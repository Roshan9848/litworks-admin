import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { getAuthUser } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Allow public requests (e.g. from main website) to display active packages.
    // If adminMode is true, we authenticate the admin user to show inactive plans.
    const { searchParams } = new URL(req.url);
    const adminMode = searchParams.get("adminMode") === "true";
    
    const query: any = {};
    if (!adminMode) {
      query.status = "active";
    } else {
      const user = getAuthUser(req);
      if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const packages = await Package.find(query).sort({ category: 1, price: 1 });
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    console.error("Packages GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Founder can create packages
    if (user.role !== "FOUNDER") {
      return NextResponse.json({ success: false, error: "Forbidden: Only the Founder can manage packages" }, { status: 403 });
    }

    const body = await req.json();
    const { title, price, discountPrice, description, features, serviceType, isBestseller, category } = body;

    if (!title || !price || !description || !serviceType || !category) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const newPackage = await Package.create({
      title,
      price,
      discountPrice,
      description,
      features,
      serviceType,
      isBestseller: !!isBestseller,
      category,
      status: "active",
    });

    await AuditLog.create({
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      action: "Create Package",
      newValue: newPackage,
    });

    return NextResponse.json({ success: true, package: newPackage });
  } catch (error: any) {
    console.error("Packages POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
