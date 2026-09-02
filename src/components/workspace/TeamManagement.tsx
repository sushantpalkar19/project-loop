"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Users, Shield, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  createdAt: string;
}

export default function TeamManagement() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const { success, error: toastError, info } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/workspace/members");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You do not have permission to manage team members.");
        }
        throw new Error("Failed to load workspace members.");
      }
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      toastError(msg, "Members Load Failed");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin, fetchMembers]);

  const handleRoleChange = async (memberId: string, memberEmail: string, newRole: string) => {
    setUpdatingId(memberId);
    setError(null);
    info(`Updating role for ${memberEmail} to ${newRole}...`, "Updating Permissions");

    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update member role");
      }

      success(`Member role updated to ${newRole} successfully.`, "Role Updated");
      fetchMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Role update failed";
      setError(msg);
      toastError(msg, "Role Update Error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs border border-rose-200">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Admin Access Required</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Only Admin users have permission to manage workspace team members and assign roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold">
                <Users className="w-3.5 h-3.5 mr-1" />
                ADMIN TEAM CONTROLS
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Workspace Team Members
            </h1>
            <p className="text-xs text-slate-300">
              Manage member roles and permissions scoped to your workspace ({user?.workspaceId}).
            </p>
          </div>

          <Button
            onClick={fetchMembers}
            variant="outline"
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shrink-0"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Members
          </Button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Unable to load team members"
          message={error}
          onRetry={fetchMembers}
        />
      )}

      {/* Role Explanations Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-purple-200/80 bg-purple-50/30 shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="purple" size="sm" className="font-bold">ADMIN</Badge>
              <span className="text-[10px] text-purple-700 font-bold">Full Access</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Manage workspace members, assign roles, access settings, feedback ingestion, Ask LOOP, & VoC reports.
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-200/80 bg-sky-50/30 shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="info" size="sm" className="font-bold">ANALYST</Badge>
              <span className="text-[10px] text-sky-700 font-bold">Feedback Controls</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Add feedback, import CSV, simulate channel ingestion, change workflow status, reclassify AI themes, Ask LOOP & VoC reports.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-slate-50/50 shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="neutral" size="sm" className="font-bold">VIEWER</Badge>
              <span className="text-[10px] text-slate-500 font-bold">Read Only</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Read-only access across Dashboard, Feedback Inbox, Insights, Ask LOOP, & VoC Reports. No write/upload/role actions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <Users className="w-4 h-4 text-indigo-600" />
            Active Workspace Members
          </CardTitle>
          <CardDescription>
            Members currently registered in your workspace tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={4} />
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No members found in this workspace.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Member</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Assign Permission Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
                          {(member.name || member.email || "M").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{member.name || "Workspace Member"}</span>
                          {member.id === user?.id && (
                            <span className="text-[10px] text-indigo-600 font-bold font-mono">
                              (You - Current Session)
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "ADMIN"
                            ? "purple"
                            : member.role === "ANALYST"
                            ? "info"
                            : "neutral"
                        }
                        size="sm"
                        className="font-bold"
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.id === user?.id ? (
                        <span className="text-xs text-slate-400 italic">Self (Admin)</span>
                      ) : (
                        <select
                          value={member.role}
                          disabled={updatingId === member.id}
                          onChange={(e) => handleRoleChange(member.id, member.email, e.target.value)}
                          className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
