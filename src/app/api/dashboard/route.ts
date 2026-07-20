import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import Project from "@/models/Project";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is a standard crew employee (Videographer, Photographer, Editor, Intern)
    const isEmployee = !["FOUNDER", "CO-FOUNDER", "MANAGER"].includes(user.role);

    if (isEmployee) {
      const mongoose = require("mongoose");
      const userObjectId = new mongoose.Types.ObjectId(user.userId);

      // Find all projects assigned to this user
      const employeeProjects = await Project.find({ assignedTeam: userObjectId }).populate("bookingId");

      const completedProjects = employeeProjects.filter((p) => p.status === "Completed");
      const activeProjectsCount = employeeProjects.filter((p) => p.status !== "Completed").length;
      const completedProjectsCount = completedProjects.length;

      // Calculate money earned (30% commission of the project's booking price)
      let totalMoneyEarned = 0;
      for (const proj of completedProjects) {
        let priceVal = 2500; // Base fallback rate per completed project
        if (proj.bookingId && typeof proj.bookingId === "object") {
          const booking: any = proj.bookingId;
          const totalStr = booking.dynamicFields?.calculatedTotalPrice || booking.dynamicFields?.bookingDepositPaid;
          if (totalStr) {
            const parsed = parseFloat(totalStr.toString().replace(/[^0-9.]/g, ""));
            if (!isNaN(parsed) && parsed > 0) {
              priceVal = Math.round(parsed * 0.3); // 30% flat commission rate
            }
          }
        }
        totalMoneyEarned += priceVal;
      }

      // Recent assigned projects
      const recentProjects = employeeProjects
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((p) => ({
          _id: p._id,
          title: p.title,
          status: p.status,
          deadline: p.deadline,
          deliverablesCount: p.deliverables?.length || 0,
        }));

      return NextResponse.json({
        success: true,
        isEmployee: true,
        metrics: {
          completedProjectsCount,
          activeProjectsCount,
          totalMoneyEarned,
        },
        recentProjects,
      });
    }

    // 1. Core KPIs (For Founder, Co-Founder, Manager)
    const payments = await Payment.find({ status: "captured" });
    const paidBookings = await Booking.find({ paymentStatus: "paid" });

    // Payment Transaction IDs to avoid double counting if recorded in both collections
    const paymentTxIds = new Set(payments.map((p) => p.transactionId).filter(Boolean));

    let totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPayments = payments.filter((p) => new Date(p.createdAt) >= startOfMonth);
    let revenueThisMonth = thisMonthPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Sum revenue from paid bookings
    paidBookings.forEach((b) => {
      if (b.transactionId && paymentTxIds.has(b.transactionId)) return;

      let amt = b.paymentConfirmedAmount || 0;
      if (!amt || amt <= 0) {
        const totalStr = b.dynamicFields?.calculatedTotalPrice || b.dynamicFields?.bookingDepositPaid;
        if (totalStr) {
          const parsed = parseFloat(totalStr.toString().replace(/[^0-9.]/g, ""));
          if (!isNaN(parsed) && parsed > 0) amt = parsed;
        }
      }

      totalRevenue += amt;

      const bookingDate = new Date(b.paymentConfirmedAt || b.createdAt || Date.now());
      if (bookingDate >= startOfMonth) {
        revenueThisMonth += amt;
      }
    });

    // Active Clients (Unique clients across Client collection + paid/active Bookings)
    const clientCount = await Client.countDocuments();
    const uniqueBookingClients = await Booking.distinct("email", { email: { $exists: true, $ne: "" } });
    const activeClients = Math.max(clientCount, uniqueBookingClients.length);

    // Booking KPIs
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ bookingStatus: { $ne: "Completed" } });

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

    paidBookings.forEach((b) => {
      if (b.transactionId && paymentTxIds.has(b.transactionId)) return;
      let amt = b.paymentConfirmedAmount || 0;
      if (!amt || amt <= 0) {
        const totalStr = b.dynamicFields?.calculatedTotalPrice || b.dynamicFields?.bookingDepositPaid;
        if (totalStr) {
          const parsed = parseFloat(totalStr.toString().replace(/[^0-9.]/g, ""));
          if (!isNaN(parsed) && parsed > 0) amt = parsed;
        }
      }

      const date = new Date(b.paymentConfirmedAt || b.createdAt || Date.now());
      const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyRevenueMap[key] !== undefined) {
        monthlyRevenueMap[key] += amt;
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
    const bookings = await Booking.find();
    const packagePerformanceMap: { [key: string]: number } = {};
    bookings.forEach((b) => {
      const title = b.dynamicFields?.planTitle || b.service || "Standard Service";
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
        totalBookings,
        activeBookings,
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
