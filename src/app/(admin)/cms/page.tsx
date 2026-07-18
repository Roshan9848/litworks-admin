"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  FileText,
  Save,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Mail,
  Loader2,
  AlertCircle,
  Star,
  Video,
  MapPin,
  Tag
} from "lucide-react";

export default function CMSLiveEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sections State
  const [hero, setHero] = useState({
    badgeText: "",
    heading: "",
    subheading: "",
    primaryBtnText: "",
    secondaryBtnText: ""
  });

  const [stats, setStats] = useState({
    projectsCount: "",
    deliveryTime: "",
    satisfactionRate: ""
  });

  const [faq, setFaq] = useState({
    heading: "",
    subheading: "",
    items: [] as { question: string; answer: string }[]
  });

  const [contact, setContact] = useState({
    email: "",
    phone: "",
    whatsapp: "",
    address: ""
  });

  const [testimonials, setTestimonials] = useState({
    heading: "",
    subheading: "",
    items: [] as { name: string; role: string; location: string; rating: number; comment: string }[]
  });

  const [videos, setVideos] = useState({
    heading: "",
    subheading: "",
    items: [] as { url: string; title: string; instagramUrl?: string }[]
  });

  const [locations, setLocations] = useState<{
    states: { name: string; cities: string[] }[];
  }>({
    states: [
      {
        name: "Telangana",
        cities: ["Hyderabad", "Karimnagar", "Nizamabad", "Armoor"]
      },
      {
        name: "Andhra Pradesh",
        cities: ["Vijayawada", "Visakhapatnam (Vizag)"]
      }
    ]
  });

  const [announcement, setAnnouncement] = useState({
    text: "",
    active: false
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCMSContent();
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

  const fetchCMSContent = async () => {
    try {
      const res = await fetch("/api/cms");
      const data = await res.json();
      if (data.success && data.contents) {
        // Map backend contents
        data.contents.forEach((section: any) => {
          if (section.sectionKey === "hero") setHero(section.content);
          if (section.sectionKey === "stats") setStats(section.content);
          if (section.sectionKey === "faq") setFaq(section.content);
          if (section.sectionKey === "contact") setContact(section.content);
          if (section.sectionKey === "testimonials") setTestimonials(section.content);
          if (section.sectionKey === "videos") setVideos(section.content);
          if (section.sectionKey === "announcement") setAnnouncement(section.content);
          if (section.sectionKey === "locations") {
            if (section.content && Array.isArray(section.content.states)) {
              setLocations(section.content);
            }
          }
        });
      }
    } catch (e) {
      console.error("CMS load error:", e);
      setErrorMsg("Failed to query website CMS contents.");
    } finally {
      setLoading(false);
    }
  };

  const handleCMSUpdate = async (sectionKey: string, content: any) => {
    if (currentUser?.role !== "FOUNDER") {
      alert("Forbidden: Only the Founder can modify CMS contents.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, content })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully saved updates to "${sectionKey.toUpperCase()}"!`);
        // Clear message after 4s
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to update CMS content");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save CMS data");
    } finally {
      setSaving(false);
    }
  };

  // FAQ handlers
  const handleFaqItemChange = (index: number, field: "question" | "answer", val: string) => {
    const nextItems = [...faq.items];
    nextItems[index] = { ...nextItems[index], [field]: val };
    setFaq({ ...faq, items: nextItems });
  };

  const addFaqItem = () => {
    setFaq({ ...faq, items: [...faq.items, { question: "", answer: "" }] });
  };

  const removeFaqItem = (index: number) => {
    const nextItems = faq.items.filter((_, i) => i !== index);
    setFaq({ ...faq, items: nextItems });
  };

  // Testimonial handlers
  const handleTestimonialChange = (index: number, field: "name" | "role" | "location" | "rating" | "comment", val: any) => {
    const nextItems = [...testimonials.items];
    nextItems[index] = { ...nextItems[index], [field]: val };
    setTestimonials({ ...testimonials, items: nextItems });
  };

  const addTestimonialItem = () => {
    setTestimonials({
      ...testimonials,
      items: [...testimonials.items, { name: "", role: "", location: "", rating: 5, comment: "" }]
    });
  };

  const removeTestimonialItem = (index: number) => {
    const nextItems = testimonials.items.filter((_, i) => i !== index);
    setTestimonials({ ...testimonials, items: nextItems });
  };
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});

  const handleFileUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      alert("File is too large. Max size allowed is 150MB.");
      return;
    }

    setUploadingSlots((prev) => ({ ...prev, [idx]: true }));
    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      handleVideoChange(idx, "url", newBlob.url);
      alert(`Video uploaded successfully!`);
    } catch (err: any) {
      alert(err.message || "Failed to upload video to Vercel Blob.");
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [idx]: false }));
    }
  };

  // Video handlers
  const handleVideoChange = (index: number, field: "url" | "title" | "instagramUrl", val: string) => {
    const nextItems = [...(videos.items || [])];
    while (nextItems.length <= index) {
      nextItems.push({ url: "", title: "", instagramUrl: "" });
    }
    nextItems[index] = { ...nextItems[index], [field]: val };
    setVideos({ ...videos, items: nextItems });
  };

  // Location handlers
  const handleStateNameChange = (sIdx: number, val: string) => {
    const nextStates = [...locations.states];
    nextStates[sIdx] = { ...nextStates[sIdx], name: val };
    setLocations({ states: nextStates });
  };

  const addState = () => {
    setLocations({
      states: [...locations.states, { name: "", cities: [] }]
    });
  };

  const removeState = (sIdx: number) => {
    const nextStates = locations.states.filter((_, idx) => idx !== sIdx);
    setLocations({ states: nextStates });
  };

  const handleCityNameChange = (sIdx: number, cIdx: number, val: string) => {
    const nextStates = [...locations.states];
    const nextCities = [...nextStates[sIdx].cities];
    nextCities[cIdx] = val;
    nextStates[sIdx] = { ...nextStates[sIdx], cities: nextCities };
    setLocations({ states: nextStates });
  };

  const addCity = (sIdx: number) => {
    const nextStates = [...locations.states];
    nextStates[sIdx] = {
      ...nextStates[sIdx],
      cities: [...nextStates[sIdx].cities, ""]
    };
    setLocations({ states: nextStates });
  };

  const removeCity = (sIdx: number, cIdx: number) => {
    const nextStates = [...locations.states];
    nextStates[sIdx] = {
      ...nextStates[sIdx],
      cities: nextStates[sIdx].cities.filter((_, idx) => idx !== cIdx)
    };
    setLocations({ states: nextStates });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Syncing Live CMS pipeline...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">
          Live Website <span className="text-brand-orange">CMS Editor</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
          Modify hero copies, FAQs, and contact links on www.litworks.media in real-time
        </p>
      </div>

      {/* Message banners */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/45 text-red-500 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {currentUser?.role !== "FOUNDER" && (
        <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-900/40 text-amber-500 text-xs leading-relaxed uppercase font-mono">
          Warning: Read-only access. Only Founder (Roshan) can publish content changes.
        </div>
      )}

      {/* 1. HERO SECTION */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <FileText className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Hero Intro Banner Copy</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("hero", hero);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Badge Text / Highlight</label>
            <input
              type="text"
              value={hero.badgeText}
              onChange={(e) => setHero({ ...hero, badgeText: e.target.value })}
              className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Primary Heading Text *</label>
            <input
              type="text"
              required
              value={hero.heading}
              onChange={(e) => setHero({ ...hero, heading: e.target.value })}
              className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Subheading Description Paragraph *</label>
            <textarea
              rows={3}
              required
              value={hero.subheading}
              onChange={(e) => setHero({ ...hero, subheading: e.target.value })}
              className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Primary CTA Button Label *</label>
              <input
                type="text"
                required
                value={hero.primaryBtnText}
                onChange={(e) => setHero({ ...hero, primaryBtnText: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Secondary CTA Button Label *</label>
              <input
                type="text"
                required
                value={hero.secondaryBtnText}
                onChange={(e) => setHero({ ...hero, secondaryBtnText: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Hero intro</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. STATS SECTION */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <TrendingUp className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Trust Badges / Counter stats</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("stats", stats);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Projects Completed Count</label>
              <input
                type="text"
                value={stats.projectsCount}
                onChange={(e) => setStats({ ...stats, projectsCount: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Delivery Speed Indicator</label>
              <input
                type="text"
                value={stats.deliveryTime}
                onChange={(e) => setStats({ ...stats, deliveryTime: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Satisfaction Rating (%)</label>
              <input
                type="text"
                value={stats.satisfactionRate}
                onChange={(e) => setStats({ ...stats, satisfactionRate: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Stats</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 3. FAQ SECTION */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <HelpCircle className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Frequently Asked Questions</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("faq", faq);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">FAQ Heading *</label>
              <input
                type="text"
                required
                value={faq.heading}
                onChange={(e) => setFaq({ ...faq, heading: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">FAQ Subheading *</label>
              <input
                type="text"
                required
                value={faq.subheading}
                onChange={(e) => setFaq({ ...faq, subheading: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">FAQ Q&A Accordion Items</label>
              <button
                type="button"
                onClick={addFaqItem}
                className="text-[9px] font-extrabold uppercase text-brand-orange flex items-center gap-1 hover:underline cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Q&A
              </button>
            </div>

            <div className="space-y-4 bg-black border border-neutral-850 p-4 rounded-2xl max-h-80 overflow-y-auto no-scrollbar">
              {faq.items.length === 0 ? (
                <p className="text-[10px] text-neutral-600 text-center font-mono py-4">No FAQ items defined</p>
              ) : (
                faq.items.map((item, index) => (
                  <div key={index} className="space-y-2 border-b border-neutral-900/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-600 font-mono">#{index + 1}</span>
                      <input
                        type="text"
                        required
                        placeholder="Question text..."
                        value={item.question}
                        onChange={(e) => handleFaqItemChange(index, "question", e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange"
                      />
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        className="text-neutral-600 hover:text-red-500 transition-colors"
                      >
                        <MinusCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Answer details..."
                      value={item.answer}
                      onChange={(e) => handleFaqItemChange(index, "answer", e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange resize-none"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save FAQ</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 4. CONTACT SECTION */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <Mail className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Agency Contact & Media Channels</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("contact", contact);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Corporate Email Address</label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number</label>
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">WhatsApp link / Number</label>
              <input
                type="text"
                value={contact.whatsapp}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Physical HQ Address Location</label>
            <input
              type="text"
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Contact Info</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 5. TESTIMONIALS SECTION */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <Star className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Client Feedbacks & Testimonials</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("testimonials", testimonials);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Heading *</label>
              <input
                type="text"
                required
                value={testimonials.heading}
                onChange={(e) => setTestimonials({ ...testimonials, heading: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Subheading *</label>
              <input
                type="text"
                required
                value={testimonials.subheading}
                onChange={(e) => setTestimonials({ ...testimonials, subheading: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Feedback Items List</label>
              <button
                type="button"
                onClick={addTestimonialItem}
                className="text-[9px] font-extrabold uppercase text-brand-orange flex items-center gap-1 hover:underline cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Feedback
              </button>
            </div>

            <div className="space-y-4 bg-black border border-neutral-850 p-4 rounded-2xl max-h-96 overflow-y-auto no-scrollbar">
              {testimonials.items.length === 0 ? (
                <p className="text-[10px] text-neutral-600 text-center font-mono py-4">No reviews defined</p>
              ) : (
                testimonials.items.map((item, index) => (
                  <div key={index} className="space-y-3 border-b border-neutral-900/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neutral-600 font-mono">#{index + 1}</span>
                      <input
                        type="text"
                        required
                        placeholder="Client Name..."
                        value={item.name}
                        onChange={(e) => handleTestimonialChange(index, "name", e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Role (e.g. Founder)..."
                        value={item.role}
                        onChange={(e) => handleTestimonialChange(index, "role", e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange"
                      />
                      <button
                        type="button"
                        onClick={() => removeTestimonialItem(index)}
                        className="text-neutral-600 hover:text-red-500 transition-colors"
                      >
                        <MinusCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Location (e.g. Hyderabad)..."
                          value={item.location}
                          onChange={(e) => handleTestimonialChange(index, "location", e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                      <div>
                        <select
                          value={item.rating}
                          onChange={(e) => handleTestimonialChange(index, "rating", parseInt(e.target.value))}
                          className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange"
                        >
                          <option value={5}>5 Stars</option>
                          <option value={4}>4 Stars</option>
                          <option value={3}>3 Stars</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      placeholder="Comment detail review content..."
                      value={item.comment}
                      onChange={(e) => handleTestimonialChange(index, "comment", e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange resize-none"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Testimonials</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 6. REEL VIDEOS SECTION */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <Video className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Reel Videos Showcase (6 Videos Grid)</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("videos", videos);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Heading *</label>
              <input
                type="text"
                required
                value={videos.heading}
                onChange={(e) => setVideos({ ...videos, heading: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Subheading *</label>
              <input
                type="text"
                required
                value={videos.subheading}
                onChange={(e) => setVideos({ ...videos, subheading: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">Video Showcase Items (Reels Aspect 9:16)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const item = (videos.items && videos.items[idx]) || { url: "", title: "", instagramUrl: "" };
                return (
                  <div key={idx} className="bg-black border border-neutral-900 p-4 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-neutral-500 font-mono uppercase">Video Slot #{idx + 1}</span>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-neutral-455 font-bold mb-1">Video Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wedding Highlights..."
                        value={item.title}
                        onChange={(e) => handleVideoChange(idx, "title", e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-neutral-455 font-bold mb-1">Direct Video MP4 URL</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="https://example.com/video.mp4"
                          value={item.url}
                          onChange={(e) => handleVideoChange(idx, "url", e.target.value)}
                          className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-brand-orange font-mono"
                        />
                        <label className={`px-2.5 py-2.5 rounded-lg border text-[8px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center transition-all duration-200 select-none min-w-[85px] ${
                          uploadingSlots[idx] 
                            ? "bg-neutral-900 border-neutral-850 text-neutral-500 cursor-not-allowed" 
                            : "bg-neutral-900 border-neutral-800 hover:border-brand-orange text-white hover:text-brand-orange active:scale-95"
                        }`}>
                          {uploadingSlots[idx] ? (
                            <Loader2 className="w-3 h-3 animate-spin text-brand-orange" />
                          ) : (
                            "Upload MP4"
                          )}
                          <input
                            type="file"
                            disabled={uploadingSlots[idx]}
                            accept="video/mp4,video/quicktime,video/webm"
                            className="hidden"
                            onChange={(e) => handleFileUpload(idx, e)}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-neutral-455 font-bold mb-1">Instagram Link (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://instagram.com/reel/..."
                        value={item.instagramUrl || ""}
                        onChange={(e) => handleVideoChange(idx, "instagramUrl", e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-brand-orange font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Showcase Videos</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 7. AVAILABLE LOCATIONS */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <MapPin className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Available Booking Locations (States & Cities)</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("locations", locations);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            {locations.states.map((s, sIdx) => (
              <div key={sIdx} className="bg-black border border-neutral-900 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-[8px] uppercase tracking-widest text-neutral-450 font-bold mb-1">State Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Telangana"
                      value={s.name}
                      onChange={(e) => handleStateNameChange(sIdx, e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeState(sIdx)}
                    className="mt-4 flex items-center gap-1 text-[9px] uppercase tracking-widest text-red-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5" /> Remove State
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[8px] uppercase tracking-widest text-neutral-450 font-bold">Cities in {s.name || "this state"}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {s.cities.map((city, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 p-2 rounded-xl">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hyderabad"
                          value={city}
                          onChange={(e) => handleCityNameChange(sIdx, cIdx, e.target.value)}
                          className="flex-1 bg-black border border-neutral-850 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-brand-orange"
                        />
                        <button
                          type="button"
                          onClick={() => removeCity(sIdx, cIdx)}
                          className="text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addCity(sIdx)}
                      className="flex items-center justify-center gap-1.5 border border-dashed border-neutral-800 hover:border-brand-orange text-[9px] uppercase tracking-widest text-neutral-400 hover:text-white rounded-xl p-2.5 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add City
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addState}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-800 hover:border-brand-orange text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white rounded-2xl p-4 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add New State
            </button>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Booking Locations</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 8. MARQUEE ANNOUNCEMENT STRIP */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <Tag className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Website Marquee Announcement Banner (Offers Strip)</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCMSUpdate("announcement", announcement);
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Marquee Banner Message *</label>
              <input
                type="text"
                required
                placeholder="e.g. 🎉 Grand Launch Offer: Use code FIRST500 to get ₹500 off on your first booking! | Limited slots available!"
                value={announcement.text}
                onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Marquee Status</label>
              <button
                type="button"
                onClick={() => setAnnouncement({ ...announcement, active: !announcement.active })}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  announcement.active
                    ? "bg-brand-orange text-black font-extrabold shadow-[0_0_15px_rgba(255,122,0,0.2)]"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-450 hover:text-white"
                }`}
              >
                <span>{announcement.active ? "Active (Displayed on Website)" : "Inactive (Hidden)"}</span>
              </button>
            </div>
          </div>

          {currentUser?.role === "FOUNDER" && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Announcement Ribbon</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
