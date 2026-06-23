import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
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
    const status = searchParams.get("status");
    const query: any = {};
    if (status) query.status = status;

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Allow public requests (e.g. from main website forms) to this API endpoint
    const body = await req.json();
    const { name, phone, email, businessName, service, source, notes } = body;

    if (!name || !phone || !email || !service) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const newLead = await Lead.create({
      name,
      phone,
      email,
      businessName,
      service,
      source: source || "Website Form",
      notes,
      status: "New",
    });

    const user = getAuthUser(req);
    await AuditLog.create({
      userId: user ? user.userId : undefined,
      userName: user ? user.name : "System / Website",
      userEmail: user ? user.email : "system@litworks.media",
      action: "Create Lead",
      newValue: newLead,
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error("Leads POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
