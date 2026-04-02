"use client";

import { useEffect, useRef, useState } from "react";

interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({ target, suffix = "", prefix = "", duration = 1200, decimals = 0, className = "" }: CounterProps) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(2, -10 * progress);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return (
    <span className={className}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}{suffix}
    </span>
  );
}

/* ── Alert ticker banner ── */
interface TickerItem { district: string; riskLevel: string; riskScore: number; state: string; }
const LEVEL_COLOR: Record<string, string> = {
  Critical: "#a855f7", High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e",
};

export function AlertTicker({ items }: { items: TickerItem[] }) {
  if (!items || items.length === 0) return null;
  const doubled = [...items, ...items]; // seamless loop

  return (
    <div
      className="w-full overflow-hidden flex items-center gap-3 py-2 px-4"
      style={{ background: "rgba(255,87,87,.06)", borderBottom: "1px solid rgba(255,87,87,.12)" }}
    >
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-danger flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse inline-block" />
        ALERT
      </span>
      <div className="flex-1 overflow-hidden">
        <div className="marquee-track flex items-center gap-8 whitespace-nowrap" style={{ width: "max-content" }}>
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: LEVEL_COLOR[item.riskLevel] ?? "#94a3b8" }} />
              <span className="text-foreground font-medium">{item.district}</span>
              <span className="text-muted">{item.state}</span>
              <span className="font-bold tabular-nums" style={{ color: LEVEL_COLOR[item.riskLevel] }}>{item.riskLevel} · {item.riskScore}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card with animated number ── */
interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  decimals?: number;
  delay?: number;
}

export function StatCard({ label, value, suffix, prefix, sub, icon, accentColor, decimals = 0, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className="stat-card glass-card rounded-2xl p-5 relative overflow-hidden"
      style={{
        borderTop: `2px solid ${accentColor}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${accentColor}08 0%, transparent 60%)` }}
      />
      {/* Shimmer overlay */}
      <div className="shimmer absolute inset-0 pointer-events-none rounded-2xl" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <p className="text-muted text-[11px] font-medium uppercase tracking-wider leading-tight max-w-[120px]">{label}</p>
          <div className="p-2 rounded-xl" style={{ background: `${accentColor}15` }}>
            {icon}
          </div>
        </div>
        <div className="font-heading text-4xl font-bold text-foreground mb-1 tabular-nums">
          {visible ? (
            <AnimatedCounter target={value} suffix={suffix} prefix={prefix} decimals={decimals} />
          ) : (
            <span>{prefix}0{suffix}</span>
          )}
        </div>
        <p className="text-muted text-xs">{sub}</p>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-500"
          style={{ background: `linear-gradient(to right, ${accentColor}, transparent)`, width: visible ? "70%" : "0%" }}
        />
      </div>
    </div>
  );
}
