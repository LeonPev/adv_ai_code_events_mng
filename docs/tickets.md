# CCMS Implementation Tickets

All route files and the Prisma schema exist as a skeleton. Every page is a placeholder `<div>`. The tickets below cover everything needed to make the PRD fully functional. Work through the stages in order — each stage's tickets are independent of each other within the stage but depend on the prior stage being complete.

---

## Stage 1 — Authentication & Signup

### T-01 · Customer self-registration (signup)

**Screen:** `C-03` → `/auth/signup`

Wire up the signup form at `src/app/auth/signup/page.tsx`. On submit, call a server action that:
1. Validates email uniqueness, password length (≥ 8 chars).
2. Hashes the password with bcrypt.
3. Creates a `User` record with `role = CUSTOMER`, `status = ACTIVE`.
4. Returns `{ success: true }`. The client page then calls `signIn("credentials", …)` with `callbackUrl: '/activities'`.

**Acceptance criteria**
- Duplicate email returns an inline error; no redirect.
- After signup the user lands on the activity browser, already authenticated.
- New user appears in the DB with a hashed password (never plaintext).

**PRD refs:** FR-AUTH-01, FR-AUTH-02

**Verification:** Add a Vitest integration test (new file `src/app/auth/signup/signup.test.ts`) that seeds the DB via `testPrisma`, calls the signup server action directly, and asserts: (1) a new user row exists with a bcrypt-hashed password; (2) calling the action again with the same email returns a duplicate-email error without creating a second row. Add a Playwright E2E spec (`e2e/auth.spec.ts`) for the happy path: fill the signup form → assert redirect to `/activities`. Note: asserting the nav shows the user's name requires a nav component to exist — defer to when the shared layout is built.

---

### T-02 · Login page (all roles)

**Screen:** `C-03` / `O-01` → `/auth/login`

Wire up `src/app/auth/login/page.tsx`. The existing NextAuth credentials provider in `src/lib/auth.ts` handles validation — the page just needs a form that calls `signIn("credentials", { email, password, callbackUrl })`. After login, redirect based on role:
- `CUSTOMER` → `/activities`
- `OPERATOR` → `/operator`
- `ADMIN` → `/admin`

Add a "Forgot password" link (static page with a "contact admin" message is acceptable for V1 since FR-AUTH-03 has no email service yet).

**Acceptance criteria**
- Wrong credentials show "Invalid email or password."
- Each role lands on the correct home route.
- A suspended customer (`status = SUSPENDED`) is rejected with "Your account has been suspended."

**PRD refs:** FR-AUTH-01 through FR-AUTH-04

---

## Stage 2 — Room Management

### T-03 · Room list (A-05)

**Screen:** `/admin/rooms`

Replace the placeholder in `src/app/(admin)/admin/rooms/page.tsx` with a server component that fetches all rooms from Prisma and renders a table with columns: Name, Type, Capacity, Status (Active / Inactive), and an "Edit" link. Include a "New Room" button that links to `/admin/rooms/new`.

**Acceptance criteria**
- Rooms load server-side (no client fetch).
- Inactive rooms are visually distinct (e.g., muted text or a badge).

**PRD refs:** FR-ROOM-01, Screen A-05

---

### T-04 · Room create / edit / deactivate (A-06)

**Screens:** `/admin/rooms/new` and `/admin/rooms/[id]`

Build a shared form component for creating and editing rooms (name, type dropdown, capacity, description). Server actions:
- `createRoom` — validates uniqueness of name, inserts.
- `updateRoom` — same validations, updates.
- `deactivateRoom` — sets `isActive = false`; blocks if the room has future published activities (EC-05): return an error listing the conflicting activities.

The detail page (`src/app/(admin)/admin/rooms/[id]/page.tsx`) also shows a simple read-only list of upcoming activities booked in that room as the "availability calendar" (FR-ROOM-03 — a sorted list is sufficient for V1).

