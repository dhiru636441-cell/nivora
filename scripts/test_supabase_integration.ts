import {
  isSupabaseConfigured,
  supabase,
  testSupabaseTablesConnection,
  fetchSupabaseUsers,
  fetchSupabaseRooms,
  fetchSupabaseReservations,
  fetchSupabaseFeedback,
  SUPABASE_DEFAULTS,
  SUPABASE_TABLE_COLUMNS,
} from '../src/lib/supabase';

async function runSupabaseVerification() {
  console.log('================================================================');
  console.log('NIVORA RESORT — LIVE SUPABASE DATABASE INTEGRATION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Supabase Configuration & Client Initialization
  console.log('--- 1. Supabase Client & Configuration ---');
  assert(isSupabaseConfigured === true, 'Supabase client is configured');
  assert(Boolean(supabase), 'Supabase client instance is initialized');
  assert(
    SUPABASE_DEFAULTS.url === 'https://enthyivpaupwifvvpshw.supabase.co',
    'Configured with exact user project URL: https://enthyivpaupwifvvpshw.supabase.co'
  );
  assert(
    SUPABASE_DEFAULTS.anonKey.startsWith('sb_publishable_'),
    'Configured with publishable key (no service role key exposed)'
  );

  // TEST 2: Inspect all 5 tables in user Supabase project
  console.log('\n--- 2. Live Connection & Schema Verification for 5 Tables ---');
  const tableHealth = await testSupabaseTablesConnection();
  const tables = ['nivora_profiles', 'reservations', 'feedback', 'rooms', 'user'] as const;

  for (const table of tables) {
    const info = tableHealth[table];
    assert(
      info !== undefined && info.status === 'connected',
      `Table public.${table} exists and responded with HTTP ${info?.httpStatus || 'N/A'}`
    );
    assert(
      info.columnsCount > 0,
      `Table public.${table} schema columns verified (${info.columnsCount} known columns)`
    );
  }

  // TEST 3: Domain Table Fetch Operations (Read under RLS)
  console.log('\n--- 3. Domain Table Fetch Operations ---');
  const usersRes = await fetchSupabaseUsers();
  assert(usersRes.error === null, 'fetchSupabaseUsers() executed successfully on public.user');

  const roomsRes = await fetchSupabaseRooms();
  assert(roomsRes.error === null, 'fetchSupabaseRooms() executed successfully on public.rooms');

  const reservationsRes = await fetchSupabaseReservations();
  assert(reservationsRes.error === null, 'fetchSupabaseReservations() executed successfully on public.reservations');

  const feedbackRes = await fetchSupabaseFeedback();
  assert(feedbackRes.error === null, 'fetchSupabaseFeedback() executed successfully on public.feedback');

  // TEST 4: Row-Level Security (RLS) Integrity
  console.log('\n--- 4. Row-Level Security (RLS) Protection Verification ---');
  for (const table of tables) {
    assert(
      tableHealth[table]?.rlsActive === true,
      `RLS is active and preserved on public.${table} (not disabled)`
    );
  }

  console.log('\n================================================================');
  console.log(`SUPABASE VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSupabaseVerification();
