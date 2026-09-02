import Link from "next/link";
import { FileQuestion, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-800/80 border border-slate-700/80 p-8 rounded-2xl shadow-2xl backdrop-blur-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-md">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
            404 — PAGE NOT FOUND
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            We couldn&apos;t find that page
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The page or route you were looking for does not exist or may have been moved.
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
