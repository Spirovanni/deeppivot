/**
 * Vitest setup: provide DATABASE_URL so db module loads.
 * Tests that hit the DB need a real connection; unit tests that return early (e.g. points <= 0) do not.
 */
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
}
