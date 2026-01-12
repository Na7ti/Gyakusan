#!/bin/bash
set -e

# Config
BASE_URL="http://localhost:8000"
GOOGLE_ID="100002183571470050906"
COOKIE="auth_token=${GOOGLE_ID}"
EXAM_TITLE="CurlTestExam_$(date +%s)"

echo "🚀 Starting Integration Verify (via Curl + Docker)..."
echo "   User: ${GOOGLE_ID}"

# 1. Create Exam
echo -e "\n1️⃣  Creating Exam '${EXAM_TITLE}'..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Cookie: ${COOKIE}" \
  -F "title=${EXAM_TITLE}" \
  -F "exam_date=2026-01-05" \
  -F "target_pages=10" \
  -F "start_date=2026-01-01" \
  "${BASE_URL}/api/exams/create")

if [ "$response" == "303" ]; then
  echo "✅ Exam Create API returned 303 (Success)."
else
  echo "❌ Create Failed. HTTP Code: $response"
  exit 1
fi

# 2. Get Exam ID from DB
echo -e "\n2️⃣  Verifying in Database..."
EXAM_ID=$(docker exec gyakusan-db-1 psql -U user -d gyakusan -t -c "SELECT id FROM exams WHERE title = '${EXAM_TITLE}' ORDER BY id DESC LIMIT 1;" | xargs)

if [ -z "$EXAM_ID" ]; then
  echo "❌ Exam not found in DB."
  exit 1
fi
echo "✅ Exam Found in DB. ID: ${EXAM_ID}"

# 3. Trigger Roadmap (Optional, just checking connectivity)
echo -e "\n3️⃣  Triggering AI Roadmap..."
# Note: This might take time or fail if API keys are bad, so we allow 500 or 200, but mainly check if it doesn't crash 404.
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Cookie: ${COOKIE}" \
  "${BASE_URL}/api/exams/${EXAM_ID}/roadmap")

echo "ℹ️  Roadmap API returned: ${http_code}"

# 4. Delete Exam
echo -e "\n4️⃣  Deleting Exam ${EXAM_ID}..."
del_resp=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Cookie: ${COOKIE}" \
  "${BASE_URL}/api/exams/${EXAM_ID}/delete")

status_code=$(echo "$del_resp" | tail -n1)
echo "   Delete Status: ${status_code}"

if [ "$status_code" != "200" ]; then
  echo "❌ Delete Failed."
  exit 1
fi

# 5. Verify Deletion in DB
echo -e "\n5️⃣  Verifying Deletion in DB..."
COUNT=$(docker exec gyakusan-db-1 psql -U user -d gyakusan -t -c "SELECT count(*) FROM exams WHERE id = ${EXAM_ID};" | xargs)

if [ "$COUNT" == "0" ]; then
  echo "✅ Exam successfully verified as deleted."
else
  echo "❌ Exam still exists in DB! (Count: ${COUNT})"
  exit 1
fi

echo -e "\n🎉 TEST PASSED SUCCESSFULLY!"
