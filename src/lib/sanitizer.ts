import {
  NutritionAssistantResponseSchema,
  ValidatedNutritionResponse
} from "./validation";

/**
 * Sanitizes and strictly validates Gemini LLM output against the Milestone 1 contract.
 *
 * Enforces:
 * 1. Markdown code fence removal (```json ... ```)
 * 2. Safe JSON syntax parsing
 * 3. Fallback claim generation if claims array is empty or missing
 * 4. Programmatic enforcement that all claim sources are null in Milestone 1
 * 5. Strict Zod runtime schema validation
 */
export function sanitizeAndValidateGeminiResponse(
  rawText: string
): ValidatedNutritionResponse {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error("Empty or non-string response received from model.");
  }

  // 1. Strip markdown code fences if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // 2. Parse JSON
  let jsonObject: any;
  try {
    jsonObject = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Invalid JSON syntax returned by model: ${err.message}`);
  }

  if (typeof jsonObject !== "object" || jsonObject === null) {
    throw new Error("Model response did not evaluate to a JSON object.");
  }

  // 3. Fallback claim generation if claims array is empty or missing
  if (!Array.isArray(jsonObject.claims) || jsonObject.claims.length === 0) {
    const fallbackText =
      typeof jsonObject.answer === "string" && jsonObject.answer.trim().length > 0
        ? jsonObject.answer.trim().slice(0, 120)
        : "General nutritional principle stated.";
    jsonObject.claims = [
      {
        claim_text: fallbackText,
        source: null
      }
    ];
  }

  // 4. Milestone 1 Strict Rule: Force all source fields to null
  jsonObject.claims = jsonObject.claims.map((claim: any) => ({
    claim_text:
      typeof claim === "object" && claim !== null && typeof claim.claim_text === "string"
        ? claim.claim_text.trim()
        : String(claim).trim(),
    source: null
  }));

  // 5. Validate against Zod schema
  return NutritionAssistantResponseSchema.parse(jsonObject);
}
