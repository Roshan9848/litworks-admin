"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Target,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Failed to fetch dashboard metrics");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Loading Analytics Pipeline...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 border border-neutral-900 bg-neutral-950 rounded-2xl text-center max-w-md mx-auto my-12">
        <p className="text-red-500 font-bold mb-2">Error Loading Dashboard</p>
        <p className="text-xs text-neutral-400 mb-4">{error || "Data not available"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-bold uppercase rounded-lg hover:border-brand-orange text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, charts } = data;

  const COLORS = ["#FF7A00", "#FF9E40", "#FFC180", "#FFDAB3", "#402000", "#904800"];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (data.isEmployee) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">
              Creator <span className="text-brand-orange">Console</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
              Your Personal Deliveries, Completed Shoots & Earnings Summary
            </p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-900 text-[10px] font-mono text-neutral-400">
              Session: Active
            </div>
          </div>
        </div>

        {/* Grid: Employee-style KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Completed Projects */}
          <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                  Completed Shoots
                </p>
                <h3 className="text-2xl font-black mt-2 text-white font-sans">
                  {data.metrics.completedProjectsCount}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
              <span>All deliverables uploaded successfully</span>
            </div>
          </div>

          {/* Active Projects */}
          <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                  Active Shoots
                </p>
                <h3 className="text-2xl font-black mt-2 text-white font-sans">
                  {data.metrics.activeProjectsCount}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
              <span>Ongoing filming & editing workloads</span>
            </div>
          </div>

          {/* Total Money Earned */}
          <div className="relative group overflow-hidden bg-brand-orange/5 border border-brand-orange/25 hover:border-brand-orange/50 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/10 rounded-bl-full blur-2xl transition-all" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-brand-orange/80 uppercase tracking-widest font-mono">
                  Earnings (30% Share)
                </p>
                <h3 className="text-2xl font-black mt-2 text-white font-mono">
                  {formatCurrency(data.metrics.totalMoneyEarned)}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-brand-orange text-black">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-brand-orange font-mono font-bold uppercase tracking-wider">
              <span>Payable upon complete project closure</span>
            </div>
          </div>
        </div>

        {/* Recent Assigned Projects List */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-900 pb-3 mb-4">
            Recent Work Assignments
          </h3>
          {data.recentProjects.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider py-8 text-center">
              No project assignments found in registry
            </p>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">Project Title</th>
                    <th className="pb-3">Work Status</th>
                    <th className="pb-3">Deadline</th>
                    <th className="pb-3">Deliverables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/60 text-[11px] font-mono text-neutral-300">
                  {data.recentProjects.map((proj: any) => (
                    <tr key={proj._id} className="hover:bg-neutral-900/20 transition-colors">
                      <td className="py-3.5 font-bold text-white max-w-xs truncate">{proj.title}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          proj.status === "Completed"
                            ? "bg-emerald-950/20 text-emerald-450 border border-emerald-900/40"
                            : proj.status === "Editing"
                            ? "bg-amber-950/20 text-amber-450 border border-amber-900/40"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-neutral-450">
                        {proj.deadline ? new Date(proj.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No deadline"}
                      </td>
                      <td className="py-3.5 text-neutral-450">{proj.deliverablesCount} Uploads</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Operational <span className="text-brand-orange">Metrics</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Stripe-Style Financial & Project KPI Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-900 text-[10px] font-mono text-neutral-400">
            Auto-refresh: Active
          </div>
        </div>
      </div>

      {/* Grid: Stripe-style KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Revenue */}
        <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Total Revenue
              </p>
              <h3 className="text-2xl font-black mt-2 text-white">
                {formatCurrency(metrics.totalRevenue)}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% from launch</span>
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Revenue This Month
              </p>
              <h3 className="text-2xl font-black mt-2 text-white">
                {formatCurrency(metrics.revenueThisMonth)}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pacing ahead of last month</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                CRM Lead Conversion
              </p>
              <h3 className="text-2xl font-black mt-2 text-white">
                {metrics.conversionRate}%
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
            <span>{metrics.totalLeads} total leads captured</span>
          </div>
        </div>

        {/* Active Clients */}
        <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Active Clients
              </p>
              <h3 className="text-2xl font-black mt-2 text-white font-sans">
                {metrics.activeClients}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
            <span>High retention rate</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Active Projects
              </p>
              <h3 className="text-2xl font-black mt-2 text-white">
                {metrics.activeProjects}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
            <span>Assigned to current production crew</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="relative group overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Total Leads Captured
              </p>
              <h3 className="text-2xl font-black mt-2 text-white">
                {metrics.totalLeads}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
            <span>Steady flow of incoming inquiries</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Growth Area Chart */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between h-[340px] shadow-xl">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Revenue Growth Trend</h4>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Last 6 Months Income Breakdown</p>
            </div>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF7A00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" stroke="#525252" fontSize={10} tickLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF7A00" strokeWidth={2} fillOpacity={1} fill="url(#revenueGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Conversion Status distribution */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between h-[340px] shadow-xl">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Lead Pipeline Stages</h4>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Total counts across the sales funnel</p>
            </div>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.leadConversion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                    formatter={(val: any) => [val, "Leads"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {charts.leadConversion.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Package performance Pie Chart */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between h-[340px] shadow-xl">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Bookings by Package</h4>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Distribution of popular service plans</p>
            </div>
            <div className="flex-grow flex items-center justify-center text-xs relative">
              {charts.packagePerformance.length === 0 ? (
                <div className="text-neutral-500 uppercase tracking-widest text-[10px] font-mono">No booking logs found</div>
              ) : (
                <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-1/2 h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                          formatter={(val: any) => [val, "Paid Bookings"]}
                        />
                        <Pie
                          data={charts.packagePerformance}
                          dataKey="bookings"
                          nameKey="package"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {charts.packagePerformance.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full max-h-[180px] overflow-y-auto no-scrollbar space-y-1.5">
                    {charts.packagePerformance.map((entry: any, index: number) => (
                      <div key={entry.package} className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-neutral-300 truncate max-w-[120px]">{entry.package}</span>
                        </div>
                        <span className="text-white font-bold">{entry.bookings} ({entry.bookings === 0 ? 0 : Math.round((entry.bookings / charts.packagePerformance.reduce((a: any, b: any) => a + b.bookings, 0)) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Bookings Line Chart */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between h-[340px] shadow-xl">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Monthly Booking Volume</h4>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Quantity of sessions booked over time</p>
            </div>
            <div className="flex-grow w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyBookings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" stroke="#525252" fontSize={10} tickLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", borderRadius: "12px", color: "#fff" }}
                    formatter={(val: any) => [val, "Bookings"]}
                  />
                  <Line type="monotone" dataKey="bookings" stroke="#FF7A00" strokeWidth={2} dot={{ fill: "#FF7A00", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
