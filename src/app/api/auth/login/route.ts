import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { loginId, otp } = await req.json();

    if (!loginId || !otp) {
      return NextResponse.json({ success: false, error: "Please enter email/phone and OTP passcode" }, { status: 400 });
    }

    const trimmedLogin = loginId.trim();

    // Query user by email or phone
    const user = await User.findOne({
      $or: [
        { email: trimmedLogin.toLowerCase() },
        { phone: trimmedLogin }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ success: false, error: "Account is inactive" }, { status: 401 });
    }

    // Verify OTP exists and matches
    if (!user.otp || !user.otpExpires) {
      return NextResponse.json({ success: false, error: "No active OTP session found. Please request a new code." }, { status: 401 });
    }

    // Check expiry
    if (new Date() > new Date(user.otpExpires)) {
      return NextResponse.json({ success: false, error: "OTP passcode has expired. Please request a new code." }, { status: 401 });
    }

    // Match OTP
    if (user.otp !== otp.trim()) {
      return NextResponse.json({ success: false, error: "Incorrect OTP passcode" }, { status: 401 });
    }

    // Clear OTP fields upon successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signJWT(payload);

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login verification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
