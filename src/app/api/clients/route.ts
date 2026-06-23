import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const clients = await Client.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    console.error("Clients GET error:", error);
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

    const body = await req.json();
    const { name, phone, email, companyName, notes } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const client = await Client.create({
      name,
      phone,
      email,
      companyName,
      notes,
    });

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: "Create Client",
      newValue: client,
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("Clients POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
