import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WebsiteContent from "@/models/WebsiteContent";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const contents = await WebsiteContent.find();
    return NextResponse.json({ success: true, contents });
  } catch (error: any) {
    console.error("CMS GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const body = await req.json();
    const { sectionKey, content } = body;

    if (!sectionKey || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Update if exists, else create
    const updatedContent = await WebsiteContent.findOneAndUpdate(
      { sectionKey },
      { content },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Update CMS ${sectionKey}`,
      newValue: updatedContent,
    });

    return NextResponse.json({ success: true, content: updatedContent });
  } catch (error: any) {
    console.error("CMS POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
