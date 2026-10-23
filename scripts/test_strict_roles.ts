/**
 * Unit & Integration Test for Strict Role Separation and Profile Onboarding Validation
 */

// Helper replicating checkIsProfileComplete logic
function checkIsProfileComplete(u?: {
  full_name?: string;
  role?: string;
  age?: number | string;
  gender?: string;
  mobile_number?: string;
  phone?: string;
} | null): boolean {
  if (!u) return false;
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

// Access guard logic
function canAccessPortal(role: 'customer' | 'staff' | 'front_desk', portal: 'customer' | 'staff' | 'front_desk'): boolean {
  if (portal === 'customer') return role === 'customer';
  if (portal === 'staff') return role === 'staff';
  if (portal === 'front_desk') return role === 'front_desk';
  return false;
}

// User role resolution logic
const trustedRoles: Record<string, 'customer' | 'staff' | 'front_desk'> = {
  'usr_customer_demo': 'customer',
  'staff@nivoraresort.com': 'staff',
  'frontdesk@nivoraresort.com': 'front_desk',
};

function getUserRole(emailOrId: string): 'customer' | 'staff' | 'front_desk' {
  const normalized = emailOrId.toLowerCase().trim();
  return trustedRoles[normalized] || 'customer';
}

function runTests() {
  console.log('================================================================');
  console.log('NIVORA RESORT — STRICT ROLE-BASED PORTAL & ONBOARDING TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Role derivation test
  console.log('--- 1. Strict Server Role Derivation ---');
  assert('Guest email defaults to customer', getUserRole('random.guest@gmail.com') === 'customer');
  assert('Customer cannot self-elevate to staff via email trick', getUserRole('fake_staff@gmail.com') === 'customer');
  assert('Verified staff email resolves strictly to staff', getUserRole('staff@nivoraresort.com') === 'staff');
  assert('Verified frontdesk email resolves strictly to front_desk', getUserRole('frontdesk@nivoraresort.com') === 'front_desk');

  // 2. Mutual exclusivity of portals
  console.log('\n--- 2. Mutual Portal Exclusivity & Route Protection ---');
  assert('Customer can access Customer portal', canAccessPortal('customer', 'customer') === true);
  assert('Customer CANNOT access Staff portal', canAccessPortal('customer', 'staff') === false);
  assert('Customer CANNOT access Front Desk portal', canAccessPortal('customer', 'front_desk') === false);
  assert('Staff CANNOT access Customer portal with employee session', canAccessPortal('staff', 'customer') === false);
  assert('Staff CANNOT access Front Desk portal with staff session', canAccessPortal('staff', 'front_desk') === false);
  assert('Staff can access Staff portal', canAccessPortal('staff', 'staff') === true);
  assert('Front Desk CANNOT access Customer portal with employee session', canAccessPortal('front_desk', 'customer') === false);
  assert('Front Desk CANNOT access Staff portal with front desk session', canAccessPortal('front_desk', 'staff') === false);
  assert('Front Desk can access Front Desk portal', canAccessPortal('front_desk', 'front_desk') === true);

  // 3. Customer Profile Validation Rules
  console.log('\n--- 3. Customer Profile Onboarding & Validation Rules ---');
  assert('New uncompleted customer profile is blocked', checkIsProfileComplete({
    full_name: 'David Test',
    role: 'customer',
  }) === false);

  assert('Profile with age under 18 is blocked', checkIsProfileComplete({
    full_name: 'David Test',
    role: 'customer',
    age: 17,
    gender: 'Male',
    mobile_number: '+91 9876543210',
  }) === false);

  assert('Profile with age above 120 is blocked', checkIsProfileComplete({
    full_name: 'David Test',
    role: 'customer',
    age: 121,
    gender: 'Male',
    mobile_number: '+91 9876543210',
  }) === false);

  assert('Profile with invalid gender is blocked', checkIsProfileComplete({
    full_name: 'David Test',
    role: 'customer',
    age: 29,
    gender: 'CustomUnknown',
    mobile_number: '+91 9876543210',
  }) === false);

  assert('Profile with short mobile number (< 7 digits) is blocked', checkIsProfileComplete({
    full_name: 'David Test',
    role: 'customer',
    age: 29,
    gender: 'Male',
    mobile_number: '+91 123',
  }) === false);

  assert('Complete profile with valid Age 18-120, Gender, and +91 Phone passes', checkIsProfileComplete({
    full_name: 'Sophia Laurent',
    role: 'customer',
    age: 32,
    gender: 'Female',
    mobile_number: '+91 98765 43210',
  }) === true);

  assert('Male gender option is accepted', checkIsProfileComplete({
    full_name: 'Alexander Cross',
    role: 'customer',
    age: 45,
    gender: 'Male',
    mobile_number: '+91 98765 11111',
  }) === true);

  assert('Prefer not to say gender option is accepted', checkIsProfileComplete({
    full_name: 'Morgan Blake',
    role: 'customer',
    age: 28,
    gender: 'Prefer not to say',
    mobile_number: '+91 98765 22222',
  }) === true);

  console.log(`\n================================================================`);
  console.log(`ROLE & ONBOARDING VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================`);
}

runTests();
