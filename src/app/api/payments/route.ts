import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["FOUNDER", "CO-FOUNDER", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const payments = await Payment.find()
      .populate("clientId", "name email companyName")
      .populate("bookingId", "orderId name email service")
      .sort({ createdAt: -1 });

    const bookings = await Booking.find().sort({ createdAt: -1 });

    const paymentTxIds = new Set(payments.map((p) => p.transactionId).filter(Boolean));

    const bookingTxList: any[] = [];

    bookings.forEach((b: any) => {
      if (b.transactionId && paymentTxIds.has(b.transactionId)) return;

      let amt = b.paymentConfirmedAmount || 0;
      if (!amt || amt <= 0) {
        const totalStr = b.dynamicFields?.calculatedTotalPrice || b.dynamicFields?.bookingDepositPaid;
        if (totalStr) {
          const parsed = parseFloat(totalStr.toString().replace(/[^0-9.]/g, ""));
          if (!isNaN(parsed) && parsed > 0) amt = parsed;
        }
      }

      bookingTxList.push({
        _id: b._id,
        transactionId: b.transactionId || b.orderId || `TX_${b._id.toString().slice(-6)}`,
        orderId: b.orderId,
        clientName: b.name,
        clientEmail: b.email,
        clientPhone: b.phone,
        service: b.dynamicFields?.planTitle || b.service || "Booking Service",
        amount: amt,
        currency: "INR",
        paymentMethod: b.transactionId?.startsWith("cf_") ? "Cashfree PG" : b.paymentStatus === "paid" ? "Online PG / UPI" : "Pending Payment",
        status: b.paymentStatus === "paid" ? "captured" : b.paymentStatus === "failed" ? "failed" : "pending",
        createdAt: b.paymentConfirmedAt || b.createdAt
      });
    });

    const combined = [
      ...payments.map((p: any) => ({
        _id: p._id,
        transactionId: p.transactionId || p.invoiceId || `TX_${p._id.toString().slice(-6)}`,
        orderId: p.bookingId?.orderId || p.invoiceId || "",
        clientName: p.clientId?.name || p.bookingId?.name || "Client",
        clientEmail: p.clientId?.email || p.bookingId?.email || "",
        clientPhone: "",
        service: p.bookingId?.service || "Package Payment",
        amount: p.amount,
        currency: p.currency || "INR",
        paymentMethod: p.paymentMethod || "Cashfree PG",
        status: p.status || "captured",
        createdAt: p.createdAt
      })),
      ...bookingTxList
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, payments: combined });
  } catch (error: any) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
