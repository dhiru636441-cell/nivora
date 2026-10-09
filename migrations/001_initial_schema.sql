-- ============================================================================
-- Nivora Resort & Hotel Intelligence — Initial Database Schema & Security
-- Phase 2: Schema, Constraints, Row Level Security (RLS), and Role Control
-- ============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. USER ROLES & PROFILES (Linked to Supabase auth.users)
create table if not exists public.user_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text not null,
    role text not null check (role in ('customer', 'staff', 'front_desk')),
    phone text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for role lookups
create index if not exists idx_user_roles_role on public.user_roles(role);
create index if not exists idx_user_roles_email on public.user_roles(email);

-- 2. CUSTOMERS
create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid unique references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null,
    phone text not null,
    passport_or_id text,
    address text,
    vip_status boolean default false,
    preferences jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 3. STAFF PROFILES
create table if not exists public.staff_profiles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid unique references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null,
    department text not null check (department in ('housekeeping', 'maintenance', 'front_desk', 'management')),
    shift text not null check (shift in ('morning', 'evening', 'night')),
    badge_number text not null unique,
    status text not null default 'on_duty' check (status in ('on_duty', 'off_duty', 'break')),
    created_at timestamptz not null default now()
);

-- 4. ROOM TYPES
create table if not exists public.room_types (
    id text primary key,
    name text not null,
    category text not null check (category in ('suite', 'deluxe', 'villa', 'standard')),
    description text not null,
    base_price_cents integer not null check (base_price_cents > 0),
    max_occupancy integer not null check (max_occupancy > 0),
    bed_type text not null,
    size_sqm integer not null,
    amenities text[] default '{}',
    image_url text not null,
    created_at timestamptz not null default now()
);

