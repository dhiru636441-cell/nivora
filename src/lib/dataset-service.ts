import * as XLSX from 'xlsx';
import {
  NivoraDatasetRecord,
  DataQualityReport,
  ImportExecutionReport,
  HotelAnalyticsMetrics,
} from './types';

const DATASET_STORAGE_KEY = 'nivora_hotel_dataset_records_v1';
const QUALITY_REPORT_KEY = 'nivora_data_quality_report_v1';
const IMPORT_REPORT_KEY = 'nivora_import_report_v1';

// Seed generator to synthesize the 20,200 records representing the 49 columns
function generateSeedDataset(): NivoraDatasetRecord[] {
  const roomTypes = [
    'Nivora Presidential Penthouse Suite',
    'Deluxe Oceanfront Horizon Room',
    'Executive Sanctuary Garden Villa',
    'Royal Wellness Spa Pavilion',
  ];
  const cities = ['New York', 'London', 'Paris', 'Tokyo', 'Mumbai', 'Dubai', 'Singapore', 'Sydney', 'Zurich', 'Los Angeles'];
  const segments = ['Luxury Leisure', 'Business Executive', 'Wellness & Spa', 'Honeymoon', 'Family Heritage'];
  const loyaltyLevels = ['Silver', 'Gold', 'Platinum', 'Diamond', 'Standard'];
  const channels = ['Direct Website', 'Mobile App', 'Front Desk Walk-In', 'Booking.com', 'Agoda', 'Amex Centurion Concierge'];
  const sources = ['Direct Online', 'Direct Phone', 'Corporate Agreement', 'Luxury OTA', 'Consortium Partner'];
  const bookingStatuses = ['Checked Out', 'Checked Out', 'Confirmed', 'Checked In', 'Cancelled', 'No Show'];
  const transactionCategories = ['room_charge', 'food_and_beverage', 'spa_treatment', 'private_transport', 'concierge_excursion'];
  const paymentMethods = ['Credit Card (Visa)', 'Credit Card (Mastercard)', 'Credit Card (Amex)', 'UPI / NetBanking', 'Cash Settlement', 'Direct Folio'];
  const complaints = ['None', 'None', 'None', 'AC Cooling Delay', 'Noise from Terrace', 'Late Luggage Delivery', 'Special Dietary Inquiry'];
  const feedbackCategories = ['Overall Experience', 'Culinary Excellence', 'Housekeeping Precision', 'Staff Warmth', 'Spa Serenity'];
  const sentiments = ['Positive', 'Positive', 'Positive', 'Neutral', 'Negative'];
  const returnIntents = ['Definitely', 'High', 'High', 'Moderate', 'Unlikely'];
  const staffRoles = ['Front Desk Agent', 'Housekeeping Lead', 'Private Butler', 'Head Concierge', 'Sommelier', 'Duty Technician'];
  const aiPriorities = ['Routine', 'Routine', 'High', 'Urgent', 'Escalate'];
  const aiActions = [
    'Standard Dispatch',
    'Automate Late Checkout Authorization',
    'Assign Priority Housekeeping Inspection',
    'Alert Sommelier for Welcome Vintage Bottle',
    'Deploy Duty Engineer for Thermostat Sensor',
  ];

  const firstNames = ['Alexander', 'Eleanor', 'Vikram', 'Chloe', 'Julian', 'Sophia', 'Dmitri', 'Aria', 'Mateo', 'Kavita', 'Sebastian', 'Isabella'];
  const lastNames = ['Sterling', 'Vance', 'Kapoor', 'Sinclair', 'Dubois', 'Morrison', 'Chen', 'Al-Mansoor', 'O\'Connor', 'Takahashi'];

  const records: NivoraDatasetRecord[] = [];
  const baseTimestamp = new Date('2026-01-01').getTime();

  // Create 500 rich base records with deliberate repeated transactions & duplicates
  for (let i = 1; i <= 500; i++) {
    const guestId = `GST-${1000 + (i % 85)}`;
    const fName = firstNames[(i * 3) % firstNames.length];
    const lName = lastNames[(i * 7) % lastNames.length];
    const guestName = `${fName} ${lName}`;
    const bookingId = `BK-2026-${String(Math.floor(i / 1.4) + 100).padStart(4, '0')}`;
    const transactionId = `TXN-2026-${String(i).padStart(6, '0')}`;
    const roomId = `RM-${(100 + (i % 24))}`;
    const roomType = roomTypes[i % roomTypes.length];
    
    // Dates
    const checkInOffset = (i * 1.5) * 86400000;
    const checkInD = new Date(baseTimestamp + checkInOffset);
    const nights = (i % 6) + 1;
    const checkOutD = new Date(checkInD.getTime() + nights * 86400000);
    const inDateStr = checkInD.toISOString().split('T')[0];
    const outDateStr = checkOutD.toISOString().split('T')[0];

    // Financials
    const ratePerNight = roomType.includes('Presidential') ? 850 : roomType.includes('Villa') ? 640 : roomType.includes('Wellness') ? 520 : 420;
    const roomCharge = nights * ratePerNight;
    const foodCharge = (i % 5 === 0) ? 180 : (i % 3 === 0) ? 95 : 0;
    const serviceCharge = Math.round((roomCharge + foodCharge) * 0.10);
    const discountPercent = (i % 8 === 0) ? 10 : 0;
    const discountAmount = Math.round(((roomCharge + foodCharge) * discountPercent) / 100);
    const taxAmount = Math.round(((roomCharge + foodCharge + serviceCharge - discountAmount) * 0.12));
    const totalBookingAmount = roomCharge + foodCharge + serviceCharge - discountAmount + taxAmount;

    // Transaction
    const isSuccess = i % 19 !== 0; // 95% success rate, 5% failed
    const txAmount = (i % 3 === 0) ? totalBookingAmount : (i % 3 === 1) ? roomCharge : foodCharge || 120;
    const txStatus = isSuccess ? 'Settled' : 'Failed';
    const payStatus = isSuccess ? 'Success' : 'Failed';

    const satisfaction = isSuccess ? Math.min(5, Math.max(3, (i % 3) + 3)) : 2;
    const sentiment = satisfaction >= 4 ? 'Positive' : satisfaction === 3 ? 'Neutral' : 'Negative';

    const rec: NivoraDatasetRecord = {
      transaction_id: transactionId,
      transaction_date: inDateStr,
      transaction_category: transactionCategories[i % transactionCategories.length],
      transaction_amount: txAmount,
      payment_method: paymentMethods[i % paymentMethods.length],
      payment_status: payStatus,
      transaction_status: txStatus,

      room_id: roomId,
      room_status: (i % 4 === 0) ? 'clean' : (i % 4 === 1) ? 'occupied' : (i % 4 === 2) ? 'inspected' : 'dirty',
      booking_id: bookingId,
      check_in_date: inDateStr,
      check_out_date: outDateStr,
      stay_nights: nights,
      room_type: roomType,
      booking_source: sources[i % sources.length],
      booking_channel: channels[i % channels.length],
      booking_status: isSuccess ? bookingStatuses[i % bookingStatuses.length] : 'Cancelled',

      guest_id: guestId,
      guest_name: guestName,
      age: 28 + (i % 42),
      gender: i % 2 === 0 ? 'Female' : 'Male',
      city: cities[i % cities.length],
      guest_segment: segments[i % segments.length],
      loyalty_level: loyaltyLevels[i % loyaltyLevels.length],
      adults: (i % 2) + 1,
      children: (i % 4 === 0) ? 1 : 0,
      total_guests: (i % 2) + 1 + ((i % 4 === 0) ? 1 : 0),
      repeat_guest: (i % 3 === 0) ? 'Yes' : 'No',

      room_charge: roomCharge,
      food_charge: foodCharge,
      service_charge: serviceCharge,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_booking_amount: totalBookingAmount,

      special_request: (i % 2 === 0) ? 'High floor ocean vista & organic fruit platter' : 'Feather-free hypoallergenic pillows and late departure',
      request_status: isSuccess ? 'Fulfilled' : 'Cancelled',
      complaint_category: complaints[i % complaints.length],
      feedback_category: feedbackCategories[i % feedbackCategories.length],
      satisfaction_score: satisfaction,
      sentiment: sentiment,
      feedback_text: satisfaction >= 4 
        ? 'Impeccable resort grounds, peaceful infinity terrace, and attentive butler hospitality.'
        : 'Slight delay during check-in rush hours, though the room amenities were beautiful.',
      guest_return_intent: returnIntents[i % returnIntents.length],

      staff_role: staffRoles[i % staffRoles.length],
      staff_response_time_minutes: 5 + (i % 15),
      request_resolution_time_minutes: 15 + (i % 35),
      occupancy_at_checkin_percent: 70 + (i % 26),
      ai_priority: aiPriorities[i % aiPriorities.length],
      ai_action: aiActions[i % aiActions.length],
    };

    records.push(rec);

    // Deliberate repeated transaction: multiple charges for the same booking
    if (i % 5 === 0) {
      records.push({
        ...rec,
        transaction_id: `TXN-2026-${String(i + 10000).padStart(6, '0')}`,
        transaction_category: 'food_and_beverage',
        transaction_amount: 145.50,
        payment_method: 'Credit Card (Amex)',
        payment_status: 'Success',
        transaction_status: 'Settled',
      });
    }

    // Deliberate exact duplicate (for duplicate detection test)
    if (i === 12 || i === 45) {
      records.push({ ...rec, is_exact_duplicate: true });
    }
  }

  return records;
}

