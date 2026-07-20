"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Gift,
  Plus,
  Search,
  Download,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  X,
  Percent,
  Loader2,
  ExternalLink,
  ChevronRight,
  Trash2
} from "lucide-react";

interface PaymentTransaction {
  _id: string;
  transactionId: string;
  clientId?: {
    name: string;
    email: string;
    companyName?: string;
  };
  bookingId?: {
    _id: string;
    orderId: string;
    name: string;
    email: string;
    service: string;
  };
  packageName?: string;
  amount: number;
  gst: number;
  status: "captured" | "failed" | "pending" | "refunded";
  gateway: "Cashfree" | "Razorpay";
  createdAt: string;
}

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed" | "referral";
  value: number;
  usageCount: number;
  usageLimit?: number;
  revenueGenerated: number;
  expiryDate?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function BillingManagementPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ledgers" | "coupons">("ledgers");

  // Search filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [couponSearch, setCouponSearch] = useState("");

  // Modals state
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");

  // Form states
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percentage" as Coupon["type"],
    value: "",
    usageLimit: "",
    expiryDate: ""
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      if (d.success) setCurrentUser(d.user);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const [paymentsRes, couponsRes, bookingsRes] = await Promise.all([
        fetch(`/api/payments?_t=${timestamp}`),
        fetch(`/api/coupons?_t=${timestamp}`),
        fetch(`/api/bookings?_t=${timestamp}`)
      ]);

      const paymentsData = await paymentsRes.json();
      const couponsData = await couponsRes.json();
      const bookingsData = await bookingsRes.json();

      if (paymentsData.success) setPayments(paymentsData.payments);
      if (couponsData.success) setCoupons(couponsData.coupons);
      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
        if (bookingsData.bookings.length > 0 && !selectedBookingId) {
          setSelectedBookingId(bookingsData.bookings[0]._id);
        }
      }
    } catch (e) {
      console.error("Error loading billing data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can create coupon codes.");
      return;
    }

    setLoading(true);
    const payload = {
      ...couponForm,
      value: Number(couponForm.value),
      usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
      expiryDate: couponForm.expiryDate ? new Date(couponForm.expiryDate) : undefined
    };

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCouponModal(false);
        setCouponForm({ code: "", type: "percentage", value: "", usageLimit: "", expiryDate: "" });
        fetchData();
      } else {
        alert(data.error || "Failed to create coupon code");
      }
    } catch (err: any) {
      alert(err.message || "Error creating coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can delete coupon codes.");
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this coupon code? It will cease working immediately.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/coupons?id=${couponId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete coupon code");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (bookingId: string, orderId: string) => {
    try {
      const res = await fetch(`/api/invoices/${bookingId}/pdf`);
      if (!res.ok) throw new Error("Invoice download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_LIT-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Failed to download tax invoice PDF.");
    }
  };

  // Filters
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (p.clientId && p.clientId.name.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
      (p.bookingId && p.bookingId.name.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
      (p.bookingId && p.bookingId.orderId.toLowerCase().includes(ledgerSearch.toLowerCase()));

    return matchesSearch;
  });

  const filteredCoupons = coupons.filter((c) => {
    return c.code.toLowerCase().includes(couponSearch.toLowerCase());
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Loading Financial Registry...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Billing & <span className="text-brand-orange">Invoices</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Track client transaction ledger balances and manage campaign coupon codes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-brand-orange text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4 text-brand-orange" />
            <span>Generate Booking Invoice</span>
          </button>
          {activeTab === "coupons" && currentUser?.role === "FOUNDER" && (
            <button
              onClick={() => setShowAddCouponModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Coupon</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-900">
        <button
          onClick={() => setActiveTab("ledgers")}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "ledgers" ? "border-brand-orange text-brand-orange" : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          Transaction Ledgers ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "coupons" ? "border-brand-orange text-brand-orange" : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          Campaign Coupon Engine ({coupons.length})
        </button>
      </div>

      {/* LEDGERS TAB */}
      {activeTab === "ledgers" && (
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex gap-4 shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by transaction ID, client name, order reference..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    <th className="py-4 px-6">Transaction ID</th>
                    <th className="py-4 px-6">Client / Booking</th>
                    <th className="py-4 px-6">Gateway</th>
                    <th className="py-4 px-6">GST (18%) Portion</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Invoice PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono uppercase tracking-widest">
                        No transactions captured in search query
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const clientName = p.clientId?.name || p.bookingId?.name || "System Booking";
                      const clientEmail = p.clientId?.email || p.bookingId?.email || "";
                      return (
                        <tr key={p._id} className="hover:bg-neutral-905/30 transition-colors group">
                          <td className="py-4.5 px-6 font-mono text-neutral-300">
                            {p.transactionId}
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="font-bold text-white">{clientName}</div>
                            <span className="text-[9px] text-neutral-500 font-mono">{clientEmail}</span>
                          </td>
                          <td className="py-4.5 px-6 font-mono text-neutral-400">
                            {p.gateway}
                          </td>
                          <td className="py-4.5 px-6 font-mono text-neutral-400">
                            {formatCurrency(p.gst)}
                          </td>
                          <td className="py-4.5 px-6 font-bold text-white font-mono">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
                              p.status === "captured"
                                ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40"
                                : p.status === "failed"
                                ? "bg-red-950/20 text-red-400 border-red-900/40"
                                : "bg-neutral-900 text-neutral-400 border-neutral-850"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            {p.bookingId ? (
                              <button
                                onClick={() => handleDownloadInvoice(p.bookingId!._id, p.bookingId!.orderId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-brand-orange text-neutral-400 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3 text-brand-orange" />
                                <span>TAX PDF</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-600 font-mono italic">No Linked Order</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex gap-4 shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search active campaign coupons by code..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCoupons.length === 0 ? (
              <div className="col-span-full py-12 text-center text-neutral-500 font-mono uppercase tracking-widest border border-dashed border-neutral-900 rounded-2xl">
                No active coupon campaigns found
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="bg-neutral-950 border border-neutral-900 hover:border-brand-orange/45 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-brand-orange" />
                        <h4 className="text-sm font-black tracking-widest text-white uppercase font-mono">{coupon.code}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUser?.role === "FOUNDER" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="text-neutral-605 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                          coupon.status === "active" ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/20" : "bg-red-950/20 text-red-500 border border-red-900/20"
                        }`}>
                          {coupon.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[10px] font-mono text-neutral-400 border-t border-neutral-900 pt-4">
                      <div className="flex justify-between">
                        <span>DISCOUNT VALUE</span>
                        <span className="text-white font-bold">
                          {coupon.type === "percentage" ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value)} OFF`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>CAMPAIGN USAGE</span>
                        <span className="text-white font-bold">
                          {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : "usages"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>REVENUE GENERATED</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(coupon.revenueGenerated)}</span>
                      </div>
                      {coupon.expiryDate && (
                        <div className="flex justify-between">
                          <span>EXPIRY DATE</span>
                          <span className="text-neutral-500 font-bold">{new Date(coupon.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: ADD COUPON */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowAddCouponModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              Generate <span className="text-brand-orange">Promo Code</span>
            </h3>

            <form onSubmit={handleAddCouponSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LITFEST20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange uppercase font-mono tracking-widest"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Discount Type *</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as Coupon["type"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (INR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10 or 500"
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited if empty"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Deploy Campaign Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: GENERATE INVOICE FROM BOOKING */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
              Generate Booking <span className="text-brand-orange">Tax Invoice</span>
            </h3>
            <p className="text-[10px] text-neutral-400 uppercase font-mono mb-6">
              Select any client booking to generate an official LITWORKS PDF Tax Invoice
            </p>

            {bookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                No active bookings found in database.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
                    Select Client Booking *
                  </label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange font-mono cursor-pointer"
                  >
                    {bookings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.orderId} — {b.name} ({b.service}) — {b.dynamicFields?.calculatedTotalPrice || "₹0"}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const sel = bookings.find((b) => b._id === selectedBookingId) || bookings[0];
                  if (!sel) return null;
                  const confirmedAmt = sel.paymentConfirmedAmount || parseFloat((sel.dynamicFields?.calculatedTotalPrice || "999").replace(/[^0-9.]/g, "")) || 999;
                  const basePrice = Math.round((confirmedAmt / 1.18) * 100) / 100;
                  const gstPrice = Math.round((confirmedAmt - basePrice) * 100) / 100;

                  return (
                    <div className="bg-black border border-neutral-900 rounded-2xl p-4 space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-neutral-900 pb-2">
                        <span className="text-neutral-500">CLIENT</span>
                        <span className="text-white font-bold">{sel.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-900 pb-2">
                        <span className="text-neutral-500">SERVICE</span>
                        <span className="text-brand-orange font-bold">{sel.service}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-900 pb-2">
                        <span className="text-neutral-500">BASE PRICE</span>
                        <span className="text-white">INR {basePrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-900 pb-2">
                        <span className="text-neutral-500">18% GST (CGST+SGST)</span>
                        <span className="text-white">INR {gstPrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-neutral-400 font-bold">TOTAL INVOICE AMOUNT</span>
                        <span className="text-emerald-400 font-black text-sm">INR {confirmedAmt.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = bookings.find((b) => b._id === selectedBookingId) || bookings[0];
                      if (sel) handleDownloadInvoice(sel._id, sel.orderId);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(255,122,0,0.3)]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Tax Invoice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
