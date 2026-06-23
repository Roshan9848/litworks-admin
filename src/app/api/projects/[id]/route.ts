import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Role safety check: Managers, Co-founders, and Founders can update anything.
    // Editors, Photographers, Videographers can ONLY update status and add deliverables
    const isTeamMember =
      user.role === "EDITOR" ||
      user.role === "PHOTOGRAPHER" ||
      user.role === "VIDEOGRAPHER" ||
      user.role === "INTERN";

    if (isTeamMember) {
      // Limit changes
      const allowedFields = ["status", "deliverable"];
      const requestedFields = Object.keys(body);
      const isAllowed = requestedFields.every((f) => allowedFields.includes(f));
      if (!isAllowed) {
        return NextResponse.json({ success: false, error: "Forbidden: Team members can only update project status and deliverables" }, { status: 403 });
      }
    }

    const oldVal = JSON.parse(JSON.stringify(project));

    // Update fields
    if (body.title && !isTeamMember) project.title = body.title;
    if (body.status) {
      project.status = body.status;
      if (body.status === "Completed") {
        // Send alert to Founder when project is completed
        await Notification.create({
          type: "project",
          title: "Project Completed",
          message: `Project "${project.title}" has been marked as Completed by ${user.name}.`,
          referenceId: project._id.toString(),
        });
      }
    }
    if (body.deadline && !isTeamMember) project.deadline = body.deadline;
    if (body.assignedTeam && !isTeamMember) project.assignedTeam = body.assignedTeam;
    
    // Add deliverable
    if (body.deliverable) {
      project.deliverables.push({
        name: body.deliverable.name,
        url: body.deliverable.url,
        uploadedAt: new Date(),
      });
    }

    await project.save();

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Update Project ${id}`,
      oldValue: oldVal,
      newValue: project,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Project PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await Project.findById(id)
      .populate("clientId", "name email phone companyName")
      .populate("assignedTeam", "name email role");

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Project GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
