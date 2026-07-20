"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Grid,
  FileText,
  DollarSign,
  Settings,
  Shield,
  Receipt,
  LogOut,
  Bell,
  Loader2,
  Menu,
  X
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error("Unauthorized");
        }
        setUser(data.user);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?limit=5");
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 min refresh
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sidebar Menu Items filtered by User Role Permissions (Memoized for high 60fps performance)
  const allowedMenuItems = useMemo(() => {
    if (!user) return [];
    const menuItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["FOUNDER", "CO-FOUNDER", "MANAGER", "EDITOR", "PHOTOGRAPHER", "VIDEOGRAPHER"] },
      { name: "Leads CRM", href: "/leads", icon: Users, roles: ["FOUNDER", "CO-FOUNDER", "MANAGER"] },
      { name: "Clients", href: "/clients", icon: Briefcase, roles: ["FOUNDER", "CO-FOUNDER"] },
      { name: "Bookings", href: "/bookings", icon: Calendar, roles: ["FOUNDER", "CO-FOUNDER", "MANAGER"] },
      { name: "Transactions Log", href: "/transactions", icon: Receipt, roles: ["FOUNDER", "CO-FOUNDER", "MANAGER"] },
      { name: "Packages", href: "/packages", icon: Grid, roles: ["FOUNDER", "CO-FOUNDER", "MANAGER"] },
      { name: "Invoices & Coupons", href: "/billing", icon: DollarSign, roles: ["FOUNDER", "CO-FOUNDER"] },
      { name: "CMS Live Content", href: "/cms", icon: FileText, roles: ["FOUNDER"] },
      { name: "Team Workload", href: "/team", icon: Settings, roles: ["FOUNDER", "CO-FOUNDER"] },
      { name: "Audit Trail Logs", href: "/logs", icon: Shield, roles: ["FOUNDER", "CO-FOUNDER"] },
    ];
    return menuItems.filter((item) => item.roles.includes(user.role));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Establishing Session...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black flex text-white relative">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-neutral-950 border-r border-neutral-900 flex-shrink-0">
        <div className="p-6 border-b border-neutral-900 flex justify-center">
          <Link href="/dashboard">
            <img src="/logo.png" alt="LITWORKS Logo" className="h-7 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(255,122,0,0.35)]" />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {allowedMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "bg-brand-orange text-black shadow-[0_0_15px_rgba(255,122,0,0.25)]"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-900 bg-neutral-950/50">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-orange/15 border border-brand-orange/20 text-brand-orange flex items-center justify-center font-bold text-xs uppercase shadow-[0_0_10px_rgba(255,122,0,0.1)]">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 text-[8px] font-mono text-brand-orange uppercase">
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-900 hover:border-red-900/50 hover:bg-red-950/15 hover:text-red-500 text-neutral-400 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR MODAL */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          
          <aside className="relative flex flex-col w-64 bg-neutral-950 border-r border-neutral-900 z-10">
            <div className="p-6 border-b border-neutral-900 flex justify-between items-center">
              <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
                <img src="/logo.png" alt="LITWORKS Logo" className="h-7 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(255,122,0,0.35)]" />
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {allowedMenuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? "bg-brand-orange text-black shadow-[0_0_15px_rgba(255,122,0,0.25)]"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-neutral-900">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-900 text-neutral-400 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER BAR */}
        <header className="h-16 bg-neutral-950/70 border-b border-neutral-900 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-400 hover:text-white cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden md:inline-block px-3 py-1 rounded-full bg-neutral-900 border border-neutral-850 text-[10px] font-mono text-neutral-400">
              Environment: production
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full border border-neutral-900 text-neutral-400 hover:text-white hover:border-brand-orange transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-orange text-black font-extrabold text-[8px] flex items-center justify-center shadow-[0_0_8px_rgba(255,122,0,0.5)]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-neutral-950 border border-neutral-900 p-4 shadow-2xl z-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Alert Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[9px] font-bold text-brand-orange uppercase hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          n.isRead ? "border-neutral-900 bg-neutral-950" : "border-brand-orange/15 bg-brand-orange/5"
                        }`}
                      >
                        <p className="text-[10px] font-bold text-white leading-snug">{n.title}</p>
                        <p className="text-[9px] text-neutral-400 leading-relaxed mt-0.5">{n.message}</p>
                        <span className="text-[8px] text-neutral-600 block mt-1 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-grow p-6 sm:p-8 bg-black">{children}</main>
      </div>
    </div>
  );
}
