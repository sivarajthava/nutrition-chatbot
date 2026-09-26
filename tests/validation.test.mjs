import test from "node:test";
import assert from "node:assert";
import { ClaimSchema, NutritionAssistantResponseSchema } from "../src/lib/validation.ts";
import { sanitizeAndValidateGeminiResponse } from "../src/lib/sanitizer.ts";

test("Phase 2 Data Contract: Valid response passes Zod schema", () => {
  const validData = {
    answer: "Cooked rice can be safely stored in the refrigerator for 3 to 4 days at 40°F (4°C) or below.",
    claims: [
      {
        claim_text: "Cooked rice is safe in the refrigerator for 3 to 4 days.",
        source: null
      },
      {
        claim_text: "The refrigerator temperature should be maintained at or below 40°F (4°C).",
        source: null
      }
    ]
  };

  const parsed = NutritionAssistantResponseSchema.parse(validData);
  assert.strictEqual(parsed.claims.length, 2);
  assert.strictEqual(parsed.claims[0].source, null);
  assert.strictEqual(parsed.claims[1].source, null);
});

test("Phase 2 Data Contract: Non-null source is rejected by Zod schema", () => {
  const invalidData = {
    answer: "A 70kg vegetarian adult typically requires approximately 56 grams of protein daily.",
    claims: [
      {
        claim_text: "RDA for adult protein is 0.8g per kg body weight.",
        source: "USDA Dietary Guidelines" // Strictly forbidden in Milestone 1!
      }
    ]
  };

  assert.throws(
    () => NutritionAssistantResponseSchema.parse(invalidData),
    (err) => {
      assert(err.name === "ZodError");
      return true;
    },
    "Zod schema must reject non-null sources"
  );
});

test("Phase 2 Data Contract: Empty claims array is rejected by Zod schema", () => {
  const invalidData = {
    answer: "Broccoli retains more water-soluble vitamins when steamed rather than boiled.",
    claims: []
  };

  assert.throws(
    () => NutritionAssistantResponseSchema.parse(invalidData),
    (err) => {
      assert(err.name === "ZodError");
      return true;
    }
  );
});

test("Phase 2 Data Contract: Short answer (<10 characters) is rejected", () => {
  const invalidData = {
    answer: "Too short",
    claims: [
      {
        claim_text: "Some valid claim text here.",
        source: null
      }
    ]
  };

  assert.throws(
    () => NutritionAssistantResponseSchema.parse(invalidData),
    (err) => {
      assert(err.name === "ZodError");
      return true;
    }
  );
});

test("Phase 2 Sanitizer: Strips markdown code fences correctly", () => {
  const rawModelOutput = `\`\`\`json
{
  "answer": "Boiling vegetables causes water-soluble vitamins like Vitamin C to leach into the cooking water.",
  "claims": [
    {
      "claim_text": "Vitamin C leaches into cooking water during boiling.",
      "source": null
    }
  ]
}
\`\`\``;

  const validated = sanitizeAndValidateGeminiResponse(rawModelOutput);
  assert.strictEqual(validated.claims.length, 1);
  assert.strictEqual(validated.claims[0].source, null);
});

test("Phase 2 Sanitizer: Forces hallucinated sources to null in Milestone 1", () => {
  const rawModelOutputWithHallucinatedSources = JSON.stringify({
    answer: "Iron absorption from plant foods is enhanced when consumed with Vitamin C rich foods.",
    claims: [
      {
        claim_text: "Vitamin C enhances non-heme iron absorption.",
        source: "WHO Nutrition Report 2023" // Hallucinated source
      }
    ]
  });

  const validated = sanitizeAndValidateGeminiResponse(rawModelOutputWithHallucinatedSources);
  assert.strictEqual(validated.claims.length, 1);
  assert.strictEqual(validated.claims[0].source, null); // Enforced to null!
});

test("Phase 2 Sanitizer: Generates fallback claim if claims array is empty", () => {
  const rawModelOutputWithEmptyClaims = JSON.stringify({
    answer: "Extra virgin olive oil contains polyphenols and monounsaturated oleic acid with high thermal stability.",
    claims: []
  });

  const validated = sanitizeAndValidateGeminiResponse(rawModelOutputWithEmptyClaims);
  assert(validated.claims.length >= 1);
  assert.strictEqual(validated.claims[0].source, null);
});

test("Phase 2 Sanitizer: Throws clear error on completely malformed JSON", () => {
  const malformedOutput = "{ this is not valid json at all }";

  assert.throws(
    () => sanitizeAndValidateGeminiResponse(malformedOutput),
    /Invalid JSON syntax returned by model/
  );
});
