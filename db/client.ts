import { Client } from "postgres";

const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://user:password@localhost:5432/gyakusan";

export const db = new Client(DATABASE_URL);

/**
 * Connect to the database, run a callback, and disconnect.
 * Useful for one-off queries or initialization checks.
 */
export async function withDb<T>(callback: (client: Client) => Promise<T>): Promise<T> {
  await db.connect();
  try {
    return await callback(db);
  } finally {
    await db.end();
  }
}
