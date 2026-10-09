import { db, INITIAL_ROOM_TYPES } from '../src/lib/db';
import { Reservation, Room } from '../src/lib/types';

// Mock localStorage for headless Node environment
const store: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

async function runTests() {
  console.log('====================================================');
  console.log('NIVORA RESORT — PHASE 1 THROUGH 8 ACCEPTANCE TESTS');
  console.log('====================================================\n');

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

  // --- TEST 1: Role-Based Authorization & Default Roles ---
  console.log('\n--- 1. Authentication & Role-Based Guard Tests ---');
  const newEmail = 'newguest@example.com';
  const roleNew = db.getUserRole(newEmail);
  assert(roleNew === 'customer', 'New public users default strictly to "customer" role');

  // Verify staff role resolution
  const roleStaff = db.getUserRole('staff@nivoraresort.com');
  assert(roleStaff === 'staff', 'Provisioned staff account resolves to "staff"');

  const roleFrontDesk = db.getUserRole('frontdesk@nivoraresort.com');
  assert(roleFrontDesk === 'front_desk', 'Provisioned front desk account resolves to "front_desk"');

  // --- TEST 2: Customer Room Reservation Creation ---
  console.log('\n--- 2. Customer Reservation & Availability Tests ---');
  const checkIn = '2026-11-01';
  const checkOut = '2026-11-05';
  const roomType = INITIAL_ROOM_TYPES[0]; // Presidential Suite

  const availBefore = db.checkAvailability(roomType.id, checkIn, checkOut);
  assert(availBefore.available, 'Room type is initially available for booking');

  const reservation = db.createReservation({
    userId: 'test_guest_1',
    customerName: 'Victoria Hastings',
    customerEmail: 'victoria@example.com',
    customerPhone: '+1 (555) 890-1234',
    roomTypeId: roomType.id,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    numGuests: 2,
    specialRequests: 'Welcome vintage champagne and high floor',
  });

  assert(reservation.booking_reference.startsWith('NIV-'), 'Generated unique booking reference with correct prefix');
  assert(reservation.status === 'confirmed', 'Reservation created with confirmed status');
  assert(reservation.total_price_cents === 4 * roomType.base_price_cents, 'Total price calculated accurately for 4 nights');

  // Verify persistence in db
  const fetched = db.getReservationById(reservation.booking_reference);
  assert(fetched !== undefined && fetched.id === reservation.id, 'Reservation persists and is retrievable by booking reference');

  // --- TEST 3: Double-Booking Prevention ---
  console.log('\n--- 3. Double-Booking Prevention Tests ---');
  // Presidential Penthouse has 2 rooms (301, 302). Room 302 is out of service.
  // Room 301 is now booked by Victoria for 2026-11-01 to 2026-11-05.
  // Next booking attempt on overlapping dates should detect zero available rooms!
  const availAfter = db.checkAvailability(roomType.id, '2026-11-02', '2026-11-04');
  let doubleBookPrevented = false;
  try {
    if (!availAfter.available) {
      doubleBookPrevented = true;
    } else {
      // If system allows attempting, verify createReservation rejects it
      db.createReservation({
        userId: 'test_guest_2',
        customerName: 'Second Guest',
        customerEmail: 'second@example.com',
        customerPhone: '+1 (555) 000-0000',
        roomTypeId: roomType.id,
        checkInDate: '2026-11-02',
        checkOutDate: '2026-11-04',
        numGuests: 2,
      });
    }
  } catch (err: any) {
    doubleBookPrevented = true;
  }
  assert(doubleBookPrevented, 'Double-booking rejected when inventory capacity for dates is exhausted');

  // Non-overlapping date should succeed
  const futureAvail = db.checkAvailability(roomType.id, '2026-11-10', '2026-11-15');
  assert(futureAvail.available, 'Non-overlapping future dates remain available');

  // --- TEST 4: Front Desk Room Assignment & Check-in Safeguards ---
  console.log('\n--- 4. Front Desk Room Readiness & Check-in Tests ---');
  // Attempting to check in to a dirty room should be rejected
  const dirtyRoom = db.getRooms().find(r => r.operational_status === 'dirty')!;
  let dirtyCheckInBlocked = false;
  try {
    db.checkInGuest(reservation.id, dirtyRoom.id, {
      id: 'fd_agent',
      email: 'frontdesk@nivoraresort.com',
      role: 'front_desk',
    });
  } catch (err: any) {
    dirtyCheckInBlocked = true;
  }
  assert(dirtyCheckInBlocked, 'Operational constraint: Check-in to a dirty room is blocked');

  // Clean room 301 check-in
  const cleanRoom = db.getRooms().find(r => r.id === 'rm_301')!;
  const stay = db.checkInGuest(reservation.id, cleanRoom.id, {
    id: 'fd_agent',
    email: 'frontdesk@nivoraresort.com',
    role: 'front_desk',
  });

  assert(stay.status === 'active', 'Guest active stay created upon check-in');
  assert(stay.keycard_code.startsWith('KEY-'), 'Digital keycard generated with secure code');

  const updatedRoom = db.getRooms().find(r => r.id === 'rm_301')!;
  assert(updatedRoom.occupancy_status === 'occupied', 'Room marked as occupied in central inventory');

  const updatedRes = db.getReservationById(reservation.id)!;
  assert(updatedRes.status === 'checked_in', 'Reservation status updated to checked_in');

  // --- TEST 5: Front Desk Checkout & Automated Turnover ---
  console.log('\n--- 5. Checkout & Automated Housekeeping Turnover Tests ---');
  const checkoutResult = db.checkOutGuest(
    stay.id,
    { method: 'card', amountCents: reservation.total_price_cents },
    { id: 'fd_agent', email: 'frontdesk@nivoraresort.com', role: 'front_desk' }
  );

  assert(checkoutResult.stay.status === 'completed', 'Stay marked as completed upon checkout');
  assert(checkoutResult.room?.occupancy_status === 'vacant', 'Room marked as vacant upon checkout');
  assert(checkoutResult.room?.operational_status === 'dirty', 'Room operational status marked as dirty upon checkout');

  // Verify automated housekeeping task creation
  const hkTasks = db.getHousekeepingTasks();
  const turnoverTask = hkTasks.find(t => t.room_id === 'rm_301' && t.task_type === 'turnover_clean');
  assert(turnoverTask !== undefined, 'Turnover cleaning task automatically generated for housekeeping queue');
  assert(turnoverTask?.priority === 'urgent', 'Turnover task created with urgent priority');

  // --- TEST 6: Staff Task Execution & Room Restoration ---
  console.log('\n--- 6. Staff Housekeeping Execution Tests ---');
  // Start task
  db.updateHousekeepingTaskStatus(turnoverTask!.id, 'in_progress', 'Started sanitization and linens', {
    id: 'stf_1',
    email: 'staff@nivoraresort.com',
    role: 'staff',
  });
  const roomInProgress = db.getRooms().find(r => r.id === 'rm_301')!;
  assert(roomInProgress.operational_status === 'cleaning_in_progress', 'Room status updated to cleaning_in_progress when task started');

  // Complete task
  db.updateHousekeepingTaskStatus(turnoverTask!.id, 'completed', 'Sanitized, inspected, prepared for next guest', {
    id: 'stf_1',
    email: 'staff@nivoraresort.com',
    role: 'staff',
  });
  const roomClean = db.getRooms().find(r => r.id === 'rm_301')!;
  assert(roomClean.operational_status === 'clean', 'Room status restored to clean in inventory upon task completion');

  // --- TEST 7: Guest Service Request & Staff Fulfillment ---
  console.log('\n--- 7. Guest Service Requests & Dispatch Tests ---');
  const serviceReq = db.createServiceRequest({
    userId: 'test_guest_1',
    roomNumber: '301',
    category: 'concierge',
    title: 'Private sunset catamaran charter inquiry',
    details: 'Charter for 2 guests departing at 17:00 tomorrow',
    priority: 'high',
  });
  assert(serviceReq.status === 'pending', 'Service request created with pending status');

  db.updateServiceRequestStatus(serviceReq.id, 'completed', 'Reserved 45ft Lagoon catamaran with skipper', {
    id: 'stf_1',
    email: 'staff@nivoraresort.com',
    role: 'staff',
  });
  const updatedSrv = db.getServiceRequests().find(s => s.id === serviceReq.id)!;
  assert(updatedSrv.status === 'completed', 'Staff successfully fulfilled and completed guest service order');

  // --- TEST 8: Audit Logging Trail ---
  console.log('\n--- 8. Audit Logging Trail Tests ---');
  const logs = db.getAuditLogs();
  assert(logs.length >= 5, 'Comprehensive audit entries generated across all actions');
  const checkInLog = logs.find(l => l.action === 'CHECK_IN');
  const checkOutLog = logs.find(l => l.action === 'CHECK_OUT');
  assert(checkInLog !== undefined, 'Check-in event immutably logged in audit trail');
  assert(checkOutLog !== undefined, 'Checkout event immutably logged in audit trail');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
