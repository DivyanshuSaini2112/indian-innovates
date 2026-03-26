"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";

const ROLES = ["Citizen", "Researcher", "Government Official", "NGO Worker"];

function StrengthBar({ password }: { password: string }) {
  const s = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  return (
    <div className="flex gap-1 mt-1.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
          i <= s ? (s === 1 ? "bg-critical" : s === 2 ? "bg-warning" : "bg-safe") : "bg-white/10"
        }`} />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState("Citizen");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { window.location.href = "/onboarding"; }, 600);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020B18] via-[#051628] to-[#020B18]" />
        <div className="absolute top-1/3 left-1/3 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(26,111,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(26,111,212,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10">
          <span className="font-heading font-semibold text-2xl tracking-[0.15em]">FLOOD<span className="text-primary">SENSE</span></span>
        </div>
        <div className="relative z-10 space-y-4">
          {[["🌧️", "Last 24hrs", "142mm", "rainfall in Kerala"], ["🌊", "Rivers at risk", "9", "above danger mark"], ["🤖", "AI model", "48h", "advance prediction"]].map(([icon, label, val, sub]) => (
            <div key={label} className="glass rounded-xl p-5 flex items-center gap-4 border border-white/8">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-muted text-xs">{label}</p>
                <p className="font-heading text-2xl font-semibold text-foreground">{val} <span className="text-muted text-sm font-normal">{sub}</span></p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative z-10 text-muted text-sm">Trusted by disaster management teams across <span className="text-foreground font-medium">12 states</span>.</div>
      </div>

      {/* Right panel */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center px-8 md:px-14 py-12 bg-background overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">Create account.</h1>
          <p className="text-muted mb-8">Join FloodSense — free forever.</p>

          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full glass border border-white/15 rounded-xl py-4 flex items-center justify-center gap-3 text-foreground hover:bg-white/8 hover:border-primary/40 transition font-medium mb-6 disabled:opacity-60">
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6"><div className="h-px flex-1 bg-white/8" /><span className="text-muted text-xs">or use email</span><div className="h-px flex-1 bg-white/8" /></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {["Full Name", "Email Address"].map((label, i) => (
              <div key={label} className="relative">
                <input type={i === 1 ? "email" : "text"} id={label} placeholder=" " required
                  className="peer w-full glass rounded-xl px-4 pt-6 pb-2 text-foreground bg-transparent outline-none border border-white/10 focus:border-primary/60 transition text-sm" />
                <label htmlFor={label} className="absolute left-4 top-2 text-xs text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all peer-focus:text-primary">{label}</label>
              </div>
            ))}
            <div className="relative">
              <input type="password" id="password" placeholder=" " required value={password} onChange={e => setPassword(e.target.value)}
                className="peer w-full glass rounded-xl px-4 pt-6 pb-2 text-foreground bg-transparent outline-none border border-white/10 focus:border-primary/60 transition text-sm" />
              <label htmlFor="password" className="absolute left-4 top-2 text-xs text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all peer-focus:text-primary">Password</label>
              <StrengthBar password={password} />
            </div>

            <div>
              <p className="text-xs text-muted mb-2">Your Role</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${role === r ? "bg-primary text-white shadow-[0_0_12px_rgba(26,111,212,0.4)]" : "glass text-muted hover:text-foreground"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-[#2580E8] text-white rounded-xl font-semibold hover:shadow-[0_0_24px_rgba(26,111,212,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4" /> Create Account</>}
            </button>
          </form>

          <p className="text-muted text-center mt-6 text-sm">Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
