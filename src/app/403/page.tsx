import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-800/80 border border-slate-700/80 p-8 rounded-2xl shadow-2xl backdrop-blur-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono">
            403 — ACCESS FORBIDDEN
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Permission Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            You do not have the required role permissions to access this workspace section. Contact your Workspace Admin to request access.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="primary" size="md" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
