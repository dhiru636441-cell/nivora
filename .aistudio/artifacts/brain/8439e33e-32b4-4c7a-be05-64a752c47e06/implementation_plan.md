# Nivora Resort — Strict Role-Based Portal Separation & Customer Profile Onboarding

Comprehensive architectural plan to enforce strict role-based authentication, navigation, and backend route protection across Nivora Resort's three distinct operational environments (Customer Sanctuary, Staff Operations, and Front Desk Intelligence), paired with a luxury full-page customer profile completion onboarding flow and verified Supabase persistence.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been confirmed via Phase 1 clarification:

- **Confirmed Decision 1 (Separate Login Interfaces)**: Staff and Front Desk employees access their portals via dedicated URLs (`/staff` and `/front-desk`) featuring dedicated, portal-specific login interfaces. The customer-facing login (`/` and `/login`) displays strictly Customer/Guest authentication with no staff or front desk links, role selectors, or employee buttons.
- **Confirmed Decision 2 (Unauthorized Access Enforcement)**: When any user manually enters a restricted URL for another portal, the application displays a dedicated, luxury **Access Denied** screen detailing the restriction with a primary button to safely return to their authorized dashboard.
- **Confirmed Decision 3 (Customer Profile Onboarding)**: Newly registered customers and existing customers with incomplete profiles are routed to a dedicated, full-page luxury **Complete Your Profile** onboarding screen before access to the main customer dashboard is granted.

---

## 1. Overview & Core Concept

### What It Delivers
A complete separation of concerns between guest-facing hospitality and internal resort operations:
1. **Three Completely Isolated Login Surfaces**:
   - **Customer Portal (`/`, `/login`)**: Dedicated solely to guest bookings, luxury stays, culinary dining, and guest profiles. No staff or front desk affordances exist here.
   - **Staff Operations Portal (`/staff`, `/staff/login`)**: Tailored login for housekeeping, maintenance, and concierge teams. Customer registration and guest links are completely excluded.
   - **Front Desk Intelligence Portal (`/front-desk`, `/front-desk/login`)**: Secure login for front desk supervisors, reservation agents, and night audit operations. Customer and housekeeping logins are excluded.
2. **Dedicated Full-Page Customer Profile Onboarding**:
   - Immediately intercepts any authenticated guest whose profile lacks required legal information.
   - Validates **Full Name** (text), **Age** (integer strictly between 18 and 120), **Gender** (`Male`, `Female`, `Prefer not to say`), and **Mobile Number** (with country code selector, defaulting to `+91` for India).
   - Blocks dashboard access until successfully validated and saved to Supabase.
   - Persists data permanently so returning customers proceed directly to the dashboard without repeated prompts.
3. **Strict Route Protection & Backend Role Authorization**:
   - Server-enforced role verification using authenticated identity records in Supabase and trusted database lookup.
   - Client-side role tampering or URL manipulation cannot grant elevated access.
   - Cross-role navigation is blocked; attempting to navigate to another portal presents a polished Access Denied screen.

---

## 2. User Experience & Visual Design

### Key User Flows

#### Flow A: Guest Registration & First-Time Onboarding
```
[Guest Visits /] ──> [Clicks 'Sign In / Register'] ──> [Customer Auth Modal (Email/Google/Phone)]
       │
       ▼ (Successful Authentication)
[Check Profile Status] ──(Profile Incomplete)──> [Dedicated Full-Page 'Complete Your Profile']
                                                               │
                                                               ▼ (Validates: Name, Age 18-120, Gender, +91 Phone)
[Customer Dashboard Opened] <────────(Saves to Supabase)──────┘
```

#### Flow B: Returning Customer Login
```
[Guest Visits /login] ──> [Enters Credentials] ──> [Supabase Authenticates]
       │
       ▼
[Check Profile Status: Complete] ──> [Direct Access to Customer Dashboard]
```

#### Flow C: Staff / Front Desk Authentication & Cross-Access Blocking
```
[Staff Visits /staff] ──> [Staff Portal Login Screen] ──> [Authenticates Staff Account]
       │
       ▼
[Staff Dashboard Active] ──(Types /front-desk or /customer)──> [Access Denied Screen]
                                                                        │
                                                                        ▼
                                                         [Click 'Return to Staff Portal']
```

