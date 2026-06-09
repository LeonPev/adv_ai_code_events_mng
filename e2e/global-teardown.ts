export default async function globalTeardown() {
  // Nothing to clean up — test.db persists between runs to allow inspection after failures.
  // Run `npm run test:db:reset` manually to wipe it.
}
