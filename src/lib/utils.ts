import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compute a 0-100 risk score from rainfall data */
export function computeRiskScore(rainfall24h: number, rainfall7d: number): number {
  // IMD thresholds: Heavy = 64.5mm, Very Heavy = 115.6mm, Extremely Heavy = 204.4mm
  const score24h = Math.min(100, (rainfall24h / 200) * 100);
  const score7d   = Math.min(100, (rainfall7d  / 500) * 70);
  return Math.round(score24h * 0.6 + score7d * 0.4);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low:      "#1D9E75",
  Medium:   "#F0A500",
  High:     "#E85D24",
  Critical: "#C0392B",
};

export const RISK_PILL_CLASS: Record<RiskLevel, string> = {
  Low:      "bg-safe/20 text-safe border-safe/30",
  Medium:   "bg-warning/20 text-warning border-warning/30",
  High:     "bg-danger/20 text-danger border-danger/30",
  Critical: "bg-critical/20 text-critical border-critical/30",
};

export function formatRainfall(mm: number): string {
  return `${mm.toFixed(1)}mm`;
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
