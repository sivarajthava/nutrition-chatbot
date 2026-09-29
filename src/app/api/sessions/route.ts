import { NextRequest, NextResponse } from "next/server";
import { listSessions, deleteSession, prisma } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const sessions = await listSessions();
    const formatted = sessions.map((s) => ({
      id: s.id,
      title: s.title || "Nutrition Chat",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastMessage: s.messages[0]?.content || "No messages yet"
    }));

    return NextResponse.json({ sessions: formatted }, { headers: corsHeaders });
  } catch (error: any) {
    console.warn("GET /api/sessions DB unavailable:", error?.message);
    return NextResponse.json(
      { sessions: [], warning: "Database unavailable" },
      { headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newSessionId = body.sessionId || `session-${Date.now()}`;
    const title = body.title || "New Nutrition Chat";

    const session = await prisma.session.create({
      data: {
        id: newSessionId,
        title
      }
    });

    return NextResponse.json({ session }, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, title } = body;

    if (!sessionId || typeof title !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid sessionId or title parameter" },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const updated = await prisma.session.update({
        where: { id: sessionId },
        data: { title: title.trim(), updatedAt: new Date() }
      });
      return NextResponse.json({ success: true, session: updated }, { headers: corsHeaders });
    } catch (dbErr: any) {
      console.warn("PATCH /api/sessions DB warning:", dbErr?.message);
      return NextResponse.json(
        {
          success: true,
          session: {
            id: sessionId,
            title: title.trim(),
            updatedAt: new Date().toISOString()
          }
        },
        { headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("PATCH /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to update session", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400, headers: corsHeaders }
      );
    }

    await deleteSession(sessionId);
    return NextResponse.json({ success: true, deletedSessionId: sessionId }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("DELETE /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to delete session", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
