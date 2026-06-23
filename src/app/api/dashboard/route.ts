import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import Project from "@/models/Project";
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

    // 1. Core KPIs
    // Total Revenue
    const payments = await Payment.find({ status: "captured" });
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    // Revenue This Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPayments = payments.filter((p) => new Date(p.createdAt) >= startOfMonth);
    const revenueThisMonth = thisMonthPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Active Clients
    const activeClients = await Client.countDocuments();

    // Total Leads
    const totalLeads = await Lead.countDocuments();

    // Active Projects
    const activeProjects = await Project.countDocuments({ status: { $ne: "Completed" } });

    // Conversion Rate
    const wonLeads = await Lead.countDocuments({ status: "Won" });
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // 2. Charts Data
    // A. Revenue Growth (Last 6 Months)
    const monthlyRevenueMap: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthlyRevenueMap[key] = 0;
    }

    payments.forEach((p) => {
      const date = new Date(p.createdAt);
      const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyRevenueMap[key] !== undefined) {
        monthlyRevenueMap[key] += p.amount;
      }
    });

    const revenueGrowth = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // B. Lead Conversion Pipeline Stages
    const stages = ["New", "Contacted", "Interested", "Proposal Sent", "Won", "Lost"];
    const leadConversion = await Promise.all(
      stages.map(async (stage) => {
        const count = await Lead.countDocuments({ status: stage });
        return { name: stage, value: count };
      })
    );

    // C. Package Performance (Bookings count by service type)
    const bookings = await Booking.find({ paymentStatus: "paid" });
    const packagePerformanceMap: { [key: string]: number } = {};
    bookings.forEach((b) => {
      const title = b.dynamicFields?.planTitle || b.service;
      packagePerformanceMap[title] = (packagePerformanceMap[title] || 0) + 1;
    });

    const packagePerformance = Object.entries(packagePerformanceMap).map(([pkg, count]) => ({
      package: pkg,
      bookings: count,
    }));

    // D. Monthly Bookings (Last 6 Months)
    const monthlyBookingsMap: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthlyBookingsMap[key] = 0;
    }

    bookings.forEach((b) => {
      const date = new Date(b.createdAt);
      const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyBookingsMap[key] !== undefined) {
        monthlyBookingsMap[key] += 1;
      }
    });

    const monthlyBookings = Object.entries(monthlyBookingsMap).map(([month, bookings]) => ({
      month,
      bookings,
    }));

    // 3. Return JSON payload
    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue,
        revenueThisMonth,
        activeClients,
        totalLeads,
        activeProjects,
        conversionRate,
      },
      charts: {
        revenueGrowth,
        leadConversion,
        packagePerformance,
        monthlyBookings,
      },
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
