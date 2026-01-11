import { Pool } from "postgres";

const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://user:password@localhost:5432/gyakusan";

// Use a pool for multiple concurrent connections
const pool = new Pool(DATABASE_URL, 10, true);

/**
 * Get a connection from the pool, run a callback, and return the connection.
 */
export async function withDb<T>(callback: (client: Pool) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
