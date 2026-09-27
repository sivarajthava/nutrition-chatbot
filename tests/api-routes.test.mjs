import test from "node:test";
import assert from "node:assert";
import { GET as healthGET } from "../src/app/api/health/route.ts";
import { GET as sessionsGET, POST as sessionsPOST, DELETE as sessionsDELETE } from "../src/app/api/sessions/route.ts";
import { NextRequest } from "next/server";

test("API /api/health: Returns 200 OK with server health, active model, and CORS", async () => {
  const res = await healthGET();
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.status, "online");
  assert.strictEqual(data.service, "AI Nutrition Assistant Prototype");
  assert.strictEqual(data.guardrails, "active");
  assert(data.model);

  assert.strictEqual(res.headers.get("access-control-allow-origin"), "*");
});

test("API /api/sessions: Lists sessions and supports creation and deletion", async () => {
  const testSessionId = `test-api-session-${Date.now()}`;

  // 1. Create session
  const postReq = new NextRequest("http://localhost:3000/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: testSessionId, title: "Test Chat Session" })
  });
  const postRes = await sessionsPOST(postReq);
  assert.strictEqual(postRes.status, 201);
  const postData = await postRes.json();
  assert.strictEqual(postData.session.id, testSessionId);

  // 2. List sessions
  const getRes = await sessionsGET();
  assert.strictEqual(getRes.status, 200);
  const getData = await getRes.json();
  assert(Array.isArray(getData.sessions));
  const found = getData.sessions.find((s) => s.id === testSessionId);
  assert(found);
  assert.strictEqual(found.title, "Test Chat Session");

  // 3. Delete session
  const delReq = new NextRequest(`http://localhost:3000/api/sessions?sessionId=${testSessionId}`, {
    method: "DELETE"
  });
  const delRes = await sessionsDELETE(delReq);
  assert.strictEqual(delRes.status, 200);
});
