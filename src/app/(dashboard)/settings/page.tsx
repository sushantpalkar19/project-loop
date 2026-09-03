"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Settings, Shield, User, Layers, Server, Key, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold">
                <Settings className="w-3.5 h-3.5 mr-1" />
                SYSTEM & WORKSPACE CONFIGURATION
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Workspace Settings
            </h1>
            <p className="text-xs text-slate-300">
              Overview of active tenant isolation, user role security, and platform specifications.
            </p>
          </div>
        </div>
      </div>

      {/* User Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            User Account Profile
          </CardTitle>
          <CardDescription>Authenticated session user details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium block">Full Name:</span>
              <p className="font-bold text-slate-900 text-sm">
                {user?.name || "Authenticated User"}
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium block">Email Address:</span>
              <p className="font-mono text-slate-900 font-bold text-sm">
                {user?.email || "user@example.com"}
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium block">Role Permissions:</span>
              <Badge
                variant={
                  user?.role === "ADMIN"
                    ? "purple"
                    : user?.role === "ANALYST"
                    ? "info"
                    : "neutral"
                }
                size="md"
                className="mt-0.5 font-bold uppercase"
              >
                {user?.role || "VIEWER"}
              </Badge>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium block">Authentication Provider:</span>
              <p className="font-semibold text-slate-800">
                NextAuth.js Credentials (JWT Session)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Isolation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Workspace Tenant Isolation
          </CardTitle>
          <CardDescription>Multi-tenant security parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-950">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Multi-Tenant Query Scoping Enforced</span>
            </div>
            <p className="text-indigo-900/80 leading-relaxed">
              Every database query and API call in Project LOOP is strictly scoped to your authenticated <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-indigo-950">workspaceId</code>. Client requests cannot bypass workspace boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium block">Active Workspace ID:</span>
              <p className="font-mono text-slate-900 font-bold truncate">
                {user?.workspaceId || "cuid..."}
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium block">Isolation Mode:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active Tenant Scoping
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Specifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            System Infrastructure & Architecture
          </CardTitle>
          <CardDescription>Official Zidio Project LOOP Specifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-slate-500 block font-medium mb-0.5">Framework</span>
              <span className="font-bold text-slate-900">Next.js 14 App Router</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-slate-500 block font-medium mb-0.5">Database & ORM</span>
              <span className="font-bold text-slate-900">PostgreSQL + Prisma ORM</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-slate-500 block font-medium mb-0.5">AI Intelligence</span>
              <span className="font-bold text-slate-900">Google Gemini / Vector Search</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