**Acceptance criteria**
- Deactivating a room with future bookings shows an error with the activity names, not a silent failure.
- A deactivated room no longer appears in room-selection dropdowns in activity forms.
- Creating/editing navigates back to the room list on success.

**PRD refs:** FR-ROOM-01, FR-ROOM-02, FR-ROOM-03, EC-05

---

## Stage 3 — Activity Management

### T-05 · Activity list with filters (A-02)

**Screen:** `/admin/activities`

Replace the placeholder with a server component that accepts `searchParams` for filtering. Render a table of all activities (name, type badge, status badge, room, start date, registration count / capacity). Add:
- A search input (name, debounced via URL param).
- Filter dropdowns: Type, Status, Room.
- A "New Activity" button → `/admin/activities/new`.

**Acceptance criteria**
- Filters are applied server-side via Prisma `where` clauses; no client-side filtering.
- Registration count is fetched with `_count` in the same query, not N+1.

**PRD refs:** FR-ACT-07, FR-ACT-08, Screen A-02

---

### T-06 · New activity form (A-04)

**Screen:** `/admin/activities/new`

Multi-step form (can be a single long page divided into sections, not a true wizard):
1. **Type** — Radio: Event / Seminar / Course.
2. **Details** — Name, description (textarea), capacity, price placeholder.
3. **Schedule** — If Event or Seminar: start + end datetime pickers. If Course: skip (sessions added after creation).
4. **Room** — Dropdown of active rooms.
5. **Status** — Draft (default) or Published.

Server action `createActivity`:
- Validates required fields per type.
- For Event/Seminar: enforces no room double-booking (BR-12) — query for any published/draft activity in the same room with overlapping `[startDatetime, endDatetime]`.
- Creates the `Activity` record with `createdById = session.user.id`.
- Redirects to the activity detail page on success.

**Acceptance criteria**
- Room conflict returns a descriptive error naming the conflicting activity and its time, without losing form state.
- A Course can be saved in Draft status without any sessions (sessions are added via T-07).
- Publishing a Course with zero sessions is blocked (EC-11): "A course must have at least one session before it can be published."

**PRD refs:** FR-ACT-01, FR-ACT-02, FR-ACT-03, FR-ACT-06, BR-12, EC-08, EC-11, Screen A-04

---

### T-07 · Activity detail / edit + course sessions (A-03)

**Screen:** `/admin/activities/[id]`

Replace the placeholder. This page has two modes: view and edit (use a single page with an Edit button that enables inline editing, or separate `/edit` sub-route — your choice).

Sections:
- **Fields** — same as the create form; all editable except type.
- **Course Sessions** (shown only for `type = COURSE`) — a list of sessions with session number, start/end datetime, room. Actions: Add Session, Edit Session, Delete Session. Each session add/edit runs the room double-booking check for that session's room + time window (EC-02).
- **Registrations summary** — count of active registrations vs. capacity.
- **Actions** — Publish (if Draft), Cancel Activity (see T-08), Back to list.

Server actions: `updateActivity`, `addCourseSession`, `updateCourseSession`, `deleteCourseSession`.

**Acceptance criteria**
- Editing a published Event/Seminar's room or datetime re-validates for conflicts.
- Attempting to publish a Course with no sessions shows the EC-11 validation error.
- Session add/edit validates room conflict for that session's specific time window.

**PRD refs:** FR-ACT-03, FR-ACT-05, FR-ACT-06, EC-02, EC-06, EC-08, Screen A-03

---

### T-08 · Cancel activity (cascade)

Add a "Cancel Activity" action to the activity detail page (T-07). The server action `cancelActivity`:
1. Shows a confirmation dialog in the UI: "This will cancel N active registrations. Are you sure?"
2. On confirmation, wraps the following in a Prisma transaction:
   - Sets `Activity.status = CANCELLED`.
   - Sets all `Registration.status = CANCELLED` where `activityId = id AND status = ACTIVE`.
3. Redirects to the activity list.

