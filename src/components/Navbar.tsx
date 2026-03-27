"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const navLinks = [
  { href: "/dashboard",    label: "Overview" },
  { href: "/map",          label: "Live Map" },
  { href: "/my-districts", label: "My Districts" },
  { href: "/alerts",       label: "Alerts" },
  { href: "/reports",      label: "Reports" },
];

export default function Navbar() {
  const pathname = usePathname();

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
      </div>
    </nav>
  );
}
