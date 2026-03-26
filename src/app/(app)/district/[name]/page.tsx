import { fetchDistrictWeather } from "@/lib/api";
import { DISTRICT_COORDS } from "@/types";
import { RiskPill } from "@/components/RiskPill";
import { RISK_COLORS } from "@/lib/utils";
import { ArrowLeft, Share2, Droplets, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 900;

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
  const riverPct = data.riverLevel && data.dangerMark ? data.riverLevel / data.dangerMark : 0;

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
              <span className="text-muted text-xs">Live · Open-Meteo</span>
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
          <div key={i} className="absolute w-px bg-blue-400/25"
            style={{ height: `${8 + Math.random() * 12}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`, animationDelay: `${Math.random() * 2}s` }} />
        ))}
        {/* Buildings SVG */}
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 500 200" preserveAspectRatio="xMidYMax slice">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={i * 42 + 5} y={200 - (30 + Math.random() * 60)} width={35} height={30 + Math.random() * 60}
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
            <div key={String(label)} className="mb-4 last:mb-0">
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
            Source: Open-Meteo API · Live
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

      {/* Causes / Effects / Mitigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { icon: <Droplets className="w-5 h-5 text-primary" />, title: "Causes", items: ["Prolonged heavy rainfall", "Upstream catchment overflow", "Poor drainage capacity", "Low-lying terrain"] },
          { icon: <AlertTriangle className="w-5 h-5 text-danger" />, title: "Effects", items: ["Inundation of low-lying areas", "Road/transport disruption", "Risk of waterborne disease", "Agricultural crop damage"] },
          { icon: <Shield className="w-5 h-5 text-safe" />, title: "Mitigation", items: ["Follow evacuation advisories", "Avoid flood-prone roads", "NDRF Helpline: 1078", `Relief centers: ${data.riskScore > 60 ? "4 active" : "On standby"}`] },
        ].map(card => (
          <div key={card.title} className="glass rounded-2xl p-6">
            <div className="mb-3">{card.icon}</div>
            <h3 className="font-heading font-semibold text-foreground mb-3">{card.title}</h3>
            <ul className="space-y-1.5">
              {card.items.map(item => <li key={item} className="text-muted text-sm flex gap-2"><span className="text-white/20 shrink-0">•</span>{item}</li>)}
            </ul>
          </div>
        ))}
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