-- 5. ROOMS
create table if not exists public.rooms (
    id text primary key,
    room_number text not null unique,
    room_type_id text not null references public.room_types(id) on delete restrict,
    floor integer not null check (floor > 0),
    operational_status text not null default 'clean' check (operational_status in ('clean', 'dirty', 'cleaning_in_progress', 'inspected', 'out_of_service')),
    occupancy_status text not null default 'vacant' check (occupancy_status in ('vacant', 'occupied')),
    current_stay_id text,
    last_cleaned_at timestamptz,
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_rooms_operational_status on public.rooms(operational_status);
create index if not exists idx_rooms_occupancy_status on public.rooms(occupancy_status);

-- 6. RESERVATIONS
create table if not exists public.reservations (
    id text primary key,
    booking_reference text not null unique,
    user_id uuid references auth.users(id) on delete set null,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    room_type_id text not null references public.room_types(id) on delete restrict,
    assigned_room_id text references public.rooms(id) on delete set null,
    check_in_date date not null,
    check_out_date date not null,
    num_guests integer not null check (num_guests > 0),
    total_price_cents integer not null check (total_price_cents >= 0),
    paid_amount_cents integer not null default 0 check (paid_amount_cents >= 0),
    status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
    special_requests text,
    created_at timestamptz not null default now(),
    constraint check_dates_valid check (check_out_date > check_in_date)
);

create index if not exists idx_reservations_user_id on public.reservations(user_id);
create index if not exists idx_reservations_status on public.reservations(status);
create index if not exists idx_reservations_dates on public.reservations(check_in_date, check_out_date);
create index if not exists idx_reservations_booking_ref on public.reservations(booking_reference);

-- 7. ACTIVE STAYS
create table if not exists public.active_stays (
    id text primary key,
    reservation_id text not null references public.reservations(id) on delete cascade,
    room_id text not null references public.rooms(id) on delete restrict,
    room_number text not null,
    user_id uuid references auth.users(id) on delete set null,
    guest_name text not null,
    check_in_time timestamptz not null default now(),
    expected_check_out date not null,
    actual_check_out_time timestamptz,
    keycard_code text not null,
    status text not null default 'active' check (status in ('active', 'completed')),
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_active_stays_room on public.active_stays(room_id);
create index if not exists idx_active_stays_status on public.active_stays(status);

-- 8. SERVICE REQUESTS
create table if not exists public.service_requests (
    id text primary key,
    user_id uuid references auth.users(id) on delete set null,
    reservation_id text references public.reservations(id) on delete set null,
    room_number text not null,
    category text not null check (category in ('housekeeping', 'room_service', 'maintenance', 'concierge')),
    title text not null,
    details text not null,
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    assigned_to_name text,
    notes text
);

create index if not exists idx_service_requests_status on public.service_requests(status);
create index if not exists idx_service_requests_user on public.service_requests(user_id);

-- 9. HOUSEKEEPING TASKS
create table if not exists public.housekeeping_tasks (
    id text primary key,
    room_id text not null references public.rooms(id) on delete cascade,
    room_number text not null,
    assigned_staff_id uuid references auth.users(id) on delete set null,
    assigned_staff_name text,
    task_type text not null check (task_type in ('turnover_clean', 'daily_tidy', 'deep_clean', 'inspection')),
    priority text not null default 'routine' check (priority in ('routine', 'priority', 'urgent')),
    status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
    notes text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_housekeeping_status on public.housekeeping_tasks(status);
create index if not exists idx_housekeeping_room on public.housekeeping_tasks(room_id);

-- 10. MAINTENANCE REQUESTS
create table if not exists public.maintenance_requests (
    id text primary key,
    room_id text not null references public.rooms(id) on delete cascade,
    room_number text not null,
    assigned_staff_id uuid references auth.users(id) on delete set null,
    assigned_staff_name text,
    issue_title text not null,
    description text not null,
    urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high', 'emergency')),
    status text not null default 'reported' check (status in ('reported', 'investigating', 'in_progress', 'resolved')),
    resolution_notes text,
    reported_by text,
    created_at timestamptz not null default now(),
    resolved_at timestamptz
);

create index if not exists idx_maintenance_status on public.maintenance_requests(status);

-- 11. PAYMENTS AND AUDIT RECORDS
create table if not exists public.payments (
    id text primary key,
    reservation_id text not null references public.reservations(id) on delete cascade,
    booking_reference text not null,
    amount_cents integer not null check (amount_cents > 0),
    currency text not null default 'USD',
    payment_method text not null check (payment_method in ('card', 'cash', 'folio_transfer', 'authorized_terminal')),
    status text not null default 'verified' check (status in ('pending', 'verified', 'refunded')),
    verified_by text not null,
    transaction_reference text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists public.notifications (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    target_role text check (target_role in ('customer', 'staff', 'front_desk', 'all')),
    title text not null,
    message text not null,
    read boolean not null default false,
    link_url text,
    created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
    id text primary key,
    actor_id text not null,
    actor_email text not null,
    actor_role text not null,
    action text not null,
    entity_type text not null,
    entity_id text not null,
    details jsonb default '{}'::jsonb,
    timestamp timestamptz not null default now()
);

create index if not exists idx_audit_logs_timestamp on public.audit_logs(timestamp desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.room_types enable row level security;
alter table public.rooms enable row level security;
alter table public.reservations enable row level security;
alter table public.active_stays enable row level security;
alter table public.service_requests enable row level security;
alter table public.housekeeping_tasks enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function: Get current user role
create or replace function public.current_user_role()
returns text as $$
  select role from public.user_roles where user_id = auth.uid();
$$ language sql security definer;

-- Trigger to auto-create user_role as 'customer' for new Google OAuth sign-ups
-- Preventing self-assignment of staff or front_desk
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_roles (user_id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'customer', -- STRICT DEFAULT: New signups are always customer
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- USER ROLES POLICIES
create policy "Users can view own role"
  on public.user_roles for select
  using (auth.uid() = user_id or public.current_user_role() in ('front_desk'));

-- ROOM TYPES POLICIES (Public read for all authenticated users)
create policy "Anyone can view room types"
  on public.room_types for select
  using (true);

-- ROOMS POLICIES
create policy "Staff and Front Desk can view all rooms"
  on public.rooms for select
  using (public.current_user_role() in ('staff', 'front_desk'));

create policy "Customers can view basic room info"
  on public.rooms for select
  using (true);

create policy "Staff and Front Desk can update room status"
  on public.rooms for update
  using (public.current_user_role() in ('staff', 'front_desk'));

-- RESERVATIONS POLICIES
create policy "Customers can view own reservations"
  on public.reservations for select
  using (auth.uid() = user_id or public.current_user_role() in ('front_desk', 'staff'));

create policy "Customers can insert own reservations"
  on public.reservations for insert
  with check (auth.uid() = user_id or public.current_user_role() in ('front_desk'));

create policy "Front Desk can manage all reservations"
  on public.reservations for all
  using (public.current_user_role() = 'front_desk');

-- ACTIVE STAYS POLICIES
create policy "Customers can view own active stays"
  on public.active_stays for select
  using (auth.uid() = user_id or public.current_user_role() in ('front_desk', 'staff'));

create policy "Front desk can manage active stays"
  on public.active_stays for all
  using (public.current_user_role() = 'front_desk');

-- SERVICE REQUESTS POLICIES
create policy "Customers can view and submit own service requests"
  on public.service_requests for select
  using (auth.uid() = user_id or public.current_user_role() in ('staff', 'front_desk'));

create policy "Customers can insert service requests"
  on public.service_requests for insert
  with check (auth.uid() = user_id or public.current_user_role() in ('front_desk'));

create policy "Staff can update service requests"
  on public.service_requests for update
  using (public.current_user_role() in ('staff', 'front_desk'));

-- HOUSEKEEPING & MAINTENANCE (Staff & Front Desk only)
create policy "Staff can view and update housekeeping tasks"
  on public.housekeeping_tasks for all
  using (public.current_user_role() in ('staff', 'front_desk'));

create policy "Staff can view and update maintenance"
  on public.maintenance_requests for all
  using (public.current_user_role() in ('staff', 'front_desk'));

-- PAYMENTS POLICIES (Front desk only)
create policy "Front desk can view and record payments"
  on public.payments for all
  using (public.current_user_role() = 'front_desk');

-- AUDIT LOGS POLICIES
create policy "Staff and Front Desk can view audit logs"
  on public.audit_logs for select
  using (public.current_user_role() in ('front_desk'));

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true);
