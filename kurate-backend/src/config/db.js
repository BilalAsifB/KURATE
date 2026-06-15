import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "kurate",
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default pool;