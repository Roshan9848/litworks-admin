import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    
    const query: any = {};
    if (clientId) query.clientId = clientId;

    // Workload Isolation: Editors, videographers, photographers, interns only see their assigned projects
    if (user.role !== "FOUNDER" && user.role !== "CO-FOUNDER" && user.role !== "MANAGER") {
      query.assignedTeam = user.userId;
    }

    const projects = await Project.find(query)
      .populate("clientId", "name email phone companyName")
      .populate("assignedTeam", "name email role")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("Projects GET error:", error);
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

    // Co-Founders, Founders, and Managers can create projects
    if (
      user.role !== "FOUNDER" &&
      user.role !== "CO-FOUNDER" &&
      user.role !== "MANAGER"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, clientId, bookingId, assignedTeam, deadline } = body;

    if (!title || !clientId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const project = await Project.create({
      title,
      clientId,
      bookingId,
      assignedTeam: assignedTeam || [],
      deadline,
      status: "Pending",
    });

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: "Create Project",
      newValue: project,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
