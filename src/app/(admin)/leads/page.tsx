"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  X,
  Phone,
  Mail,
  Building,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email: string;
  businessName?: string;
  service: string;
  source: string;
  notes?: string;
  status: "New" | "Contacted" | "Interested" | "Proposal Sent" | "Won" | "Lost";
  convertedToClientId?: string;
  createdAt: string;
  updatedAt: string;
}

const STAGES: { key: Lead["status"]; label: string; color: string; bg: string; border: string }[] = [
  { key: "New", label: "New Leads", color: "text-blue-400", bg: "bg-blue-950/20", border: "border-blue-900/30" },
  { key: "Contacted", label: "Contacted", color: "text-amber-400", bg: "bg-amber-950/20", border: "border-amber-900/30" },
  { key: "Interested", label: "Interested", color: "text-purple-400", bg: "bg-purple-950/20", border: "border-purple-900/30" },
  { key: "Proposal Sent", label: "Proposal", color: "text-pink-400", bg: "bg-pink-950/20", border: "border-pink-900/30" },
  { key: "Won", label: "Won", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-900/30" },
  { key: "Lost", label: "Lost", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-900/30" }
];

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"pipeline" | "table">("pipeline");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("All");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    businessName: "",
    service: "Video Production",
    notes: "",
    status: "New" as Lead["status"]
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
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

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      } else {
        setError(data.error || "Failed to load CRM leads");
      }
    } catch (err: any) {
      setError(err.message || "Failed to query leads API");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        resetForm();
        fetchLeads();
      } else {
        alert(data.error || "Failed to create lead");
      }
    } catch (err: any) {
      alert(err.message || "Error creating lead");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedLead(null);
        resetForm();
        fetchLeads();
      } else {
        alert(data.error || "Failed to update lead");
      }
    } catch (err: any) {
      alert(err.message || "Error updating lead");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToClient = async (leadId: string) => {
    if (!confirm("Are you sure you want to convert this lead to a Client? This will create a permanent Client record and set lead status to Won.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        alert("Successfully converted lead to client!");
        fetchLeads();
        setShowEditModal(false);
      } else {
        alert(data.error || "Conversion failed");
      }
    } catch (err: any) {
      alert(err.message || "Error converting lead");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead? This action is permanent and will be logged in the audit trail.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        setShowEditModal(false);
      } else {
        alert(data.error || "Failed to delete lead");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting lead");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      businessName: "",
      service: "Video Production",
      notes: "",
      status: "New"
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      businessName: lead.businessName || "",
      service: lead.service,
      notes: lead.notes || "",
      status: lead.status
    });
    setShowEditModal(true);
  };

  const updateLeadStatusQuick = async (lead: Lead, status: Lead["status"]) => {
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filters
  const filteredLeads = leads.filter((lead) => {
    const name = lead.name || "";
    const email = lead.email || "";
    const phone = lead.phone || "";
    const businessName = lead.businessName || "";
    const service = lead.service || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService = selectedService === "All" || lead.service === selectedService;

    return matchesSearch && matchesService;
  });

  const servicesList = ["All", ...Array.from(new Set(leads.map((l) => l.service)))];

  if (loading && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Loading Leads Pipeline...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Leads <span className="text-brand-orange">CRM Pipeline</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Track inquiries, convert opportunities, and scale client relationships
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Capture Manual Lead</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
            >
              {servicesList.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-850">
          <button
            onClick={() => setViewMode("pipeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              viewMode === "pipeline" ? "bg-brand-orange text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              viewMode === "table" ? "bg-brand-orange text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Pipeline View (Kanban Board) */}
      {viewMode === "pipeline" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4 no-scrollbar">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.key);
            return (
              <div key={stage.key} className="flex flex-col min-w-[220px] bg-neutral-950/40 border border-neutral-900 rounded-2xl p-4 h-[600px] overflow-hidden shadow-sm">
                {/* Column Title */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.color.replace("text-", "bg-")}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-neutral-900/60 rounded-xl text-neutral-600 text-[10px] font-mono uppercase">
                      Empty Stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        onClick={() => openEditModal(lead)}
                        className={`group relative p-4 bg-neutral-950 border border-neutral-850 hover:border-brand-orange/40 rounded-xl cursor-pointer shadow-md transition-all duration-300 hover:shadow-[0_4px_20px_rgba(255,122,0,0.05)]`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-[11px] font-extrabold text-white truncate max-w-[120px]">
                            {lead.name}
                          </h4>
                          <span className="text-[8px] bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[70px]">
                            {lead.service}
                          </span>
                        </div>

                        {lead.businessName && (
                          <p className="text-[9px] text-neutral-400 mt-1 font-medium italic truncate">
                            {lead.businessName}
                          </p>
                        )}

                        <p className="text-[9px] text-neutral-500 mt-3 truncate font-mono">
                          {lead.email}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-900/50 pt-2 text-[8px] font-mono text-neutral-600">
                          <span>{lead.source}</span>
                          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Contact info</th>
                  <th className="py-4 px-6">Company</th>
                  <th className="py-4 px-6">Service Required</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Created On</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono uppercase tracking-widest">
                      No CRM records match search query
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const currentStage = STAGES.find((s) => s.key === lead.status);
                    return (
                      <tr key={lead._id} className="hover:bg-neutral-900/30 transition-colors group">
                        <td className="py-4.5 px-6">
                          <div className="font-bold text-white">{lead.name}</div>
                          <span className="text-[9px] text-neutral-500 font-mono">Source: {lead.source}</span>
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-neutral-300 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-neutral-600" />
                              {lead.email}
                            </span>
                            <span className="text-neutral-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-neutral-600" />
                              {lead.phone}
                            </span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-neutral-400 font-medium italic">
                          {lead.businessName || "—"}
                        </td>
                        <td className="py-4.5 px-6">
                          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-850 text-[10px] text-brand-orange uppercase font-bold tracking-wider">
                            {lead.service}
                          </span>
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider border ${currentStage?.bg} ${currentStage?.color} ${currentStage?.border}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-neutral-400 font-mono">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-brand-orange text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: ADD LEAD */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              Capture <span className="text-brand-orange">CRM Opportunity</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Business/Company</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Target Service *</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Video Production">Video Production</option>
                    <option value="Wedding Videography">Wedding Videography</option>
                    <option value="Corporate Ads">Corporate Ads</option>
                    <option value="Commercial Photography">Commercial Photography</option>
                    <option value="Creative Director Consultation">Creative Consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Starting Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead["status"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Opportunity Notes</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange resize-none"
                  placeholder="Details about client needs, project scope, estimate requirements..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: EDIT / CONVERT LEAD */}
      {showEditModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedLead(null);
              }}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              Opportunity <span className="text-brand-orange">Profile Editor</span>
            </h3>

            {/* Quick Actions (Convert/Delete) */}
            <div className="flex flex-wrap gap-2.5 border-b border-neutral-900 pb-5 mb-5">
              {selectedLead.status !== "Won" && (
                <button
                  onClick={() => handleConvertToClient(selectedLead._id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-950/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Convert to Client</span>
                </button>
              )}

              {selectedLead.convertedToClientId && (
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] font-mono font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CONVERTED CLIENT ID: {selectedLead.convertedToClientId.slice(-6)}</span>
                </span>
              )}

              {(currentUser?.role === "FOUNDER" || currentUser?.role === "CO-FOUNDER") && (
                <button
                  onClick={() => handleDeleteLead(selectedLead._id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/20 border border-red-900/40 hover:bg-red-950/40 text-red-500 text-[10px] font-bold uppercase tracking-wider cursor-pointer ml-auto transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Lead Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Business/Company</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Target Service</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Video Production">Video Production</option>
                    <option value="Wedding Videography">Wedding Videography</option>
                    <option value="Corporate Ads">Corporate Ads</option>
                    <option value="Commercial Photography">Commercial Photography</option>
                    <option value="Creative Director Consultation">Creative Consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Pipeline Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead["status"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Opportunity Notes</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLead(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
