import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";
import { RiskPill } from "./RiskPill";
import Link from "next/link";

interface DistrictCardProps {
  name: string;
  state: string;
  riskScore: number;
  riskLevel: RiskLevel;
  rainfall24h: number;
  rainfall7d: number;
  forecast?: number[];  // simplified forecase values
  className?: string;
}

export function DistrictCard({ name, state, riskScore, riskLevel, rainfall24h, rainfall7d, forecast, className }: DistrictCardProps) {
  const borderColor = {
    Critical: "border-t-critical",
    High:     "border-t-danger",
    Medium:   "border-t-warning",
    Low:      "border-t-safe",
  }[riskLevel];

  const mini = forecast ?? [riskScore * 0.6, riskScore * 0.7, riskScore * 0.8, riskScore * 0.9, riskScore, riskScore * 1.05, riskScore];

  return (
    <Link href={`/district/${name.toLowerCase()}`}>
      <div className={cn(
        "glass rounded-2xl p-5 border-t-2 hover:bg-white/5 transition cursor-pointer",
        borderColor,
        className
      )}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-heading font-semibold text-foreground">{name}</p>
            <p className="text-muted text-xs">{state}</p>
          </div>
          <RiskPill level={riskLevel} />
        </div>

        <p className="font-heading text-5xl font-bold text-foreground mb-1">{riskScore}</p>
        <p className="text-muted text-xs mb-4">risk score / 100</p>

        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between text-muted">
            <span>24h rainfall</span>
            <span className="text-foreground">{rainfall24h.toFixed(1)}mm</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>7-day total</span>
            <span className="text-foreground">{rainfall7d.toFixed(1)}mm</span>
          </div>
        </div>

        {/* Sparkline - Color coded by rainfall - FULL WIDTH */}
        <div className="flex items-end gap-0.5 h-12 -mx-5 px-5 bg-background/30 rounded-b-lg">
          {mini.map((v, i) => (
            <div key={i} className="flex-1 rounded-sm rain-bar"
              style={{
                height: `${Math.min(100, v)}%`,
                background: v > 100 ? "#C0392B" : v > 80 ? "#E85D24" : v > 60 ? "#F0A500" : "#1A6FD4",
                opacity: 0.75,
                minHeight: "3px",
                boxShadow: `0 0 8px ${v > 80 ? "rgba(232, 93, 36, 0.3)" : v > 60 ? "rgba(240, 165, 0, 0.3)" : "rgba(26, 111, 212, 0.3)"}`,
                animationDelay: `${i * 0.06}s`
              }}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
