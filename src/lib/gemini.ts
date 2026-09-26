import { GoogleGenAI, Type } from "@google/genai";
import { NUTRITION_SYSTEM_PROMPT } from "./prompts/systemPrompt";
import { sanitizeAndValidateGeminiResponse } from "./sanitizer";
import { ValidatedNutritionResponse } from "./validation";

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-gemini-api-key-here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please supply a valid GEMINI_API_KEY in .env.local."
    );
  }
  return new GoogleGenAI({ apiKey });
}

export const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description:
        "Comprehensive conversational answer addressing the user's food, nutrition, or cooking question."
    },
    claims: {
      type: Type.ARRAY,
      description: "List of atomic, testable factual assertions made within the answer.",
      items: {
        type: Type.OBJECT,
        properties: {
          claim_text: {
            type: Type.STRING,
            description: "A single distinct factual statement."
          },
          source: {
            type: Type.STRING,
            nullable: true,
            description: "Source reference. MUST ALWAYS BE NULL in Milestone 1."
          }
        },
        required: ["claim_text", "source"]
      }
    }
  },
  required: ["answer", "claims"]
};

export interface ChatHistoryTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Invokes Google Gemini with native JSON Schema structured output,
 * sliding-window context, rate-limit backoff, and safety fallbacks.
 */
export async function generateNutritionResponse(
  userPrompt: string,
  history: ChatHistoryTurn[] = []
): Promise<ValidatedNutritionResponse> {
  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Rolling context window: take the last 6 turns to avoid context overflow (SC-22)
  const recentHistory = history.slice(-6).map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }]
  }));

  const contents = [
    ...recentHistory,
    { role: "user", parts: [{ text: userPrompt }] }
  ];

  let rawResponse: any = null;
  let lastError: any = null;

  // Retry up to 2 times on transient rate limits (429) with exponential jitter (SC-16)
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      rawResponse = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: NUTRITION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.2, // Low temperature for factual stability
          maxOutputTokens: 1024
        }
      });
      break; // Success
    } catch (err: any) {
      lastError = err;
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("429");

      if (isRateLimit && attempt < maxRetries) {
        const backoffMs = (attempt + 1) * 1000 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
      throw err;
    }
  }

  // Handle native safety filter block (SC-18)
  const candidate = rawResponse?.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") {
    return {
      answer:
        "This inquiry involves high-risk food hazards, acute biological toxins, or clinical parameters that trigger safety precautions. Please consult public health authorities or qualified healthcare providers directly.",
      claims: [
        {
          claim_text:
            "High-risk food pathogens or hazardous toxins require evaluation by public health or medical authorities.",
          source: null
        }
      ]
    };
  }

  const rawText = rawResponse?.text;
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Model returned an empty response.");
  }

  // Step 4: Parse, sanitize, and validate through Zod contract
  return sanitizeAndValidateGeminiResponse(rawText);
}
