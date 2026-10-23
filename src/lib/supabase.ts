import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  NivoraDatasetRecord,
  NivoraDatasetQueryParams,
  NivoraDatasetQueryResult,
  SupabaseUserRow,
  NivoraProfileRow,
  SupabaseRoomRow,
  SupabaseReservationRow,
  SupabaseFeedbackRow,
  SupabaseTableHealth,
} from './types';

// Backward-compatible type alias
export type SupabaseGuestRow = SupabaseUserRow;
export type SupabaseOperationRow = Record<string, any>;

// Canonical Project Credentials for Nivora Resort & Hotel Intelligence Supabase project
export const SUPABASE_DEFAULTS = {
  url: 'https://enthyivpaupwifvvpshw.supabase.co',
  anonKey: 'sb_publishable_OgfHm6F40NEeBv97ZISYbg_wRigHNl4',
  projectId: 'enthyivpaupwifvvpshw',
};

// Environment variables for Supabase (with fallback to verified project credentials)
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  SUPABASE_DEFAULTS.url;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  SUPABASE_DEFAULTS.anonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nivora_hotel_supabase_session',
  },
});

/**
 * Known schema columns for all verified Supabase tables in the project.
 */
export const SUPABASE_TABLE_COLUMNS = {
  user: ['guest_id', 'guest_name', 'email', 'city', 'age', 'gender', 'guest_segment', 'loyalty_level'],
  nivora_profiles: ['id', 'full_name', 'phone', 'created_at', 'updated_at'],
  rooms: ['room_id', 'room_type', 'room_status'],
  reservations: ['id', 'guest_id', 'room_id', 'check_in', 'check_out', 'booking_status', 'created_at'],
  feedback: ['id', 'guest_id', 'reservation_id', 'rating', 'comments', 'created_at'],
} as const;

/**
 * Recommended Row-Level Security (RLS) SQL policies documentation.
 */
export const RECOMMENDED_RLS_POLICIES_SQL = `
-- Row Level Security (RLS) policies for Nivora Resort:
-- 1. public.reservations: SELECT and INSERT policies for authenticated users
-- 2. public.feedback: SELECT and INSERT policies for authenticated users
-- 3. public.nivora_profiles: SELECT and UPDATE for profile owners (auth.uid() = id)
-- 4. public.rooms: SELECT enabled for room availability
-- 5. public.user: SELECT enabled for hotel operations
`.trim();

/**
 * Health check that tests all 5 verified tables in the user's Supabase project.
 */
export async function testSupabaseTablesConnection(): Promise<Record<string, SupabaseTableHealth>> {
  const tables: Array<'user' | 'rooms' | 'reservations' | 'feedback' | 'nivora_profiles'> = [
    'nivora_profiles',
    'reservations',
    'feedback',
    'rooms',
    'user',
  ];

  const results: Record<string, SupabaseTableHealth> = {};

  await Promise.all(
    tables.map(async (table) => {
      try {
        const { data, error, count, status } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);

        const columns = (SUPABASE_TABLE_COLUMNS as any)[table] || [];

        if (error) {
          results[table] = {
            tableName: table as any,
            status: 'error',
            httpStatus: status || 500,
            rowCount: 0,
            columnsCount: columns.length,
            columns,
            rlsActive: error.code === '42501' || error.message.includes('row-level security'),
            canRead: false,
            errorMessage: error.message,
            lastCheckedAt: new Date().toISOString(),
          };
        } else {
          const rowCount = count ?? (data?.length || 0);
          results[table] = {
            tableName: table as any,
            status: 'connected',
            httpStatus: status || 200,
            rowCount,
            columnsCount: columns.length,
            columns,
            rlsActive: true,
            canRead: rowCount > 0 || (Array.isArray(data) && data.length > 0),
            errorMessage: null,
            lastCheckedAt: new Date().toISOString(),
          };
        }
      } catch (err: any) {
        results[table] = {
          tableName: table as any,
          status: 'error',
          httpStatus: 500,
          rowCount: 0,
          columnsCount: ((SUPABASE_TABLE_COLUMNS as any)[table] || []).length,
          columns: (SUPABASE_TABLE_COLUMNS as any)[table] || [],
          rlsActive: true,
          canRead: false,
          errorMessage: err.message || 'Unknown network error',
          lastCheckedAt: new Date().toISOString(),
        };
      }
    })
  );

  return results;
}

/**
 * Real Supabase query for public.nivora_dataset with search, filtering, and pagination.
 */
