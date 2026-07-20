import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import InvoiceTemplate from "@/models/InvoiceTemplate";
import PDFDocument from "pdfkit";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
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
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const template = await InvoiceTemplate.findOne({ isDefault: true });

    const companyName = template?.companyName || "LitWorks Media Agency";
    const companyAddress = template?.companyAddress || "Madhapur, Hyderabad, Telangana, 500081";
    const gstin = template?.gstin || "36AAACL8901D1Z5";
    const email = template?.email || "billing@litworks.media";
    const phone = template?.phone || "+91 9110797354";

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Collect PDF chunks into buffer array
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on("error", (err) => reject(err));
    });

    // --- Draw PDF Content ---
    // Title
    doc.fillColor("#000000").fontSize(18).text("TAX INVOICE", { align: "right" });
    
    // Branding
    doc.fillColor("#FF7A00").fontSize(24).text("LITWORKS", 50, 50, { lineGap: 5 });
    doc.fillColor("#555555").fontSize(10).text("Creative Media & Marketing Agency", 50, 75);
    
    // Company details
    doc.fillColor("#000000").fontSize(9).text(companyName, 50, 100);
    doc.text(companyAddress);
    doc.text(`GSTIN: ${gstin}`);
    doc.text(`Email: ${email} | Phone: ${phone}`);
    
    // Invoice Metadata
    doc.text(`Invoice No: LIT-${booking._id.toString().substring(18).toUpperCase()}`, 350, 100);
    doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString("en-IN")}`, 350, 115);
    doc.text(`Order ID: ${booking.orderId}`, 350, 130);
    doc.text(`Status: PAID`, 350, 145);

    doc.moveTo(50, 170).lineTo(550, 170).strokeColor("#DDDDDD").stroke();

    // Client Details (Bill To)
    doc.fillColor("#555555").fontSize(10).text("BILL TO:", 50, 185);
    doc.fillColor("#000000").fontSize(11).text(booking.name, 50, 200);
    doc.fontSize(9).text(`Phone: ${booking.phone}`);
    doc.text(`Email: ${booking.email}`);
    doc.text(`Location: ${booking.city}, ${booking.state}`);

    doc.moveTo(50, 245).lineTo(550, 245).strokeColor("#DDDDDD").stroke();

    // Table Header
    doc.fillColor("#555555").fontSize(10);
    doc.text("Description", 50, 260);
    doc.text("Qty", 350, 260, { width: 50, align: "right" });
    doc.text("Rate", 400, 260, { width: 70, align: "right" });
    doc.text("Amount", 480, 260, { width: 70, align: "right" });

    doc.moveTo(50, 275).lineTo(550, 275).strokeColor("#FF7A00").stroke();

    // Table Content
    doc.fillColor("#000000").fontSize(10);
    const serviceName = `${booking.service} - ${booking.dynamicFields?.planTitle || "Booking Package"}`;
    doc.text(serviceName, 50, 290, { width: 280 });
    doc.text("1", 350, 290, { width: 50, align: "right" });

    // Math for GST (18%)
    const confirmedAmt = booking.paymentConfirmedAmount || 999;
    const basePrice = Math.round((confirmedAmt / 1.18) * 100) / 100;
    const gstPrice = Math.round((confirmedAmt - basePrice) * 100) / 100;

    doc.text(`INR ${basePrice.toLocaleString("en-IN")}`, 400, 290, { width: 70, align: "right" });
    doc.text(`INR ${basePrice.toLocaleString("en-IN")}`, 480, 290, { width: 70, align: "right" });

    doc.moveTo(50, 320).lineTo(550, 320).strokeColor("#DDDDDD").stroke();

    // Calculation Breakdown
    doc.fillColor("#555555");
    doc.text("Subtotal:", 380, 335, { width: 90, align: "right" });
    doc.fillColor("#000000");
    doc.text(`INR ${basePrice.toLocaleString("en-IN")}`, 480, 335, { width: 70, align: "right" });

    doc.fillColor("#555555");
    doc.text("CGST (9%):", 380, 350, { width: 90, align: "right" });
    doc.fillColor("#000000");
    doc.text(`INR ${(gstPrice / 2).toLocaleString("en-IN")}`, 480, 350, { width: 70, align: "right" });

    doc.fillColor("#555555");
    doc.text("SGST (9%):", 380, 365, { width: 90, align: "right" });
    doc.fillColor("#000000");
    doc.text(`INR ${(gstPrice / 2).toLocaleString("en-IN")}`, 480, 365, { width: 70, align: "right" });

    doc.moveTo(380, 385).lineTo(550, 385).strokeColor("#DDDDDD").stroke();

    // Total Paid
    doc.fillColor("#FF7A00").fontSize(12);
    doc.text("Total Paid:", 350, 395, { width: 120, align: "right" });
    doc.text(`INR ${confirmedAmt.toLocaleString("en-IN")}`, 480, 395, { width: 70, align: "right" });

    // Terms
    doc.fillColor("#888888").fontSize(8);
    if (template?.footerNotes) {
      doc.text(template.footerNotes, 50, 480);
    } else {
      doc.text("Note: This is an electronically generated tax invoice. No signature is required.", 50, 480);
      doc.text("Thank you for partnering with LITWORKS Media. We look forward to delivering epic content!", 50, 495);
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Blob([pdfBuffer as any], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Invoice_LIT-${booking.orderId}.pdf`,
      },
    });
  } catch (error: any) {
    console.error("Invoice PDF generation error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
