import { fetchMultipleDistricts, generateAlertsFromWeather, DEFAULT_DISTRICTS } from "@/lib/api";
import { RISK_COLORS } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 900;

const DISTRICT_POSITIONS: Record<string, { x: number; y: number }> = {
  guwahati:    { x: 77, y: 20 },
  darbhanga:   { x: 55, y: 30 },
  patna:       { x: 50, y: 34 },
  delhi:       { x: 34, y: 26 },
  jaipur:      { x: 28, y: 30 },
  lucknow:     { x: 45, y: 30 },
  jhansi:      { x: 42, y: 36 },
  mumbai:      { x: 22, y: 56 },
  pune:        { x: 25, y: 58 },
  nagpur:      { x: 40, y: 52 },
  ahmedabad:   { x: 20, y: 42 },
  surat:       { x: 20, y: 48 },
  hyderabad:   { x: 43, y: 62 },
  bangalore:   { x: 40, y: 72 },
  chennai:     { x: 50, y: 72 },
  kolkata:     { x: 65, y: 44 },
  bhubaneswar: { x: 62, y: 50 },
  kottayam:    { x: 36, y: 80 },
  wayanad:     { x: 34, y: 75 },
  dibrugarh:   { x: 83, y: 18 },
};

export default async function MapPage() {
  const districts = await fetchMultipleDistricts(DEFAULT_DISTRICTS);
  const alerts = generateAlertsFromWeather(districts);

  const topAtRisk = [...districts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 relative bg-[#020B18] overflow-hidden">
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.2" />
            </pattern>
            <radialGradient id="skyGlow" cx="35%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1A6FD4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#020B18" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          <rect width="100" height="100" fill="url(#skyGlow)" />

          {/* India rough outline */}
          <path d="M25 8 L40 5 L58 7 L72 12 L80 22 L85 36 L82 50 L78 62 L70 74 L62 84 L54 92 L46 88 L34 80 L24 70 L16 55 L15 40 L18 24 Z"
            fill="rgba(26,111,212,0.04)" stroke="rgba(26,111,212,0.25)" strokeWidth="0.4" />

          {/* Dynamic district circles from real API data */}
          {districts.map(d => {
            const pos = DISTRICT_POSITIONS[d.name.toLowerCase()] ?? { x: 50, y: 50 };
            const color = RISK_COLORS[d.riskLevel];
            const r = 4 + (d.riskScore / 100) * 6;
            return (
              <g key={d.name} className="cursor-pointer">
                <circle cx={pos.x} cy={pos.y} r={r} fill={color} fillOpacity={0.15} stroke={color} strokeWidth="0.4" />
                <circle cx={pos.x} cy={pos.y} r={r * 0.45} fill={color} fillOpacity={0.7} />
                <text x={pos.x} y={pos.y + r + 3.5} textAnchor="middle" fill="rgba(240,244,255,0.6)" fontSize="2.2">{d.name}</text>
              </g>
            );
          })}
        </svg>

        {/* Layer toggles */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {["Rainfall", "Rivers", "Satellite"].map(l => (
            <button key={l} className="glass rounded-xl px-3 py-2 text-xs text-muted hover:text-foreground transition">{l}</button>
          ))}
        </div>

        {/* Risk legend */}
        <div className="absolute bottom-4 left-4 glass rounded-xl px-4 py-3 z-20">
          <p className="text-xs text-muted mb-2">Risk Level</p>
          <div className="flex gap-3">
            {(["Low", "Medium", "High", "Critical"] as const).map(l => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[l] }} />
                <span className="text-xs text-muted">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source badge */}
        <div className="absolute top-4 right-4 glass rounded-full px-3 py-1.5 text-xs text-muted flex items-center gap-1.5 z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          Open-Meteo · Live
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-80 flex flex-col border-l border-white/5 bg-background/80 overflow-y-auto shrink-0">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-heading font-semibold text-foreground mb-1">National Status</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${alerts.length > 2 ? "bg-danger" : "bg-warning"}`} />
            <span className={`text-sm font-medium ${alerts.length > 2 ? "text-danger" : "text-warning"}`}>
              {alerts.length > 2 ? "HIGH ALERT" : alerts.length > 0 ? "ELEVATED" : "NORMAL"}
            </span>
          </div>
        </div>

        <div className="p-5 border-b border-white/5">
          <h3 className="text-xs text-muted uppercase tracking-widest mb-3">Top At-Risk Districts</h3>
          {topAtRisk.map((d, i) => (
            <Link key={d.name} href={`/district/${d.name.toLowerCase()}`} className="flex items-center gap-3 py-2.5 hover:bg-white/5 px-2 rounded-xl transition">
              <span className="text-xs text-muted w-4">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm text-foreground">{d.name}</p>
                <p className="text-xs text-muted">{d.state}</p>
              </div>
              <span className="text-sm font-semibold font-heading" style={{ color: RISK_COLORS[d.riskLevel] }}>{d.riskScore}</span>
            </Link>
          ))}
        </div>

        <div className="p-5 flex-1">
          <h3 className="text-xs text-muted uppercase tracking-widest mb-3">Live Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-muted text-sm">No active alerts.</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 4).map(a => (
                <div key={a.id} className={`border-l-2 pl-3 py-2 ${a.severity === "Critical" ? "border-critical" : a.severity === "High" ? "border-danger" : "border-warning"}`}>
                  <p className="text-xs font-medium text-foreground">{a.district}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/5">
          <Link href="/alerts" className="block w-full text-center py-2.5 glass rounded-xl text-sm text-primary hover:bg-primary/10 transition">
            View All Alerts →
          </Link>
        </div>
      </aside>
    </div>
  );
}
