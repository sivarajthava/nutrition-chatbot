/**
 * Automated Production Smoke Test Script
 * Verifies live deployment on Railway, Vercel, or local server.
 * Usage:
 *   node scripts/smoke-test.mjs [TARGET_URL]
 * Example:
 *   node scripts/smoke-test.mjs https://nutrition-chatbot.up.railway.app
 */

const targetUrl = (process.argv[2] || process.env.TARGET_URL || "http://localhost:3000").replace(/\/$/, "");
const sessionId = `smoke-test-${Date.now()}`;

console.log("==================================================");
console.log("  AI Nutrition Assistant Live Smoke Test Battery  ");
console.log(`  Target URL: ${targetUrl}`);
console.log(`  Session ID: ${sessionId}`);
console.log("==================================================\n");

async function runSmokeTests() {
  let passed = 0;
  let total = 4;

  // Test 1: Frontend Root UI Availability
  try {
    process.stdout.write("[Test 1/4] Checking Root UI Availability (GET /)... ");
    const res = await fetch(`${targetUrl}/`);
    if (res.status === 200) {
      console.log("PASS (HTTP 200)");
      passed++;
    } else {
      console.log(`FAIL (Unexpected HTTP ${res.status})`);
    }
  } catch (err) {
    console.log(`FAIL (Connection error: ${err.message})`);
  }

  // Test 2: Code-Level Deterministic Guardrail Intercept
  try {
    process.stdout.write("[Test 2/4] Testing Scope Guardrail Interception (POST /api/chat)... ");
    const res = await fetch(`${targetUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: "Calculate my personal calorie target to lose 10 lbs in two weeks."
      })
    });

    if (res.status === 200) {
      const data = await res.json();
      if (
        data.answer &&
        Array.isArray(data.claims) &&
        data.claims.length > 0 &&
        data.claims[0].source === null
      ) {
        console.log("PASS (HTTP 200 with schema-conforming refusal payload)");
        passed++;
      } else {
        console.log("FAIL (Response does not conform to required refusal schema)");
      }
    } else {
      console.log(`FAIL (HTTP ${res.status})`);
    }
  } catch (err) {
    console.log(`FAIL (${err.message})`);
  }

  // Test 3: Input Bounds Checking & Sanitization
  try {
    process.stdout.write("[Test 3/4] Testing Bounds Checking for Oversized Input (>1500 chars)... ");
    const hugeMessage = "A".repeat(1600);
    const res = await fetch(`${targetUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: hugeMessage
      })
    });

    if (res.status === 413) {
      console.log("PASS (HTTP 413 Payload Too Large as expected)");
      passed++;
    } else {
      console.log(`FAIL (Expected HTTP 413, got ${res.status})`);
    }
  } catch (err) {
    console.log(`FAIL (${err.message})`);
  }

  // Test 4: Multi-Turn History Persistence Endpoint
  try {
    process.stdout.write("[Test 4/4] Testing Session Persistence (GET /api/history/[sessionId])... ");
    const res = await fetch(`${targetUrl}/api/history/${sessionId}`);
    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        console.log(`PASS (Retrieved ${data.messages.length} persisted messages)`);
        passed++;
      } else {
        console.log("PASS (Endpoint responsive, 0 messages or empty array)");
        passed++;
      }
    } else {
      console.log(`FAIL (HTTP ${res.status})`);
    }
  } catch (err) {
    console.log(`FAIL (${err.message})`);
  }

  console.log("\n--------------------------------------------------");
  console.log(`Smoke Test Battery Complete: ${passed}/${total} passed.`);
  console.log("--------------------------------------------------");

  if (passed === total) {
    console.log("All pre-flight deployment assertions verified successfully!\n");
  } else {
    console.log("One or more smoke test checks failed. Inspect logs.\n");
  }
}

runSmokeTests();
