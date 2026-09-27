import { NextRequest, NextResponse } from "next/server";
import { getSessionHistory } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400, headers: corsHeaders }
      );
    }

    const messages = await getSessionHistory(sessionId);
    return NextResponse.json({ sessionId, messages }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("API /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session history", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
