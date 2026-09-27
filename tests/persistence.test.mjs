import test from "node:test";
import assert from "node:assert";
import {
  saveMessageToDB,
  getSessionHistory,
  clearSessionHistory,
  saveFailureLogToDB,
  getFailureLogs
} from "../src/lib/db.ts";

test("Phase 5 Persistence: Creates session, persists user message and assistant message with claims", async () => {
  const testSessionId = `test-persist-${Date.now()}`;

  try {
    // 1. Save user message
    const userMsg = await saveMessageToDB(
      testSessionId,
      "user",
      "How much vitamin C is in an orange?"
    );
    assert.strictEqual(userMsg.sessionId, testSessionId);
    assert.strictEqual(userMsg.role, "user");
    assert.strictEqual(userMsg.content, "How much vitamin C is in an orange?");

    // 2. Save assistant message with atomic claims (source: null)
    const assistantMsg = await saveMessageToDB(
      testSessionId,
      "assistant",
      "A medium orange typically contains approximately 70 milligrams of vitamin C.",
      [
        {
          claim_text: "A medium orange contains approximately 70 mg of vitamin C.",
          source: null
        }
      ]
    );
    assert.strictEqual(assistantMsg.sessionId, testSessionId);
    assert.strictEqual(assistantMsg.role, "assistant");
    assert.strictEqual(assistantMsg.claims.length, 1);
    assert.strictEqual(assistantMsg.claims[0].source, null);

    // 3. Fetch history
    const history = await getSessionHistory(testSessionId);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].role, "user");
    assert.strictEqual(history[1].role, "assistant");
    assert.strictEqual(history[1].claims.length, 1);
    assert.strictEqual(history[1].claims[0].claimText, "A medium orange contains approximately 70 mg of vitamin C.");
    assert.strictEqual(history[1].claims[0].source, null);
  } finally {
    // Cleanup
    await clearSessionHistory(testSessionId);
  }
});

test("Phase 5 Persistence: Cascade deletion clears session, messages, and claims", async () => {
  const testSessionId = `test-cascade-${Date.now()}`;

  await saveMessageToDB(
    testSessionId,
    "user",
    "What are safe food refrigeration temps?"
  );
  await saveMessageToDB(
    testSessionId,
    "assistant",
    "Refrigerators should be kept at or below 40°F (4°C).",
    [
      {
        claim_text: "Safe refrigeration temperature is 40°F (4°C) or lower.",
        source: null
      }
    ]
  );

  const beforeClear = await getSessionHistory(testSessionId);
  assert.strictEqual(beforeClear.length, 2);

  // Clear session
  await clearSessionHistory(testSessionId);

  const afterClear = await getSessionHistory(testSessionId);
  assert.strictEqual(afterClear.length, 0);
});

test("Phase 5 Persistence: Stores and queries FailureLog telemetry records", async () => {
  const testQId = 999;
  const failureRecord = await saveFailureLogToDB({
    questionId: testQId,
    category: "Food Safety & Storage",
    questionText: "How long can cooked rice be safely kept in the refrigerator?",
    runNumber: 1,
    responseText: "Rice can be stored for 5 days.",
    failureTypes: "UA,SN",
    notes: "Parametric hallucination test entry."
  });

  assert.strictEqual(failureRecord.questionId, testQId);
  assert.strictEqual(failureRecord.category, "Food Safety & Storage");
  assert.strictEqual(failureRecord.failureTypes, "UA,SN");

  const logs = await getFailureLogs();
  const found = logs.find((l) => l.questionId === testQId);
  assert(found);
  assert.strictEqual(found.runNumber, 1);
});
