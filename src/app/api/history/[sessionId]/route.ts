import { NextRequest, NextResponse } from "next/server";
import { getSessionHistory } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    const messages = await getSessionHistory(sessionId);
    return NextResponse.json({ sessionId, messages }, { status: 200 });
  } catch (error: any) {
    console.error("API /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session history", details: error.message },
      { status: 500 }
    );
  }
}
