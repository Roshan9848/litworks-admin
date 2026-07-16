import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendWhatsAppOTP } from "@/lib/whatsapp";
import { sendOTPEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { loginId } = await req.json();

    if (!loginId) {
      return NextResponse.json({ success: false, error: "Please enter your email or phone number" }, { status: 400 });
    }

    const trimmedLogin = loginId.trim();

    // Query by either email or phone number
    const user = await User.findOne({
      $or: [
        { email: trimmedLogin.toLowerCase() },
        { phone: trimmedLogin }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "No creator account found with these details" }, { status: 404 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ success: false, error: "Your account is currently inactive. Contact Founder." }, { status: 403 });
    }

    if (!user.phone) {
      return NextResponse.json({
        success: false,
        error: "No WhatsApp phone number is registered for your account. Please ask Founder to add your phone number."
      }, { status: 400 });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP details to user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send WhatsApp OTP (Meta Cloud/UltraMsg/Mock)
    const sent = await sendWhatsAppOTP(user.phone, otp);
    if (!sent) {
      return NextResponse.json({ success: false, error: "Failed to dispatch WhatsApp message. Try again." }, { status: 500 });
    }

    // Email Backup Fallback - send OTP to owner inbox (litworks.media@gmail.com) so they are never locked out
    try {
      await sendOTPEmail("litworks.media@gmail.com", otp, user.email);
    } catch (mailError) {
      console.error("Backup OTP Email fallback failed:", mailError);
    }

    // Obfuscate phone number for safety feedback (e.g. +91 *******89)
    const phoneStr = user.phone;
    const obscured = phoneStr.length > 4 
      ? `*******${phoneStr.slice(-4)}`
      : phoneStr;

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to WhatsApp (${obscured})`,
      loginId: trimmedLogin
    });
  } catch (error: any) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
