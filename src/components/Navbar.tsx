"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Droplets, Activity, Radio } from "lucide-react";

const navLinks = [
  { href: "/dashboard",    label: "Overview",     dot: true  },
  { href: "/map",          label: "Live Map",      dot: true  },
  { href: "/my-districts", label: "My Districts",  dot: false },
  { href: "/alerts",       label: "Alerts",        dot: false },
  { href: "/collab",       label: "Operations",    dot: true  },
  { href: "/reports",      label: "Reports",       dot: false },
];

export default function Navbar() {
  const pathname  = usePathname();
  const [time,    setTime]    = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  /* Live clock */
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Scroll shadow */
  useEffect(() => {
    const el = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", el, { passive: true });
    return () => window.removeEventListener("scroll", el);
  }, []);

  /* Fetch alert count from live weather API */
  useEffect(() => {
    fetch("/api/alerts")
      .then(r => r.json())
      .then(d => setAlertCount(d?.alerts?.length ?? 0))
      .catch(() => {});
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 px-6 py-0 flex items-center justify-between transition-all duration-300"
      style={{
        background:    scrolled ? "rgba(6,15,28,.97)" : "rgba(6,15,28,.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom:  "1px solid rgba(255,255,255,.07)",
        boxShadow:     scrolled ? "0 4px 32px rgba(0,0,0,.4)" : "none",
        height: "57px",
      }}
    >
      {/* ── Logo ── */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <div className="relative w-7 h-7 shrink-0">
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-lg border border-primary/40 group-hover:border-primary/80 transition-colors" />
          <div className="absolute inset-[3px] rounded-md bg-primary/10 flex items-center justify-center">
            <Droplets className="w-3.5 h-3.5 text-primary" />
          </div>
          {/* live pulse */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-safe animate-ping opacity-75" />
            <span className="absolute inset-0.5 rounded-full bg-safe" />
          </span>
        </div>
        <span className="font-heading font-bold text-[15px] tracking-[0.12em] text-foreground">
          FLOOD<span className="text-primary">SENSE</span>
        </span>
      </Link>

      {/* ── Center nav ── */}
      <div className="hidden md:flex items-stretch h-full gap-0.5">
        {navLinks.map((link) => {
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center px-4 text-sm font-medium transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {/* Active underline bar */}
              {active && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary"
                  style={{ boxShadow: "0 0 8px rgba(45,212,191,.8)" }}
                />
              )}
              {/* Live dot for map and dashboard */}
              {link.dot && (
                <span className={`mr-1.5 w-1.5 h-1.5 rounded-full ${active ? "bg-primary" : "bg-muted/40"} transition-colors`} />
              )}
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Live clock */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", color: "#7B90AA" }}
        >
          <Activity className="w-3 h-3 text-safe" />
          <span className="tabular-nums">{time} IST</span>
        </div>

        {/* Alert bell with badge */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-full hover:bg-white/5 transition-all duration-150 group"
        >
          <Bell className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
          {alertCount > 0 ? (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full bg-danger flex items-center justify-center text-[9px] font-bold text-white px-0.5">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          ) : (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-safe/60" />
          )}
        </Link>

        {/* Profile avatar placeholder */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-primary border border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all duration-150"
        >
          FS
        </Link>
      </div>
    </nav>
  );
}
