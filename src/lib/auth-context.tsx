import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserRole, UserProfile } from './types';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser } from './supabase';
import { db } from './db';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  signInGoogle: (targetPortal?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  switchProvisionedRole: (newRole: UserRole) => void;
  canAccessPortal: (portal: 'customer' | 'staff' | 'front_desk') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'nivora_active_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
            const userId = session.user.id;
            const email = session.user.email || '';
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
            const avatarUrl = session.user.user_metadata?.avatar_url;

            // Fetch role from trusted database
            let userRole: UserRole = 'customer';
            try {
              const { data: roleRow, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single();

              if (roleRow?.role && ['customer', 'staff', 'front_desk'].includes(roleRow.role)) {
                userRole = roleRow.role as UserRole;
              } else {
                // Check if pre-provisioned in db layer
                userRole = db.getUserRole(email);
              }
            } catch (rErr) {
              userRole = db.getUserRole(email);
            }

            if (mounted) {
              const profile: UserProfile = {
                id: userId,
                email,
                full_name: fullName,
                role: userRole,
                avatar_url: avatarUrl,
                created_at: session.user.created_at,
              };
              setUser(profile);
              setRole(userRole);
            }
          } else {
            // Check local fallback session if any
            restoreLocalFallback();
          }

          // Listen for auth changes
          const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;
            if (newSession?.user) {
              const u = newSession.user;
              const email = u.email || '';
              const fullName = u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0];
              const userRole = db.getUserRole(email);

              setUser({
                id: u.id,
                email,
                full_name: fullName,
                role: userRole,
                avatar_url: u.user_metadata?.avatar_url,
                created_at: u.created_at,
              });
              setRole(userRole);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setRole('customer');
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
          setUser({ ...parsed, role: trustedRole });
          setRole(trustedRole);
        } else {
          // Default guest customer user so the user can immediately experience the resort
          const defaultCustomer: UserProfile = {
            id: 'usr_customer_demo',
            email: 'guest@nivoraresort.com',
            full_name: 'Sophia Laurent',
            role: 'customer',
            created_at: new Date().toISOString(),
          };
          setUser(defaultCustomer);
          setRole('customer');
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(defaultCustomer));
        }
      } catch (e) {
        // Fallback customer
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
        const { error } = await signInWithGoogle(targetPortal ? `/${targetPortal}` : undefined);
        if (error) {
          console.error('Supabase Google OAuth error:', error);
          return { error };
        }
        return {};
      } else {
        // Mock Google sign in when Supabase credentials are pending in .env
        const mockGoogleUser: UserProfile = {
          id: `usr_${Date.now()}`,
          email: 'dhiru636441@gmail.com',
          full_name: 'Dhiru Hotelier',
          role: 'customer',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          created_at: new Date().toISOString(),
        };
        setUser(mockGoogleUser);
        setRole('customer');
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockGoogleUser));
        db.setUserRole(mockGoogleUser.email, 'customer');
        return {};
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
   * Switch provisioned operational role.
   * Required for staff / front desk testing and verified management.
   */
  const switchProvisionedRole = (newRole: UserRole) => {
    if (!user) return;
    db.setUserRole(user.email, newRole);
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    setRole(newRole);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));
  };

  const canAccessPortal = (portal: 'customer' | 'staff' | 'front_desk'): boolean => {
    if (!user) return false;
    if (portal === 'customer') return role === 'customer';
    if (portal === 'staff') return role === 'staff';
    if (portal === 'front_desk') return role === 'front_desk';
    return false;
  };

  const value = useMemo(
    () => ({
      user,
      role,
      isLoading,
      isSupabaseConnected: isSupabaseConfigured,
      signInGoogle,
      signOut,
      switchProvisionedRole,
      canAccessPortal,
    }),
    [user, role, isLoading]
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
