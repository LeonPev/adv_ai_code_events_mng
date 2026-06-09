# Community Center Management System (CCMS)

A Next.js 14 web app for managing community center activities, registrations, and attendance.

## Stack

- **Next.js 14** App Router + React Server Components
- **Prisma 5** + SQLite
- **NextAuth v4** (credentials, JWT)
- **Tailwind CSS**

## Getting started

```bash
npm install
npx prisma migrate dev --name init   # creates prisma/dev.db
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
npm run test:db:setup   # create prisma/test.db (run once)
npm test                # Vitest unit + integration tests
npm run test:e2e        # Playwright E2E tests
```

See `CLAUDE.md` for the full command reference and architecture overview.
