import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserRole, UserProfile } from './types';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser } from './supabase';
import { db } from './db';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  isProfileComplete: boolean;
  signInGoogle: (targetPortal?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data?: any; error?: any }>;
  saveCustomerProfile: (data: {
    full_name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Prefer not to say' | string;
    mobile_number: string;
  }) => Promise<{ success: boolean; error?: string }>;
  switchProvisionedRole: (newRole: UserRole) => void;
  canAccessPortal: (portal: 'customer' | 'staff' | 'front_desk') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'nivora_active_user_session';

/**
 * Universal validator to check whether customer profile contains all required onboarding fields.
 */
export function checkIsProfileComplete(u?: Partial<UserProfile> | null): boolean {
  if (!u) return false;
  // Non-customer roles don't undergo customer onboarding
  if (u.role && u.role !== 'customer') return true;

  const hasName = Boolean(u.full_name && u.full_name.trim().length > 0);
  const ageNum = typeof u.age === 'number' ? u.age : Number(u.age);
  const hasValidAge = !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
  const genderLower = (u.gender || '').toLowerCase().trim();
  const hasGender = ['male', 'female', 'prefer not to say'].includes(genderLower);
  const phone = u.mobile_number || u.phone;
  const hasValidPhone = Boolean(phone && phone.replace(/\D/g, '').length >= 7);

  return Boolean(hasName && hasValidAge && hasGender && hasValidPhone);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Compute profile completion state dynamically
  const isProfileComplete = useMemo(() => {
    if (!user) return false;
    if (role !== 'customer') return true;
    return checkIsProfileComplete(user);
  }, [user, role]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Check active Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Error fetching Supabase session:', error.message);
          }

          if (session?.user) {
            const u = session.user;
            const userId = u.id;
            const email = u.email || '';
            const meta = u.user_metadata || {};

            let fullName = meta.full_name || meta.name || email.split('@')[0];
            let phone = meta.phone || meta.mobile_number || '';
            let age: number | undefined = meta.age ? Number(meta.age) : undefined;
            let gender: string | undefined = meta.gender;
            let mobileNumber: string | undefined = meta.mobile_number || meta.phone;
            const avatarUrl = meta.avatar_url;

            // Check if profile was cached in local storage for this user
            try {
              const cachedProfileStr = localStorage.getItem(`nivora_profile_${email.toLowerCase()}`) ||
                                       localStorage.getItem(`nivora_profile_${userId}`);
              if (cachedProfileStr) {
                const cp = JSON.parse(cachedProfileStr);
                if (cp.age && !age) age = Number(cp.age);
                if (cp.gender && !gender) gender = cp.gender;
                if (cp.mobile_number && !mobileNumber) mobileNumber = cp.mobile_number;
                if (cp.full_name && (!fullName || fullName === email.split('@')[0])) fullName = cp.full_name;
              }
            } catch (cErr) {
              // ignore parse errors
            }

            // Load signed-in user's profile from public.nivora_profiles
            try {
              const { data: profileRow } = await supabase
                .from('nivora_profiles')
                .select('id, full_name, phone, created_at, updated_at')
                .eq('id', userId)
                .maybeSingle();

              if (profileRow) {
                if (profileRow.full_name) fullName = profileRow.full_name;
                if (profileRow.phone) {
                  phone = profileRow.phone;
                  if (!mobileNumber) mobileNumber = profileRow.phone;
                }
              }
            } catch (pErr) {
              console.warn('Error loading public.nivora_profiles:', pErr);
            }

            const userRole: UserRole = db.getUserRole(email);
            const isComplete = userRole !== 'customer' || checkIsProfileComplete({
              full_name: fullName,
              age,
              gender,
              mobile_number: mobileNumber || phone,
              phone: mobileNumber || phone,
              role: userRole,
            });

            if (mounted) {
              const profile: UserProfile = {
                id: userId,
                email,
                full_name: fullName,
                phone: mobileNumber || phone,
                mobile_number: mobileNumber || phone,
                age,
                gender,
                is_profile_complete: isComplete,
                role: userRole,
                avatar_url: avatarUrl,
                created_at: session.user.created_at,
              };
              setUser(profile);
              setRole(userRole);
            }
          } else {
            // Check if there is an active local session
            restoreLocalFallback();
          }

          // Listen for auth changes
          const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;
            if (newSession?.user) {
              const u = newSession.user;
              const email = u.email || '';
              const meta = u.user_metadata || {};
              let fullName = meta.full_name || meta.name || email.split('@')[0];
              let phone = meta.phone || meta.mobile_number || '';
              let age: number | undefined = meta.age ? Number(meta.age) : undefined;
              let gender: string | undefined = meta.gender;
              let mobileNumber: string | undefined = meta.mobile_number || meta.phone;

              // Check if cached
              try {
                const cachedProfileStr = localStorage.getItem(`nivora_profile_${email.toLowerCase()}`) ||
                                         localStorage.getItem(`nivora_profile_${u.id}`);
                if (cachedProfileStr) {
                  const cp = JSON.parse(cachedProfileStr);
                  if (cp.age && !age) age = Number(cp.age);
                  if (cp.gender && !gender) gender = cp.gender;
                  if (cp.mobile_number && !mobileNumber) mobileNumber = cp.mobile_number;
                  if (cp.full_name && (!fullName || fullName === email.split('@')[0])) fullName = cp.full_name;
                }
              } catch (e) {
                // ignore
              }

              // Load profile from public.nivora_profiles
              try {
                const { data: profileRow } = await supabase
                  .from('nivora_profiles')
                  .select('id, full_name, phone, created_at, updated_at')
                  .eq('id', u.id)
                  .maybeSingle();

                if (profileRow) {
                  if (profileRow.full_name) fullName = profileRow.full_name;
                  if (profileRow.phone) {
                    phone = profileRow.phone;
                    if (!mobileNumber) mobileNumber = profileRow.phone;
                  }
                }
              } catch (pErr) {
                console.warn('Error loading public.nivora_profiles on auth change:', pErr);
              }

              const userRole: UserRole = db.getUserRole(email);
              const isComplete = userRole !== 'customer' || checkIsProfileComplete({
                full_name: fullName,
                age,
                gender,
                mobile_number: mobileNumber || phone,
                phone: mobileNumber || phone,
                role: userRole,
              });

              if (mounted) {
                const profileObj: UserProfile = {
                  id: u.id,
                  email,
                  full_name: fullName,
                  phone: mobileNumber || phone,
                  mobile_number: mobileNumber || phone,
                  age,
                  gender,
                  is_profile_complete: isComplete,
                  role: userRole,
                  avatar_url: u.user_metadata?.avatar_url,
                  created_at: u.created_at,
                };
                setUser(profileObj);
                setRole(userRole);
                localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profileObj));
              }
            } else if (event === 'SIGNED_OUT') {
              if (mounted) {
                setUser(null);
                setRole('customer');
                localStorage.removeItem(LOCAL_SESSION_KEY);
              }
            }
          });

          return () => {
            authSubscription.subscription.unsubscribe();
          };
        } else {
          // If Supabase not yet configured, restore persisted local session
          restoreLocalFallback();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        restoreLocalFallback();
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    function restoreLocalFallback() {
      try {
        const cached = localStorage.getItem(LOCAL_SESSION_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as UserProfile;
          const trustedRole = db.getUserRole(parsed.email || parsed.id);
          const isComplete = trustedRole !== 'customer' || checkIsProfileComplete(parsed);
          const profileWithTrustedRole: UserProfile = {
            ...parsed,
            role: trustedRole,
            is_profile_complete: isComplete,
          };
          setUser(profileWithTrustedRole);
          setRole(trustedRole);
        } else {
          // Default guest customer user (Sophia Laurent) with pre-completed profile so initial tour runs smoothly
          const defaultCustomer: UserProfile = {
            id: 'usr_customer_demo',
            email: 'guest@nivoraresort.com',
            full_name: 'Sophia Laurent',
            role: 'customer',
            age: 32,
            gender: 'Female',
            mobile_number: '+91 98765 43210',
            phone: '+91 98765 43210',
            is_profile_complete: true,
            created_at: new Date().toISOString(),
          };
          setUser(defaultCustomer);
          setRole('customer');
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(defaultCustomer));
        }
      } catch (e) {
        setUser(null);
        setRole('customer');
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInGoogle = async (targetPortal?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await signInWithGoogle(targetPortal);
        if (error) {
          console.error('Supabase Google OAuth error:', error);
          return { error };
        }
        return {};
      } else {
        return {
          error: new Error(
            'Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
          ),
        };
      }
    } catch (err: any) {
      console.error('Google Sign in exception:', err);
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await signOutUser();
      }
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setRole('customer');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save customer profile after login/registration with complete input validation.
   * Persists in Supabase Auth user metadata, public.nivora_profiles, and authenticated session.
   */
  const saveCustomerProfile = async (profileData: {
    full_name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Prefer not to say' | string;
    mobile_number: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const fullName = profileData.full_name?.trim();
    if (!fullName) {
      return { success: false, error: 'Full legal name is required.' };
    }

    const ageNum = Number(profileData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      return { success: false, error: 'Age must be a valid number between 18 and 120.' };
    }

    const gender = profileData.gender;
    const validGenders = ['Male', 'Female', 'Prefer not to say'];
    if (!gender || !validGenders.includes(gender)) {
      return { success: false, error: 'Please select a valid gender option.' };
    }

    const rawMobile = profileData.mobile_number?.trim();
    const digitsOnly = (rawMobile || '').replace(/\D/g, '');
    if (!rawMobile || digitsOnly.length < 7) {
      return { success: false, error: 'Please enter a valid mobile number with country code.' };
    }

    try {
      const currentUserId = user?.id || `usr_${Date.now()}`;
      const email = user?.email || 'guest@nivoraresort.com';

      // 1. Update Supabase Auth user metadata if logged in with real Supabase session
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: metaError } = await supabase.auth.updateUser({
            data: {
              full_name: fullName,
              age: ageNum,
              gender,
              mobile_number: rawMobile,
              phone: rawMobile,
              profile_completed: true,
            },
          });
          if (metaError) {
            console.warn('Supabase auth.updateUser notice:', metaError.message);
          }
        } catch (mErr) {
          console.warn('Supabase user metadata update notice:', mErr);
        }

        // 2. Persist in public.nivora_profiles table if UUID format
        if (currentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)) {
          try {
            const { error: profileUpsertError } = await supabase
              .from('nivora_profiles')
              .upsert({
                id: currentUserId,
                full_name: fullName,
                phone: rawMobile,
                updated_at: new Date().toISOString(),
              });
            if (profileUpsertError) {
              console.warn('Supabase nivora_profiles upsert notice:', profileUpsertError.message);
            }
          } catch (pErr) {
            console.warn('Error saving to nivora_profiles:', pErr);
          }
        }
      }

      // 3. Update active user session object
      const updatedProfile: UserProfile = {
        id: currentUserId,
        email,
        full_name: fullName,
        age: ageNum,
        gender,
        mobile_number: rawMobile,
        phone: rawMobile,
        role: role || 'customer',
        is_profile_complete: true,
        created_at: user?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(updatedProfile);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedProfile));
      localStorage.setItem(`nivora_profile_${email.toLowerCase()}`, JSON.stringify(updatedProfile));
      if (currentUserId) {
        localStorage.setItem(`nivora_profile_${currentUserId}`, JSON.stringify(updatedProfile));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to save customer profile:', err);
      return { success: false, error: err.message || 'Failed to save profile. Please check connection and try again.' };
    }
  };

  /**
   * Update signed-in user's profile
   */
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ data?: any; error?: any }> => {
    if (!user) {
      return { error: new Error('No active user session.') };
    }

    try {
      const merged: UserProfile = {
        ...user,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      merged.is_profile_complete = checkIsProfileComplete(merged);

      if (isSupabaseConfigured && supabase && user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
        await supabase
          .from('nivora_profiles')
          .upsert({
            id: user.id,
            full_name: merged.full_name,
            phone: merged.mobile_number || merged.phone,
            updated_at: new Date().toISOString(),
          });
      }

      setUser(merged);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(merged));
      localStorage.setItem(`nivora_profile_${user.email.toLowerCase()}`, JSON.stringify(merged));

      return { data: merged };
    } catch (err: any) {
      return { error: err };
    }
  };

  /**
   * Internal role switch for authorized testing or admin provisions
   */
  const switchProvisionedRole = (newRole: UserRole) => {
    if (!user) return;
    db.setUserRole(user.email, newRole);
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    setRole(newRole);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
  };

  /**
   * Strict portal access control enforcing mutual exclusivity:
   * - Customers can ONLY access 'customer' portal.
   * - Staff can ONLY access 'staff' portal.
   * - Front Desk can ONLY access 'front_desk' portal.
   * - Authorized owner/admin email (dhiru636441@gmail.com) can access all three portals seamlessly.
   */
  const canAccessPortal = (portal: 'customer' | 'staff' | 'front_desk'): boolean => {
    if (!user) return false;
    return db.canEmailAccessPortal(user.email, portal);
  };

  const value = useMemo(
    () => ({
      user,
      role,
      isLoading,
      isSupabaseConnected: isSupabaseConfigured,
      isProfileComplete,
      signInGoogle,
      signOut,
      updateProfile,
      saveCustomerProfile,
      switchProvisionedRole,
      canAccessPortal,
    }),
    [user, role, isLoading, isProfileComplete]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
