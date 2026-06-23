"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Search,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
} from "lucide-react";

interface AuditLog {
  _id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
}

export default function AuditTrailLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs?limit=100");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.error || "Failed to load audit logs");
      }
    } catch (err: any) {
      setError(err.message || "Failed to query logs API");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(term);
    const userMatch =
      (log.userName && log.userName.toLowerCase().includes(term)) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(term));
    return actionMatch || userMatch;
  });

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Loading Audit Trail logs...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-neutral-900 bg-neutral-950 rounded-2xl text-center max-w-md mx-auto my-12 animate-fadeIn">
        <div className="flex justify-center mb-3">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-red-500 font-bold mb-2">Access Denied / Error</p>
        <p className="text-xs text-neutral-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-bold uppercase rounded-lg hover:border-brand-orange text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">
          System <span className="text-brand-orange">Audit Trail Logs</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
          Trace security events, state transitions, package updates, and user modifications
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex gap-4 shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Filter logs by operator name, email or event action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Logs Registry */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-neutral-900 bg-neutral-950 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-orange" />
            <span>Trace History (Last 100 entries)</span>
          </h3>
          <span className="text-[10px] font-mono text-neutral-400">
            {filteredLogs.length} matching logs
          </span>
        </div>

        <div className="divide-y divide-neutral-900 max-h-[600px] overflow-y-auto no-scrollbar">
          {filteredLogs.length === 0 ? (
            <p className="text-center text-neutral-500 font-mono text-xs uppercase tracking-widest py-12">
              No audit logs match filter
            </p>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log._id;
              const hasDiff = log.oldValue || log.newValue;
              return (
                <div key={log._id} className="p-4 hover:bg-neutral-900/10 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 text-neutral-400 mt-0.5">
                        <Activity className="w-3.5 h-3.5 text-brand-orange" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-snug">{log.action}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[9px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userName || "System"} ({log.userEmail || "system@litworks.media"})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasDiff && (
                      <button
                        onClick={() => toggleExpandLog(log._id)}
                        className="self-end sm:self-center flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-brand-orange text-neutral-400 hover:text-white text-[9px] font-bold uppercase transition-colors cursor-pointer"
                      >
                        <span>Inspect Payload</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON diff */}
                  {isExpanded && hasDiff && (
                    <div className="mt-4 p-4 rounded-2xl bg-black border border-neutral-900 overflow-x-auto text-[10px] font-mono space-y-3">
                      {log.oldValue && (
                        <div>
                          <span className="block text-[8px] text-red-500 uppercase font-bold mb-1">(-) Pre-State Payload</span>
                          <pre className="text-neutral-500 bg-red-950/5 border border-red-950/15 p-2 rounded-lg max-h-40 overflow-y-auto no-scrollbar">
                            {JSON.stringify(log.oldValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <span className="block text-[8px] text-emerald-400 uppercase font-bold mb-1">(+) Post-State Payload</span>
                          <pre className="text-neutral-400 bg-emerald-950/5 border border-emerald-950/15 p-2 rounded-lg max-h-40 overflow-y-auto no-scrollbar">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
