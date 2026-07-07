import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, error: "Please enter email, passcode, and new password" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: false, error: "No account found with this email" }, { status: 404 });
    }

    if (!user.otp || !user.otpExpires) {
      return NextResponse.json({ success: false, error: "No active reset request found" }, { status: 400 });
    }

    // Verify OTP expiry
    if (new Date() > new Date(user.otpExpires)) {
      return NextResponse.json({ success: false, error: "Passcode has expired. Please request a new one." }, { status: 400 });
    }

    // Verify OTP match
    if (user.otp !== otp.trim()) {
      return NextResponse.json({ success: false, error: "Invalid passcode" }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user record and clear OTP fields
    user.passwordHash = passwordHash;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Passcode updated successfully. You can now login.",
    });
  } catch (error: any) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
