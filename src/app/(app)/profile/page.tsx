"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { User, Bell, Shield, Link2, Loader2 } from "lucide-react";

const TABS = [
  { id: "info",      label: "Personal Info",       icon: <User className="w-4 h-4" /> },
  { id: "notifs",    label: "Notifications",        icon: <Bell className="w-4 h-4" /> },
  { id: "privacy",   label: "Data & Privacy",       icon: <Shield className="w-4 h-4" /> },
  { id: "connected", label: "Connected Accounts",   icon: <Link2 className="w-4 h-4" /> },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("info");
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true, whatsapp: false });

  if (status === "loading") {
    return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-muted w-6 h-6" /></div>;
  }

  const name = session?.user?.name ?? "Guest";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground mb-8">Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center text-center h-fit lg:sticky lg:top-20">
          {image ? (
            <Image src={image} alt={name} width={80} height={80} className="rounded-full mb-4 w-20 h-20 object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-safe flex items-center justify-center text-2xl font-bold text-white mb-4">
              {initials}
            </div>
          )}
          <p className="font-heading font-semibold text-foreground text-xl">{name}</p>
          <span className="glass rounded-full px-3 py-1 text-xs text-primary border border-primary/30 mt-2 inline-block">Citizen</span>
          <div className="mt-6 w-full space-y-2.5 text-sm">
            {[["Member since", "Jan 2024"], ["Districts", "5"], ["Alerts received", "42"]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-muted"><span>{k}</span><span className="text-foreground">{v}</span></div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-0.5 glass rounded-xl p-1 mb-6 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs transition whitespace-nowrap ${tab === t.id ? "bg-primary/20 text-primary" : "text-muted hover:text-foreground"}`}>
                {t.icon} <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {tab === "info" && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="font-heading font-semibold text-foreground">Personal Information</h3>
              {[["Full Name", name, "text"], ["Email", email, "email"]].map(([label, val, type]) => (
                <div key={label} className="relative">
                  <input type={type} defaultValue={val} className="peer w-full glass rounded-xl px-4 pt-6 pb-2 text-foreground bg-transparent outline-none border border-white/10 focus:border-primary/60 transition text-sm" />
                  <label className="absolute left-4 top-2 text-xs text-muted">{label}</label>
                </div>
              ))}
              <button className="w-full py-3 bg-gradient-to-r from-primary to-[#2580E8] text-white rounded-xl text-sm font-medium hover:shadow-[0_0_18px_rgba(26,111,212,0.4)] transition">Save Changes</button>
            </div>
          )}

          {tab === "notifs" && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-foreground mb-2">Notification Channels</h3>
              {Object.entries(notifs).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between glass rounded-xl p-4">
                  <div>
                    <p className="text-sm text-foreground capitalize">{key === "push" ? "Browser Push" : key === "whatsapp" ? "WhatsApp" : key.charAt(0).toUpperCase() + key.slice(1) + " Alerts"}</p>
                    <p className="text-xs text-muted mt-0.5">Receive alerts via {key}</p>
                  </div>
                  <button onClick={() => setNotifs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${val ? "bg-primary" : "bg-white/20"}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${val ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "privacy" && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Data & Privacy</h3>
              <p className="text-muted text-sm mb-6 leading-relaxed">Your data is securely stored in Supabase and never shared without consent. Download or delete your data at any time.</p>
              <div className="space-y-3">
                <button className="w-full glass rounded-xl p-4 text-left text-sm text-foreground hover:bg-white/5 transition flex justify-between items-center">
                  <span>Download my data</span><span className="text-primary text-xs">ZIP</span>
                </button>
                <button className="w-full glass rounded-xl p-4 text-left text-sm text-danger hover:bg-danger/10 transition flex justify-between items-center border border-danger/20">
                  <span>Delete account</span><span className="text-xs text-muted">Irreversible</span>
                </button>
              </div>
            </div>
          )}

          {tab === "connected" && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Connected Accounts</h3>
              <div className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <div>
                    <p className="text-sm text-foreground">Google</p>
                    <p className="text-xs text-muted">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-safe" />
                  <span className="text-xs text-safe">{session ? "Connected" : "Not connected"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
