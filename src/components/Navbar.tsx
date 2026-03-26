"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const navLinks = [
  { href: "/dashboard",    label: "Overview" },
  { href: "/map",          label: "Live Map" },
  { href: "/my-districts", label: "My Districts" },
  { href: "/alerts",       label: "Alerts" },
  { href: "/reports",      label: "Reports" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const initials = session?.user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl bg-background/80 px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="font-heading font-semibold text-lg tracking-[0.15em] text-foreground shrink-0">
        FLOOD<span className="text-primary">SENSE</span>
      </Link>

      {/* Center nav tabs */}
      <div className="hidden md:flex items-center gap-0.5">
        {navLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                active ? "bg-primary/20 text-primary" : "text-muted hover:text-foreground hover:bg-white/5"
              }`}>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Alert bell */}
        <Link href="/alerts" className="relative p-2 rounded-full hover:bg-white/5 transition">
          <Bell className="w-4 h-4 text-muted" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-critical" />
        </Link>

        {/* User menu */}
        {session ? (
          <div className="relative">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2 glass rounded-full px-3 py-1.5 hover:bg-white/8 transition">
              {session.user?.image ? (
                <Image src={session.user.image} alt={initials} width={24} height={24} className="rounded-full w-6 h-6 object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-safe flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
              )}
              <span className="text-sm text-foreground hidden sm:block max-w-[100px] truncate">
                {session.user?.name?.split(" ")[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted" />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-xs text-foreground font-medium truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted truncate">{session.user?.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition">
                    <User className="w-4 h-4 text-muted" /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition border-t border-white/5">
                    <Settings className="w-4 h-4 text-muted" /> Settings
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-danger/5 transition border-t border-white/5">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/login" className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
