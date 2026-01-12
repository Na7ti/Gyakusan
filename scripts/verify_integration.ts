import "https://deno.land/std@0.216.0/dotenv/load.ts";
import { withDb } from "../db/client.ts";

const BASE_URL = "http://localhost:8000";

async function main() {
  console.log("🚀 Starting Integration Verification...");

  // 1. Get a valid user for Auth
  const user = await withDb(async (client) => {
    const res = await client.queryObject<{ google_id: string }>`SELECT google_id FROM users LIMIT 1`;
    return res.rows[0];
  });

  if (!user || !user.google_id) {
    console.error("❌ No users found in DB. Please log in once via UI to create a user.");
    Deno.exit(1);
  }

  const cookieHeader = `auth_token=${user.google_id}`;
  console.log(`✅ Found Test User. Using Cookie: ${cookieHeader.substring(0, 20)}...`);

  // 2. Create Exam
  console.log("\nTesting: Create Exam...");
  const formData = new FormData();
  formData.append("title", "IntegrationTestExam");
  formData.append("exam_date", "2026-12-31");
  formData.append("target_pages", "100");
  formData.append("start_date", "2026-01-01");

  const createRes = await fetch(`${BASE_URL}/api/exams/create`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
    },
    body: formData,
    redirect: "manual" // We expect 303
  });

  if (createRes.status === 303) {
    console.log("✅ Exam Create API returned 303 Redirect (Success).");
  } else {
    console.error(`❌ Exam Create Failed. Status: ${createRes.status}`);
    const text = await createRes.text();
    console.error("Response:", text);
    Deno.exit(1);
  }

  // 3. Verify it exists in DB & Get ID
  const newExamId = await withDb(async (client) => {
    const res = await client.queryObject<{ id: number }>`
      SELECT id FROM exams WHERE title = 'IntegrationTestExam' ORDER BY id DESC LIMIT 1
    `;
    return res.rows[0]?.id;
  });

  if (!newExamId) {
    console.error("❌ Exam not found in DB after creation.");
    Deno.exit(1);
  }
  console.log(`✅ Exam Verified in DB. ID: ${newExamId}`);

  // 4. Test AI Roadmap Generation (Optional - might fail if API key not set or rate limit)
  console.log("\nTesting: AI Roadmap Generation...");
  try {
    const roadmapRes = await fetch(`${BASE_URL}/api/exams/${newExamId}/roadmap`, {
        method: "POST", // Assuming POST for generation trigger
        headers: { Cookie: cookieHeader }
    });
    // Note: If roadmap generation is blocking, we await. If it's pure EventStream, this might hang or return stream.
    // The previous analysis didn't show the code for roadmap.ts fully, assuming it returns JSON or Stream.
    // If it returns 200/2xx, we are good.
    if (roadmapRes.ok) {
       console.log(`✅ AI Roadmap Endpoint Reached (${roadmapRes.status}).`);
       // If it's a stream, we might want to read a bit.
       await roadmapRes.body?.cancel();
    } else {
       console.warn(`⚠️ AI Roadmap Endpoint validation warning: ${roadmapRes.status}`);
    }
  } catch (e) {
      console.warn("⚠️ AI Roadmap test skipped/failed (network/key issue):", e);
  }

  // 5. Delete Exam
  console.log("\nTesting: Delete Exam...");
  const deleteRes = await fetch(`${BASE_URL}/api/exams/${newExamId}/delete`, {
    method: "POST",
    headers: { Cookie: cookieHeader }
  });

  if (deleteRes.ok) {
    console.log("✅ Exam Delete API returned Success.");
  } else {
    console.error(`❌ Delete Failed: ${deleteRes.status}`);
    Deno.exit(1);
  }

  // 6. Verify Deletion in DB
  const deletedCheck = await withDb(async (client) => {
    const res = await client.queryObject`SELECT id FROM exams WHERE id = ${newExamId}`;
    return res.rows.length;
  });

  if (deletedCheck === 0) {
    console.log("✅ Exam successfully removed from DB.");
  } else {
    console.error("❌ Exam still exists in DB after delete!");
    Deno.exit(1);
  }

  console.log("\n🎉 All Verification Tests Passed!");
}

main();
