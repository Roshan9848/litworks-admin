"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Briefcase,
  ShieldAlert,
  Loader2,
  X,
  UserCheck,
  UserX,
  Edit2
} from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: "FOUNDER" | "CO-FOUNDER" | "MANAGER" | "EDITOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "INTERN";
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface Project {
  _id: string;
  title: string;
  status: string;
  assignedTeam: (string | { _id: string })[];
}

export default function TeamManagementPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "VIDEOGRAPHER" as TeamMember["role"]
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "VIDEOGRAPHER" as TeamMember["role"],
    status: "active" as TeamMember["status"]
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
      const [teamRes, projectsRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/projects")
      ]);

      const teamData = await teamRes.json();
      const projectsData = await projectsRes.json();

      if (teamData.success) setTeam(teamData.team);
      if (projectsData.success) setProjects(projectsData.projects);
    } catch (err: any) {
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can onboard new crew members.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        resetAddForm();
        fetchData();
      } else {
        alert(data.error || "Failed to onboard team member");
      }
    } catch (err: any) {
      alert(err.message || "Error creating team member");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can modify crew member profiles.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/team/${selectedMember._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedMember(null);
        fetchData();
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      alert(err.message || "Error updating team member");
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setAddForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "VIDEOGRAPHER"
    });
  };

  const handleDeleteMember = async (memberId: string) => {
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can delete team members.");
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this team member? This action is permanent and cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete team member");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting team member");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      phone: member.phone || "",
      role: member.role,
      status: member.status
    });
    setShowEditModal(true);
  };

  // Get count of active projects assigned to a team member
  const getAssignedProjectsCount = (memberId: string) => {
    return projects.filter((proj) => {
      const isAssigned = proj.assignedTeam.some((teamObj: any) => {
        const id = typeof teamObj === "object" ? teamObj._id : teamObj;
        return id === memberId;
      });
      return isAssigned && proj.status !== "Completed";
    }).length;
  };

  if (loading && team.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Syncing Workload Registry...
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
            Team Workload & <span className="text-brand-orange">Staff Registry</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Onboard production crew and review active project workload distribution
          </p>
        </div>
        {currentUser?.role === "FOUNDER" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Crew</span>
          </button>
        )}
      </div>

      {currentUser?.role !== "FOUNDER" && (
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-850 text-neutral-400 text-xs leading-relaxed uppercase font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-orange flex-shrink-0" />
          <span>Only the Founder has privileges to onboard or modify staff profiles.</span>
        </div>
      )}

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {team.map((member) => {
          const activeProjCount = getAssignedProjectsCount(member._id);
          return (
            <div
              key={member._id}
              className={`bg-neutral-950 border rounded-2xl p-6 shadow-lg relative flex flex-col justify-between transition-all duration-300 ${
                member.status === "inactive"
                  ? "border-neutral-900 opacity-50"
                  : "border-neutral-900 hover:border-brand-orange/40"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-brand-orange font-mono font-bold">
                      {member.role}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-0.5">{member.name}</h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                    member.status === "active" ? "bg-emerald-950/20 text-emerald-400" : "bg-neutral-900 text-neutral-500"
                  }`}>
                    {member.status}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-neutral-900 pt-4 text-[10px] font-mono text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-600" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 p-3 rounded-xl bg-black border border-neutral-900 flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>ACTIVE ASSIGNMENTS</span>
                  <span className="text-white font-extrabold">{activeProjCount} Projects</span>
                </div>
              </div>

              {currentUser?.role === "FOUNDER" && (
                <div className="mt-6 pt-4 border-t border-neutral-900 flex gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-brand-orange text-neutral-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member._id)}
                    className="flex items-center justify-center py-2 px-3 rounded-lg bg-neutral-950 border border-neutral-900 hover:border-red-950 hover:bg-red-950/20 text-neutral-600 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete Employee"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: ADD TEAM MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              Onboard <span className="text-brand-orange">Crew Member</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  placeholder="e.g. john@litworks.media"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Secure Access Password *</label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Operational Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as TeamMember["role"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono font-bold"
                  >
                    <option value="INTERN">INTERN</option>
                    <option value="VIDEOGRAPHER">VIDEOGRAPHER</option>
                    <option value="PHOTOGRAPHER">PHOTOGRAPHER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CO-FOUNDER">CO-FOUNDER</option>
                  </select>
                </div>
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
                  Confirm Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: EDIT TEAM MEMBER */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedMember(null);
              }}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              Modify <span className="text-brand-orange">Crew Profile</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Operational Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as TeamMember["role"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono font-bold"
                  >
                    <option value="INTERN">INTERN</option>
                    <option value="VIDEOGRAPHER">VIDEOGRAPHER</option>
                    <option value="PHOTOGRAPHER">PHOTOGRAPHER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CO-FOUNDER">CO-FOUNDER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Operational Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TeamMember["status"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