### Visual Identity & Theme
- **Color Discipline (60-30-10)**:
  - **60% Canvas**: Warm Ivory (`#F7F3EA`) in light mode; Deep Obsidian Green (`#141714` / `#161916`) in dark mode.
  - **30% Structural Elements**: Sovereign Deep Forest Green (`#12382D`), subtle hairline borders (`border-[#C7A36A]/25`), and unboxed typography.
  - **10% Accent**: Brushed Champagne Gold (`#C7A36A`) reserved for primary action CTAs, active focus indicators, and key resort insignias.
- **Typography**:
  - **Display / Brand**: Serif typeface (`font-serif`) for luxury hotel headers and welcome banners.
  - **Body & Forms**: Clean modern sans-serif (`font-sans`) with generous line-height and touch targets ($\ge 44\text{px}$).
  - **Data & Phone Numbers**: Tabular figures (`tabular-nums font-mono`) for precision phone input and numeric validation.
- **Top Bar Contract (Clean 3-Zone Architecture)**:
  - **Customer Portal**: Brand wordmark (`NIVORA`) — Guest Navigation Links (Overview, Accommodations, Dining, Services, Concierge, Feedback) — Cart + Theme Toggle + User Profile. *Zero staff links or role toggles.*
  - **Staff Portal**: Brand wordmark (`NIVORA STAFF`) — Staff Modules (Housekeeping, Maintenance, Service Requests, Room Readiness) — Theme Toggle + Staff Badge.
  - **Front Desk Portal**: Brand wordmark (`NIVORA FRONT DESK`) — Operations Modules (Front Desk Intelligence, Room Roster, Check-Ins, Analytics) — Theme Toggle + Agent Badge.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Three Dedicated Login Components vs. Parameterized Shared Modal
- **Chosen Approach**: Three distinct, purpose-built login interfaces (`CustomerAuthModal`, `StaffLoginForm`, `FrontDeskLoginForm`) bound strictly to their respective route contexts.
- **Why**: Eliminates any possibility of accidental leakage of staff affordances, role selection chips, or employee demo hints to hotel guests. Provides tailored copy (e.g. employee badge ID / corporate SSO vs. guest vacation account).
- **Alternatives Considered**: A single shared login modal with dynamic props was rejected because conditional branching frequently exposes role dropdowns or tabs during state resets.

### Decision 2: Dual Persistence Strategy for Customer Profiles (Supabase Auth Metadata + Database Table)
- **Chosen Approach**: Upsert profile details (`full_name`, `age`, `gender`, `mobile_number`) into Supabase Auth's user metadata (`supabase.auth.updateUser`) AND the persistent `public.nivora_profiles` database table, complemented by synchronized user session state.
- **Why**: Supabase free-tier PostgREST schemas vary in available custom columns, while `auth.users.raw_user_meta_data` is guaranteed writable by the authenticated user and survives logins across all devices without schema mismatch errors.
- **Alternatives Considered**: Storing in browser `localStorage` alone was rejected because the requirement explicitly demands server-backed persistence in Supabase.

### Decision 3: Enforcing Authorization via Authenticated Email / Role Claims
- **Chosen Approach**: User roles are derived from trusted database records (`db.getUserRole(email)`) and Supabase identity attributes, strictly on the server/auth layer. Client code cannot elevate roles via URL parameters or state mutation.
- **Why**: Prevents guests from typing `/staff` and assuming staff privileges.

---

## 4. Technical Architecture & System Flow

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN ROUTER (App.tsx)                           │
│   Resolves path: / | /customer | /staff | /front-desk | /auth/callback │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ CUSTOMER DOMAIN  │      │   STAFF DOMAIN   │      │ FRONT DESK DOMAIN│
│  Route: /        │      │  Route: /staff   │      │Route: /front-desk│
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Role Guard Check │      │ Role Guard Check │      │ Role Guard Check │
│ (role === cust)  │      │ (role === staff) │      │(role===frontdesk)│
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │ (Pass)                  │ (Pass)                  │ (Pass)
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Profile Status   │      │  Staff Dashboard │      │Front Desk Portal │
│ Complete Check   │      │  & Room Toggles  │      │& Room Readiness  │
└────────┬─────────┘      └──────────────────┘      └──────────────────┘
   No    │     Yes
