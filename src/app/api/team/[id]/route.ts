import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

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

    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const teamMember = await User.findById(id);
    if (!teamMember) {
      return NextResponse.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    const oldVal = JSON.parse(JSON.stringify(teamMember));
    delete oldVal.passwordHash;

    if (body.name) teamMember.name = body.name;
    if (body.role) teamMember.role = body.role;
    if (body.phone) teamMember.phone = body.phone;
    if (body.status) teamMember.status = body.status;

    await teamMember.save();

    const newVal = JSON.parse(JSON.stringify(teamMember));
    delete newVal.passwordHash;

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Update Team Member ${id}`,
      oldValue: oldVal,
      newValue: newVal,
    });

    return NextResponse.json({ success: true, user: newVal });
  } catch (error: any) {
    console.error("Team PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { id } = await params;
    
    // Prevent Founder from deleting themselves
    if (id === user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot delete your own founder account" }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    const userRes = JSON.parse(JSON.stringify(deletedUser));
    delete userRes.passwordHash;

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Delete Team Member ${id}`,
      oldValue: userRes,
    });

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (error: any) {
    console.error("Team DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
