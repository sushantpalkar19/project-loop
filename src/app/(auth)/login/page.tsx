"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, AlertCircle, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: LoginInput = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Validate with Zod
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors(errors as Record<string, string>);
      setLoading(false);
      return;
    }

    try {
      const response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 antialiased relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white tracking-tight text-2xl block leading-none">
              PROJECT LOOP
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block mt-0.5">
              Feedback Intelligence
            </span>
          </div>
        </Link>

        <div>
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your team feedback intelligence workspace
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-center gap-2 text-rose-400 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Email address"
              placeholder="you@company.com"
              error={fieldErrors.email}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              isPasswordToggle
              label="Password"
              placeholder="••••••••"
              error={fieldErrors.password}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-md shadow-indigo-600/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign in to Workspace
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Security callout */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>Protected by Enterprise Workspace Isolation & Encryption</span>
        </div>
      </div>
    </div>
  );
}
