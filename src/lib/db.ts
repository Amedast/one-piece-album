import { Pool } from "pg";

// Singleton pattern: avoids creating multiple Pool instances during
// Next.js Fast Refresh in development.
const globalForPg = globalThis as unknown as { appPool: Pool | undefined };

export const db =
  globalForPg.appPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPg.appPool = db;
