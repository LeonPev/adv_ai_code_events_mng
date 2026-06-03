## Project Overview

Community Center Management System (CCMS) — a Next.js 14 web app for managing community center activities, registrations, and attendance. The full product spec lives in `docs/prd.md`.

All commands below run from the repo root.

## Commands

```bash
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build
npm run lint       # ESLint

# Database
npx prisma migrate dev --name <name>   # create and apply a migration
npx prisma migrate reset               # reset DB and re-run all migrations
npx prisma db push                     # push schema without a migration (dev only)
npx prisma studio                      # GUI browser for the DB
npm run prisma -- db seed              # or: npx tsx prisma/seed.ts
```

No test suite is set up yet.

## Architecture

### Stack
- **Next.js 14** App Router with React Server Components
- **Prisma 5** + **SQLite** (`prisma/dev.db`, path set via `DATABASE_URL` in `.env`)
- **NextAuth v4** — credentials-based, JWT session strategy; config in `src/lib/auth.ts`
- **Tailwind CSS** for styling

### Route Groups and Role Gating

The app uses three Next.js route groups, each with its own layout that enforces role-based access via `getServerSession()`:

| Route group | URL prefix | Required role |
|---|---|---|
| `(admin)` | `/admin/**` | `ADMIN` |
| `(operator)` | `/operator/**` | `OPERATOR` |
| `(customer)` | `/activities`, `/my-registrations`, `/profile` | Any authenticated user |

`src/middleware.ts` protects all four path prefixes with NextAuth middleware. Layout files (`(admin)/layout.tsx`, etc.) do a secondary role check and redirect if the role doesn't match.

### Data Model (Prisma)

Single `User` model covers all three roles (`CUSTOMER | OPERATOR | ADMIN`) distinguished by the `role` field. Key relationships:

- `Activity` → has a `Room`, optional `CourseSession[]` (COURSE type only), `Registration[]`, `AttendanceRecord[]`
- `Registration` → links `User` (customer) ↔ `Activity`; holds `qrToken` (Events only); has at most one `AttendanceRecord`
- `AttendanceRecord` — immutable once created; records who was checked in by which operator

Business rule enforcement (capacity limits, duplicate registrations, room double-booking) must be implemented at the API/server-action level, not just in the UI.

### Authentication

- `src/lib/auth.ts` — `authOptions` and a convenience `getServerSession()` wrapper
- `src/lib/prisma.ts` — singleton Prisma client
- `src/types/next-auth.d.ts` — extends the Session/JWT types to include `role` and `id`
- Session contains `user.id`, `user.role`, `user.name`, `user.email`


### Seed Data

`prisma/seed.ts` creates three test accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ccms.local | admin123 |
| Operator | operator@ccms.local | op123 |
| Customer | customer@ccms.local | cust123 |