export async function queryNivoraDataset(
  params: NivoraDatasetQueryParams = {}
): Promise<NivoraDatasetQueryResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('nivora_dataset')
      .select('*', { count: 'exact' });

    // Search filter across text columns
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      query = query.or(
        `guest_name.ilike.%${s}%,booking_id.ilike.%${s}%,transaction_id.ilike.%${s}%,city.ilike.%${s}%,room_type.ilike.%${s}%`
      );
    }

    // Room type filter
    if (params.roomType && params.roomType !== 'all') {
      query = query.eq('room_type', params.roomType);
    }

    // Booking channel filter
    if (params.bookingChannel && params.bookingChannel !== 'all') {
      query = query.eq('booking_channel', params.bookingChannel);
    }

    // Guest segment filter
    if (params.guestSegment && params.guestSegment !== 'all') {
      query = query.eq('guest_segment', params.guestSegment);
    }

    // Transaction status filter
    if (params.transactionStatus && params.transactionStatus !== 'all') {
      if (params.transactionStatus === 'settled') {
        query = query.eq('transaction_status', 'Settled');
      } else if (params.transactionStatus === 'failed') {
        query = query.eq('transaction_status', 'Failed');
      } else {
        query = query.eq('transaction_status', params.transactionStatus);
      }
    }

    // Sorting
    const sortField = params.sortBy || 'check_in_date';
    const sortAsc = params.sortAscending ?? false;
    query = query.order(sortField, { ascending: sortAsc });

    // Pagination range
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.warn('Supabase nivora_dataset query warning:', error.message);
      return {
        records: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
        isLiveSupabase: false,
        rlsRestricted: error.code === '42501' || error.message.includes('row-level security'),
        errorMessage: error.message,
        fetchedAt: new Date().toISOString(),
      };
    }

    const totalCount = count ?? (data?.length || 0);
    const records = (data || []) as NivoraDatasetRecord[];

    return {
      records,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      isLiveSupabase: true,
      rlsRestricted: totalCount === 0 && !params.search,
      errorMessage: null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Exception querying nivora_dataset:', err);
    return {
      records: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      isLiveSupabase: false,
      rlsRestricted: true,
      errorMessage: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetch guests from public.user table in Supabase.
 */
export async function fetchSupabaseUsers(search?: string): Promise<{ data: SupabaseUserRow[]; error: Error | null }> {
  try {
    let query = supabase.from('user').select('*').order('guest_id', { ascending: true });
    if (search && search.trim()) {
      query = query.or(`guest_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as SupabaseUserRow[], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

// Backward-compatible alias for user/guest lookups
export const fetchSupabaseGuests = fetchSupabaseUsers;

/**
 * Fetch profile from public.nivora_profiles for authenticated user UUID.
 */
export async function fetchUserProfile(userId: string): Promise<{ data: NivoraProfileRow | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('nivora_profiles')
      .select('id, full_name, phone, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return { data: (data || null) as NivoraProfileRow | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update profile in public.nivora_profiles for authenticated user UUID.
 */
export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string; phone?: string }
): Promise<{ data: NivoraProfileRow | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('nivora_profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return { data: data as NivoraProfileRow, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Fetch rooms from public.rooms table in Supabase.
 */
export async function fetchSupabaseRooms(): Promise<{ data: SupabaseRoomRow[]; error: Error | null }> {
  try {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) throw error;
    return { data: (data || []) as SupabaseRoomRow[], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Fetch reservations from public.reservations table in Supabase for a guest UUID.
 */
export async function fetchSupabaseReservations(guestId?: string): Promise<{ data: SupabaseReservationRow[]; error: Error | null }> {
  try {
    let query = supabase.from('reservations').select('*').order('created_at', { ascending: false });
    if (guestId) {
      query = query.eq('guest_id', guestId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as SupabaseReservationRow[], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Insert reservation into public.reservations using authenticated user's UUID.
 */
export async function insertSupabaseReservation(reservation: {
  guest_id: string; // auth.users UUID
  room_id?: string; // room UUID
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  booking_status?: string;
}): Promise<{ data: SupabaseReservationRow | null; error: Error | null }> {
  try {
    const payload: Record<string, any> = {
      guest_id: reservation.guest_id,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      booking_status: reservation.booking_status || 'confirmed',
    };
    if (reservation.room_id) {
      payload.room_id = reservation.room_id;
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SupabaseReservationRow, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Fetch feedback from public.feedback table in Supabase.
 */
export async function fetchSupabaseFeedback(guestId?: string): Promise<{ data: SupabaseFeedbackRow[]; error: Error | null }> {
  try {
    let query = supabase.from('feedback').select('*').order('created_at', { ascending: false });
    if (guestId) {
      query = query.eq('guest_id', guestId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as SupabaseFeedbackRow[], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Insert guest feedback into public.feedback using authenticated user's UUID.
 */
export async function insertSupabaseFeedback(feedback: {
  guest_id: string; // auth.users UUID
  rating: number; // 1 - 5
  comments: string;
  reservation_id?: string;
}): Promise<{ data: SupabaseFeedbackRow | null; error: Error | null }> {
  try {
    const payload: Record<string, any> = {
      guest_id: feedback.guest_id,
      rating: feedback.rating,
      comments: feedback.comments,
    };
    if (feedback.reservation_id) {
      payload.reservation_id = feedback.reservation_id;
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SupabaseFeedbackRow, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Canonical published production URL for Nivora Resort & Hotel Intelligence.
 */
export const PUBLISHED_PRODUCTION_URL = 'https://nivora-resort-hotel-intelligence.ai.studio';

/**
 * Resolves the trusted post-authentication redirect destination.
 * Requirement: For production Google sign-in, use https://nivora-resort-hotel-intelligence.ai.studio.
 * Never use localhost:3000 or editor/preview iframe origins in production.
 */
export function getOAuthRedirectUrl(redirectToPortal?: string): string {
  const baseUrl = PUBLISHED_PRODUCTION_URL;
  if (!redirectToPortal) {
    return baseUrl;
  }
  const cleanPath = redirectToPortal.startsWith('/') ? redirectToPortal : `/${redirectToPortal}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Initiates official Supabase Google OAuth flow.
 * Directs user to Google OAuth consent screen with the canonical published production redirect URL.
 */
export async function signInWithGoogle(redirectToPortal?: string) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  // Construct official production redirect URL to ensure OAuth callback returns to the published production host
  const redirectTo = getOAuthRedirectUrl(redirectToPortal);

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

  const redirectTo = `${PUBLISHED_PRODUCTION_URL}/auth/callback?type=recovery`;
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

