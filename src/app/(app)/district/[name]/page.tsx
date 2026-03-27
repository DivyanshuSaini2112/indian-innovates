import { fetchDistrictWeather } from "@/lib/api";
import { RiskPill } from "@/components/RiskPill";
import { RISK_COLORS } from "@/lib/utils";
import { ArrowLeft, Share2, Droplets, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ControlMeasures } from "@/components/ControlMeasures";
import { estimateFloodLevelCm } from "@/lib/floodGuidance";

export const dynamic = "force-dynamic";
export const revalidate = 900;

function seeded01(seed: string) {
  // Deterministic pseudo-random in [0, 1), avoiding Math.random() during render.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Math.sin is pure; we only use it to derive a stable float.
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}

function seededRange(seed: string, min: number, max: number) {
  return min + seeded01(seed) * (max - min);
}

export default async function DistrictPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const data = await fetchDistrictWeather(name);
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted">
        <p className="text-4xl mb-4">🌊</p>
        <h1 className="font-heading text-xl font-semibold text-foreground mb-2">District Not Found</h1>
        <p className="mb-6">We don&apos;t have data for &quot;{displayName}&quot; yet.</p>
        <Link href="/my-districts" className="text-primary hover:underline">← Back to My Districts</Link>
      </div>
    );
  }

  const riskColor = RISK_COLORS[data.riskLevel];
  const floodLevelCm = estimateFloodLevelCm(data.riskScore);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-muted hover:text-foreground text-sm mb-4 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="font-heading text-5xl font-semibold text-foreground">{data.name}</h1>
            <RiskPill level={data.riskLevel} className="animate-pulse px-4 py-1.5 text-sm" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <span className="text-muted text-xs">
                Live · {data.weatherSource ?? "OpenWeatherMap"}
                {!data.openWeatherConfigured && (
                  <span className="block text-[11px] text-muted/80 mt-0.5">OpenWeather key not configured (server fallback)</span>
                )}
              </span>
            </div>
          </div>
          <p className="text-muted text-lg mt-1">{data.state}, India</p>
        </div>
        <button className="glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-muted hover:text-foreground transition">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {/* City flood scene — CSS animated */}
      <div className="rounded-2xl overflow-hidden mb-8 h-[320px] relative border border-white/5"
        style={{ background: data.riskScore > 75 ? "linear-gradient(180deg,#1a0505 0%,#2d0b0b 100%)" : data.riskScore > 50 ? "linear-gradient(180deg,#0f1a0a 0%,#1a2810 100%)" : "linear-gradient(180deg,#0a1628 0%,#020B18 100%)" }}>
        {/* Rain */}
        {data.rainfall24h > 20 && Array.from({ length: Math.min(60, data.rainfall24h * 0.5) }).map((_, i) => (
          <div key={i} className="absolute w-px bg-blue-400/25 rain-drop"
            style={{
              height: `${8 + seededRange(`${data.name}-rain-h-${i}`, 0, 1) * 12}px`,
              left: `${seededRange(`${data.name}-rain-left-${i}`, 0, 1) * 100}%`,
              top: `${seededRange(`${data.name}-rain-top-${i}`, 0, 1) * 80}%`,
              animationDuration: `${1.2 + seededRange(`${data.name}-rain-speed-${i}`, 0, 1) * 0.8}s`,
              animationDelay: `${seededRange(`${data.name}-rain-delay-${i}`, 0, 1) * 2}s`,
            }} />
        ))}
        {/* Buildings SVG */}
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 500 200" preserveAspectRatio="xMidYMax slice">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x={i * 42 + 5}
              y={200 - (30 + seededRange(`${data.name}-b-y-${i}`, 0, 1) * 60)}
              width={35}
              height={30 + seededRange(`${data.name}-b-h-${i}`, 0, 1) * 60}
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" rx="2" />
          ))}
          {/* Water level */}
          <rect x={0} y={200 - Math.min(80, data.riskScore * 0.8)} width={500} height={200}
            fill={`rgba(26, 111, 212, ${0.15 + data.riskScore * 0.003})`} />
        </svg>
        {/* Info overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-5 py-1.5 text-xs text-muted">
          Flood risk: <span className="font-semibold" style={{ color: riskColor }}>{data.riskScore}/100</span>
          {" · "}{data.riskLevel.toUpperCase()}
        </div>
      </div>

      {/* Data cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Rainfall */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" /> Rainfall Stats
          </h3>
          {[["24 Hours", data.rainfall24h], ["7 Days", data.rainfall7d], ["30 Days (est.)", data.rainfall30d]].map(([label, val]) => (
            <div key={String(label)} className="mb-4 last:mb-0 rainfall-stat">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted">{label}</span>
                <span className="text-foreground font-medium">{Number(val).toFixed(1)}mm</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${Math.min(100, Number(val) / 12)}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-white/8 text-xs text-muted flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            Source: {data.weatherSource ?? "OpenWeatherMap"} · Live
          </div>
        </div>

        {/* Conditions */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Current Conditions</h3>
          <div className="space-y-3 text-sm">
            {[
              ["🌡️", "Temperature", `${data.temperature}°C`],
              ["💧", "Humidity", `${data.humidity}%`],
              ["💨", "Wind Speed", `${data.windSpeed} km/h`],
              ["🎯", "Risk Score", `${data.riskScore}/100`],
            ].map(([icon, label, val]) => (
              <div key={label} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                <span className="flex items-center gap-2 text-muted"><span>{icon}</span>{label}</span>
                <span className="text-foreground font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> AI Analysis
          </h3>
          <p className="text-muted text-sm leading-relaxed mb-3">
            Based on <span className="text-foreground font-medium">{data.rainfall24h.toFixed(1)}mm</span> of rainfall in the past 24 hours and a 7-day accumulation of <span className="text-foreground font-medium">{data.rainfall7d.toFixed(1)}mm</span>, the flood risk in {data.name} is classified as{" "}
            <span className="font-semibold" style={{ color: riskColor }}>{data.riskLevel.toUpperCase()}</span>.
          </p>
          {data.riskScore >= 60 && (
            <p className="text-muted text-sm leading-relaxed">
              {data.riskScore >= 80
                ? "⚠️ Immediate action recommended. Low-lying areas should be evacuated."
                : "⚡ Caution advised. Monitor official channels and avoid flood-prone areas."}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-white/8">
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${data.riskScore}%`, background: `linear-gradient(to right, #1D9E75, #F0A500, ${riskColor})` }} />
            </div>
            <div className="flex justify-between text-xs text-muted mt-1"><span>0</span><span>100</span></div>
          </div>
        </div>
      </div>

      {/* Control measures tuned to flood level */}
      <div className="mb-8">
        <ControlMeasures
          district={data.name}
          state={data.state}
          riskLevel={data.riskLevel}
          riskScore={data.riskScore}
          floodLevelCm={data.floodLevelCm ?? floodLevelCm}
        />
      </div>

      {/* 72h forecast chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">72-Hour Rainfall Forecast</h3>
        <div className="flex items-end gap-1 h-32 mb-3">
          {data.forecast.slice(0, 36).map((pt, i) => {
            const v = Math.min(100, pt.rain * 30);
            return (
              <div key={i} className="flex-1 rounded-t-sm"
                style={{ height: `${Math.max(3, v)}%`, background: v > 60 ? "#E85D24" : v > 30 ? "#F0A500" : "#1A6FD4", opacity: 0.7 }} />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>Now</span><span>+12h</span><span>+24h</span><span>+36h</span><span>+48h</span><span>+72h</span>
        </div>
      </div>
    </div>
  );
}
