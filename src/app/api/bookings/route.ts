import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

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
    if (status) query.bookingStatus = status;

    const bookings = await Booking.find(query)
      .populate("assignedTeam", "name email role")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Allow public requests (e.g. from main website) to create booking orders
    const body = await req.json();
    const { name, phone, email, state, city, service, notes, dynamicFields, orderId } = body;

    if (!name || !phone || !email || !service || !orderId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const booking = await Booking.create({
      orderId,
      name,
      phone,
      email,
      state,
      city,
      service,
      notes,
      dynamicFields,
      paymentStatus: "pending",
      bookingStatus: "Pending",
    });

    // Notify Founder
    await Notification.create({
      type: "booking",
      title: "New Booking Received",
      message: `A new booking has been placed by ${name} for ${service} (Order ID: ${orderId}).`,
      referenceId: booking._id.toString(),
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Bookings POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
