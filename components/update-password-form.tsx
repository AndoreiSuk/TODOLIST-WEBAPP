"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/home");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 antialiased relative"
      {...props}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[300px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <span className="text-white text-sm font-black">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>

        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white mb-1">Set new password</h1>
            <p className="text-sm text-slate-500">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full bg-[#111927] border border-slate-800 hover:border-slate-700 focus:border-indigo-500/60 focus:shadow-[0_0_15px_rgba(99,102,241,0.12)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Update password"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          TaskFlow &mdash; Streamline your workflow
        </p>
      </div>
    </div>
  );
}
