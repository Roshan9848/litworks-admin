import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
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

    const { id } = await params;
    const body = await req.json();

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const oldVal = JSON.parse(JSON.stringify(lead));
    
    // Update fields
    const updatedFields = ["name", "phone", "email", "businessName", "service", "status", "notes"];
    updatedFields.forEach((field) => {
      if (body[field] !== undefined) {
        lead[field] = body[field];
      }
    });

    await lead.save();

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Update Lead ${id}`,
      oldValue: oldVal,
      newValue: lead,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Lead PATCH error:", error);
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

    // Co-founder and Founder have access, Managers cannot delete leads
    if (user.role !== "FOUNDER" && user.role !== "CO-FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Delete Lead ${id}`,
      oldValue: lead,
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error("Lead DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