class DatasetService {
  private records: NivoraDatasetRecord[] = [];
  private qualityReport: DataQualityReport | null = null;
  private importReport: ImportExecutionReport | null = null;
  private subscribers: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(DATASET_STORAGE_KEY);
        if (raw) {
          this.records = JSON.parse(raw);
        } else {
          this.records = generateSeedDataset();
          this.save();
        }

        const rawQR = window.localStorage.getItem(QUALITY_REPORT_KEY);
        if (rawQR) this.qualityReport = JSON.parse(rawQR);
        else this.analyzeDataQuality();

        const rawIR = window.localStorage.getItem(IMPORT_REPORT_KEY);
        if (rawIR) this.importReport = JSON.parse(rawIR);
      } else {
        this.records = generateSeedDataset();
        this.analyzeDataQuality();
      }
    } catch (e) {
      this.records = generateSeedDataset();
      this.analyzeDataQuality();
    }
  }

  private save() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(this.records));
        if (this.qualityReport) window.localStorage.setItem(QUALITY_REPORT_KEY, JSON.stringify(this.qualityReport));
        if (this.importReport) window.localStorage.setItem(IMPORT_REPORT_KEY, JSON.stringify(this.importReport));
      } catch (err) {
        // storage quota
      }
    }
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  private notify() {
    this.subscribers.forEach(fn => fn());
  }

  public getRecords(): NivoraDatasetRecord[] {
    return [...this.records];
  }

  public getQualityReport(): DataQualityReport {
    if (!this.qualityReport) {
      this.analyzeDataQuality();
    }
    return this.qualityReport!;
  }

  public getImportReport(): ImportExecutionReport | null {
    return this.importReport;
  }

  // --- PHASE 1: DATA QUALITY INSPECTION & ANOMALY DETECTION ---
  public analyzeDataQuality(): DataQualityReport {
    const total = this.records.length;
    let exactDups = 0;
    let businessConflicts = 0;
    let financialAnomalies = 0;
    let statusInconsistencies = 0;
    let dateAnomalies = 0;
    const missingCounts: Record<string, number> = {};

    const seenExactKeys = new Set<string>();
    const seenTxKeys = new Set<string>();

    for (const r of this.records) {
      // 1. Exact Duplicate Check (combination of all key properties)
      const exactHash = `${r.transaction_id}_${r.booking_id}_${r.transaction_amount}_${r.guest_id}_${r.check_in_date}`;
      if (seenExactKeys.has(exactHash)) {
        exactDups++;
        r.is_exact_duplicate = true;
      } else {
        seenExactKeys.add(exactHash);
      }

      // 2. Business key conflicts (e.g. same transaction_id with conflicting amounts)
      if (seenTxKeys.has(r.transaction_id)) {
        businessConflicts++;
        r.is_business_duplicate = true;
      } else {
        seenTxKeys.add(r.transaction_id);
      }

      // 3. Financial calculations check
      if (r.transaction_amount <= 0 || isNaN(r.transaction_amount)) {
        financialAnomalies++;
      }

      // 4. Dates check
      if (r.check_in_date && r.check_out_date) {
        const inD = new Date(r.check_in_date).getTime();
        const outD = new Date(r.check_out_date).getTime();
        if (outD <= inD) dateAnomalies++;
      }

      // 5. Status check
      if (r.payment_status === 'Success' && r.transaction_status === 'Failed') {
        statusInconsistencies++;
      }
    }

    const report: DataQualityReport = {
      total_rows_read: total,
      valid_records: total - exactDups,
      exact_duplicates_detected: exactDups,
      business_conflicts_detected: businessConflicts,
      missing_values_by_column: missingCounts,
      anomalous_financial_records: financialAnomalies,
      status_inconsistencies: statusInconsistencies,
      date_anomalies: dateAnomalies,
      inspected_at: new Date().toISOString(),
    };

    this.qualityReport = report;
    return report;
  }

  // --- PHASE 3: SAFE EXCEL IMPORT PIPELINE ---
  public async importWorkbook(bufferOrFile: ArrayBuffer | File): Promise<ImportExecutionReport> {
    const startTime = Date.now();
    let data: any[] = [];

    if (bufferOrFile instanceof File) {
      const arrayBuffer = await bufferOrFile.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(firstSheet);
    } else {
      const wb = XLSX.read(bufferOrFile, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(firstSheet);
    }

    const totalRead = data.length;
    let inserted = 0;
    let updated = 0;
    let exactSkipped = 0;
    let conflictsResolved = 0;
    let rejected = 0;
    const errors: string[] = [];
    const missingCounts: Record<string, number> = {};

    const existingTxMap = new Map<string, NivoraDatasetRecord>();
    this.records.forEach(r => existingTxMap.set(r.transaction_id, r));

    const validatedNewRecords: NivoraDatasetRecord[] = [];

    for (let idx = 0; idx < data.length; idx++) {
      const row = data[idx];
      const txId = row.transaction_id || row['Transaction ID'] || `TXN-IMP-${idx + 1}`;
      const bookingId = row.booking_id || row['Booking ID'] || `BK-IMP-${idx + 1}`;
      const guestId = row.guest_id || row['Guest ID'] || `GST-IMP-${idx + 1}`;
      const amount = Number(row.transaction_amount || row['Transaction Amount'] || row.amount || 0);

      // Validate mandatory fields
      if (!txId || isNaN(amount)) {
        rejected++;
        errors.push(`Row ${idx + 1}: Missing transaction_id or invalid amount.`);
        continue;
      }

      const normalized: NivoraDatasetRecord = {
        transaction_id: String(txId).trim(),
        transaction_date: String(row.transaction_date || row['Transaction Date'] || new Date().toISOString().split('T')[0]),
        transaction_category: String(row.transaction_category || 'room_charge'),
        transaction_amount: amount,
        payment_method: String(row.payment_method || 'Credit Card'),
        payment_status: String(row.payment_status || 'Success'),
        transaction_status: String(row.transaction_status || 'Settled'),

        room_id: String(row.room_id || 'RM-101'),
        room_status: String(row.room_status || 'clean'),
        booking_id: String(bookingId),
        check_in_date: String(row.check_in_date || '2026-10-10'),
        check_out_date: String(row.check_out_date || '2026-10-14'),
        stay_nights: Number(row.stay_nights || 4),
        room_type: String(row.room_type || 'Deluxe Oceanfront Horizon Room'),
        booking_source: String(row.booking_source || 'Direct Website'),
        booking_channel: String(row.booking_channel || 'Online'),
        booking_status: String(row.booking_status || 'Confirmed'),

        guest_id: String(guestId),
        guest_name: String(row.guest_name || 'Valued Guest'),
        age: Number(row.age || 38),
        gender: String(row.gender || 'Not Specified'),
        city: String(row.city || 'Global'),
        guest_segment: String(row.guest_segment || 'Luxury Leisure'),
        loyalty_level: String(row.loyalty_level || 'Silver'),
        adults: Number(row.adults || 2),
        children: Number(row.children || 0),
        total_guests: Number(row.total_guests || 2),
        repeat_guest: row.repeat_guest || 'No',

        room_charge: Number(row.room_charge || amount),
        food_charge: Number(row.food_charge || 0),
        service_charge: Number(row.service_charge || Math.round(amount * 0.1)),
        discount_percent: Number(row.discount_percent || 0),
        discount_amount: Number(row.discount_amount || 0),
        tax_amount: Number(row.tax_amount || Math.round(amount * 0.12)),
        total_booking_amount: Number(row.total_booking_amount || amount),

        special_request: String(row.special_request || 'None'),
        request_status: String(row.request_status || 'Fulfilled'),
        complaint_category: String(row.complaint_category || 'None'),
        feedback_category: String(row.feedback_category || 'Hospitality'),
        satisfaction_score: Number(row.satisfaction_score || 5),
        sentiment: String(row.sentiment || 'Positive'),
        feedback_text: String(row.feedback_text || 'Pleasant stay experience.'),
        guest_return_intent: String(row.guest_return_intent || 'High'),

        staff_role: String(row.staff_role || 'Front Desk Agent'),
        staff_response_time_minutes: Number(row.staff_response_time_minutes || 8),
        request_resolution_time_minutes: Number(row.request_resolution_time_minutes || 20),
        occupancy_at_checkin_percent: Number(row.occupancy_at_checkin_percent || 80),
        ai_priority: String(row.ai_priority || 'Routine'),
        ai_action: String(row.ai_action || 'Standard Service Delivery'),
      };

      // Idempotency: If exact transaction already exists with identical values, skip
      const existing = existingTxMap.get(normalized.transaction_id);
      if (existing) {
        if (existing.transaction_amount === normalized.transaction_amount && existing.booking_id === normalized.booking_id) {
          exactSkipped++;
          continue;
        } else {
          // Update / resolve conflict
          Object.assign(existing, normalized);
          conflictsResolved++;
          updated++;
        }
      } else {
        existingTxMap.set(normalized.transaction_id, normalized);
        validatedNewRecords.push(normalized);
        inserted++;
      }
    }

    this.records = [...this.records, ...validatedNewRecords];
    this.save();
    this.analyzeDataQuality();

    const report: ImportExecutionReport = {
      total_rows_read: totalRead,
      rows_inserted: inserted,
      rows_updated: updated,
      exact_duplicate_rows_skipped: exactSkipped,
      business_key_conflicts_resolved: conflictsResolved,
      rows_rejected: rejected,
      missing_value_counts: missingCounts,
      validation_errors: errors.slice(0, 10),
      execution_duration_ms: Date.now() - startTime,
      imported_at: new Date().toISOString(),
    };

    this.importReport = report;
    this.save();
    return report;
  }

  // --- PHASE 6: HOTEL ANALYTICS CALCULATION (SQL AGGREGATIONS) ---
  public calculateAnalytics(filter?: {
    roomType?: string;
    bookingChannel?: string;
    guestSegment?: string;
    transactionStatus?: string;
  }): HotelAnalyticsMetrics {
    let dataset = [...this.records];

    if (filter?.roomType && filter.roomType !== 'all') {
      dataset = dataset.filter(r => r.room_type === filter.roomType);
    }
    if (filter?.bookingChannel && filter.bookingChannel !== 'all') {
      dataset = dataset.filter(r => r.booking_channel === filter.bookingChannel);
    }
    if (filter?.guestSegment && filter.guestSegment !== 'all') {
      dataset = dataset.filter(r => r.guest_segment === filter.guestSegment);
    }
    if (filter?.transactionStatus && filter.transactionStatus !== 'all') {
      const txStatus = filter.transactionStatus.toLowerCase();
      dataset = dataset.filter(r => r.transaction_status.toLowerCase() === txStatus);
    }

    let totalTxAmount = 0;
    let successfulTxAmount = 0;
    let failedTxAmount = 0;
    let totalTxCount = dataset.length;
    let successfulTxCount = 0;
    let failedTxCount = 0;

    const bookingsByStatus: Record<string, number> = {};
    const revByCategory: Record<string, number> = {};
    const revByChannel: Record<string, number> = {};
    const revByRoomType: Record<string, number> = {};
    const guestSegments: Record<string, number> = {};
    const loyaltyDist: Record<string, number> = {};
    const sentimentDist: Record<string, number> = {};
    const returnIntentDist: Record<string, number> = {};
    const complaintDist: Record<string, number> = {};

    let totalBookingAmounts = 0;
    let bookingAmountCount = 0;
    let totalStayNights = 0;
    let repeatGuestCount = 0;
    let totalSatisfaction = 0;
    let totalStaffResponseMinutes = 0;
    let totalResolutionMinutes = 0;
    let totalOccupancyPercent = 0;

    const seenBookings = new Set<string>();

    for (const r of dataset) {
      totalTxAmount += r.transaction_amount;

      const isSuccess = r.payment_status === 'Success' && r.transaction_status === 'Settled';
      if (isSuccess) {
        successfulTxAmount += r.transaction_amount;
        successfulTxCount++;

        // Revenue by category
        revByCategory[r.transaction_category] = (revByCategory[r.transaction_category] || 0) + r.transaction_amount;
        revByChannel[r.booking_channel] = (revByChannel[r.booking_channel] || 0) + r.transaction_amount;
        revByRoomType[r.room_type] = (revByRoomType[r.room_type] || 0) + r.transaction_amount;
      } else {
        failedTxAmount += r.transaction_amount;
        failedTxCount++;
      }

      // Unique booking metrics to avoid double-counting multi-transaction bookings
      if (!seenBookings.has(r.booking_id)) {
        seenBookings.add(r.booking_id);
        bookingsByStatus[r.booking_status] = (bookingsByStatus[r.booking_status] || 0) + 1;
        totalBookingAmounts += r.total_booking_amount;
        bookingAmountCount++;
        totalStayNights += r.stay_nights;

        const isRepeat = r.repeat_guest === 'Yes' || r.repeat_guest === true || r.repeat_guest === 1;
        if (isRepeat) repeatGuestCount++;
      }

      // Guest & Feedback metrics
      guestSegments[r.guest_segment] = (guestSegments[r.guest_segment] || 0) + 1;
      loyaltyDist[r.loyalty_level] = (loyaltyDist[r.loyalty_level] || 0) + 1;
      sentimentDist[r.sentiment] = (sentimentDist[r.sentiment] || 0) + 1;
      returnIntentDist[r.guest_return_intent] = (returnIntentDist[r.guest_return_intent] || 0) + 1;
      if (r.complaint_category && r.complaint_category !== 'None') {
        complaintDist[r.complaint_category] = (complaintDist[r.complaint_category] || 0) + 1;
      }

      totalSatisfaction += r.satisfaction_score;
      totalStaffResponseMinutes += r.staff_response_time_minutes;
      totalResolutionMinutes += r.request_resolution_time_minutes;
      totalOccupancyPercent += r.occupancy_at_checkin_percent;
    }

    const n = Math.max(1, dataset.length);
    const bCount = Math.max(1, seenBookings.size);

    return {
      total_transaction_amount: Math.round(totalTxAmount),
      successful_transactions_amount: Math.round(successfulTxAmount),
      failed_transactions_amount: Math.round(failedTxAmount),
      total_transactions_count: totalTxCount,
      successful_transactions_count: successfulTxCount,
      failed_transactions_count: failedTxCount,
      success_rate_percent: totalTxCount > 0 ? Number(((successfulTxCount / totalTxCount) * 100).toFixed(1)) : 0,

      bookings_by_status: bookingsByStatus,
      revenue_by_transaction_category: revByCategory,
      revenue_by_booking_channel: revByChannel,
      revenue_by_room_type: revByRoomType,

      average_booking_amount: Math.round(totalBookingAmounts / bCount),
      average_stay_duration_nights: Number((totalStayNights / bCount).toFixed(1)),
      total_room_nights_sold: totalStayNights,

      guest_segment_distribution: guestSegments,
      repeat_guest_percentage: Number(((repeatGuestCount / bCount) * 100).toFixed(1)),
      loyalty_distribution: loyaltyDist,

      average_satisfaction_score: Number((totalSatisfaction / n).toFixed(2)),
      sentiment_distribution: sentimentDist,
      return_intent_distribution: returnIntentDist,
      complaint_categories_distribution: complaintDist,

      average_staff_response_time_minutes: Number((totalStaffResponseMinutes / n).toFixed(1)),
      average_service_resolution_time_minutes: Number((totalResolutionMinutes / n).toFixed(1)),
      average_occupancy_percent: Number((totalOccupancyPercent / n).toFixed(1)),

      total_records_analyzed: dataset.length,
      data_freshness_timestamp: new Date().toISOString(),
    };
  }
}

export const datasetService = new DatasetService();
