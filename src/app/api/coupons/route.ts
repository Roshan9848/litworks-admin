import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    // Public validation of coupon code (used by main website during checkout)
    if (code) {
      const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        status: "active",
        $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gt: new Date() } }],
      });

      if (!coupon) {
        return NextResponse.json({ success: false, error: "Invalid or expired coupon" }, { status: 404 });
      }

      if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ success: false, error: "Coupon usage limit reached" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
        },
      });
    }

    // Secured Admin List retrieval
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Coupons GET error:", error);
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

    // Only Founder can create coupons
    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const body = await req.json();
    const { code, type, value, expiryDate, usageLimit } = body;

    if (!code || !type || !value) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Coupon code already exists" }, { status: 400 });
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      expiryDate,
      usageLimit,
      status: "active",
    });

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: "Create Coupon",
      newValue: newCoupon,
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    console.error("Coupons POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
