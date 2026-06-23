"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  UserPlus,
  X,
  ExternalLink,
  ChevronRight,
  Loader2,
  Trash2,
  Edit2
} from "lucide-react";

interface Client {
  _id: string;
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  notes?: string;
  createdAt: string;
}

interface Project {
  _id: string;
  title: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  assignedTeam: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
  status: "Pending" | "Confirmed" | "Scheduled" | "Editing" | "Delivered" | "Completed";
  deadline?: string;
  deliverables: {
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  createdAt: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const PROJECT_STATUSES = ["Pending", "Confirmed", "Scheduled", "Editing", "Delivered", "Completed"];

export default function ClientsProjectsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clients" | "projects">("clients");

  // Search & Filter states
  const [clientSearch, setClientSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");

  // Modals state
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  const [selectedClientForProject, setSelectedClientForProject] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    notes: ""
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    clientId: "",
    assignedTeam: [] as string[],
    deadline: ""
  });

  const [deliverableForm, setDeliverableForm] = useState({
    name: "",
    url: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, projectsRes, teamRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/projects"),
        fetch("/api/team")
      ]);

      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();
      const teamData = await teamRes.json();

      if (clientsData.success) setClients(clientsData.clients);
      if (projectsData.success) setProjects(projectsData.projects);
      if (teamData.success) setTeam(teamData.team);
    } catch (e) {
      console.error("Error loading clients data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddClientModal(false);
        setClientForm({ name: "", phone: "", email: "", companyName: "", notes: "" });
        fetchData();
      } else {
        alert(data.error || "Failed to create client");
      }
    } catch (err: any) {
      alert(err.message || "Error creating client");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...projectForm,
      clientId: selectedClientForProject?._id || projectForm.clientId
    };
    if (!payload.clientId) return alert("Please select a client.");

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProjectModal(false);
        setProjectForm({ title: "", clientId: "", assignedTeam: [], deadline: "" });
        setSelectedClientForProject(null);
        fetchData();
      } else {
        alert(data.error || "Failed to create project");
      }
    } catch (err: any) {
      alert(err.message || "Error creating project");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, status: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local projects list
        setProjects((prev) =>
          prev.map((p) => (p._id === projectId ? { ...p, status: status as Project["status"] } : p))
        );
        if (selectedProject?._id === projectId) {
          setSelectedProject((p: any) => ({ ...p, status }));
        }
      } else {
        alert(data.error || "Failed to change status");
      }
    } catch (err: any) {
      alert(err.message || "Error updating project status");
    }
  };

  const handleAddDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable: deliverableForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowDeliverableModal(false);
        setDeliverableForm({ name: "", url: "" });
        // Refresh selected project details and data list
        fetchData().then(() => {
          const updated = projects.find((p) => p._id === selectedProject._id);
          if (updated) setSelectedProject(updated);
        });
      } else {
        alert(data.error || "Failed to add deliverable link");
      }
    } catch (err: any) {
      alert(err.message || "Error saving deliverable");
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamSelection = (userId: string) => {
    setProjectForm((prev) => {
      const exists = prev.assignedTeam.includes(userId);
      return {
        ...prev,
        assignedTeam: exists
          ? prev.assignedTeam.filter((id) => id !== userId)
          : [...prev.assignedTeam, userId]
      };
    });
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    return (
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(clientSearch.toLowerCase()))
    );
  });

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.clientId.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.clientId.companyName && p.clientId.companyName.toLowerCase().includes(projectSearch.toLowerCase()));

    const matchesStatus = projectStatusFilter === "All" || p.status === projectStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getClientProjectsCount = (clientId: string) => {
    return projects.filter((p) => p.clientId._id === clientId).length;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Assembling Client Pipeline...
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
            Clients & <span className="text-brand-orange">Deliverables</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Manage production workloads, deliverables pipeline, and corporate accounts
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.2)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Client</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-900">
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "clients" ? "border-brand-orange text-brand-orange" : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          Clients Directory ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "projects" ? "border-brand-orange text-brand-orange" : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          Deliverables & Projects ({projects.length})
        </button>
      </div>

      {/* CLIENTS DIRECTORY */}
      {activeTab === "clients" && (
        <div className="space-y-6">
          {/* Client Search */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex gap-4 shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search clients by name, email, brand..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredClients.length === 0 ? (
              <div className="col-span-full py-12 text-center text-neutral-500 font-mono uppercase tracking-widest border border-dashed border-neutral-900 rounded-2xl">
                No clients found in search query
              </div>
            ) : (
              filteredClients.map((client) => {
                const count = getClientProjectsCount(client._id);
                return (
                  <div
                    key={client._id}
                    className="relative group bg-neutral-950 border border-neutral-900 hover:border-brand-orange/40 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <div>
                          <h3 className="text-sm font-extrabold text-white">{client.name}</h3>
                          {client.companyName && (
                            <span className="text-[10px] text-neutral-400 font-medium italic mt-0.5 block flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-neutral-600" />
                              {client.companyName}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 text-[9px] font-mono text-brand-orange font-bold">
                          {count} Projects
                        </span>
                      </div>

                      <div className="space-y-1.5 border-t border-neutral-900 pt-4 text-[10px] font-mono text-neutral-400">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-neutral-600" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-neutral-600" />
                          <span>{client.phone}</span>
                        </div>
                      </div>

                      {client.notes && (
                        <p className="mt-4 text-[10px] text-neutral-500 leading-relaxed line-clamp-3 bg-black/40 border border-neutral-900 p-2.5 rounded-xl italic">
                          {client.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-900 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedClientForProject(client);
                          setProjectForm({ title: "", clientId: client._id, assignedTeam: [], deadline: "" });
                          setShowAddProjectModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-brand-orange text-white hover:text-brand-orange font-bold text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer text-center"
                      >
                        Create Project
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* DELIVERABLES & PROJECTS TAB */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {/* Projects Search & Filters */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search projects by title, client name..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">Status:</span>
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="bg-black border border-neutral-850 hover:border-neutral-700 focus:border-brand-orange px-3 py-2 rounded-xl text-xs text-white focus:outline-none transition-colors font-mono"
              >
                <option value="All">All Statuses</option>
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full py-12 text-center text-neutral-500 font-mono uppercase tracking-widest border border-dashed border-neutral-900 rounded-2xl">
                No active projects found matching current filter
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => {
                    setSelectedProject(project);
                    setShowProjectDetailsModal(true);
                  }}
                  className="bg-neutral-950 border border-neutral-900 hover:border-neutral-800 rounded-2xl p-6 shadow-xl relative cursor-pointer group transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-brand-orange transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-[10px] text-neutral-400 font-bold mt-1">
                        Client: {project.clientId.name}{" "}
                        {project.clientId.companyName && `(${project.clientId.companyName})`}
                      </p>
                    </div>
                    <span
                      onClick={(e) => e.stopPropagation()} // Prevent modal trigger
                      className="relative block"
                    >
                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project._id, e.target.value)}
                        className={`px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors bg-black ${
                          project.status === "Completed"
                            ? "border-emerald-900 text-emerald-400"
                            : project.status === "Delivered"
                            ? "border-blue-900 text-blue-400"
                            : project.status === "Editing"
                            ? "border-purple-900 text-purple-400"
                            : "border-neutral-800 text-neutral-400"
                        }`}
                      >
                        {PROJECT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-900 pt-4 text-[10px] font-mono text-neutral-400">
                    <div>
                      <span className="block text-[8px] text-neutral-600 uppercase tracking-widest">Production Crew</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.assignedTeam.length === 0 ? (
                          <span className="text-[9px] text-neutral-600 italic">No staff assigned</span>
                        ) : (
                          project.assignedTeam.map((member) => (
                            <span
                              key={member._id}
                              className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-white text-[8px] tracking-wide"
                            >
                              {member.name} ({member.role.toLowerCase()})
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[8px] text-neutral-600 uppercase tracking-widest">Deadline Date</span>
                      <span className="block text-white font-bold mt-1">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-900/60 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span>{project.deliverables.length} Deliverable links</span>
                    <span className="text-neutral-600 text-[8px] group-hover:text-brand-orange transition-colors flex items-center gap-1">
                      VIEW WORKSPACE <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: ADD CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowAddClientModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              Client <span className="text-brand-orange">Onboarding Profile</span>
            </h3>

            <form onSubmit={handleAddClientSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Corporate Client Name *</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Brand/Company Name</label>
                <input
                  type="text"
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Account Notes</label>
                <textarea
                  rows={3}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange resize-none"
                  placeholder="Terms, operational preferences, invoicing criteria..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Confirm Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ADD PROJECT */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowAddProjectModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">
              Launch <span className="text-brand-orange">Creative Project</span>
            </h3>
            {selectedClientForProject && (
              <p className="text-[11px] text-neutral-400 mb-6 uppercase font-mono">
                Client Account: <span className="text-white font-bold">{selectedClientForProject.name}</span>
              </p>
            )}

            <form onSubmit={handleAddProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Project Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nike Winter Ad Shoot / Roshan Wedding Video"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Target Deadline Date</label>
                <input
                  type="date"
                  value={projectForm.deadline}
                  onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Assign Production Crew</label>
                <div className="grid grid-cols-2 gap-2 bg-black border border-neutral-850 p-3 rounded-xl max-h-40 overflow-y-auto no-scrollbar">
                  {team.map((member) => {
                    const isChecked = projectForm.assignedTeam.includes(member._id);
                    return (
                      <div
                        key={member._id}
                        onClick={() => toggleTeamSelection(member._id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-[10px] cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-brand-orange/10 border-brand-orange text-white"
                            : "bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <div className="truncate pr-1">
                          <p className="font-bold truncate">{member.name}</p>
                          <span className="text-[8px] text-neutral-500 uppercase">{member.role}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: PROJECT DETAILS & WORKSPACE */}
      {showProjectDetailsModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => {
                setShowProjectDetailsModal(false);
                setSelectedProject(null);
              }}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase tracking-wider text-white mb-1">
              Project <span className="text-brand-orange">Workspace</span>
            </h3>
            <p className="text-[10px] text-neutral-400 uppercase font-mono mb-6">
              Details, assigned crew, and upload deliverable pipeline
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left pane: metadata */}
              <div className="md:col-span-2 space-y-5">
                <div className="bg-black border border-neutral-900 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase text-neutral-500 tracking-wider mb-2">Project info</h4>
                  <p className="text-sm font-extrabold text-white">{selectedProject.title}</p>
                  <p className="text-[10px] text-neutral-400 font-mono mt-1">
                    Client: {selectedProject.clientId.name}{" "}
                    {selectedProject.clientId.companyName && `(${selectedProject.clientId.companyName})`}
                  </p>
                  <div className="mt-4 flex gap-6 text-[10px] font-mono text-neutral-400">
                    <div>
                      <span className="block text-[8px] text-neutral-600 uppercase">Status</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-bold uppercase">
                        {selectedProject.status}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-neutral-600 uppercase">Deadline</span>
                      <span className="block text-white font-bold mt-1">
                        {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : "No deadline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deliverables lists */}
                <div className="bg-black border border-neutral-900 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Deliverable URL Links</h4>
                    <button
                      onClick={() => setShowDeliverableModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-805 text-white text-[9px] font-bold uppercase border border-neutral-800 hover:border-brand-orange cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-brand-orange" /> Add Link
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                    {selectedProject.deliverables.length === 0 ? (
                      <p className="text-[10px] text-neutral-600 text-center font-mono py-4">No deliverables uploaded yet</p>
                    ) : (
                      selectedProject.deliverables.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-neutral-950 border border-neutral-900 hover:border-neutral-850 rounded-xl"
                        >
                          <div className="truncate pr-2">
                            <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                            <span className="text-[8px] text-neutral-500 font-mono">
                              {new Date(item.uploadedAt).toLocaleString()}
                            </span>
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-brand-orange border border-neutral-850 hover:border-transparent text-neutral-400 hover:text-black transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right pane: crew assigned */}
              <div className="bg-black border border-neutral-900 p-4 rounded-2xl h-fit">
                <h4 className="text-xs font-bold uppercase text-neutral-500 tracking-wider mb-3">Production Crew</h4>
                <div className="space-y-2.5">
                  {selectedProject.assignedTeam.length === 0 ? (
                    <p className="text-[9px] text-neutral-600 italic">No assigned staff members</p>
                  ) : (
                    selectedProject.assignedTeam.map((member) => (
                      <div key={member._id} className="p-2 rounded bg-neutral-950 border border-neutral-900">
                        <p className="text-[10px] font-bold text-white">{member.name}</p>
                        <p className="text-[8px] text-brand-orange uppercase font-mono mt-0.5">{member.role}</p>
                        <p className="text-[8px] text-neutral-500 font-mono truncate">{member.email}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ADD DELIVERABLE LINK */}
      {showDeliverableModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowDeliverableModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1">
              Add <span className="text-brand-orange">Deliverable Link</span>
            </h3>
            <p className="text-[9px] text-neutral-400 uppercase font-mono mb-6">
              Attach Cloudinary, Drive, or YouTube preview links to project workspace
            </p>

            <form onSubmit={handleAddDeliverableSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Deliverable Name / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Cut Draft / Color Graded Edit"
                  value={deliverableForm.name}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, name: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">URL Address Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://res.cloudinary.com/... or Google Drive URL"
                  value={deliverableForm.url}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, url: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeliverableModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Upload Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
