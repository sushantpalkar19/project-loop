"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Sparkles,
  BarChart3,
  Users,
  Settings,
  LogOut,
  X,
  Layers,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLogout } from "@/components/layout/LogoutContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isLoggingOut, handleLogout } = useLogout();

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  const mainNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      roles: ["ADMIN", "ANALYST", "VIEWER"],
    },
    {
      label: "Feedback Inbox",
      href: "/feedback",
      icon: MessageSquare,
      active: pathname.startsWith("/feedback"),
      roles: ["ADMIN", "ANALYST", "VIEWER"],
    },
    {
      label: "Insights & Trends",
      href: "/trends",
      icon: TrendingUp,
      active: pathname.startsWith("/trends") || pathname.startsWith("/insights"),
      roles: ["ADMIN", "ANALYST", "VIEWER"],
    },
    {
      label: "Ask LOOP AI",
      href: "/ask",
      icon: Sparkles,
      active: pathname.startsWith("/ask"),
      roles: ["ADMIN", "ANALYST", "VIEWER"],
    },
    {
      label: "VoC Reports",
      href: "/reports",
      icon: BarChart3,
      active: pathname.startsWith("/reports"),
      roles: ["ADMIN", "ANALYST", "VIEWER"],
    },
  ];

  const adminNavItems = [
    {
      label: "Team Members",
      href: "/workspace",
      icon: Users,
      active: pathname.startsWith("/workspace"),
      roles: ["ADMIN"],
    },
    {
      label: "Workspace Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
      roles: ["ADMIN"],
    },
  ];

  const visibleMainItems = mainNavItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  const visibleAdminItems = adminNavItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 w-64 border-r border-slate-800/80 shadow-xl select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-white tracking-tight text-lg block leading-none">
              LOOP
            </span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">
              Feedback Intelligence
            </span>
          </div>
        </Link>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Workspace Indicator */}
      {user?.workspaceId && (
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-widest">
                Tenant Workspace
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-300 truncate block">
                {user.workspaceId.slice(0, 14)}…
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50" title="Active" />
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 mb-2">
            Main Platform
          </div>
          <div className="space-y-1">
            {visibleMainItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                    item.active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        item.active ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.active && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Workspace Admin Section */}
        {isAdmin && visibleAdminItems.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 mb-2">
              Workspace Admin
            </div>
            <div className="space-y-1">
              {visibleAdminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                      item.active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          item.active ? "text-white" : "text-slate-400 group-hover:text-white"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.active && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Footer Profile Card */}
      {user && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 ring-2 ring-slate-800">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user.name || "Authenticated User"}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono leading-tight mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant={
                user.role === "ADMIN"
                  ? "purple"
                  : user.role === "ANALYST"
                  ? "info"
                  : "neutral"
              }
              size="sm"
              className="text-[9px] uppercase tracking-wider font-bold"
            >
              {user.role}
            </Badge>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 focus:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 font-semibold disabled:opacity-60 disabled:cursor-not-allowed select-none"
              title="Sign out of workspace"
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Signing out…</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block fixed top-0 bottom-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onMobileClose}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
