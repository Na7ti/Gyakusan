
import { withDb } from "../db/client.ts";
import { GoogleCalendarClient } from "../utils/google_calendar.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";

async function cleanup() {
  console.log("Starting cleanup...");

  // Since this is a specialized administrative script, we'll try to grab the first user's token 
  // or just bypass auth for the sake of deleting *application* data if possible.
  // BUT the google calendar client needs a valid token to delete events.
  // We will try to fetch all users and their tokens if stored? 
  // Wait, tokens are in cookies, not usually in DB? The schema says:
  // CREATE TABLE users ( id SERIAL PRIMARY KEY, google_id VARCHAR(255) UNIQUE NOT NULL, email VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, picture VARCHAR(255) );
  // Auth token is NOT in DB. It's in the cookie.
  
  // PROBLEM: We cannot delete Google Calendar events without the user's access token.
  // We can only delete the rows in the DB.
  // The user asked to "Delete all goals on the app".
  // If we just delete DB rows, the app is clean. GCal events remain orphaned.
  
  // STRATEGY:
  // Since we don't have the access token readily available in a script (unless we hijack a session),
  // we will ONLY clear the Database.
  // This satisfies "Delete all goals ON THE APP".
  // I will inform the user that GCal events might remain.
  
  await withDb(async (client) => {
    // Check count
    const res = await client.queryObject<{ count: number }>("SELECT count(*) FROM exams");
    console.log(`Found ${res.rows[0].count} exams.`);

    if (res.rows[0].count > 0) {
      await client.queryArray("DELETE FROM exams"); // Cascade should handle tasks
      console.log("All exams deleted from DB.");
    } else {
      console.log("No exams to delete.");
    }
  });
}

cleanup().catch(console.error);
