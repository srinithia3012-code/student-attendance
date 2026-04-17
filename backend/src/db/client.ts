import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

function redactDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.password) url.password = "***";
    if (url.username) url.username = "***";
    return url.toString();
  } catch {
    return "<invalid DATABASE_URL>";
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Copy backend/.env.example to backend/.env and set a valid PostgreSQL connection string before starting the backend."
  );
}

const resolvedDatabaseUrl = databaseUrl;

/* =========================
   Create PostgreSQL Pool
========================= */

export const pool = new Pool({
  connectionString: resolvedDatabaseUrl,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

/* =========================
   Create Drizzle Instance
========================= */

export const db = drizzle(pool);

export async function verifyDatabaseConnection(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL (Neon)");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : String(err);

    throw new Error(
      `Database connection failed for ${redactDatabaseUrl(resolvedDatabaseUrl)}. Check backend/.env and make sure the host in DATABASE_URL is reachable. Original error: ${message}`
    );
  }
}