**Acceptance criteria**
- The confirmation dialog shows the exact count of affected registrations.
- After cancellation, registrations are `CANCELLED` in the DB.
- Customers with cancelled registrations cannot re-register for the same activity.

**PRD refs:** BR-14, FR-ACT-03, FR-ACT-04, §15 error scenario

---

## Stage 4 — Customer Activity Browser & Registration

### T-09 · Activity browser (C-01)

**Screen:** `/activities`

Replace the placeholder with a server component. Fetch published activities only (`status = PUBLISHED`). Render a card grid showing: name, type badge, date/time (or "Course — N sessions"), room name, registered/capacity, price placeholder.

Add filter controls (URL params, server-side):
- Type: All / Event / Seminar / Course.
- Date range: from / to.

Each card links to `/activities/[id]`.

**Acceptance criteria**
- Draft and Cancelled activities never appear.
- An activity at capacity shows a "Full" badge instead of the count.
- Filters are preserved in the URL so the page is shareable.

**PRD refs:** FR-ACT-02, FR-ACT-07, §3.1, Screen C-01

---

### T-10 · Activity detail + register button (C-02)

**Screen:** `/activities/[id]`

Replace the placeholder. Show full activity details: description, room, type, date(s), capacity fill bar, price placeholder.

Register button behavior:
- Not logged in → redirect to `/auth/login?callbackUrl=/activities/[id]`.
- Already registered → show "You are already registered" (no button).
- Activity full → show disabled button + "This activity is full."
- Otherwise → clicking triggers the `registerForActivity` server action (T-11).

**Acceptance criteria**
- All three disabled states render correctly.
- After successful registration, the customer is redirected to the confirmation screen (C-07).

**PRD refs:** FR-REG-01, FR-REG-02, FR-REG-03, BR-01, BR-04, §3.1, Screen C-02

---

### T-11 · Registration server action + confirmation (C-07)

Implement the `registerForActivity(activityId)` server action. Logic:
1. Get `session.user.id`; reject if unauthenticated.
2. Check `Registration` table for an existing active record for this customer + activity (BR-04).
3. Count active registrations and compare to `Activity.capacity` (BR-01). Use a PostgreSQL-safe transaction strategy, such as an interactive Prisma transaction plus an activity-row lock, to avoid the race condition described in §15.
4. Create the `Registration` record.
5. If `activity.type === 'EVENT'`, generate a cryptographically random `qrToken` (`crypto.randomBytes(32).toString('hex')`) and store it on the registration.
6. Return the new registration ID.

