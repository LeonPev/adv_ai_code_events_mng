# Community Center Management System — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-06-03  
**Audience:** Product Manager, UX Designer, Development Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Personas](#2-user-personas)
3. [User Journeys](#3-user-journeys)
4. [Entity Definitions](#4-entity-definitions)
5. [Business Rules](#5-business-rules)
6. [Permissions Matrix](#6-permissions-matrix)
7. [Functional Requirements](#7-functional-requirements)
8. [Screen Inventory](#8-screen-inventory)
9. [Navigation Flows](#9-navigation-flows)
10. [Enrollment Workflows](#10-enrollment-workflows)
11. [QR Attendance Workflow](#11-qr-attendance-workflow)
12. [Dashboard Requirements](#12-dashboard-requirements)
13. [Analytics Requirements](#13-analytics-requirements)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Error Scenarios](#15-error-scenarios)
16. [Edge Cases](#16-edge-cases)
17. [Future Expansion Opportunities](#17-future-expansion-opportunities)

---

## 1. Overview

The Community Center Management System (CCMS) is a web-based platform that enables community centers to manage their activities, rooms, customers, registrations, and attendance in a unified way. It serves three distinct user types: community members (Customers), front-desk staff (Check-In Operators), and administrative staff (Back Office Administrators).

### Goals

- Allow community members to discover and register for activities with minimal friction.
- Enable staff to check in event attendees quickly via QR code scanning.
- Give administrators full visibility and control over all entities in the system.
- Produce actionable reports on activity, registration, and attendance trends.

### Out of Scope for V1

- Payment processing (placeholders in the UI design only).
- Automated notifications (email, SMS, push).
- Waitlists.
- Approval workflows for registration.

---

## 2. User Personas

### 2.1 Customer — "Maya"

| Attribute | Detail |
|-----------|--------|
| Age | 34 |
| Context | Working parent looking for weekend and evening activities for herself and her children |
| Goal | Browse what the center offers, sign up quickly, and receive proof of registration |
| Pain points | Long sign-up forms, unclear schedules, forgetting registration details |
| Technical comfort | Moderate; uses a smartphone and a laptop |

**Key behaviors:** Browses by activity type or date. Wants a single-page profile view showing all her upcoming registrations. Expects a QR code she can show at the door.

---

### 2.2 Check-In Operator — "Yossi"

| Attribute | Detail |
|-----------|--------|
| Age | 28 |
| Context | Part-time staff member working event doors and front desk |
| Goal | Process a line of attendees quickly and accurately |
| Pain points | Slow lookups, unclear UI, difficulty with edge cases (late arrivals, no-shows) |
| Technical comfort | Basic; comfortable with a tablet or barcode scanner |

**Key behaviors:** Starts a shift by selecting the event for the day. Scans QR codes one by one. Needs instant visual feedback (green = valid, red = invalid/not registered). Cannot access customer financial or personal data beyond name and registration status.

---

### 2.3 Back Office Administrator — "Hadas"

| Attribute | Detail |
|-----------|--------|
| Age | 45 |
| Context | Center coordinator responsible for scheduling, customer relations, and monthly reports |
| Goal | Manage all activities, monitor registrations, and pull reports for center leadership |
| Pain points | Disjointed spreadsheets, duplicate data entry, no single source of truth |
| Technical comfort | High; daily computer user |

**Key behaviors:** Creates and edits activities, assigns rooms, reviews and overrides registrations, exports attendance reports, and monitors dashboard KPIs.

---

## 3. User Journeys

### 3.1 Customer: Discover and Enroll in an Activity

1. Customer lands on the public activity browser (no login required to browse).
2. Customer filters by type (Event / Seminar / Course) and/or date range.
3. Customer selects an activity and views details (description, room, schedule, available spots).
4. If spots are available, customer clicks "Register."
5. System prompts login/registration if not authenticated.
6. After authentication, system confirms enrollment instantly (no approval step).
7. Customer sees a success screen with a summary and, for Events, a QR code.
8. Registration appears in the customer's "My Registrations" list.

---

### 3.2 Customer: View Registrations and QR Code

1. Customer logs in and navigates to "My Registrations."
2. Customer sees a list of all upcoming and past registrations, grouped by status.
3. Customer taps an Event registration to view the QR code full-screen.
4. Customer can download or share the QR code from that screen.

---

### 3.3 Check-In Operator: Run Event Check-In

1. Operator logs in and is taken directly to the "Select Event" screen.
2. Operator selects today's event from a filtered list.
3. Operator is on the "Check-In" screen, which activates the device camera or scanner.
4. Operator scans a customer's QR code.
5. System validates the QR against registered attendees for that event.
6. System displays customer name and a clear pass/fail result.
7. If pass: attendance is recorded; operator proceeds to the next attendee.
8. If fail: operator sees the reason (not registered, already checked in, wrong event) and can manually search by name as a fallback.

---

### 3.4 Back Office Administrator: Create an Activity

1. Admin navigates to "Activities" and clicks "New Activity."
2. Admin selects the type (Event, Seminar, or Course).
3. Admin fills in name, description, capacity, and assigns a room.
4. For a Course: admin adds individual sessions (date, time, duration) one by one or in bulk.
5. Admin sets a payment placeholder (amount field, marked as "not yet active").
6. Admin publishes the activity, making it visible to customers.
7. Admin can edit or cancel the activity at any time before it starts.

---

### 3.5 Back Office Administrator: Generate Attendance Report

1. Admin navigates to "Reports."
2. Admin selects "Attendance" report type and filters by activity, date range, or room.
3. Admin previews the data in a table.
4. Admin exports to CSV or PDF.

---

## 4. Entity Definitions

### 4.1 Customer

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `full_name` | String | Display name |
| `email` | String | Unique, used for login |
| `phone` | String | Optional |
| `date_of_birth` | Date | Optional, for age-gated activities in future |
| `created_at` | Timestamp | |
| `status` | Enum | `active`, `suspended` |
| `payment_method_placeholder` | String | Placeholder field; not processed in V1 |

---

### 4.2 Room

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `name` | String | Display name (e.g., "Room A") |
| `type` | Enum | `classroom`, `art_studio`, `auditorium` |
| `capacity` | Integer | Maximum occupants |
| `description` | String | Optional notes (equipment, accessibility) |

---

### 4.3 Activity

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `name` | String | |
| `type` | Enum | `event`, `seminar`, `course` |
| `description` | String | Rich text |
| `room_id` | FK → Room | |
| `capacity` | Integer | Overrides room capacity if set lower |
| `status` | Enum | `draft`, `published`, `cancelled` |
| `price_placeholder` | Decimal | UI display only; not processed |
| `created_by` | FK → Admin User | |
| `created_at` | Timestamp | |

For **Event** and **Seminar** (one-time activities), the activity itself carries date/time fields:

| Field | Type | Notes |
|-------|------|-------|
| `start_datetime` | Timestamp | |
| `end_datetime` | Timestamp | |

For **Course**, date/time lives on the Session entity (see 4.4).

---

### 4.4 Session (Course only)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `course_id` | FK → Activity | |
| `session_number` | Integer | Ordered index within the course |
| `start_datetime` | Timestamp | |
| `end_datetime` | Timestamp | |
| `room_id` | FK → Room | May differ from the course's default room |

---

### 4.5 Registration

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `customer_id` | FK → Customer | |
| `activity_id` | FK → Activity | |
| `registered_at` | Timestamp | |
| `status` | Enum | `active`, `cancelled` |
| `qr_token` | String | Unique token, used for QR generation (Events only) |
| `payment_status_placeholder` | Enum | `pending`, `paid` — UI only in V1 |

---

### 4.6 Attendance Record (Events only)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `registration_id` | FK → Registration | |
| `event_id` | FK → Activity | Denormalized for query efficiency |
| `checked_in_at` | Timestamp | |
| `checked_in_by` | FK → Operator User | |

---

### 4.7 User (Staff)

Separate from Customer. Covers Check-In Operators and Administrators.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `email` | String | Unique login |
| `role` | Enum | `operator`, `admin` |
| `full_name` | String | |
| `status` | Enum | `active`, `inactive` |

---

## 5. Business Rules

| # | Rule |
|---|------|
| BR-01 | An activity's enrollment count cannot exceed its capacity. When capacity is reached, the "Register" button is disabled and the activity is marked "Full." |
| BR-02 | Registration is immediate upon confirmation. There is no approval step. |
| BR-03 | There is no waitlist in V1. A full activity shows as unavailable to new registrants. |
| BR-04 | A customer may not register for the same activity more than once. |
| BR-05 | A customer may cancel their own registration any time before the activity starts. |
| BR-06 | An administrator may cancel any registration at any time. |
| BR-07 | Cancelling a registration frees one spot, making the activity available again (if it was full). |
| BR-08 | A QR code is generated only for Event-type activities. |
| BR-09 | Each QR token is unique per registration, not reusable across events. |
| BR-10 | Attendance is recorded only for Events. Seminars and Courses have no attendance tracking in V1. |
| BR-11 | A QR code can only be scanned once per event. A second scan of the same token returns an "Already checked in" error. |
| BR-12 | Rooms cannot be double-booked. Two activities cannot occupy the same room at overlapping times. |
| BR-13 | A Course's capacity applies to the course as a whole, not per session. |
| BR-14 | A cancelled activity removes all associated active registrations and marks them `cancelled`. |
| BR-15 | Administrators can create, edit, and cancel activities at any time. Customers cannot. |
| BR-16 | Payment fields are visible in the UI as placeholders but have no functional effect in V1. |

---

## 6. Permissions Matrix

| Action | Customer | Operator | Admin |
|--------|----------|----------|-------|
| Browse published activities | Yes | No | Yes |
| Register for an activity | Yes | No | Yes (on behalf of customer) |
| Cancel own registration | Yes | No | Yes |
| View own registrations | Yes | No | — |
| View QR code for own event | Yes | No | — |
| Select event for check-in | No | Yes | Yes |
| Scan QR code / record attendance | No | Yes | Yes |
| Manually search customer for check-in | No | Yes | Yes |
| Create / edit / cancel activity | No | No | Yes |
| Create / edit / deactivate room | No | No | Yes |
| View all registrations | No | No | Yes |
| Cancel any registration | No | No | Yes |
| Manage customer accounts | No | No | Yes |
| Create / manage staff users | No | No | Yes |
| View reports and analytics | No | No | Yes |
| Export data (CSV/PDF) | No | No | Yes |

---

## 7. Functional Requirements

### 7.1 Authentication and Account Management

- **FR-AUTH-01:** Customers self-register with email and password.
- **FR-AUTH-02:** Staff accounts (Operators and Admins) are created by an Admin; staff cannot self-register.
- **FR-AUTH-03:** All users can reset their password via a "Forgot Password" flow.
- **FR-AUTH-04:** Sessions expire after a configurable idle timeout.
- **FR-AUTH-05:** Role is assigned at account creation and can be changed by an Admin.

### 7.2 Activity Management

- **FR-ACT-01:** Admin can create an activity of type Event, Seminar, or Course.
- **FR-ACT-02:** Activities in `draft` status are not visible to Customers.
- **FR-ACT-03:** Admin can publish, edit, or cancel any activity.
- **FR-ACT-04:** Cancelling an activity triggers cancellation of all active registrations (BR-14).
- **FR-ACT-05:** Admin can add, edit, or remove sessions from a Course before the course starts.
- **FR-ACT-06:** System prevents room double-booking at creation and edit time (BR-12).
- **FR-ACT-07:** The activity list view supports filtering by type, date range, room, and status.
- **FR-ACT-08:** Admin can search activities by name.

### 7.3 Room Management

- **FR-ROOM-01:** Admin can create, edit, and deactivate rooms.
- **FR-ROOM-02:** Deactivated rooms cannot be assigned to new activities but remain on existing ones.
- **FR-ROOM-03:** Room detail shows a calendar view of scheduled activities.

### 7.4 Customer Management (Admin)

- **FR-CUST-01:** Admin can view, search, and filter the customer list.
- **FR-CUST-02:** Admin can view a customer's registration history.
- **FR-CUST-03:** Admin can suspend or reactivate a customer account.
- **FR-CUST-04:** Admin can manually register a customer for any activity with available capacity.
- **FR-CUST-05:** Admin can cancel any customer's registration.

### 7.5 Registration

- **FR-REG-01:** A logged-in Customer can register for any published activity with available capacity.
- **FR-REG-02:** System enforces capacity limits in real time (BR-01).
- **FR-REG-03:** System prevents duplicate registration (BR-04).
- **FR-REG-04:** Upon successful registration for an Event, a unique QR token is generated and stored.
- **FR-REG-05:** A Customer can cancel their own active registration before the activity starts.
- **FR-REG-06:** Cancellation frees a capacity slot immediately (BR-07).

### 7.6 QR Code

- **FR-QR-01:** Event registrations display a QR code on the registration detail screen.
- **FR-QR-02:** The QR code encodes the registration's unique `qr_token`.
- **FR-QR-03:** The customer can download the QR code as an image.
- **FR-QR-04:** QR codes are displayed at a size suitable for scanning on mobile screens.

### 7.7 Check-In (Operator)

- **FR-CI-01:** The Check-In screen presents a list of today's events for the operator to select.
- **FR-CI-02:** After selecting an event, the operator enters scanning mode.
- **FR-CI-03:** Scanning a valid QR code records attendance and displays the customer's name with a green confirmation.
- **FR-CI-04:** Scanning an invalid or unrecognized QR displays a red error with the reason.
- **FR-CI-05:** Scanning a QR that has already been used for that event displays "Already checked in" with the original check-in time.
- **FR-CI-06:** The operator can manually search for a customer by name and mark attendance without a QR scan (fallback).
- **FR-CI-07:** The check-in screen shows a live count of checked-in vs. registered attendees for the current event.

### 7.8 Reporting

- **FR-RPT-01:** Admin can generate an Attendance Report filtered by event, date range, or room.
- **FR-RPT-02:** Admin can generate a Registration Report filtered by activity, type, or date range.
- **FR-RPT-03:** Admin can generate a Capacity Utilization Report showing registered vs. capacity per activity.
- **FR-RPT-04:** All reports can be exported as CSV or PDF.
- **FR-RPT-05:** Report data is current at time of generation (no caching lag beyond a defined threshold).

---

## 8. Screen Inventory

### Customer-Facing Screens

| ID | Screen Name | Description |
|----|-------------|-------------|
| C-01 | Activity Browser | Public list of published activities; filterable |
| C-02 | Activity Detail | Full activity info, capacity indicator, Register button |
| C-03 | Login / Sign Up | Authentication entry point |
| C-04 | My Registrations | Logged-in customer's registration list, grouped by upcoming/past |
| C-05 | Registration Detail | Single registration; shows QR code for Events |
| C-06 | Profile | View and edit personal info; payment placeholder section |
| C-07 | Registration Confirmation | Success screen shown immediately after enrolling |
| C-08 | Cancellation Confirmation | Confirmation dialog + success message after cancelling |

### Check-In Operator Screens

| ID | Screen Name | Description |
|----|-------------|-------------|
| O-01 | Operator Login | Separate login entry; role-restricted |
| O-02 | Event Selection | List of today's events for the operator to pick |
| O-03 | Check-In Scanner | Camera/scanner interface; live counter; scan result overlay |
| O-04 | Manual Lookup | Name search fallback; mark attendance manually |

### Back Office Administrator Screens

| ID | Screen Name | Description |
|----|-------------|-------------|
| A-01 | Admin Dashboard | KPI tiles, recent activity feed, quick links |
| A-02 | Activity List | All activities; filterable and searchable |
| A-03 | Activity Detail / Edit | View or edit an activity's fields and sessions |
| A-04 | New Activity Form | Multi-step form: type → details → schedule → room → publish |
| A-05 | Room List | All rooms with type and current status |
| A-06 | Room Detail / Edit | View, edit room; embedded availability calendar |
| A-07 | Customer List | All customers; searchable; status indicators |
| A-08 | Customer Detail | Profile, registration history, admin actions |
| A-09 | Registration List | All registrations; filterable |
| A-10 | Registration Detail | Single registration; admin cancel action |
| A-11 | Staff User Management | Create, edit, deactivate Operators and Admins |
| A-12 | Reports | Report selector, filters, preview table, export buttons |
| A-13 | Attendance View | Per-event attendance list; exportable |

---

## 9. Navigation Flows

### Customer Navigation

```
Public: Activity Browser (C-01)
           └── Activity Detail (C-02)
                    └── [Login required] Login / Sign Up (C-03)
                              └── Registration Confirmation (C-07)

Logged-in header:
  My Registrations (C-04)
        └── Registration Detail (C-05)
              └── [Event] QR Code display
              └── Cancel → Cancellation Confirmation (C-08)
  Profile (C-06)
  Logout
```

### Operator Navigation

```
Operator Login (O-01)
      └── Event Selection (O-02)
               └── Check-In Scanner (O-03)
                        └── [fail] Manual Lookup (O-04)
```

### Admin Navigation

```
Admin Login
    └── Dashboard (A-01)
          ├── Activities (A-02)
          │      ├── Activity Detail/Edit (A-03)
          │      └── New Activity (A-04)
          ├── Rooms (A-05)
          │      └── Room Detail/Edit (A-06)
          ├── Customers (A-07)
          │      └── Customer Detail (A-08)
          ├── Registrations (A-09)
          │      └── Registration Detail (A-10)
          ├── Staff (A-11)
          └── Reports (A-12)
                 └── Attendance View (A-13)
```

---

## 10. Enrollment Workflows

### 10.1 Standard Customer Self-Enrollment

```
Customer views Activity Detail (C-02)
  ↓
Clicks "Register"
  ↓
[Not logged in?] → Redirect to Login/Sign Up (C-03) → Return to Activity Detail
  ↓
[Already registered?] → Show inline message "You are already registered"
  ↓
[Activity full?] → Register button is disabled; show "Activity is full"
  ↓
System validates capacity (real-time check)
  ↓
[Capacity available] → Create Registration record
  ↓
[Event type?] → Generate unique QR token
  ↓
Show Registration Confirmation screen (C-07) with summary + QR code (if Event)
  ↓
Registration appears in My Registrations (C-04)
```

### 10.2 Admin Enrollment on Behalf of Customer

```
Admin opens Customer Detail (A-08)
  ↓
Clicks "Register for Activity"
  ↓
Admin searches for and selects target activity
  ↓
System validates: capacity, no duplicate
  ↓
Registration created → shown on Customer Detail page
```

### 10.3 Customer Self-Cancellation

```
Customer opens Registration Detail (C-05)
  ↓
[Activity already started or in the past?] → Cancel button hidden
  ↓
Clicks "Cancel Registration"
  ↓
Confirmation dialog: "Are you sure? This cannot be undone."
  ↓
[Confirmed] → Registration status set to `cancelled`; capacity slot freed
  ↓
Cancellation Confirmation screen (C-08)
```

### 10.4 Admin Cancellation

```
Admin opens Registration Detail (A-10)
  ↓
Clicks "Cancel Registration"
  ↓
Confirmation dialog
  ↓
[Confirmed] → Registration status set to `cancelled`; capacity slot freed
  ↓
Confirmation banner on the page
```

---

## 11. QR Attendance Workflow

### 11.1 Normal Flow

```
Operator logs in → Event Selection (O-02)
  ↓
Selects event from today's list
  ↓
Check-In Scanner (O-03) activates camera
  ↓
Customer presents QR code on phone
  ↓
System decodes QR → extracts `qr_token`
  ↓
System looks up Registration by `qr_token`
  ↓
Validates:
  a. Token exists in database
  b. Registration.activity_id matches selected event
  c. Registration.status = `active`
  d. No existing Attendance Record for this registration + event
  ↓
[All valid] →
  Create Attendance Record (checked_in_at = now, checked_in_by = operator)
  Display: green banner, customer full name, "Checked In ✓"
  Live counter increments
  ↓
Operator ready for next scan
```

### 11.2 Failure States

| Condition | Display Message |
|-----------|----------------|
| Token not found in DB | "QR code not recognized" |
| Registration is for a different event | "Not registered for this event" |
| Registration status is `cancelled` | "Registration has been cancelled" |
| Already checked in | "Already checked in at [time]" |
| Activity has been cancelled | "This event has been cancelled" |

### 11.3 Manual Fallback

```
Operator taps "Manual Lookup" (O-04)
  ↓
Types customer name → live search results
  ↓
Selects customer from results
  ↓
System shows registration status for the active event
  ↓
[Registered and not yet checked in] → Operator taps "Mark as Attended"
  ↓
Same validation and record creation as QR flow
```

---

## 12. Dashboard Requirements

### 12.1 Customer Dashboard (My Registrations — C-04)

| Element | Description |
|---------|-------------|
| Upcoming registrations | Sorted by nearest start date; shows activity name, type, date, room |
| Past registrations | Collapsed section; last 6 months |
| Quick access to QR | Prominent "Show QR" button on Event registrations |
| Empty state | Friendly prompt to browse activities |

### 12.2 Operator Dashboard (O-03 — Check-In Screen)

| Element | Description |
|---------|-------------|
| Event name and date | Always visible at top |
| Checked-in counter | "X / Y checked in" — live updates |
| Last scan result | Large green/red overlay, auto-dismisses after 3 seconds |
| Scanner viewfinder | Central element, takes majority of screen |
| Manual lookup button | Always accessible |

### 12.3 Admin Dashboard (A-01)

| KPI Tile | Metric |
|----------|--------|
| Total active customers | Count of customers with `status = active` |
| Registrations today | Count of registrations created today |
| Activities this week | Count of published activities with start date in the current week |
| Top activity | Activity with highest registration count (rolling 30 days) |

| Widget | Description |
|--------|-------------|
| Recent Registrations feed | Last 10 registrations across all activities; links to detail |
| Upcoming activities list | Next 7 days; shows capacity fill % |
| Room utilization chart | Bar chart of room bookings this week |
| Quick actions | Buttons: "New Activity," "View Reports," "Manage Customers" |

---

## 13. Analytics Requirements

### 13.1 Registration Analytics

- Registrations per activity (all time and filtered by date range).
- Registrations per activity type (Event, Seminar, Course).
- Registrations per customer (identify most engaged members).
- Cancellation rate per activity.
- Cancellation rate over time (weekly/monthly trend).

### 13.2 Attendance Analytics (Events only)

- Attendance rate per event: (checked-in / registered) × 100%.
- No-show count per event.
- Check-in time distribution (histogram of check-in times relative to event start).
- Attendance trend over time across all events.

### 13.3 Capacity Utilization

- Fill rate per activity: (registered / capacity) × 100%.
- Activities that reached full capacity vs. those that did not.
- Average fill rate by room type.
- Average fill rate by activity type.

### 13.4 Room Analytics

- Room booking frequency (bookings per room per month).
- Room utilization by time of day (heatmap or bar chart).
- Most and least used rooms.

### 13.5 Customer Analytics

- New customer signups per month.
- Active vs. inactive customer ratio.
- Average number of activities per customer.
- Repeat enrollment rate (customers who registered for 2+ activities).

---

## 14. Non-Functional Requirements

### 14.1 Performance

- Activity browser page loads within 2 seconds under normal load.
- QR code validation (scan to result) completes within 1 second.
- Report generation for up to 12 months of data completes within 10 seconds.

### 14.2 Availability

- Target uptime: 99.5% during operating hours (7:00–22:00 local time).
- Planned maintenance windows outside operating hours.

### 14.3 Scalability

- System must support up to 10,000 registered customers and 500 concurrent users in V1.
- Architecture must not block a path to 10× this scale without a full rewrite.

### 14.4 Security

- All data transmitted over HTTPS.
- Passwords stored as salted hashes (bcrypt or equivalent).
- QR tokens are not guessable (cryptographically random, minimum 128-bit entropy).
- Role-based access control enforced server-side on every request.
- Admin and Operator accounts protected by the same authentication system as Customers; no shared credentials.
- Sensitive customer data (email, phone) masked in Operator-facing views.

### 14.5 Accessibility

- Customer-facing screens meet WCAG 2.1 AA standards.
- QR code screen includes a text fallback (registration ID) for customers who cannot display images.

### 14.6 Internationalization

- V1: Hebrew and English UI strings only.
- Date, time, and number formats follow locale settings.
- RTL layout support for Hebrew.

### 14.7 Auditability

- All registration creation and cancellation events are logged with timestamp and acting user.
- All attendance records are immutable once created; corrections are new records, not overwrites.

---

## 15. Error Scenarios

| Scenario | System Behavior |
|----------|----------------|
| Customer tries to register for a full activity | Register button is disabled; inline message: "This activity is full" |
| Customer tries to register while not logged in | Redirect to login; return to registration flow after auth |
| Customer tries to register for an activity they're already in | Show inline error: "You are already registered for this activity" |
| Customer cancels a registration for a past activity | Cancel button is not shown for past/in-progress activities |
| Operator scans a QR for the wrong event | Display "Not registered for this event" in red |
| Operator scans a duplicate QR | Display "Already checked in at [HH:MM]" |
| Operator scans a corrupt or non-system QR | Display "QR code not recognized" |
| Admin creates an activity in a room with a conflicting booking | System shows conflict details and blocks creation until resolved |
| Admin cancels an activity with active registrations | Warning dialog lists the number of registrations affected; requires explicit confirmation |
| Session timeout during registration | User is shown a session-expired message; after re-login, returns to activity detail (registration is not auto-completed) |
| Network failure during QR scan | Check-in screen shows a connectivity error; no attendance record is written; operator must retry |
| Capacity race condition (two users register simultaneously for the last spot) | System accepts the first and rejects the second with "Activity is now full" |

---

## 16. Edge Cases

| # | Edge Case | Handling |
|---|-----------|----------|
| EC-01 | A customer registers, then the admin reduces the activity capacity below the current registration count | Existing registrations are honored. The activity shows as "over-committed" in the admin view; no new registrations are accepted. |
| EC-02 | A Course session's room conflicts with another booking when the session is added | System blocks the session add and displays the conflicting booking detail. |
| EC-03 | An operator selects an event that has been cancelled after they logged in | The scanner screen displays "This event has been cancelled" and disables scanning. |
| EC-04 | A customer attempts to view a QR code for a Seminar or Course registration | The QR code section is not shown. The registration detail shows the activity type and schedule only. |
| EC-05 | Admin tries to delete a room that has upcoming activities assigned to it | Deletion is blocked; admin is shown a list of affected activities and prompted to reassign them first. |
| EC-06 | Two admins edit the same activity simultaneously | Last-write-wins with an optimistic-lock warning: "This activity was modified by [user] at [time]. Your changes may overwrite theirs." |
| EC-07 | A customer account is suspended while the customer has active registrations | Registrations remain; the customer cannot log in, register for new activities, or cancel until reactivated. Admin can still cancel on their behalf. |
| EC-08 | An activity's start datetime is set in the past during creation | Admin receives a validation warning ("Start time is in the past") but is not blocked from saving, to allow back-dated entry of historical activities. |
| EC-09 | Check-In Operator has no events assigned to today | The Event Selection screen (O-02) shows an empty state: "No events scheduled for today." No scanning mode is accessible. |
| EC-10 | A customer's QR token is screenshot and shared with another person | The token is single-use (BR-11). Only the first scan succeeds; the second receives "Already checked in." The operator can verify identity manually if needed. |
| EC-11 | A Course has zero sessions defined when admin tries to publish it | System blocks publishing and shows a validation error: "A course must have at least one session before it can be published." |
| EC-12 | Admin exports a report with no matching records | Export produces an empty file with headers only; a UI message informs the admin the filter returned no results. |

---

## 17. Future Expansion Opportunities

The following capabilities are explicitly out of scope for V1 but should be considered in architectural decisions to avoid blocking their later addition.

| # | Opportunity | Notes |
|---|-------------|-------|
| FE-01 | **Payment processing** | Placeholder fields exist in Registration and Activity entities. A payment gateway integration should plug into these without schema changes. |
| FE-02 | **Waitlist** | Registration entity has capacity logic in one place. A `waitlist_position` field and a promotion workflow can be added without refactoring the core registration flow. |
| FE-03 | **Notifications** | Email/SMS notifications for registration confirmation, reminders, and cancellations. The system should be designed so that registration and cancellation events emit hooks that a notification service can subscribe to. |
| FE-04 | **Recurring events** | Currently Events are one-time. A recurrence pattern (e.g., weekly yoga) could be modeled similarly to Course sessions. |
| FE-05 | **Attendance for Seminars and Courses** | The Attendance Record entity references `event_id` today. Generalizing to `activity_id` + optional `session_id` would extend tracking to all types. |
| FE-06 | **Self-service staff portal** | Operators are created by Admins only. A future self-service onboarding flow with email verification could be added. |
| FE-07 | **Customer mobile app** | The QR code display and activity browser are high-value mobile surfaces. Designing the customer-facing API as a clean REST or GraphQL layer from the start enables a future native app. |
| FE-08 | **Advanced analytics and BI integration** | The reporting module in V1 is basic. A data warehouse export (nightly CSV or event stream) would allow integration with BI tools. |
| FE-09 | **Age-restricted activities** | The Customer entity includes `date_of_birth` as an optional field. Age-gate validation logic can be added to the enrollment workflow without a new field. |
| FE-10 | **Multi-location support** | All entities are currently location-agnostic (single center). Adding a `location_id` foreign key to Room and Activity enables multi-branch operations. |
| FE-11 | **Approval workflows** | The Registration entity's `status` field can be extended with `pending_approval` states without breaking the existing `active`/`cancelled` flow. |
| FE-12 | **Customer-facing calendar export** | Registrations could export to `.ics` format so customers can add activities to Google Calendar or Outlook. |

---

*End of Document*
