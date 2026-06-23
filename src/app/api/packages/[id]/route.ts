import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
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

    // Only Founder can modify packages
    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Only the Founder can manage packages" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const pkg = await Package.findById(id);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    const oldVal = JSON.parse(JSON.stringify(pkg));

    // Update fields
    const allowedFields = ["title", "price", "discountPrice", "description", "features", "serviceType", "isBestseller", "category", "status"];
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        pkg[field] = body[field];
      }
    });

    await pkg.save();

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Update Package ${id}`,
      oldValue: oldVal,
      newValue: pkg,
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error: any) {
    console.error("Package PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Founder can delete packages
    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Only the Founder can manage packages" }, { status: 403 });
    }

    const { id } = await params;
    const pkg = await Package.findByIdAndDelete(id);

    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: `Delete Package ${id}`,
      oldValue: pkg,
    });

    return NextResponse.json({ success: true, message: "Package deleted successfully" });
  } catch (error: any) {
    console.error("Package DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