Add a confirmation route/page `src/app/(customer)/activities/[id]/confirm/page.tsx` (or reuse `/my-registrations/[id]`) that shows the activity summary and, for Events, the QR code (use T-14's QR component).

**Acceptance criteria**
- Concurrent registrations for the last remaining spot: only one succeeds (test manually with two browser sessions).
- Event registrations have a non-null, unique, 64-char hex `qrToken`.
- Non-event registrations have `qrToken = null`.

**PRD refs:** FR-REG-01 through FR-REG-04, BR-01, BR-04, BR-08, BR-09, §14.4 (crypto tokens), §15 race condition

---

## Stage 5 — My Registrations & QR Code

### T-12 · My registrations list (C-04)

**Screen:** `/my-registrations`

Replace the placeholder. Fetch all registrations for `session.user.id`, joined with the activity and room. Group into two sections:
- **Upcoming** — activity start date in the future (or course with any future session).
- **Past** — activity start date in the past.

Each row: activity name, type, date, room, status badge (Active / Cancelled). For Event registrations with `status = ACTIVE`, show a "Show QR" button linking to `/my-registrations/[id]`.

Empty state: "You have no registrations yet. [Browse activities →]"

**Acceptance criteria**
- Cancelled registrations appear in the appropriate section with a "Cancelled" badge.
- Courses appear once (not once per session).

**PRD refs:** §3.2, §12.1, Screen C-04

---

### T-13 · Registration detail + QR code + cancel (C-05 / C-08)

**Screen:** `/my-registrations/[id]`

Replace the placeholder. Show:
- Activity summary (name, type, date, room).
- For Event registrations: a QR code rendered from the `qrToken` using the `qrcode` npm package. Display at 256×256 px minimum. Below the QR: registration ID as text fallback (§14.5). A "Download QR" button that triggers a client-side canvas download.
- **Cancel Registration** button — shown only if the activity has not yet started. Clicking opens a confirmation dialog ("Are you sure? This cannot be undone."). On confirm, calls `cancelRegistration(registrationId)` server action, which sets `status = CANCELLED` and returns the freed slot (BR-05, BR-07).

**Acceptance criteria**
- QR section is hidden for Seminar and Course registrations (EC-04).
- Cancel button is hidden if `activity.startDatetime <= now()` (BR-05).
- After cancellation, the activity's available spots increase by one.
- Download saves a PNG to the user's device.

**PRD refs:** FR-REG-05, FR-REG-06, FR-QR-01 through FR-QR-04, BR-05, BR-07, BR-08, EC-04, §14.5, Screens C-05, C-08

---

## Stage 6 — Customer Profile

### T-14 · Profile view / edit (C-06)

**Screen:** `/profile`

Replace the placeholder. Show and allow editing of: full name, phone, date of birth. Email is read-only. Include a read-only "Payment method" section with a "Coming soon" note (BR-16). Server action `updateProfile` validates and saves.

**Acceptance criteria**
- Email field is non-editable.
- Successful save shows a success toast/banner without a full page reload (use React state or `router.refresh()`).

**PRD refs:** BR-16, Screen C-06

---

## Stage 7 — Operator Check-In

### T-15 · Event selection (O-02)

**Screen:** `/operator`

Replace the placeholder. Fetch all published Events where `startDatetime` is today (midnight to 23:59 local time). Render as a list of clickable cards: event name, start time, room, registered/capacity. Each card links to `/operator/checkin/[eventId]`.

Empty state: "No events scheduled for today." (EC-09)

**Acceptance criteria**
- Only Events appear (not Seminars or Courses).
- Only published events appear; cancelled events are excluded.
- Time filtering uses the server's local timezone consistently.

**PRD refs:** FR-CI-01, EC-09, Screen O-02

---

### T-16 · Check-in scanner (O-03)

**Screen:** `/operator/checkin/[eventId]`

Replace the placeholder. This is a client component. Layout:
- Top bar: event name, date.
- Live counter: "X / Y checked in" — fetched on load, updated after each scan.
- Central viewfinder: use the `html5-qrcode` or `@zxing/browser` library to access the device camera and decode QR codes.
- Result overlay: full-width green (success) or red (failure) banner with customer name or error message. Auto-dismisses after 3 seconds.
- "Manual Lookup" button — always visible, links to T-17.

When a QR is decoded, POST to `/api/checkin` with `{ qrToken, eventId }`. The API route:
1. Looks up the `Registration` by `qrToken`.
2. Validates all four conditions from §11.1 (token exists, correct event, active status, no existing attendance record).
3. On success: creates `AttendanceRecord`; returns `{ ok: true, customerName }`.
4. On failure: returns `{ ok: false, reason }` with the appropriate message from §11.2.

Also handle the EC-03 edge case: if the event is cancelled after the operator logged in, the scanner screen detects `activity.status === 'CANCELLED'` on load and shows "This event has been cancelled" with scanning disabled.

**Acceptance criteria**
- Each of the five failure messages (§11.2) renders correctly.
- A second scan of the same QR returns "Already checked in at [HH:MM]."
- Counter increments immediately after a successful scan without a page reload.
- Network failure during scan (fetch throws) shows a connectivity error; no attendance record is written.

**PRD refs:** FR-CI-02 through FR-CI-07, BR-11, §11.1, §11.2, §12.2, EC-03, §14.1 (1s response), §14.4 (server-side validation), §15

---

### T-17 · Manual lookup fallback (O-04)

**Screen:** Can be a modal on the scanner page or a sub-route `/operator/checkin/[eventId]/manual`

A search input that queries customers by name via a debounced fetch to `/api/checkin/search?name=…&eventId=…`. The API returns matching customers who have an active registration for the event, with their check-in status. Selecting a customer shows their registration status. If not yet checked in, a "Mark as Attended" button runs the same check-in logic as the QR flow.

**Acceptance criteria**
- Customers with no registration for this event do not appear in results.
- Already-checked-in customers appear but the "Mark as Attended" button is replaced with "Already checked in at [time]."
- Sensitive fields (email, phone) are not returned in the API response (§14.4).

**PRD refs:** FR-CI-06, §11.3, §14.4, Screen O-04

---

## Stage 8 — Admin: Customer & Registration Management

### T-18 · Customer list (A-07)

**Screen:** `/admin/customers`

Replace the placeholder. Fetch all `CUSTOMER`-role users with registration count. Render a searchable table: full name, email, status badge (Active / Suspended), registration count, "View" link. Server-side name/email search via URL param.

**Acceptance criteria**
- Staff users (OPERATOR, ADMIN) are not shown in this list.
- Search filters by name or email (case-insensitive `contains`).

**PRD refs:** FR-CUST-01, Screen A-07

---

### T-19 · Customer detail + admin actions (A-08)

**Screen:** `/admin/customers/[id]`

Replace the placeholder. Show customer profile fields (read-only), status badge, and a registration history table (activity name, type, date, registration status, attendance status for events).

Admin actions:
- **Suspend / Reactivate** — toggles `User.status` between `ACTIVE` and `SUSPENDED` (FR-CUST-03). Suspended customers cannot log in (enforced in the NextAuth `authorize` callback in T-02).
- **Register for Activity** — a search modal that finds published activities with available capacity, then calls `registerForActivity` on behalf of the customer (FR-CUST-04, §10.2).
- **Cancel Registration** — a cancel button on each active registration row (FR-CUST-05).

**Acceptance criteria**
- EC-07: suspending a customer with active registrations shows a warning but does not auto-cancel the registrations.
- Admin-initiated registration runs the same capacity + duplicate checks as customer self-registration.
- Cancelled registrations in the history show as "Cancelled," not hidden.

**PRD refs:** FR-CUST-02 through FR-CUST-05, EC-07, §10.2, Screen A-08

---

### T-20 · Registration list (A-09) and detail (A-10)

**Screens:** `/admin/registrations` and `/admin/registrations/[id]`

**List:** Table of all registrations with columns: customer name, activity name, type, date, registered at, status. Filterable by activity type, status, and date range (server-side).

**Detail:** Show registration fields + the activity summary + attendance record (if exists). Admin cancel button — same `cancelRegistration` server action as T-13, without the "activity not started" gate (FR-REG-05 gate applies only to customers; BR-06 says admins can cancel any time).

**Acceptance criteria**
- Admin cancel works even for past activities.
- Cancellation confirmation dialog shown before the action executes.

**PRD refs:** FR-CUST-05, BR-06, Screens A-09, A-10

---

## Stage 9 — Admin: Staff Management

### T-21 · Staff user management (A-11)

**Screen:** `/admin/staff`

Replace the placeholder. List all users with `role = OPERATOR OR ADMIN` in a table: name, email, role, status. Actions:
- **New Staff** button → inline form or modal: name, email, role (Operator/Admin), auto-generated temporary password (shown once, logged to console in dev). Server action hashes the password and creates the user.
- **Edit** — change name, role.
- **Deactivate** — sets `status = INACTIVE`. Inactive users cannot log in (enforce in NextAuth `authorize`).

**Acceptance criteria**
- Customers cannot self-register as staff (FR-AUTH-02) — this is enforced by the signup form in T-01 always creating `CUSTOMER` role.
- An admin cannot deactivate themselves.
- Temporary password is shown exactly once in the UI after creation.

**PRD refs:** FR-AUTH-02, FR-AUTH-05, Screen A-11

---

## Stage 10 — Admin Dashboard

### T-22 · Admin dashboard KPI tiles + widgets (A-01)

**Screen:** `/admin`

Replace the placeholder. Four KPI tiles (all server-side Prisma queries):
1. Total active customers — `count where role=CUSTOMER AND status=ACTIVE`.
2. Registrations today — `count where registeredAt >= today midnight`.
3. Activities this week — `count where status=PUBLISHED AND startDatetime in [Mon–Sun this week]`.
4. Top activity (rolling 30 days) — activity with most active registrations in the last 30 days.

Widgets:
- **Recent Registrations** — last 10 registrations, each linking to `/admin/registrations/[id]`.
- **Upcoming Activities** — next 7 days, published only; shows name, date, and fill % `(registrations/capacity)*100`.
- **Room Utilization** — bar chart of how many activities are booked per room this week. Use a lightweight chart library (Recharts is already compatible with Next.js 14).
- **Quick Actions** — "New Activity," "View Reports," "Manage Customers" buttons.

**Acceptance criteria**
- All data loads in a single server render pass (parallel `Promise.all` queries, not sequential awaits).
- Dashboard renders correctly when there are zero activities or registrations (no divide-by-zero crashes).

**PRD refs:** §12.3, Screen A-01

---

## Stage 11 — Reports & Export

### T-23 · Attendance report (A-12, A-13)

**Screen:** `/admin/reports`

Replace the placeholder. Build a report UI with a "Report Type" selector. Implement the Attendance report first:
- Filters: event (dropdown of past events), date range.
- Preview table: customer name, event name, registered at, checked-in at (or "No-show").
- Export CSV button — server action streams a CSV using the `papaparse` or plain string-building approach.

Also add a direct Attendance View per event at `/admin/activities/[id]/attendance` (Screen A-13): list of all registrations with attendance status, exportable as CSV.

**Acceptance criteria**
- Empty filter results export an empty CSV with headers only (EC-12), and show "No results found" in the preview.
- CSV download triggers a file save, not a navigation.

**PRD refs:** FR-RPT-01, FR-RPT-04, FR-RPT-05, EC-12, Screens A-12, A-13

---

### T-24 · Registration and capacity utilization reports

Add two more report types to the report page from T-23:

**Registration Report** (FR-RPT-02) — filters: activity, type, date range. Columns: customer name, activity, type, registered at, status, payment placeholder.

**Capacity Utilization Report** (FR-RPT-03) — no date filter needed. Shows all published activities with: name, type, capacity, active registrations, fill % (bar or numeric). Sorted by fill % descending.

Both support CSV export. PDF export: generate a simple HTML table and use the browser's `window.print()` with a print stylesheet, or use `jsPDF` if you want a proper PDF — your call.

**Acceptance criteria**
- All three report types (attendance, registration, capacity) appear in the report type selector.
- CSV and PDF export work for each type.

**PRD refs:** FR-RPT-02, FR-RPT-03, FR-RPT-04

---

## Stage 12 — Business Rules Polish & Edge Cases

### T-25 · Room double-booking enforcement hardening (BR-12)

Audit all places where an activity or session is created or edited (T-06, T-07) to confirm the overlap query is correct. The overlap condition for `[newStart, newEnd]` against an existing booking `[existStart, existEnd]` is:

```
newStart < existEnd AND newEnd > existStart
```

Exclude the activity being edited from the conflict check (otherwise editing its own fields always conflicts with itself). Exclude `CANCELLED` activities from the check.

**Acceptance criteria**
- Back-to-back activities in the same room (e.g., 10:00–11:00 and 11:00–12:00) are allowed.
- Overlapping activities are blocked with the conflicting activity name and time shown.
- Editing an activity to change its description (no time/room change) does not trigger a false conflict.

**PRD refs:** BR-12, FR-ACT-06, EC-02

---

### T-26 · Capacity race condition (atomic registration)

Ensure the `registerForActivity` server action (T-11) uses a Prisma interactive transaction that re-reads the registration count inside the transaction before inserting and locks the activity row in PostgreSQL before checking capacity.

Also handle EC-01: if an admin reduces `Activity.capacity` below the current active registration count, the activity should show an "Over-committed" warning badge in the admin detail view (A-03). No registrations are auto-cancelled; no new registrations are accepted while over-committed.

**Acceptance criteria**
- Stress test: open two browser tabs, both on the same full-minus-one activity, and submit both simultaneously. Only one registration is created.
- Over-committed badge appears correctly and new registrations are blocked.

**PRD refs:** BR-01, BR-07, EC-01, §15 race condition

---

### T-27 · Audit logging

For every registration creation and cancellation event, write a lightweight log entry. The simplest V1 approach: add a `AuditLog` model to the Prisma schema with fields `(id, action, actorId, targetId, targetType, createdAt, metadata JSON)` and call `prisma.auditLog.create` inside the same transaction as the registration change.

**Acceptance criteria**
- Registration creation and cancellation each produce one audit log row.
- Activity cancellation (which bulk-cancels registrations) produces one row per cancelled registration.
- `actorId` is always set (the admin or customer who triggered the action).

**PRD refs:** §14.7

---

### T-28 · Final edge-case validation pass

A focused pass to wire up the remaining edge cases not covered by earlier tickets:

| Edge case | Where to fix |
|-----------|--------------|
| EC-06 — optimistic lock warning when two admins edit same activity | Add `updatedAt DateTime @updatedAt` to `Activity` in schema. On save, compare the form's `updatedAt` with the DB value; if different, show "This activity was modified by [user] at [time]. Reload to see the latest changes." |
| EC-11 — block publishing a Course with no sessions | Already called out in T-06/T-07 acceptance criteria; this ticket is the final audit. |
| EC-07 — suspended customer login block | Confirm the NextAuth `authorize` callback checks `status !== 'SUSPENDED'`. |
| BR-11 — QR single-use | Confirm the check-in API (T-16) queries `AttendanceRecord` before creating and returns the "Already checked in" message with timestamp. |
| §14.4 — RBAC on every API route | Audit all `/api/*` routes: each must call `getServerSession()` and check the required role before processing. |

**Acceptance criteria**
- Each item in the table above is verified by manual testing.
- No API route returns data without an authenticated session.

**PRD refs:** BR-11, EC-06, EC-07, §14.4

---

## Dependency Map

```
T-01, T-02  (auth)
   └── T-03, T-04  (rooms)
         └── T-05, T-06, T-07, T-08  (activities)
               ├── T-09, T-10, T-11  (customer browser + registration)
               │     └── T-12, T-13  (my registrations + QR)
               │     └── T-14  (profile — independent)
               ├── T-15, T-16, T-17  (operator check-in)
               ├── T-18, T-19, T-20  (admin customer + registrations)
               ├── T-21  (staff management)
               ├── T-22  (admin dashboard — needs all data)
               └── T-23, T-24  (reports — needs all data)

T-25, T-26, T-27, T-28  (polish — after all features are wired)
```

---

## Package Additions Needed

| Package | Used in |
|---------|---------|
| `qrcode` + `@types/qrcode` | T-13 (QR rendering) |
| `html5-qrcode` or `@zxing/browser` | T-16 (camera scanner) |
| `recharts` | T-22 (room utilization chart) |
| `papaparse` or built-in string join | T-23, T-24 (CSV export) |
| `jsPDF` (optional) | T-24 (PDF export) |
| `bcryptjs` + `@types/bcryptjs` | T-01 (already used in auth, confirm it's installed) |
