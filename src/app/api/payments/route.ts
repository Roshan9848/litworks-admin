import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Founder and Co-Founder can view payments/billing details
    if (user.role !== "FOUNDER" && user.role !== "CO-FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const payments = await Payment.find()
      .populate("clientId", "name email companyName")
      .populate("bookingId", "orderId name email service")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
