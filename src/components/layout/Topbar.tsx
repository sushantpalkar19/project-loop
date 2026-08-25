"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, Shield, ChevronDown, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageMeta = () => {
    if (pathname.startsWith("/feedback")) {
      return { title: "Feedback Inbox", subtitle: "Manage, filter & process feedback" };
    }
    if (pathname.startsWith("/dashboard")) {
      return { title: "Dashboard", subtitle: "Customer feedback intelligence overview" };
    }
    return { title: "Project LOOP", subtitle: "AI Customer Feedback Platform" };
  };

  const meta = getPageMeta();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Workspace /
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {meta.title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Workspace Pill */}
        {user?.workspaceId && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-medium">WS:</span>
            <span className="font-mono text-slate-800 font-semibold truncate max-w-[100px]">
              {user.workspaceId.slice(0, 8)}
            </span>
          </div>
        )}

        {/* User Role Badge */}
        {user?.role && (
          <Badge
            variant={
              user.role === "ADMIN"
                ? "purple"
                : user.role === "ANALYST"
                ? "info"
                : "neutral"
            }
            size="sm"
            className="hidden sm:inline-flex"
          >
            {user.role}
          </Badge>
        )}

        {/* User Avatar Menu Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-expanded={dropdownOpen}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user.name || "Authenticated User"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-indigo-600" />
                    <span className="text-[10px] font-medium text-indigo-700 uppercase">
                      {user.role} Permissions
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
