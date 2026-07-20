import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import InvoiceTemplate from "@/models/InvoiceTemplate";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const templates = await InvoiceTemplate.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Templates GET error:", error);
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

    if (user.role !== "FOUNDER" && user.role !== "CO-FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { templateName, companyName, companyAddress, gstin, email, phone, footerNotes, isDefault } = body;

    if (!templateName || !companyName || !companyAddress || !gstin || !email || !phone) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // If setting default, unset others first
    if (isDefault) {
      await InvoiceTemplate.updateMany({}, { isDefault: false });
    }

    const template = await InvoiceTemplate.create({
      templateName,
      companyName,
      companyAddress,
      gstin,
      email,
      phone,
      footerNotes,
      isDefault: !!isDefault
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Templates POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing template ID" }, { status: 400 });
    }

    await InvoiceTemplate.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Templates DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
