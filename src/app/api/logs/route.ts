import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Founder and Co-founder can access audit logs
    if (user.role !== "FOUNDER" && user.role !== "CO-FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "100");

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("AuditLogs GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
