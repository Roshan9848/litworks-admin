import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

export async function POST(
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
    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (lead.convertedToClientId) {
      return NextResponse.json({ success: false, error: "Lead has already been converted to a client" }, { status: 400 });
    }

    // Create the Client
    const newClient = await Client.create({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      companyName: lead.businessName || "",
      sourceLeadId: lead._id,
      notes: lead.notes || `Converted from Lead. Service interest: ${lead.service}`,
    });

    // Update Lead Status
    lead.status = "Won";
    lead.convertedToClientId = newClient._id;
    await lead.save();

    // Log Action
    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Convert Lead ${id} to Client ${newClient._id}`,
      newValue: { client: newClient, lead },
    });

    // Notify Founder
    await Notification.create({
      type: "lead",
      title: "Lead Converted to Client",
      message: `Lead ${lead.name} has been successfully converted into client ${newClient.name} by ${user.name}.`,
      referenceId: newClient._id.toString(),
    });

    return NextResponse.json({ success: true, client: newClient, lead });
  } catch (error: any) {
    console.error("Lead conversion error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
