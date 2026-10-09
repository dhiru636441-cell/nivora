export type UserRole = 'customer' | 'staff' | 'front_desk';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  passport_or_id: string;
  address?: string;
  vip_status?: boolean;
  preferences?: {
    floor_preference?: 'high' | 'low' | 'any';
    pillow_type?: string;
    dietary?: string;
    special_notes?: string;
  };
  created_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: 'housekeeping' | 'maintenance' | 'front_desk' | 'management';
  shift: 'morning' | 'evening' | 'night';
  badge_number: string;
  status: 'on_duty' | 'off_duty' | 'break';
  created_at: string;
}

export interface RoomType {
  id: string;
  name: string;
  category: 'suite' | 'deluxe' | 'villa' | 'standard';
  description: string;
  base_price_cents: number; // in cents, e.g. 35000 = $350.00
  max_occupancy: number;
  bed_type: string;
  size_sqm: number;
  amenities: string[];
  image_url: string;
}

export type RoomOperationalStatus = 'clean' | 'dirty' | 'cleaning_in_progress' | 'inspected' | 'out_of_service';
export type RoomOccupancyStatus = 'vacant' | 'occupied';

export interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  operational_status: RoomOperationalStatus;
  occupancy_status: RoomOccupancyStatus;
  current_stay_id?: string;
  last_cleaned_at?: string;
  notes?: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Reservation {
  id: string;
  booking_reference: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  room_type_id: string;
  assigned_room_id?: string;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  num_guests: number;
  total_price_cents: number;
  paid_amount_cents: number;
  status: ReservationStatus;
  special_requests?: string;
  created_at: string;
}

export type StayStatus = 'active' | 'completed';

export interface ActiveStay {
  id: string;
  reservation_id: string;
  room_id: string;
  room_number: string;
  user_id: string;
  guest_name: string;
  check_in_time: string;
  expected_check_out: string;
  actual_check_out_time?: string;
  keycard_code: string;
  status: StayStatus;
  notes?: string;
}

export type ServiceRequestCategory = 'housekeeping' | 'room_service' | 'maintenance' | 'concierge';
export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
  user_id: string;
  reservation_id?: string;
  room_number: string;
  category: ServiceRequestCategory;
  title: string;
  details: string;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  created_at: string;
  completed_at?: string;
  assigned_to_name?: string;
  notes?: string;
}

export type HousekeepingTaskType = 'turnover_clean' | 'daily_tidy' | 'deep_clean' | 'inspection';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface HousekeepingTask {
  id: string;
  room_id: string;
  room_number: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  task_type: HousekeepingTaskType;
  priority: 'routine' | 'priority' | 'urgent';
  status: TaskStatus;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export type MaintenanceUrgency = 'low' | 'medium' | 'high' | 'emergency';
export type MaintenanceStatus = 'reported' | 'investigating' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  id: string;
  room_id: string;
  room_number: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  issue_title: string;
  description: string;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  resolution_notes?: string;
  reported_by?: string;
  created_at: string;
  resolved_at?: string;
}

export type PaymentMethod = 'card' | 'cash' | 'folio_transfer' | 'authorized_terminal';
export type PaymentStatus = 'pending' | 'verified' | 'refunded';

export interface PaymentRecord {
  id: string;
  reservation_id: string;
  booking_reference: string;
  amount_cents: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  verified_by: string; // Staff or front desk agent
  transaction_reference: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  target_role?: UserRole | 'all';
  title: string;
  message: string;
  read: boolean;
  link_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// PHASE 1 & 2: 49-COLUMN EXCEL DATASET SCHEMA & DATA QUALITY INTERFACES
// ============================================================================

export interface NivoraDatasetRecord {
  // Transactions and payments (7)
  transaction_id: string;
  transaction_date: string;
  transaction_category: string;
  transaction_amount: number;
  payment_method: string;
  payment_status: string;
  transaction_status: string;

