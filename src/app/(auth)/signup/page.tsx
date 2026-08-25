"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, AlertCircle, ArrowRight, ShieldCheck, Check } from "lucide-react";

export default function SignupPage() {
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
    const data: SignupInput = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    // Validate with Zod
    const result = signupSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors(errors as Record<string, string>);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("An account with this email already exists");
        } else if (responseData.details) {
          setFieldErrors(responseData.details);
        } else {
          setError(responseData.error || "Failed to create account");
        }
        return;
      }

      // Auto-login after successful signup
      const loginResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Account created but auto-login failed — redirect to login
        router.push("/login");
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
          <h2 className="text-xl font-bold text-white">Create your workspace</h2>
          <p className="text-xs text-slate-400 mt-1">
            Get started with AI feedback intelligence in minutes
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Workspace Admin Notice */}
          <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-indigo-200">
                Workspace Admin Provisioning
              </span>
              Creating an account provisions your dedicated isolated workspace with ADMIN role privileges.
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-center gap-2 text-rose-400 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              label="Full Name"
              placeholder="Jane Doe"
              error={fieldErrors.name}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />

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
              autoComplete="new-password"
              required
              isPasswordToggle
              label="Password"
              placeholder="••••••••"
              error={fieldErrors.password}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              isPasswordToggle
              label="Confirm Password"
              placeholder="••••••••"
              error={fieldErrors.confirmPassword}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-md shadow-indigo-600/20 mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account & Workspace
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
