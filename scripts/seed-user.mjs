/**
 * Seed a user into the Better Auth database.
 * Run with: node --env-file=.env.local scripts/seed-user.mjs
 */

import pg from "pg";
import { randomBytes } from "crypto";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── User data ──────────────────────────────────────────────────────────────
const USER = {
  name: "Alejandro",
  email: "alexmedinaastorga@gmail.com",
  username: "Gorpax",
  password: "alejandro280620001",
};
// ──────────────────────────────────────────────────────────────────────────

/** Generate a random ID (21-char, same style Better Auth uses) */
function generateId() {
  return randomBytes(16).toString("hex").slice(0, 21);
}

/**
 * Hash the password using Better Auth's internal implementation.
 * Better Auth uses @node-rs/bcrypt internally.
 */
async function hashPassword(password) {
  // Try better-auth's internal crypto module first
  try {
    const mod = await import("better-auth/crypto");
    const fn = mod.hashPassword ?? mod.hash;
    if (fn) return await fn(password);
  } catch { /* continue */ }

  // Try @node-rs/bcrypt (shipped with better-auth)
  try {
    const bcrypt = await import("@node-rs/bcrypt");
    return await bcrypt.hash(password, 10);
  } catch { /* continue */ }

  // Fallback: bcryptjs
  const bcryptjs = await import("bcryptjs");
  return await bcryptjs.hash(password, 10);
}

async function seedUser() {
  const client = await pool.connect();
  console.log("✅ Connected to database\n");

  try {
    // Check if user already exists
    const existing = await client.query(
      `SELECT id FROM "user" WHERE email = $1 OR username = $2`,
      [USER.email, USER.username]
    );

    if (existing.rows.length > 0) {
      console.log(
        `⚠️  User with email "${USER.email}" or username "${USER.username}" already exists. Aborting.`
      );
      return;
    }

    const userId = generateId();
    const accountId = generateId();
    const now = new Date();

    console.log("🔐 Hashing password...");
    const hashedPassword = await hashPassword(USER.password);
    console.log("   done\n");

    // Insert into "user" table
    await client.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "username", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, USER.name, USER.email, false, USER.username, now, now]
    );
    console.log(`✅ User "${USER.name}" inserted (id: ${userId})`);

    // Insert into "account" table (credential provider)
    await client.query(
      `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [accountId, userId, "credential", userId, hashedPassword, now, now]
    );
    console.log(`✅ Account (credential) inserted (id: ${accountId})`);

    console.log("\n🎉 User seeded successfully!");
    console.log(`   Email:    ${USER.email}`);
    console.log(`   Username: ${USER.username}`);
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedUser();