  // Rooms and reservations (10)
  room_id: string;
  room_status: string;
  booking_id: string;
  check_in_date: string;
  check_out_date: string;
  stay_nights: number;
  room_type: string;
  booking_source: string;
  booking_channel: string;
  booking_status: string;

  // Guest information (11)
  guest_id: string;
  guest_name: string;
  age: number;
  gender: string;
  city: string;
  guest_segment: string;
  loyalty_level: string;
  adults: number;
  children: number;
  total_guests: number;
  repeat_guest: boolean | number | string;

  // Booking amounts (7)
  room_charge: number;
  food_charge: number;
  service_charge: number;
  discount_percent: number;
  discount_amount: number;
  tax_amount: number;
  total_booking_amount: number;

  // Guest requests and feedback (8)
  special_request: string;
  request_status: string;
  complaint_category: string;
  feedback_category: string;
  satisfaction_score: number;
  sentiment: string;
  feedback_text: string;
  guest_return_intent: string;

  // Staff and AI-related fields (6)
  staff_role: string;
  staff_response_time_minutes: number;
  request_resolution_time_minutes: number;
  occupancy_at_checkin_percent: number;
  ai_priority: string;
  ai_action: string;

  // System validation tags
  is_exact_duplicate?: boolean;
  is_business_duplicate?: boolean;
  validation_issues?: string[];
}

export interface DataQualityReport {
  total_rows_read: number;
  valid_records: number;
  exact_duplicates_detected: number;
  business_conflicts_detected: number;
  missing_values_by_column: Record<string, number>;
  anomalous_financial_records: number;
  status_inconsistencies: number;
  date_anomalies: number;
  inspected_at: string;
}

export interface ImportExecutionReport {
  total_rows_read: number;
  rows_inserted: number;
  rows_updated: number;
  exact_duplicate_rows_skipped: number;
  business_key_conflicts_resolved: number;
  rows_rejected: number;
  missing_value_counts: Record<string, number>;
  validation_errors: string[];
  execution_duration_ms: number;
  imported_at: string;
}

// ============================================================================
// PHASE 6: REAL HOTEL ANALYTICS METRICS
// ============================================================================

export interface HotelAnalyticsMetrics {
  total_transaction_amount: number;
  successful_transactions_amount: number;
  failed_transactions_amount: number;
  total_transactions_count: number;
  successful_transactions_count: number;
  failed_transactions_count: number;
  success_rate_percent: number;

  bookings_by_status: Record<string, number>;
  revenue_by_transaction_category: Record<string, number>;
  revenue_by_booking_channel: Record<string, number>;
  revenue_by_room_type: Record<string, number>;

  average_booking_amount: number;
  average_stay_duration_nights: number;
  total_room_nights_sold: number;

  guest_segment_distribution: Record<string, number>;
  repeat_guest_percentage: number;
  loyalty_distribution: Record<string, number>;

  average_satisfaction_score: number;
  sentiment_distribution: Record<string, number>;
  return_intent_distribution: Record<string, number>;
  complaint_categories_distribution: Record<string, number>;

  average_staff_response_time_minutes: number;
  average_service_resolution_time_minutes: number;
  average_occupancy_percent: number;

  total_records_analyzed: number;
  data_freshness_timestamp: string;
}

// ============================================================================
// PHASE 7: GROUNDED HOTEL INTELLIGENCE & KNOWLEDGE
// ============================================================================

export interface HotelKnowledgeDocument {
  id: string;
  category: 'policy' | 'faq' | 'service' | 'room_spec' | 'dining' | 'wellness' | 'sop';
  title: string;
  content: string;
  keywords: string[];
  updated_at: string;
}

export interface AIQueryResponse {
  answer: string;
  sql_query?: string;
  sql_results_summary?: Record<string, any>;
  retrieved_sources?: Array<{ title: string; category: string; snippet?: string }>;
  role_scope: UserRole;
  data_freshness: string;
  limitations?: string;
}

