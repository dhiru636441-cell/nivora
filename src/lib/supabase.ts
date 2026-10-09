import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nivora_hotel_supabase_session',
      },
    })
  : null;

/**
 * Initiates official Supabase Google OAuth flow.
 * Directs user to Google OAuth consent screen with correct redirect URL.
 */
export async function signInWithGoogle(redirectToPortal?: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  // Construct absolute redirect URL to ensure OAuth callback returns to the current applet host
  const origin = window.location.origin;
  const redirectPath = redirectToPortal || window.location.pathname;
  const redirectTo = `${origin}${redirectPath}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  return { data, error };
}

/**
 * Signs in using Email and Password via Supabase Auth.
 */
export async function signInWithEmailPassword(email: string, password: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Creates new user account using Email and Password.
 * Auto-assigned 'customer' role strictly.
 */
export async function signUpWithEmailPassword(email: string, password: string, fullName: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'customer',
      },
    },
  });
}

/**
 * Sends real SMS OTP to phone number with country code (e.g. +91 for India, +1 for US).
 */
export async function sendPhoneOtp(phone: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  // Format: ensure leading + is present
  const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;

  return await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });
}

/**
 * Verifies real SMS OTP for phone authentication.
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;

  return await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: token.trim(),
    type: 'sms',
  });
}

/**
 * Requests password reset email link.
 */
export async function requestPasswordReset(email: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

/**
 * Updates password for currently authenticated recovery session.
 */
export async function updateUserPassword(newPassword: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  return await supabase.auth.updateUser({
    password: newPassword,
  });
}

/**
 * Terminates session via Supabase Auth.
 */
export async function signOutUser() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error);
    }
  }
}
