# Deployment

This app deploys to Firebase App Hosting in project `huji-leon`.

## Runtime

- Firebase App Hosting backend: `ccms`
- Region: `us-central1`
- URL: `https://ccms--huji-leon.us-central1.hosted.app`
- Cloud SQL instance: `huji-leon:us-central1:huji-leon-ccms-sql`
- Runtime database: `ccms`
- Runtime database user: `ccms_app`
- Runtime networking: `ccms-vpc` / `ccms-us-central1` with Cloud SQL private IP

## CI Deploy

CI runs from `.github/workflows/ci.yml` on pushes, pull requests, and manual
workflow dispatches. Deploys are manual: start the `CI` workflow from GitHub
Actions and enable the `deploy_stg` or `deploy_prod` input.

The CI jobs are:

- `security`: installs dependencies, blocks critical production dependency
  vulnerabilities with `npm run security:audit`, and reports high severity
  advisories with `npm run security:audit:strict`.
- `lint`: installs dependencies, generates the Prisma client, and runs
  `npm run lint`.
- `unittests`: starts a disposable PostgreSQL service, applies migrations,
  runs `npm run build`, and runs `npm test`.
- `e2e`: starts a disposable PostgreSQL service, generates the Prisma client,
  installs Chromium for Playwright, and runs `npm run test:e2e`.
- `deploy_stg`: deploys to Firebase App Hosting after `security`, `lint`,
  `unittests`, and `e2e` succeed.
- `deploy_prod`: only runs from a manual workflow dispatch on `main`, waits for
  `security`, `lint`, `unittests`, `e2e`, and `deploy_stg`, and currently
  prints `ok`.

When the manual `deploy_stg` input is enabled, the staging deploy job runs:

```bash
npm run deploy
```

It deploys the repository source to Firebase App Hosting backend `ccms`.

### GitHub authentication

Add a repository secret named `FIREBASE_SERVICE_ACCOUNT_HUJI_LEON` containing
the service account JSON.

The service account needs permission to deploy Firebase App Hosting for project
`huji-leon`.

## Manual Deploy

Manual deploys are still available from a machine authenticated with Firebase:

```bash
npm run deploy
```

This deploys the current local source to the Firebase App Hosting backend
`ccms`. Run the command directly; do not use
`source scripts/manual-deploy.sh`.

For schema changes, run the Prisma migration once before or after the rollout:

```bash
DATABASE_URL='postgresql://ccms_app:<password>@127.0.0.1:5433/ccms?schema=public' npm run db:deploy
```

That command assumes Cloud SQL Auth Proxy is already listening on local port
`5433`. The GitHub Actions deploy does not run production migrations because
the runtime Cloud SQL instance is private. If there are no schema changes, skip
the migration command.

## App Hosting Secrets

The backend expects these App Hosting secrets:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

They are referenced from `apphosting.yaml`.
