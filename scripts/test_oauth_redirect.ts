import { getOAuthRedirectUrl, PUBLISHED_PRODUCTION_URL } from '../src/lib/supabase';

console.log('--- Testing OAuth Redirect URL Construction ---');

const expectedBase = 'https://nivora-resort-hotel-intelligence.ai.studio';

// Test 1: Base published production URL
const urlDefault = getOAuthRedirectUrl();
console.log('Default redirect URL:', urlDefault);
if (urlDefault === expectedBase) {
  console.log('✓ [PASS] Base URL matches published production URL');
} else {
  console.error(`✗ [FAIL] Expected ${expectedBase}, got ${urlDefault}`);
  process.exit(1);
}

// Test 2: Specific portal redirects
const urlCustomer = getOAuthRedirectUrl('customer');
const urlStaff = getOAuthRedirectUrl('/staff');
const urlFrontDesk = getOAuthRedirectUrl('front-desk');

console.log('Customer redirect:', urlCustomer);
console.log('Staff redirect:', urlStaff);
console.log('Front Desk redirect:', urlFrontDesk);

if (
  urlCustomer === `${expectedBase}/customer` &&
  urlStaff === `${expectedBase}/staff` &&
  urlFrontDesk === `${expectedBase}/front-desk`
) {
  console.log('✓ [PASS] Portal paths correctly appended to published production URL');
} else {
  console.error('✗ [FAIL] Portal path construction failed');
  process.exit(1);
}

// Test 3: Absence of localhost or port 3000
const allUrls = [urlDefault, urlCustomer, urlStaff, urlFrontDesk];
const hasLocalhost = allUrls.some((u) => u.includes('localhost') || u.includes(':3000'));
if (!hasLocalhost) {
  console.log('✓ [PASS] Zero localhost or port 3000 occurrences in generated redirect URLs');
} else {
  console.error('✗ [FAIL] Detected localhost or :3000 in redirect URL');
  process.exit(1);
}

console.log('ALL OAUTH REDIRECT URL TESTS PASSED.');
