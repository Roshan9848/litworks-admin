"use client";

import { useEffect, useState, useMemo, useDeferredValue } from "react";
import {
  Calendar,
  Search,
  User,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  FileCheck,
  X,
  Loader2,
  Users,
  CheckCircle,
  Clock,
  Download
} from "lucide-react";

interface Booking {
  _id: string;
  orderId: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  service: string;
  notes?: string;
  dynamicFields: {
    preferredDate?: string;
    timeSlot?: string;
    shootArea?: string;
    eventType?: string;
    extraHourRequested?: string;
    calculatedTotalPrice?: string;
    planTitle?: string;
    bookingDepositPaid?: string;
  };
  paymentStatus: "pending" | "paid" | "failed" | "custom_pending";
  transactionId?: string;
  paymentConfirmedAmount?: number;
  paymentConfirmedAt?: string;
  assignedTeam: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
  bookingStatus: "Pending" | "Confirmed" | "Scheduled" | "Editing" | "Delivered" | "Completed";
  createdAt: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const BOOKING_STATUSES = ["Pending", "Confirmed", "Scheduled", "Editing", "Delivered", "Completed"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "custom_pending"];

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Assignment states
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Link generation states
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const generateCustomPaymentLink = async (booking: Booking) => {
    setGeneratingLink(true);
    setGeneratedLink("");

    try {
      const priceVal = parseFloat(
        booking.dynamicFields?.calculatedTotalPrice?.toString().replace(/[^0-9.]/g, "") ||
        booking.dynamicFields?.bookingDepositPaid?.toString().replace(/[^0-9.]/g, "") ||
        "0"
      );

      const payload = {
        title: `Custom Package - ${booking.name}`,
        price: priceVal || 2999,
        description: `Custom package for ${booking.service} shoot requested by ${booking.name}.`,
        serviceType: booking.service || "Video Production",
        category: "custom",
        isBestseller: false,
        features: [
          `Service: ${booking.service}`,
          `Client: ${booking.name}`,
          `Date: ${booking.dynamicFields?.preferredDate || "TBD"}`,
          `Time Slot: ${booking.dynamicFields?.timeSlot || "TBD"}`
        ]
      };

      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.package) {
        const link = `https://litworks.media/pricing?packageId=${data.package._id}`;
        setGeneratedLink(link);
      } else {
        alert(data.error || "Failed to generate proposal package");
      }
    } catch (err: any) {
      alert(err.message || "Error generating payment link");
    } finally {
      setGeneratingLink(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTeam();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (e) {
      console.error("Failed to load bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success) {
        setTeam(data.team);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (bookingId: string, bookingStatus: string) => {
    const originalBookings = [...bookings];
    const originalSelected = selectedBooking ? { ...selectedBooking } : null;

    // Optimistically update UI state instantly
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, bookingStatus: bookingStatus as Booking["bookingStatus"] } : b))
    );
    if (selectedBooking?._id === bookingId) {
      setSelectedBooking((prev: any) => ({ ...prev, bookingStatus }));
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to update status");
        setBookings(originalBookings);
        if (originalSelected) setSelectedBooking(originalSelected);
      }
    } catch (err: any) {
      alert(err.message || "Error updating booking status");
      setBookings(originalBookings);
      if (originalSelected) setSelectedBooking(originalSelected);
    }
  };

  const handlePaymentStatusChange = async (bookingId: string, paymentStatus: string) => {
    const originalBookings = [...bookings];
    const originalSelected = selectedBooking ? { ...selectedBooking } : null;

    // Optimistically update UI state instantly
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: paymentStatus as Booking["paymentStatus"] } : b))
    );
    if (selectedBooking?._id === bookingId) {
      setSelectedBooking((prev: any) => ({ ...prev, paymentStatus }));
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to update payment status");
        setBookings(originalBookings);
        if (originalSelected) setSelectedBooking(originalSelected);
      }
    } catch (err: any) {
      alert(err.message || "Error updating payment status");
      setBookings(originalBookings);
      if (originalSelected) setSelectedBooking(originalSelected);
    }
  };

  const handleAssignTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTeam: selectedTeamIds
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAssignModal(false);
        fetchBookings().then(() => {
          const updated = bookings.find((b) => b._id === selectedBooking._id);
          if (updated) setSelectedBooking(updated);
        });
      } else {
        alert(data.error || "Failed to assign crew");
      }
    } catch (err: any) {
      alert(err.message || "Error updating crew assignment");
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamSelection = (userId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredBookings = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();
    return bookings.filter((b) => {
      const name = b.name || "";
      const email = b.email || "";
      const orderId = b.orderId || "";
      const service = b.service || "";
      const phone = b.phone || "";
      const city = b.city || "";
      const state = b.state || "";
      const planTitle = b.dynamicFields?.planTitle || "";

      const matchesSearch =
        !term ||
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        orderId.toLowerCase().includes(term) ||
        service.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        city.toLowerCase().includes(term) ||
        state.toLowerCase().includes(term) ||
        planTitle.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "All" || b.bookingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, deferredSearchTerm, statusFilter]);

  const formatCurrency = (val?: string) => {
    if (!val) return "—";
    const num = parseFloat(val.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return val;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      alert("No bookings available to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Client Name",
      "Phone",
      "Email",
      "State",
      "City",
      "Service",
      "Plan Title",
      "Shoot Area / Event",
      "Total Price",
      "Deposit Paid",
      "Payment Status",
      "Booking Status",
      "Created Date"
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.orderId || ""}"`,
      `"${b.name || ""}"`,
      `"${b.phone || ""}"`,
      `"${b.email || ""}"`,
      `"${b.state || ""}"`,
      `"${b.city || ""}"`,
      `"${b.service || ""}"`,
      `"${b.dynamicFields?.planTitle || ""}"`,
      `"${b.dynamicFields?.shootArea || b.dynamicFields?.eventType || ""}"`,
      `"${b.dynamicFields?.calculatedTotalPrice || ""}"`,
      `"${b.dynamicFields?.bookingDepositPaid || ""}"`,
      `"${b.paymentStatus || ""}"`,
      `"${b.bookingStatus || ""}"`,
      `"${new Date(b.createdAt).toLocaleString("en-IN")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Litworks_Bookings_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Loading Booking Registry...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Client <span className="text-brand-orange">Bookings</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Manage session schedules, payment statuses, and assign production crew workloads
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-xl bg-brand-orange text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by client, service, order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange px-3 py-2 rounded-xl text-xs text-white focus:outline-none transition-colors font-mono"
          >
            <option value="All">All Statuses</option>
            {BOOKING_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <th className="py-4 px-6">Client & Order ID</th>
                <th className="py-4 px-6">Service & Plan</th>
                <th className="py-4 px-6">Event Date / Area</th>
                <th className="py-4 px-6">Total Price</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6">Booking Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-xs">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono uppercase tracking-widest">
                    No bookings found in database
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b._id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setShowDetailsModal(true);
                    }}
                    className="hover:bg-neutral-900/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-4.5 px-6">
                      <div className="font-bold text-white group-hover:text-brand-orange transition-colors">{b.name}</div>
                      <span className="text-[9px] text-neutral-500 font-mono">ORDER: {b.orderId}</span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-semibold text-neutral-200">{b.service}</div>
                      <span className="text-[9px] text-brand-orange uppercase font-bold tracking-wider">
                        {b.dynamicFields.planTitle || "Custom Plan"}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-mono text-neutral-300">
                        {b.dynamicFields.preferredDate || "Not Scheduled"}
                      </div>
                      <span className="text-[9px] text-neutral-500 font-mono">
                        {b.city}, {b.state}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 font-bold text-white font-mono">
                      {formatCurrency(b.dynamicFields.calculatedTotalPrice)}
                    </td>
                    <td className="py-4.5 px-6">
                      <span
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        <select
                          value={b.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(b._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors bg-black ${
                            b.paymentStatus === "paid"
                              ? "border-emerald-900 text-emerald-400"
                              : b.paymentStatus === "failed"
                              ? "border-red-900 text-red-400"
                              : b.paymentStatus === "custom_pending"
                              ? "border-brand-orange text-brand-orange"
                              : "border-neutral-800 text-neutral-400"
                          }`}
                        >
                          {PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.toUpperCase().replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <span
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        <select
                          value={b.bookingStatus}
                          onChange={(e) => handleStatusChange(b._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors bg-black ${
                            b.bookingStatus === "Completed"
                              ? "border-emerald-905 text-emerald-400"
                              : b.bookingStatus === "Delivered"
                              ? "border-blue-900 text-blue-400"
                              : b.bookingStatus === "Editing"
                              ? "border-purple-900 text-purple-400"
                              : "border-neutral-800 text-neutral-400"
                          }`}
                        >
                          {BOOKING_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right font-mono text-[10px] text-neutral-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: BOOKING DETAILS */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedBooking(null);
                setGeneratedLink("");
              }}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
              Booking <span className="text-brand-orange">Detailed Invoice</span>
            </h3>
            <p className="text-[10px] text-neutral-400 uppercase font-mono mb-6">
              Order ID: {selectedBooking.orderId}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Client contact & preferences */}
              <div className="space-y-4">
                <div className="bg-black border border-neutral-900 p-4.5 rounded-2xl">
                  <h4 className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest mb-3">Client Contact info</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <User className="w-4 h-4 text-brand-orange" />
                      <span>{selectedBooking.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300 font-mono">
                      <Mail className="w-4 h-4 text-neutral-600" />
                      <span>{selectedBooking.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300 font-mono">
                      <Phone className="w-4 h-4 text-neutral-600" />
                      <span>{selectedBooking.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-neutral-300 font-mono mt-1 pt-1.5 border-t border-neutral-900">
                      <MapPin className="w-4 h-4 text-neutral-600 mt-0.5" />
                      <span>
                        {selectedBooking.city}, {selectedBooking.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black border border-neutral-900 p-4.5 rounded-2xl">
                  <h4 className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest mb-3">Shoot Specifications</h4>
                  <div className="space-y-2 text-[11px] font-mono text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">SERVICE TYPE</span>
                      <span className="text-white font-bold">{selectedBooking.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">PLAN PACKAGE</span>
                      <span className="text-brand-orange font-bold">{selectedBooking.dynamicFields.planTitle || "Custom"}</span>
                    </div>
                    {selectedBooking.dynamicFields.eventType && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">EVENT SUBTYPE</span>
                        <span className="text-white">{selectedBooking.dynamicFields.eventType}</span>
                      </div>
                    )}
                    {selectedBooking.dynamicFields.preferredDate && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">DATE</span>
                        <span className="text-white">{selectedBooking.dynamicFields.preferredDate}</span>
                      </div>
                    )}
                    {selectedBooking.dynamicFields.timeSlot && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">TIME SLOT</span>
                        <span className="text-white">{selectedBooking.dynamicFields.timeSlot}</span>
                      </div>
                    )}
                    {selectedBooking.dynamicFields.shootArea && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">SHOOT AREA</span>
                        <span className="text-white">{selectedBooking.dynamicFields.shootArea}</span>
                      </div>
                    )}
                    {selectedBooking.dynamicFields.extraHourRequested && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">EXTRA HOURS</span>
                        <span className="text-white">{selectedBooking.dynamicFields.extraHourRequested}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Billing details & Staff Assignment */}
              <div className="space-y-4">
                <div className="bg-black border border-neutral-900 p-4.5 rounded-2xl">
                  <h4 className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest mb-3">Invoicing Summary</h4>
                  <div className="space-y-2 text-[11px] font-mono text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">PLAN TOTAL</span>
                      <span className="text-white font-bold">{formatCurrency(selectedBooking.dynamicFields.calculatedTotalPrice)}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900 pb-2">
                      <span className="text-neutral-500">DEPOSIT PAID</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(selectedBooking.dynamicFields.bookingDepositPaid)}</span>
                    </div>
                    {selectedBooking.transactionId && (
                      <div className="flex flex-col gap-0.5 pt-2">
                        <span className="text-neutral-500 text-[8px] uppercase">Transaction Reference</span>
                        <span className="text-white text-[10px] truncate">{selectedBooking.transactionId}</span>
                      </div>
                    )}
                  </div>

                  {selectedBooking.paymentStatus === "pending" && (
                    <div className="mt-4 border-t border-neutral-900 pt-4">
                      <button
                        type="button"
                        onClick={() => generateCustomPaymentLink(selectedBooking)}
                        disabled={generatingLink}
                        className="w-full py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        {generatingLink ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Generate Payment Link"
                        )}
                      </button>

                      {generatedLink && (
                        <div className="mt-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-900 flex items-center justify-between gap-2">
                          <input
                            type="text"
                            readOnly
                            value={generatedLink}
                            className="bg-black border border-neutral-850 px-2.5 py-1.5 rounded-lg text-[9px] text-white flex-1 focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedLink);
                              alert("Payment link copied to clipboard!");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-white text-black text-[9px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-black border border-neutral-900 p-4.5 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Assigned Crew</h4>
                    <button
                      onClick={() => {
                        setSelectedTeamIds(selectedBooking.assignedTeam.map((t) => t._id));
                        setShowAssignModal(true);
                      }}
                      className="text-[9px] font-bold uppercase text-brand-orange hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> Manage Crew
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {selectedBooking.assignedTeam.length === 0 ? (
                      <p className="text-[10px] text-neutral-600 italic py-2 font-mono">No crew members assigned to this booking yet</p>
                    ) : (
                      selectedBooking.assignedTeam.map((member) => (
                        <div
                          key={member._id}
                          className="flex justify-between items-center p-2 rounded bg-neutral-950 border border-neutral-900 text-[10px]"
                        >
                          <span className="font-bold text-white">{member.name}</span>
                          <span className="text-brand-orange uppercase text-[8px] font-mono">{member.role}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="mt-5 p-3 rounded-2xl bg-black border border-neutral-900 text-[11px] text-neutral-400 italic">
                <span className="block text-[8px] font-bold text-neutral-600 uppercase tracking-widest not-italic mb-1">Inquiry details / notes</span>
                {selectedBooking.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: ASSIGN TEAM */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1">
              Assign <span className="text-brand-orange">Staff Crew</span>
            </h3>
            <p className="text-[9px] text-neutral-400 uppercase font-mono mb-6">
              Assign videographers, editors, and photographers to booking (Order ID: {selectedBooking.orderId})
            </p>

            <form onSubmit={handleAssignTeamSubmit} className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar bg-black border border-neutral-850 p-3 rounded-xl">
                {team.map((member) => {
                  const isChecked = selectedTeamIds.includes(member._id);
                  return (
                    <div
                      key={member._id}
                      onClick={() => toggleTeamSelection(member._id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-brand-orange/10 border-brand-orange text-white font-bold"
                          : "bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white"
                      }`}
                    >
                      <div>
                        <p>{member.name}</p>
                        <span className="text-[8px] text-neutral-500 uppercase font-mono">{member.role}</span>
                      </div>
                      {isChecked && <CheckCircle className="w-4 h-4 text-brand-orange" />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Save Crew Workload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
