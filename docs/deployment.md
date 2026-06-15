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

## Deploy

This is the only app deploy flow supported by this repo:

```bash
npm run deploy
```

It deploys the current local source to the Firebase App Hosting backend `ccms`.
Run the command directly; do not use `source scripts/manual-deploy.sh`.

For schema changes, run the Prisma migration once before or after the rollout:

```bash
DATABASE_URL='postgresql://ccms_app:<password>@127.0.0.1:5433/ccms?schema=public' npm run db:deploy
```

That command assumes Cloud SQL Auth Proxy is already listening on local port
`5433`. If there are no schema changes, skip it.

## App Hosting Secrets

The backend expects these App Hosting secrets:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

They are referenced from `apphosting.yaml`.
