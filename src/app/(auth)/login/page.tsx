"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // For demo — redirect straight to dashboard (no email/password provider configured)
    setTimeout(() => { window.location.href = "/dashboard"; }, 500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020B18] via-[#051628] to-[#020B18]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(26,111,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(26,111,212,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10">
          <span className="font-heading font-semibold text-2xl tracking-[0.15em] text-foreground">FLOOD<span className="text-primary">SENSE</span></span>
          <p className="text-muted text-sm mt-1">Real-Time Flood Intelligence · India</p>
        </div>

        <div className="relative z-10 text-center">
          <div className="glass rounded-2xl p-10 inline-block border border-white/8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <span className="text-danger text-xs font-medium uppercase tracking-widest">Live Telemetry</span>
            </div>
            <p className="font-heading text-5xl font-semibold text-foreground mb-1">4 rivers</p>
            <p className="text-muted text-sm">above danger mark today</p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[["700+", "Districts"], ["12", "States"], ["48hr", "Forecast"]].map(([v, l]) => (
                <div key={l}>
                  <p className="font-heading text-xl font-semibold text-foreground">{v}</p>
                  <p className="text-muted text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-muted text-sm">
          Trusted by disaster management teams across <span className="text-foreground font-medium">12 states</span>.
        </div>
      </div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 bg-background">
        <div className="max-w-md w-full mx-auto">
          <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">Welcome back.</h1>
          <p className="text-muted mb-10">Sign in to access precision flood intelligence.</p>

          {/* Google Sign-In (primary) */}
          <button onClick={handleGoogleSignIn} disabled={googleLoading}
            className="w-full glass border border-white/15 rounded-xl py-4 flex items-center justify-center gap-3 text-foreground hover:bg-white/8 hover:border-primary/40 transition font-medium mb-6 disabled:opacity-60">
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-muted text-xs">or sign in with email</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input type="email" id="email" placeholder=" " required
                className="peer w-full glass rounded-xl px-4 pt-6 pb-2 text-foreground bg-transparent outline-none border border-white/10 focus:border-primary/60 transition text-sm" />
              <label htmlFor="email" className="absolute left-4 top-2 text-xs text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all peer-focus:text-primary">Email</label>
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} id="password" placeholder=" " required
                className="peer w-full glass rounded-xl px-4 pt-6 pb-2 pr-12 text-foreground bg-transparent outline-none border border-white/10 focus:border-primary/60 transition text-sm" />
              <label htmlFor="password" className="absolute left-4 top-2 text-xs text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all peer-focus:text-primary">Password</label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-muted hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-right"><Link href="#" className="text-primary text-xs hover:underline">Forgot password?</Link></div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-[#2580E8] text-white rounded-xl font-semibold hover:shadow-[0_0_24px_rgba(26,111,212,0.4)] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In →"}
            </button>
          </form>

          <p className="text-muted text-center mt-8 text-sm">New here? <Link href="/register" className="text-primary hover:underline">Create account</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
