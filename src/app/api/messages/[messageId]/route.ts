import { NextRequest, NextResponse } from "next/server";
import { deleteMessageFromDB, updateMessageInDB } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await req.json().catch(() => ({}));
    const { content } = body;

    if (!messageId || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Invalid payload. 'content' is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const updated = await updateMessageInDB(messageId, content.trim());
    return NextResponse.json({ success: true, message: updated }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("PATCH /api/messages/[messageId] error:", error);
    return NextResponse.json(
      { error: "Failed to update message", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    if (!messageId) {
      return NextResponse.json(
        { error: "Missing messageId parameter" },
        { status: 400, headers: corsHeaders }
      );
    }

    await deleteMessageFromDB(messageId);
    return NextResponse.json({ success: true, deletedMessageId: messageId }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("DELETE /api/messages/[messageId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete message", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
