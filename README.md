# Community Center Management System (CCMS)

A Next.js 14 web app for managing community center activities, registrations, and attendance.

## Stack

- **Next.js 14** App Router + React Server Components
- **Prisma 5** + PostgreSQL
- **NextAuth v4** (credentials, JWT)
- **Tailwind CSS**

## Getting started

```bash
npm install
npx prisma migrate dev                # applies migrations to DATABASE_URL
npm run prisma -- db seed             # seeds three test accounts
npm run dev                           # http://localhost:3000
```

Test accounts after seeding:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ccms.local | admin123 |
| Operator | operator@ccms.local | op123 |
| Customer | customer@ccms.local | cust123 |

## Testing

```bash
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ccms_test?schema=public
npm run test:db:setup   # apply migrations to the test database
npm test                # Vitest unit + integration tests
npm run test:e2e        # Playwright E2E tests
```

## Deployment

Production deploys run in GitHub Actions on pushes to `main` after linting,
building, Vitest, and Playwright pass.

```bash
npm run deploy
```

This manually deploys the current local source to the Firebase App Hosting
backend `ccms`. See `docs/deployment.md` for CI setup, runtime details, and
database migration notes.

See `CLAUDE.md` for the full command reference and architecture overview.
