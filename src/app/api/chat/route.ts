import { NextRequest, NextResponse } from "next/server";
import { evaluateScopeGuardrail, normalizeInput } from "@/lib/guardrails";
import { generateNutritionResponse } from "@/lib/gemini";
import { saveMessageToDB, getSessionHistory } from "@/lib/db";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId = "default-session", message } = body;

    // Step 0: Input Sanitization & Bounds Checking (Edge Cases SC-12 & SC-13)
    if (typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message payload. 'message' must be a string." },
        { status: 400 }
      );
    }

    if (message.length > 1500) {
      return NextResponse.json(
        { error: "Payload too large. Please limit questions to 1,500 characters." },
        { status: 413 }
      );
    }

    const cleanMessage = normalizeInput(message);
    if (cleanMessage.length === 0) {
      return NextResponse.json(
        { error: "Invalid message payload. Message cannot be empty or solely whitespace." },
        { status: 400 }
      );
    }

    // Step 1: Pre-LLM Deterministic Scope Guardrail Intercept
    const guardrailCheck = evaluateScopeGuardrail(cleanMessage);
    if (!guardrailCheck.allowed && guardrailCheck.refusalResponse) {
      await saveMessageToDB(sessionId, "user", cleanMessage);
      await saveMessageToDB(
        sessionId,
        "assistant",
        guardrailCheck.refusalResponse.answer,
        guardrailCheck.refusalResponse.claims
      );
      return NextResponse.json(guardrailCheck.refusalResponse, { status: 200 });
    }

    // Step 2: Fetch Recent Session History for Multi-Turn Context (Edge Case SC-22)
    let history: Array<{ role: "user" | "assistant"; content: string }> = [];
    try {
      const dbMessages = await getSessionHistory(sessionId);
      history = dbMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content
        }));
    } catch (dbErr) {
      console.warn("Could not retrieve session history:", dbErr);
    }

    // Step 3: Invoke Gemini LLM with Structured Output & Schema Enforcement
    let validatedData;
    try {
      validatedData = await generateNutritionResponse(cleanMessage, history);
    } catch (modelErr: any) {
      console.error("Gemini model execution error:", modelErr);
      const isConfigError = modelErr.message?.includes("GEMINI_API_KEY");
      return NextResponse.json(
        {
          error: isConfigError
            ? "Gemini API key is not configured."
            : "Failed to generate structured response from model.",
          details: modelErr.message
        },
        { status: isConfigError ? 500 : 502 }
      );
    }

    // Step 4: Persist in SQLite DB
    try {
      await saveMessageToDB(sessionId, "user", cleanMessage);
      await saveMessageToDB(
        sessionId,
        "assistant",
        validatedData.answer,
        validatedData.claims
      );
    } catch (saveErr) {
      console.error("Failed to save message to database:", saveErr);
      // Still return validatedData even if persistence had a transient issue
    }

    // Step 5: Return 200 OK NutritionAssistantResponse JSON
    return NextResponse.json(validatedData, { status: 200 });
  } catch (error: any) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      { error: "Server error processing request.", details: error.message },
      { status: 500 }
    );
  }
}
