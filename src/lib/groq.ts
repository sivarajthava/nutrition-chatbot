import Groq from "groq-sdk";
import { NUTRITION_SYSTEM_PROMPT } from "./prompts/systemPrompt";
import { sanitizeAndValidateGeminiResponse } from "./sanitizer";
import { ValidatedNutritionResponse } from "./validation";

/**
 * Supported Groq Open-Weight Models for Phase 3
 */
export const SUPPORTED_GROQ_MODELS = {
  GPT_OSS_120B: "openai/gpt-oss-120b",
  QWEN_27B: "qwen/qwen3.6-27b"
} as const;

export type SupportedGroqModel =
  (typeof SUPPORTED_GROQ_MODELS)[keyof typeof SUPPORTED_GROQ_MODELS];

/**
 * Structured Output JSON Schema for Groq
 */
export const GROQ_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description:
        "Comprehensive conversational response addressing the user's food, nutrition, or cooking query."
    },
    claims: {
      type: "array",
      description: "List of atomic, testable factual assertions made within the answer.",
      items: {
        type: "object",
        properties: {
          claim_text: {
            type: "string",
            description: "A single distinct factual statement."
          },
          source: {
            type: "null",
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
 * Initializes the Groq SDK client with environment validation.
 */
export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-groq-api-key-here") {
    throw new Error(
      "GROQ_API_KEY is not configured. Please supply a valid GROQ_API_KEY in .env.local."
    );
  }
  return new Groq({ apiKey });
}

/**
 * Invokes Groq LPU inference with native JSON Object mode,
 * sliding-window context, rate-limit backoff, and strict Zod contract validation.
 *
 * Supported models:
 * - openai/gpt-oss-120b (Default primary: 120B MoE open-weight model with reasoning)
 * - qwen/qwen3.6-27b (Alternative: 27B model for ultra-low latency)
 */
export async function generateNutritionResponse(
  userPrompt: string,
  history: ChatHistoryTurn[] = [],
  overrideModel?: string
): Promise<ValidatedNutritionResponse> {
  const groq = getGroqClient();
  const modelName =
    overrideModel ||
    process.env.GROQ_MODEL ||
    SUPPORTED_GROQ_MODELS.GPT_OSS_120B;

  // Rolling context window: take the last 6 turns (Edge Case SC-22)
  const recentHistory: Groq.Chat.Completions.ChatCompletionMessageParam[] =
    history.slice(-6).map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content
    }));

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: NUTRITION_SYSTEM_PROMPT
    },
    ...recentHistory,
    {
      role: "user",
      content: userPrompt
    }
  ];

  let rawContent: string | null = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completionParams: any = {
        model: modelName,
        messages,
        temperature: 0.2, // Low temperature for factual consistency
        response_format: { type: "json_object" }
      };

      const completion = await groq.chat.completions.create(completionParams);

      rawContent = completion.choices[0]?.message?.content || null;
      if (rawContent && rawContent.trim().length > 0) {
        break; // Successfully received response
      }
      throw new Error("Model returned an empty content string.");
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes("rate_limit_exceeded") ||
        err?.message?.includes("429");

      if (isRateLimit && attempt < maxRetries) {
        const backoffMs = (attempt + 1) * 1000 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      // If model not found or overloaded, attempt automatic fallback to secondary model
      const isModelError =
        err?.status === 404 ||
        err?.message?.includes("model_not_found") ||
        err?.message?.includes("decommissioned");

      if (isModelError && modelName !== SUPPORTED_GROQ_MODELS.QWEN_27B && attempt < maxRetries) {
        console.warn(`Falling back to ${SUPPORTED_GROQ_MODELS.QWEN_27B} due to: ${err.message}`);
        return generateNutritionResponse(userPrompt, history, SUPPORTED_GROQ_MODELS.QWEN_27B);
      }

      throw err;
    }
  }

  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error("Empty response received from Groq model.");
  }

  // Parse, sanitize code fences, force source: null, and strictly validate against Zod contract
  return sanitizeAndValidateGeminiResponse(rawContent);
}
