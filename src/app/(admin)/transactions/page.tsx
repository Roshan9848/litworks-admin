"use client";

import { useEffect, useState, useMemo, useDeferredValue } from "react";
import {
  CreditCard,
  Search,
  Download,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Receipt
} from "lucide-react";

interface TransactionItem {
  _id: string;
  transactionId: string;
  orderId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "captured" | "pending" | "failed";
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      if (data.success) {
        setTransactions(data.payments);
      }
    } catch (e) {
      console.error("Error fetching transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredTransactions = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();
    return transactions.filter((t) => {
      const txId = t.transactionId || "";
      const orderId = t.orderId || "";
      const name = t.clientName || "";
      const email = t.clientEmail || "";
      const service = t.service || "";

      const matchesSearch =
        !term ||
        txId.toLowerCase().includes(term) ||
        orderId.toLowerCase().includes(term) ||
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        service.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "All" || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, deferredSearchTerm, statusFilter]);

  const totalCapturedRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.status === "captured")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [transactions]);

  const successfulTxCount = useMemo(() => {
    return transactions.filter((t) => t.status === "captured").length;
  }, [transactions]);

  const avgOrderValue = useMemo(() => {
    return successfulTxCount > 0 ? Math.round(totalCapturedRevenue / successfulTxCount) : 0;
  }, [totalCapturedRevenue, successfulTxCount]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions available to export.");
      return;
    }

    const headers = [
      "Transaction ID",
      "Order ID",
      "Client Name",
      "Email",
      "Phone",
      "Service / Package",
      "Amount (INR)",
      "Payment Method",
      "Status",
      "Date & Time"
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.transactionId || ""}"`,
      `"${t.orderId || ""}"`,
      `"${t.clientName || ""}"`,
      `"${t.clientEmail || ""}"`,
      `"${t.clientPhone || ""}"`,
      `"${t.service || ""}"`,
      t.amount || 0,
      `"${t.paymentMethod || "Cashfree PG"}"`,
      `"${t.status.toUpperCase()}"`,
      `"${new Date(t.createdAt).toLocaleString("en-IN")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Litworks_Transactions_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-3">
            Transactions <span className="text-brand-orange">Ledger</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Cashfree PG Online Receipts, Payments & Financial Audit Records
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Total Captured Revenue
              </p>
              <h3 className="text-2xl font-black mt-2 text-white font-mono">
                {formatCurrency(totalCapturedRevenue)}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Successful Receipts
              </p>
              <h3 className="text-2xl font-black mt-2 text-white font-mono">
                {successfulTxCount}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Average Booking Value
              </p>
              <h3 className="text-2xl font-black mt-2 text-white font-mono">
                {formatCurrency(avgOrderValue)}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-950 p-4 border border-neutral-900 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by Client, Tx ID, Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-brand-orange font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-neutral-500 hidden sm:block" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
            {["All", "captured", "pending", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? "bg-brand-orange text-black shadow-[0_0_10px_rgba(255,122,0,0.3)]"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Loading Payment Ledger...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-mono">No transaction records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-900/40 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Tx ID / Order ID</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs font-mono">
                {filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white tracking-wider">{tx.transactionId}</p>
                      {tx.orderId && tx.orderId !== tx.transactionId && (
                        <p className="text-[10px] text-neutral-500 mt-0.5">{tx.orderId}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-neutral-200">{tx.clientName}</p>
                      {tx.clientEmail && <p className="text-[10px] text-neutral-500 truncate max-w-[160px]">{tx.clientEmail}</p>}
                    </td>
                    <td className="p-4 text-neutral-300 font-sans text-xs">{tx.service}</td>
                    <td className="p-4 font-bold text-white text-sm">
                      {formatCurrency(tx.amount || 0)}
                    </td>
                    <td className="p-4 text-neutral-400 text-[11px]">{tx.paymentMethod || "Cashfree PG"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                        tx.status === "captured"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50"
                          : tx.status === "pending"
                          ? "bg-amber-950/40 text-amber-400 border border-amber-900/50"
                          : "bg-red-950/40 text-red-400 border border-red-900/50"
                      }`}>
                        {tx.status === "captured" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
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
