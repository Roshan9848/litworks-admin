import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Please enter your email address" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't explicitly leak that email doesn't exist, but here since it's a closed admin panel, it is fine to return helpful errors
      return NextResponse.json({ success: false, error: "No account found with this email" }, { status: 404 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ success: false, error: "This account is inactive. Please contact Founder." }, { status: 403 });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save to user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send email to the main corporate inbox (litworks.media@gmail.com)
    await sendOTPEmail("litworks.media@gmail.com", otp, user.email);

    return NextResponse.json({
      success: true,
      message: "Passcode sent to litworks.media@gmail.com",
    });
  } catch (error: any) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
