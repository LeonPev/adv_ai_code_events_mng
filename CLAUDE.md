## Project Overview

Community Center Management System (CCMS) — a Next.js 14 web app for managing community center activities, registrations, and attendance. The full product spec lives in `docs/prd.md`.

All commands below run from the repo root.

## Commands

```bash
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm run deploy     # deploy local source to Firebase App Hosting backend ccms

# Database
npx prisma migrate dev --name <name>   # create and apply a migration
npx prisma migrate reset               # reset DB and re-run all migrations
npx prisma db push                     # push schema without a migration (dev only)
npx prisma studio                      # GUI browser for the DB
npm run prisma -- db seed              # or: npx tsx prisma/seed.ts

# Testing (Vitest unit/integration + Playwright E2E)
npm run test:db:setup   # apply migrations to TEST_DATABASE_URL
npm test                # Vitest run (all *.test.ts files)
npm run test:watch      # Vitest watch mode
npm run test:coverage   # Vitest with v8 coverage
npm run test:e2e        # Playwright (requires dev server or auto-starts one on port 3001)
npm run test:e2e:ui     # Playwright interactive UI
npm run test:db:reset   # wipe and re-migrate TEST_DATABASE_URL
npm run test:db:seed    # seed TEST_DATABASE_URL with the standard three accounts
npm run security:audit         # fail on critical production dependency vulnerabilities
npm run security:audit:strict  # report high severity production dependency vulnerabilities
```

## Testing

Two-tier test suite:

| Layer | Tool | Files | DB |
|---|---|---|---|
| Unit / integration | Vitest 4 | `src/**/*.test.{ts,tsx}` | PostgreSQL via `TEST_DATABASE_URL` |
| E2E | Playwright | `e2e/**/*.spec.ts` | PostgreSQL via `TEST_DATABASE_URL` |

Use a disposable PostgreSQL database for tests and set `TEST_DATABASE_URL` before running DB setup, Vitest, or Playwright. `vitest.config.ts` and `playwright.config.ts` inject that value as `DATABASE_URL` for the app.

### Key conventions

- **Server action tests** use integration style: seed via `testPrisma` from `src/tests/helpers/db.ts`, then call the action directly. `vi.mock('@/lib/prisma')` does **not** intercept transitive imports in Vitest 4 — use real test DB instead.
- **NextAuth `authorize`**: access via `authOptions.providers[0].options.authorize`, not `providers[0].authorize` (the outer wrapper requires full NextAuth request context and returns `null` in isolation).
- **`getServerSession` mock**: import from `src/tests/helpers/session.ts` and use `vi.mock('@/lib/auth')` with the factory from `src/lib/__mocks__/auth.ts`.
- **`vi.clearAllMocks()`** runs globally after each test (in `vitest.setup.ts`). Do not use `vi.restoreAllMocks()` — it breaks `vitest-mock-extended` proxies.
- Vitest uses `pool: 'forks'` + `sequence: { concurrent: false }` so DB integration tests stay deterministic.
- Playwright auth state (logged-in cookies) is pre-generated in `e2e/global-setup.ts` and stored in `e2e/.auth/` (gitignored).

## Architecture

### Stack
- **Next.js 14** App Router with React Server Components
- **Prisma 5** + **PostgreSQL** (`DATABASE_URL` in `.env`)
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
