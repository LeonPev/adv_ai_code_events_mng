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

## GitHub Link

Connect the Firebase App Hosting backend `ccms` to the GitHub repository
`LeonPev/adv_ai_code_events_mng` in the Firebase console once. After that,
pushing to the live branch can trigger a rollout automatically.

## Simple Deploy

Firebase App Hosting deploys from GitHub, not from uncommitted local files.
For normal app changes:

```bash
git add .
git commit -m "Deploy"
git push
npm run deploy
```

If automatic rollouts are enabled for the backend, even `npm run deploy` is
optional; pushing to the live branch is enough.

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
