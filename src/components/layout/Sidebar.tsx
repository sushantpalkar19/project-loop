"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  X,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;

  const mainNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Feedback Inbox",
      href: "/feedback",
      icon: MessageSquare,
      active: pathname.startsWith("/feedback"),
    },
    {
      label: "Trends",
      href: "/trends",
      icon: TrendingUp,
      active: false,
      soon: true,
    },
    {
      label: "Ask LOOP",
      href: "/ask",
      icon: Sparkles,
      active: pathname.startsWith("/ask"),
    },
    {
      label: "Reports",
      href: "/reports",
      icon: BarChart3,
      active: pathname.startsWith("/reports"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      active: false,
      soon: true,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md group-hover:bg-indigo-500 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-lg block leading-none">
              LOOP
            </span>
            <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider block mt-0.5">
              Feedback Intelligence
            </span>
          </div>
        </Link>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Workspace Indicator Pill */}
      {user?.workspaceId && (
        <div className="px-4 pt-4 pb-2">
          <div className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <div className="truncate">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                Workspace
              </span>
              <span className="text-xs font-medium text-slate-200 truncate block">
                {user.workspaceId.slice(0, 12)}...
              </span>
            </div>
            <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              Active
            </Badge>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
          Menu
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          if (item.soon) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed opacity-75"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group",
                item.active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  item.active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile Card */}
      {user && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.name || "User"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Badge
              variant={
                user.role === "ADMIN"
                  ? "purple"
                  : user.role === "ANALYST"
                  ? "info"
                  : "neutral"
              }
              size="sm"
              className="text-[10px] uppercase tracking-wider"
            >
              {user.role}
            </Badge>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
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
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-in fade-in"
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
