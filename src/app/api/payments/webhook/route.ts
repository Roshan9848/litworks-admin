import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Notification from "@/models/Notification";
import AuditLog from "@/models/AuditLog";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const razorpaySignature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && razorpaySignature) {
      // Validate Razorpay webhook signature
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("Razorpay Webhook Secret or Signature missing. Processing without verification.");
    }

    const event = body.event;
    
    // Process captured or paid webhook events
    if (event === "payment.captured" || event === "order.paid" || body.mock_status === "paid") {
      const paymentEntity = body.payload?.payment?.entity || body;
      const razorpayOrderId = paymentEntity.order_id || body.order_id;
      const razorpayPaymentId = paymentEntity.id || body.payment_id || `pay_${Date.now()}`;
      const rawAmount = paymentEntity.amount || body.amount || 0;
      const amountPaid = event === "payment.captured" || event === "order.paid" ? Number(rawAmount) / 100 : Number(rawAmount);

      // Find booking by orderId
      const booking = await Booking.findOne({
        $or: [{ orderId: razorpayOrderId }, { orderId: body.order_id }],
      });

      if (booking) {
        booking.paymentStatus = "paid";
        booking.transactionId = razorpayPaymentId;
        booking.paymentConfirmedAmount = amountPaid;
        booking.paymentConfirmedAt = new Date();
        await booking.save();

        // Create Payment record
        const payment = await Payment.create({
          transactionId: razorpayPaymentId,
          bookingId: booking._id,
          packageName: booking.dynamicFields?.planTitle || booking.service,
          amount: amountPaid,
          gst: Math.round((amountPaid - amountPaid / 1.18) * 100) / 100, // 18% GST
          status: "captured",
          gateway: "Razorpay",
        });

        // Notify Founder
        await Notification.create({
          type: "payment",
          title: "Payment Received",
          message: `Payment of ₹${amountPaid.toLocaleString("en-IN")} received for Booking ${booking.name} (Order ID: ${booking.orderId}).`,
          referenceId: payment._id.toString(),
        });

        await AuditLog.create({
          userName: "System / Webhook",
          userEmail: "webhook@litworks.media",
          action: "Process Webhook Payment",
          newValue: { booking, payment },
        });

        return NextResponse.json({ success: true, message: "Payment processed successfully" });
      } else {
        console.warn(`Booking with order ID ${razorpayOrderId} not found.`);
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, message: "Unhandled event type" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
