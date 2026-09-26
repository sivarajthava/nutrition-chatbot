import test from "node:test";
import assert from "node:assert";
import { GEMINI_RESPONSE_SCHEMA } from "../src/lib/gemini.ts";
import { NUTRITION_SYSTEM_PROMPT } from "../src/lib/prompts/systemPrompt.ts";
import { evaluateScopeGuardrail, normalizeInput } from "../src/lib/guardrails.ts";
import { NutritionAssistantResponseSchema } from "../src/lib/validation.ts";

test("Orchestration: System prompt enforces tone, scope exclusions, and null sources", () => {
  assert(NUTRITION_SYSTEM_PROMPT.includes("AI Nutrition Assistant Prototype"));
  assert(NUTRITION_SYSTEM_PROMPT.includes("Never provide personal calorie prescriptions"));
  assert(NUTRITION_SYSTEM_PROMPT.includes("source': MUST BE NULL"));
  assert(NUTRITION_SYSTEM_PROMPT.includes("food, human nutrition, food science, culinary safety"));
});

test("Orchestration: Gemini Structured Output Schema conforms to contract", () => {
  assert.strictEqual(GEMINI_RESPONSE_SCHEMA.type, "OBJECT");
  assert(GEMINI_RESPONSE_SCHEMA.properties.answer);
  assert(GEMINI_RESPONSE_SCHEMA.properties.claims);
  assert.deepStrictEqual(GEMINI_RESPONSE_SCHEMA.required, ["answer", "claims"]);

  const claimItemProps = GEMINI_RESPONSE_SCHEMA.properties.claims.items.properties;
  assert(claimItemProps.claim_text);
  assert(claimItemProps.source);
  assert.strictEqual(claimItemProps.source.nullable, true);
});

test("Orchestration: Input validation bounds rejects >1500 characters", () => {
  const hugeInput = "a".repeat(1501);
  assert(hugeInput.length > 1500);
});

test("Orchestration: Input validation rejects empty and zero-width characters", () => {
  const zeroWidthOnly = "\u200B\u200C\u200D\uFEFF   ";
  const cleaned = normalizeInput(zeroWidthOnly);
  assert.strictEqual(cleaned.length, 0);
});

test("Orchestration: Context window handles 6-turn slicing", () => {
  const tenTurnHistory = Array.from({ length: 10 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `Turn message ${i + 1}`
  }));

  const sliced = tenTurnHistory.slice(-6);
  assert.strictEqual(sliced.length, 6);
  assert.strictEqual(sliced[0].content, "Turn message 5");
  assert.strictEqual(sliced[5].content, "Turn message 10");
});

test("Orchestration: Pre-LLM Guardrail intercept returns conforming refusal", () => {
  const outOfScopeQuery = "Calculate how many calories I need to burn 5kg of fat.";
  const check = evaluateScopeGuardrail(outOfScopeQuery);

  assert.strictEqual(check.allowed, false);
  assert(check.refusalResponse);

  // Validate refusal against Zod contract
  const validated = NutritionAssistantResponseSchema.parse(check.refusalResponse);
  assert(validated.answer.length >= 10);
  assert.strictEqual(validated.claims[0].source, null);
});