┌────────┴────────┐
▼                 ▼
┌──────────────┐  ┌──────────────┐
│Complete Your │  │Customer      │
│Profile Page  │  │Dashboard &   │
│(Full Screen) │  │Sanctuary Stays│
└──────────────┘  └──────────────┘
```

### Component & State Mapping

1. **`src/lib/types.ts`**:
   - Extend `UserProfile` with `age?: number`, `gender?: string`, `mobile_number?: string`, `is_profile_complete?: boolean`.
2. **`src/lib/auth-context.tsx`**:
   - Add `isProfileComplete` computed state.
   - Add `saveCustomerProfile({ full_name, age, gender, mobile_number })` handler.
   - Enforce trusted role lookup without client-side role toggle exploits.
   - Clean up mock role switcher buttons.
3. **`src/pages/customer/CompleteProfilePage.tsx`** *(New)*:
   - Full-page luxury responsive layout with Nivora branding.
   - Form fields with real-time feedback:
     - Full Name (required text).
     - Age (numeric, validated for $18 \le \text{age} \le 120$).
     - Gender (dropdown: `Male`, `Female`, `Prefer not to say`).
     - Mobile Number (country code selection defaulting to `+91`, min 7-digit validation).
   - Prominent "Save & Continue" button with loading spinner and error preservation.
4. **`src/components/auth/AuthModal.tsx`**:
   - Strip out all role-selection tabs (`Guest | Staff | Front Desk`) and quick-fill buttons.
   - Render purely Customer/Guest authentication.
5. **`src/components/auth/StaffAuthModal.tsx` & `FrontDeskAuthModal.tsx`** *(New/Refactored)*:
   - Dedicated authentication modals for `/staff` and `/front-desk` portals.
   - Only accept and verify employee credentials.
6. **`src/pages/AccessDenied.tsx`**:
   - Remove "Switch role to Staff/Front Desk" testing bypass buttons.
   - Provide clear, role-specific access restriction notice with "Return to Authorized Sanctuary" button.
7. **`src/components/layout/Navbar.tsx`**:
   - Hide Staff Operations and Front Desk Intelligence links from customer navigation and dropdown menus.
   - For authorized staff, show only their relevant operational links.
8. **`src/App.tsx`**:
   - Route resolution for `/`, `/staff`, `/front-desk`.
   - Intercept incomplete customer profiles and present `CompleteProfilePage`.
   - Protect `/staff` and `/front-desk` against customer access.

---

## 5. Verification & Testing Plan

1. **Customer Login Test**: Open customer login; verify no Staff or Front Desk buttons, tabs, or links are present.
2. **Profile Interception Test**: Register a new customer; verify the full-page "Complete Your Profile" appears before dashboard access.
3. **Input Validation Test**:
   - Submit age < 18 or > 120; verify error message.
   - Submit empty name or invalid phone number; verify error message.
   - Submit valid details (Age 28, Male, +91 98765 43210); verify profile saves and customer dashboard opens.
4. **Returning Customer Test**: Log out and log in again with the completed account; verify the user goes directly to the dashboard without repeating onboarding.
5. **Staff Portal Protection Test**:
   - As a customer, navigate directly to `/staff`; verify Access Denied screen appears.
   - As an authorized staff member, navigate to `/staff`; verify Staff Dashboard loads normally.
6. **Front Desk Protection Test**:
   - As a customer, navigate directly to `/front-desk`; verify Access Denied screen appears.
   - As an authorized front desk agent, navigate to `/front-desk`; verify Front Desk Intelligence loads normally.
7. **Cross-Role Staff Protection Test**:
   - As a staff member, verify customer-only booking functions are protected and staff cannot browse customer portals under employee session.
8. **Feature Regression Test**: Verify room browsing, reservations, F&B food ordering, cart, room status toggling, and feedback remain fully operational.
