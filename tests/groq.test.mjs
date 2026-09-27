import test from "node:test";
import assert from "node:assert";
import {
  SUPPORTED_GROQ_MODELS,
  GROQ_RESPONSE_SCHEMA,
  getGroqClient
} from "../src/lib/groq.ts";
import { NUTRITION_SYSTEM_PROMPT } from "../src/lib/prompts/systemPrompt.ts";
import { sanitizeAndValidateGeminiResponse } from "../src/lib/sanitizer.ts";
import { evaluateScopeGuardrail } from "../src/lib/guardrails.ts";

test("Phase 3 Groq: Supports specified models openai/gpt-oss-120b and qwen/qwen3.6-27b", () => {
  assert.strictEqual(SUPPORTED_GROQ_MODELS.GPT_OSS_120B, "openai/gpt-oss-120b");
  assert.strictEqual(SUPPORTED_GROQ_MODELS.QWEN_27B, "qwen/qwen3.6-27b");
});

test("Phase 3 Groq: Structured Output Schema enforces answer and claims contract", () => {
  assert.strictEqual(GROQ_RESPONSE_SCHEMA.type, "object");
  assert(GROQ_RESPONSE_SCHEMA.properties.answer);
  assert(GROQ_RESPONSE_SCHEMA.properties.claims);
  assert.deepStrictEqual(GROQ_RESPONSE_SCHEMA.required, ["answer", "claims"]);

  const claimProps = GROQ_RESPONSE_SCHEMA.properties.claims.items.properties;
  assert.strictEqual(claimProps.claim_text.type, "string");
  assert.strictEqual(claimProps.source.type, "null");
  assert.deepStrictEqual(
    GROQ_RESPONSE_SCHEMA.properties.claims.items.required,
    ["claim_text", "source"]
  );
});

test("Phase 3 Groq: getGroqClient throws descriptive error when GROQ_API_KEY is missing", () => {
  const originalKey = process.env.GROQ_API_KEY;
  try {
    delete process.env.GROQ_API_KEY;
    assert.throws(() => getGroqClient(), /GROQ_API_KEY is not configured/);
  } finally {
    if (originalKey) process.env.GROQ_API_KEY = originalKey;
  }
});

test("Phase 3 Groq: System Prompt enforces food scope, structured JSON mandate, and null sources", () => {
  assert(NUTRITION_SYSTEM_PROMPT.includes("AI Nutrition Assistant Prototype"));
  assert(NUTRITION_SYSTEM_PROMPT.includes("STRUCTURED OUTPUT MANDATE"));
  assert(NUTRITION_SYSTEM_PROMPT.includes("source': MUST BE NULL"));
  assert(NUTRITION_SYSTEM_PROMPT.includes("Never provide personal calorie prescriptions"));
});

test("Phase 3 Groq: Parses and sanitizes simulated Groq JSON response", () => {
  const simulatedGroqResponse = JSON.stringify({
    answer:
      "Lentils provide approximately 18 grams of protein per cooked cup along with high dietary fiber.",
    claims: [
      {
        claim_text: "Cooked lentils contain about 18 grams of protein per cup.",
        source: null
      },
      {
        claim_text: "Lentils are a rich source of dietary fiber.",
        source: null
      }
    ]
  });

  const parsed = sanitizeAndValidateGeminiResponse(simulatedGroqResponse);
  assert.strictEqual(parsed.claims.length, 2);
  assert.strictEqual(parsed.claims[0].source, null);
  assert.strictEqual(parsed.claims[1].source, null);
});

test("Phase 3 Groq: Strips Markdown code fences if returned by model", () => {
  const fencedResponse =
    "```json\n" +
    JSON.stringify({
      answer: "Spinach is rich in non-heme iron and vitamin A.",
      claims: [
        {
          claim_text: "Spinach contains non-heme iron.",
          source: null
        }
      ]
    }) +
    "\n```";

  const parsed = sanitizeAndValidateGeminiResponse(fencedResponse);
  assert.strictEqual(parsed.claims.length, 1);
  assert.strictEqual(parsed.claims[0].source, null);
});

test("Phase 3 Groq: Pre-LLM Guardrail intercepts calorie queries before Groq is called", () => {
  const result = evaluateScopeGuardrail("What is my calorie target to lose weight fast?");
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, "calorie_target");
  assert(result.refusalResponse);
  assert.strictEqual(result.refusalResponse.claims[0].source, null);
});
