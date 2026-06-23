"use client";

import { useEffect, useState } from "react";
import {
  Grid,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  PlusCircle,
  MinusCircle
} from "lucide-react";

interface Package {
  _id: string;
  title: string;
  price: number;
  discountPrice?: number;
  description: string;
  features: string[];
  serviceType: string;
  isBestseller: boolean;
  category: "basic" | "wedding";
  status: "active" | "inactive";
  createdAt: string;
}

export default function PackagesManagementPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    discountPrice: "",
    description: "",
    features: [""] as string[],
    serviceType: "Video Production",
    isBestseller: false,
    category: "basic" as Package["category"],
    status: "active" as Package["status"]
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchPackages();
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

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages?adminMode=true");
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages);
      } else {
        setError(data.error || "Failed to load packages");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch packages API");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can manage packages.");
      return;
    }

    setLoading(true);
    // Filter empty features
    const cleanFeatures = formData.features.filter((f) => f.trim() !== "");
    const payload = {
      ...formData,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      features: cleanFeatures
    };

    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        resetForm();
        fetchPackages();
      } else {
        alert(data.error || "Failed to create package");
      }
    } catch (err: any) {
      alert(err.message || "Error creating package");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can manage packages.");
      return;
    }

    setLoading(true);
    const cleanFeatures = formData.features.filter((f) => f.trim() !== "");
    const payload = {
      ...formData,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      features: cleanFeatures
    };

    try {
      const res = await fetch(`/api/packages/${selectedPackage._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedPackage(null);
        resetForm();
        fetchPackages();
      } else {
        alert(data.error || "Failed to update package");
      }
    } catch (err: any) {
      alert(err.message || "Error updating package");
    } finally {
      setLoading(false);
    }
  };

  const togglePackageStatus = async (pkg: Package) => {
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can toggle package status.");
      return;
    }

    const newStatus = pkg.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/packages/${pkg._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setPackages((prev) =>
          prev.map((p) => (p._id === pkg._id ? { ...p, status: newStatus } : p))
        );
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can delete packages.");
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this pricing package? This will affect package listings on the main website immediately.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/packages/${pkgId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchPackages();
      } else {
        alert(data.error || "Failed to delete package");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting package");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      price: "",
      discountPrice: "",
      description: "",
      features: [""],
      serviceType: "Video Production",
      isBestseller: false,
      category: "basic",
      status: "active"
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      title: pkg.title,
      price: String(pkg.price),
      discountPrice: pkg.discountPrice ? String(pkg.discountPrice) : "",
      description: pkg.description,
      features: pkg.features.length > 0 ? [...pkg.features] : [""],
      serviceType: pkg.serviceType,
      isBestseller: pkg.isBestseller,
      category: pkg.category,
      status: pkg.status
    });
    setShowEditModal(true);
  };

  // Feature list handlers
  const handleFeatureChange = (index: number, val: string) => {
    const next = [...formData.features];
    next[index] = val;
    setFormData({ ...formData, features: next });
  };

  const addFeatureInput = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeatureInput = (index: number) => {
    const next = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: next.length > 0 ? next : [""] });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading && packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Loading Package configuration...
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
            Pricing & <span className="text-brand-orange">Service Packages</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Control service packages and plans rendering live on the main litworks website
          </p>
        </div>
        {currentUser?.role === "FOUNDER" && (
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Package</span>
          </button>
        )}
      </div>

      {/* Basic Packages Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-900 pb-2">
          Basic / Content Creator Pricing Packages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages
            .filter((p) => p.category === "basic")
            .map((pkg) => (
              <div
                key={pkg._id}
                className={`relative group bg-neutral-950 border rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between ${
                  pkg.status === "inactive" ? "border-neutral-900 opacity-60" : "border-neutral-900 hover:border-brand-orange/40"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">
                        {pkg.serviceType}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">{pkg.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {pkg.isBestseller && (
                        <span className="px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 text-[8px] font-mono text-brand-orange font-bold uppercase">
                          Bestseller
                        </span>
                      )}
                      <button
                        onClick={() => togglePackageStatus(pkg)}
                        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        title={pkg.status === "active" ? "Mark Inactive" : "Mark Active"}
                      >
                        {pkg.status === "active" ? (
                          <ToggleRight className="w-6 h-6 text-brand-orange" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xl font-black text-white font-mono">{formatCurrency(pkg.price)}</span>
                    {pkg.discountPrice && (
                      <span className="text-xs text-neutral-500 line-through ml-2 font-mono">
                        {formatCurrency(pkg.discountPrice)}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-neutral-400 mb-5 leading-relaxed bg-black/30 border border-neutral-900 p-2.5 rounded-xl italic">
                    {pkg.description}
                  </p>

                  <ul className="space-y-2 text-[10px] text-neutral-300 font-mono border-t border-neutral-900/60 pt-4">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-brand-orange mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {currentUser?.role === "FOUNDER" && (
                  <div className="mt-6 pt-4 border-t border-neutral-900 flex gap-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-905 border border-neutral-850 hover:border-brand-orange text-neutral-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg._id)}
                      className="flex items-center justify-center py-2 px-3 rounded-lg bg-neutral-950 border border-neutral-900 hover:border-red-900 text-neutral-600 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Wedding Packages Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-900 pb-2">
          Premium Wedding Videography Packages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages
            .filter((p) => p.category === "wedding")
            .map((pkg) => (
              <div
                key={pkg._id}
                className={`relative group bg-neutral-950 border rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between ${
                  pkg.status === "inactive" ? "border-neutral-900 opacity-60" : "border-neutral-900 hover:border-brand-orange/40"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">
                        {pkg.serviceType}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">{pkg.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {pkg.isBestseller && (
                        <span className="px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 text-[8px] font-mono text-brand-orange font-bold uppercase">
                          Bestseller
                        </span>
                      )}
                      <button
                        onClick={() => togglePackageStatus(pkg)}
                        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {pkg.status === "active" ? (
                          <ToggleRight className="w-6 h-6 text-brand-orange" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xl font-black text-white font-mono">{formatCurrency(pkg.price)}</span>
                    {pkg.discountPrice && (
                      <span className="text-xs text-neutral-500 line-through ml-2 font-mono">
                        {formatCurrency(pkg.discountPrice)}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-neutral-400 mb-5 leading-relaxed bg-black/30 border border-neutral-900 p-2.5 rounded-xl italic">
                    {pkg.description}
                  </p>

                  <ul className="space-y-2 text-[10px] text-neutral-300 font-mono border-t border-neutral-900/60 pt-4">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-brand-orange mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {currentUser?.role === "FOUNDER" && (
                  <div className="mt-6 pt-4 border-t border-neutral-900 flex gap-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-brand-orange text-neutral-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg._id)}
                      className="flex items-center justify-center py-2 px-3 rounded-lg bg-neutral-950 border border-neutral-900 hover:border-red-900 text-neutral-600 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Modal: ADD / EDIT PACKAGE */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedPackage(null);
              }}
              className="absolute right-6 top-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6">
              {showAddModal ? "Launch" : "Modify"}{" "}
              <span className="text-brand-orange">Pricing Plan</span>
            </h3>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Package Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                    placeholder="e.g. Standard Reel Package"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Service Type slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                    placeholder="e.g. Instant Reel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                    placeholder="e.g. 2999"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Discount/Strike Price (INR)</label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                    placeholder="e.g. 3999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Pricing Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Package["category"] })}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  >
                    <option value="basic">Basic (Instant Reels)</option>
                    <option value="wedding">Wedding Videography</option>
                  </select>
                </div>
                <div className="flex items-center gap-2.5 pt-7 pl-1">
                  <input
                    type="checkbox"
                    id="isBestseller"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                    className="accent-brand-orange w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isBestseller" className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold cursor-pointer select-none">
                    Flag as Bestseller
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Plan Summary Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange resize-none"
                  placeholder="Summarize the core focus of this shoot package..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Bullet Deliverable Features *</label>
                  <button
                    type="button"
                    onClick={addFeatureInput}
                    className="text-[9px] font-extrabold uppercase text-brand-orange flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add feature
                  </button>
                </div>
                <div className="space-y-2.5 max-h-36 overflow-y-auto no-scrollbar bg-black border border-neutral-850 p-3 rounded-xl">
                  {formData.features.map((feat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={feat}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange font-mono"
                        placeholder={`Feature #${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureInput(index)}
                        className="text-neutral-600 hover:text-red-500 transition-colors"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedPackage(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-neutral-900 hover:bg-neutral-900/50 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {showAddModal ? "Launch Plan" : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
