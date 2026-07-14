import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 antialiased relative">
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

        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-8 shadow-2xl shadow-black/50 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-emerald-400 text-xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Thank you for signing up!</h1>
          <p className="text-sm text-slate-500">
            Check your email to confirm your account before signing in.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Back to sign in &rarr;
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          TaskFlow &mdash; Streamline your workflow
        </p>
      </div>
    </div>
  );
}
