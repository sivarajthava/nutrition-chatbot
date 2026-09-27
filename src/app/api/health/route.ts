import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const provider = "groq";

  return NextResponse.json(
    {
      status: "online",
      service: "AI Nutrition Assistant Prototype",
      version: "0.1.0",
      milestone: "Milestone 1 (Parametric Baseline)",
      provider,
      model,
      guardrails: "active",
      timestamp: new Date().toISOString()
    },
    { headers: corsHeaders }
  );
}
