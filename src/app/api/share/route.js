import { NextResponse } from "next/server";
import { buildShareUrl } from "@/lib/shareConstants";
import { createOrUpdateSharedNote, revokeSharedNote } from "@/lib/sharedNotes";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createOrUpdateSharedNote({
      note: body?.note,
      shareId: body?.shareId,
      manageToken: body?.manageToken,
      expiresInHours: body?.expiresInHours,
    });

    return NextResponse.json({
      success: true,
      shareId: result.shareId,
      manageToken: result.manageToken,
      expiresAt: result.expiresAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      url: buildShareUrl(request.nextUrl.origin, result.shareId),
    });
  } catch (error) {
    console.error("Share create/update error:", error);
    return NextResponse.json({ error: error.message || "Failed to create share link." }, { status: error.status || 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    await revokeSharedNote({
      shareId: body?.shareId,
      manageToken: body?.manageToken,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share revoke error:", error);
    return NextResponse.json({ error: error.message || "Failed to revoke share link." }, { status: error.status || 500 });
  }
}
