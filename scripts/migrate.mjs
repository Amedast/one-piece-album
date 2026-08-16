/**
 * Better Auth migration script
 * Creates the required tables for better-auth (with username plugin)
 * Run with: node --env-file=.env.local scripts/migrate.mjs
 */

import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  {
    name: "user",
    sql: `
      CREATE TABLE IF NOT EXISTS "user" (
        "id"            TEXT        PRIMARY KEY,
        "name"          TEXT        NOT NULL,
        "email"         TEXT        NOT NULL UNIQUE,
        "emailVerified" BOOLEAN     NOT NULL DEFAULT FALSE,
        "image"         TEXT,
        "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
        "username"      TEXT        UNIQUE
      );
    `,
  },
  {
    name: "session",
    sql: `
      CREATE TABLE IF NOT EXISTS "session" (
        "id"          TEXT        PRIMARY KEY,
        "expiresAt"   TIMESTAMP   NOT NULL,
        "token"       TEXT        NOT NULL UNIQUE,
        "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
        "ipAddress"   TEXT,
        "userAgent"   TEXT,
        "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
    `,
  },
  {
    name: "account",
    sql: `
      CREATE TABLE IF NOT EXISTS "account" (
        "id"                    TEXT        PRIMARY KEY,
        "accountId"             TEXT        NOT NULL,
        "providerId"            TEXT        NOT NULL,
        "userId"                TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken"           TEXT,
        "refreshToken"          TEXT,
        "idToken"               TEXT,
        "accessTokenExpiresAt"  TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope"                 TEXT,
        "password"              TEXT,
        "createdAt"             TIMESTAMP   NOT NULL DEFAULT NOW(),
        "updatedAt"             TIMESTAMP   NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: "verification",
    sql: `
      CREATE TABLE IF NOT EXISTS "verification" (
        "id"          TEXT        PRIMARY KEY,
        "identifier"  TEXT        NOT NULL,
        "value"       TEXT        NOT NULL,
        "expiresAt"   TIMESTAMP   NOT NULL,
        "createdAt"   TIMESTAMP,
        "updatedAt"   TIMESTAMP
      );
    `,
  },
  {
    name: "albums",
    sql: `
      CREATE TABLE IF NOT EXISTS "albums" (
        "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "title"       TEXT        NOT NULL DEFAULT 'Mi Álbum',
        "description" TEXT        DEFAULT '',
        "cover_url"   TEXT,
        "is_public"   BOOLEAN     NOT NULL DEFAULT TRUE,
        "is_default"  BOOLEAN     NOT NULL DEFAULT FALSE,
        "created_at"  TIMESTAMP   NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMP   NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_albums_user_id ON "albums"("user_id");
    `,
  },
  {
    name: "album_pages",
    sql: `
      CREATE TABLE IF NOT EXISTS "album_pages" (
        "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "album_id"  UUID        NOT NULL REFERENCES "albums"("id") ON DELETE CASCADE,
        "page_id"   TEXT        NOT NULL,
        "title"     TEXT        NOT NULL,
        "position"  INTEGER     NOT NULL DEFAULT 0
      );
    `,
  },
  {
    name: "album_slots",
    sql: `
      CREATE TABLE IF NOT EXISTS "album_slots" (
        "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "page_db_id"    UUID        NOT NULL REFERENCES "album_pages"("id") ON DELETE CASCADE,
        "slot_id"       TEXT        NOT NULL,
        "position"      INTEGER     NOT NULL DEFAULT 0,
        "state"         TEXT        NOT NULL DEFAULT 'EMPTY',
        "card_id"       TEXT,
        "card_data"     JSONB,
        "language"      TEXT,
        "wishlist_urls" JSONB
      );
    `,
  },
];

async function migrate() {
  const client = await pool.connect();
  console.log("✅ Connected to database\n");

  try {
    for (const { name, sql } of migrations) {
      process.stdout.write(`  -> Creating table "${name}"... `);
      await client.query(sql);
      console.log("done");
    }
    console.log("\n✅ All Better Auth tables created successfully!");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
