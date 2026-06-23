import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export async function PATCH(
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
    const body = await req.json();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const oldVal = JSON.parse(JSON.stringify(booking));

    // Update fields
    if (body.assignedTeam) booking.assignedTeam = body.assignedTeam;
    if (body.bookingStatus) booking.bookingStatus = body.bookingStatus;
    if (body.paymentStatus) booking.paymentStatus = body.paymentStatus;
    if (body.transactionId) booking.transactionId = body.transactionId;

    await booking.save();

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Update Booking ${id}`,
      oldValue: oldVal,
      newValue: booking,
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Booking PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
