import { withDb } from "./db/client.ts";

try {
  const version = await withDb(async (client) => {
    const result = await client.queryArray`SELECT version()`;
    return result.rows[0][0];
  });
  console.log("Database connected successfully!");
  console.log("PostgreSQL Version:", version);

  const tables = await withDb(async (client) => {
    const result = await client.queryArray`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    return result.rows.flat();
  });
  console.log("Tables found:", tables);

} catch (error) {
  console.error("Database connection failed:", error);
  Deno.exit(1);
}
