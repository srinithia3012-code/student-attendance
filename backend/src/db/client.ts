import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

/* =========================
   Create PostgreSQL Pool
========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

/* =========================
   Create Drizzle Instance
========================= */

export const db = drizzle(pool);

/* =========================
   Optional: Test Connection
========================= */

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL (Neon)");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
})();
