import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compute a 0-100 risk score from rainfall data */
export function computeRiskScore(rainfall24h: number, rainfall7d: number): number {
  // IMD thresholds: Heavy = 64.5mm, Very Heavy = 115.6mm, Extremely Heavy = 204.4mm
  // More aggressive scoring to properly classify high rainfall districts as high risk
  
  // 24h component: weighted heavily since intense rainfall is immediate danger
  let score24h: number;
  if (rainfall24h < 20) {
    score24h = (rainfall24h / 20) * 20; // 0-20mm → 0-20 points
  } else if (rainfall24h < 65) {
    score24h = 20 + ((rainfall24h - 20) / 45) * 30; // 20-65mm → 20-50 points
  } else if (rainfall24h < 115) {
    score24h = 50 + ((rainfall24h - 65) / 50) * 30; // 65-115mm → 50-80 points
  } else {
    score24h = 80 + Math.min(20, ((rainfall24h - 115) / 100) * 20); // 115mm+ → 80-100 points
  }
  
  // 7d component: captures sustained rainfall patterns
  let score7d: number;
  if (rainfall7d < 100) {
    score7d = (rainfall7d / 100) * 25; // 0-100mm → 0-25 points
  } else if (rainfall7d < 300) {
    score7d = 25 + ((rainfall7d - 100) / 200) * 30; // 100-300mm → 25-55 points
  } else if (rainfall7d < 500) {
    score7d = 55 + ((rainfall7d - 300) / 200) * 25; // 300-500mm → 55-80 points
  } else {
    score7d = 80 + Math.min(20, ((rainfall7d - 500) / 300) * 20); // 500mm+ → 80-100 points
  }
  
  // Weighted combination: 65% 24h (immediate threat), 35% 7d (sustained)
  return Math.round(score24h * 0.65 + score7d * 0.35);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
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
