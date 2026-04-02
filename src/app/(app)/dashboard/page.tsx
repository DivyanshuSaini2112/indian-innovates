import { fetchMultipleDistricts, generateAlertsFromWeather, DEFAULT_DISTRICTS } from "@/lib/api";
import { auth } from "@/lib/auth";
import { DistrictCard } from "@/components/DistrictCard";
import { AlertTicker, StatCard } from "@/components/AnimatedUI";
import Link from "next/link";
import { AlertTriangle, Droplets, Waves, TrendingUp, Plus, Activity } from "lucide-react";
import { getRiskModelStatus } from "@/lib/riskModel";
import { RISK_COLORS } from "@/lib/utils";

export const dynamic   = "force-dynamic";
export const revalidate = 900;

export default async function DashboardPage() {
  const session     = await auth();
  const firstName   = session?.user?.name?.split(" ")[0] ?? "there";

  const districts   = await fetchMultipleDistricts(DEFAULT_DISTRICTS);
  const alerts      = generateAlertsFromWeather(districts);
  const modelStatus = getRiskModelStatus();

  const totalRainfall = districts.reduce((a, d) => a + d.rainfall24h, 0) / (districts.length || 1);
  const highRiskCount = districts.filter(d => d.riskScore >= 60).length;
  const avgRiskScore  = Math.round(districts.reduce((a, d) => a + d.riskScore, 0) / (districts.length || 1));

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* Alert ticker items */
  const tickerItems = districts
    .filter(d => d.riskScore >= 50)
    .sort((a, b) => b.riskScore - a.riskScore)
    .map(d => ({ district: d.name, riskLevel: d.riskLevel, riskScore: d.riskScore, state: d.state }));

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)]">

      {/* Alert ticker — full width */}
      {tickerItems.length > 0 && <AlertTicker items={tickerItems} />}

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 border-r shrink-0 p-6"
          style={{ borderColor: "rgba(255,255,255,.06)", background: "rgba(6,15,28,.6)" }}>

          {/* Greeting */}
          <div className="mb-8">
            <p className="text-muted text-xs">{greeting},</p>
            <p className="font-heading font-bold text-foreground text-lg mt-0.5 capitalize">{firstName}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              <span className="text-[11px] text-muted">Operator · Active</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="space-y-2 mb-8">
            {[
              { label: "Districts Monitored", val: String(districts.length), color: "#2DD4BF" },
              { label: "Active Alerts",        val: String(alerts.length).padStart(2,"0"), color: alerts.length > 0 ? "#FF5757" : "#10B981" },
              { label: "Avg Risk Score",       val: `${avgRiskScore}/100`,   color: avgRiskScore > 50 ? "#FBBF24" : "#10B981" },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-3 flex justify-between items-center fade-in-up">
                <span className="text-xs text-muted">{s.label}</span>
                <span className="font-heading font-bold text-sm tabular-nums" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
            <div className="glass-card rounded-xl p-3 text-xs text-muted flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-safe shrink-0" />
              Synced {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
            </div>
          </div>

          <p className="text-[10px] text-muted uppercase tracking-widest mb-3">Pinned Districts</p>
          <div className="space-y-1 flex-1">
            {districts.slice(0, 5).map(d => (
              <Link key={d.name} href={`/district/${d.name.toLowerCase()}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition group">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: RISK_COLORS[d.riskLevel], boxShadow: `0 0 6px ${RISK_COLORS[d.riskLevel]}` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate group-hover:text-primary transition">{d.name}</p>
                  <p className="text-[10px] text-muted truncate">{d.state}</p>
                </div>
                <span className="text-[10px] font-bold shrink-0" style={{ color: RISK_COLORS[d.riskLevel] }}>
                  {d.riskScore}
                </span>
              </Link>
            ))}
          </div>

          <Link href="/my-districts" className="mt-4 flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="w-3 h-3" /> Manage Districts
          </Link>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">

          {/* Header */}
          <div className="mb-8 slide-in-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              <span className="text-xs text-muted">Live Dashboard</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">National Flood Overview</h1>
            <p className="text-muted text-sm mt-1">
              Real-time data across {districts.length} monitored districts · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          {/* Animated stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="National Alert Level"
              value={highRiskCount > 3 ? 3 : highRiskCount > 1 ? 2 : 1}
              suffix={highRiskCount > 3 ? " HIGH" : highRiskCount > 1 ? " MOD" : " LOW"}
              sub={`${highRiskCount} districts elevated`}
              icon={<AlertTriangle className="w-5 h-5" style={{ color: "#FF5757" }} />}
              accentColor="#FF5757"
              delay={0}
            />
            <StatCard
              label="Districts in Red"
              value={highRiskCount}
              sub="Across monitored districts"
              icon={<TrendingUp className="w-5 h-5" style={{ color: "#F97316" }} />}
              accentColor="#F97316"
              delay={100}
            />
            <StatCard
              label="Avg Rainfall Today"
              value={totalRainfall}
              suffix="mm"
              decimals={1}
              sub="Open-Meteo live data"
              icon={<Droplets className="w-5 h-5" style={{ color: "#2DD4BF" }} />}
              accentColor="#2DD4BF"
              delay={200}
            />
            <StatCard
              label="ML Model Training"
              value={modelStatus.sampleCount}
              sub={`/ ${modelStatus.minSamplesForPredict} samples needed`}
              icon={<Waves className="w-5 h-5" style={{ color: "#FBBF24" }} />}
              accentColor="#FBBF24"
              delay={300}
            />
          </div>

          {/* Districts at a glance */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading font-semibold text-foreground">Districts at a Glance</h2>
              <Link href="/my-districts" className="text-primary text-xs font-medium hover:underline">VIEW ALL →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {districts.map((d, i) => (
                <div key={d.name} className="min-w-[200px] shrink-0 fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <DistrictCard
                    name={d.name} state={d.state}
                    riskScore={d.riskScore} riskLevel={d.riskLevel}
                    rainfall24h={d.rainfall24h} rainfall7d={d.rainfall7d}
                    forecast={d.forecast.slice(-7).map(f => f.rain * 10)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Mini heatmap */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between mb-4">
                <h3 className="font-heading font-semibold text-foreground">National Risk Heatmap</h3>
                <Link href="/map" className="text-primary text-xs hover:underline">Full map →</Link>
              </div>
              <Link href="/map">
                <div className="rounded-xl h-48 relative overflow-hidden cursor-pointer hover:brightness-110 transition border"
                  style={{ background: "linear-gradient(135deg,#071220,#020B18)", borderColor: "rgba(255,255,255,.06)" }}>
                  {/* Glow blobs */}
                  <div className="absolute top-4 left-12 w-20 h-20 rounded-full blur-2xl opacity-40" style={{ background: "#a855f7" }} />
                  <div className="absolute top-12 right-20 w-14 h-14 rounded-full blur-xl opacity-35" style={{ background: "#FBBF24" }} />
                  <div className="absolute bottom-6 left-1/3 w-20 h-20 rounded-full blur-2xl opacity-30" style={{ background: "#FF5757" }} />

                  {/* Pulse dots */}
                  {districts.slice(0, 12).map((d, i) => (
                    <div key={d.name} className="absolute w-3 h-3 rounded-full animate-pulse"
                      style={{
                        background: RISK_COLORS[d.riskLevel],
                        boxShadow: `0 0 8px ${RISK_COLORS[d.riskLevel]}`,
                        left: `${10 + (i % 6) * 15}%`,
                        top:  `${20 + Math.floor(i / 6) * 35}%`,
                      }} />
                  ))}
                  <div className="absolute inset-0 flex items-end justify-center pb-3">
                    <span className="text-muted text-xs px-3 py-1 rounded-full"
                      style={{ background: "rgba(6,15,28,.7)", backdropFilter: "blur(8px)" }}>
                      Click to open Live Map →
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Latest alerts */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between mb-4">
                <h3 className="font-heading font-semibold text-foreground">Latest Alerts Feed</h3>
                <Link href="/alerts" className="text-primary text-xs hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {alerts.length > 0 ? alerts.slice(0, 3).map((a, i) => {
                  const borderCol = a.severity === "Critical" ? "#a855f7" : a.severity === "High" ? "#FF5757" : a.severity === "Medium" ? "#FBBF24" : "#10B981";
                  return (
                    <div key={a.id} className="border-l-2 pl-3 py-2 rounded-r-xl fade-in-up"
                      style={{ borderLeftColor: borderCol, background: `${borderCol}08`, animationDelay: `${i * 80}ms` }}>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-foreground">{a.district}</p>
                        <span className="text-[10px] font-bold" style={{ color: borderCol }}>{a.severity}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{a.body}</p>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,.12)" }}>
                      <span className="text-lg">✅</span>
                    </div>
                    <p className="text-muted text-sm">No active alerts for your districts.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI forecast chart */}
          {districts[0] && (
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-heading font-semibold text-foreground">AI Risk Forecast — Next 24 Hours</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                  style={{
                    background: `${RISK_COLORS[districts[0].riskLevel]}15`,
                    color: RISK_COLORS[districts[0].riskLevel],
                    border: `1px solid ${RISK_COLORS[districts[0].riskLevel]}30`,
                  }}>
                  {districts[0].riskLevel} Risk
                </span>
              </div>
              <p className="text-muted text-xs mb-5">
                Based on <span className="text-foreground font-medium">{districts[0].name}, {districts[0].state}</span> · Open-Meteo live · Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
              </p>

              {/* Forecast bars */}
              <div className="h-24 flex items-end gap-0.5 mb-3">
                {districts[0].forecast.slice(0, 24).map((pt, i) => {
                  const v  = Math.min(100, pt.rain * 20);
                  const bg = v > 70 ? "#FF5757" : v > 40 ? "#FBBF24" : "#1A6FD4";
                  return (
                    <div key={i} className="flex-1 rounded-t-sm rain-bar rain-glow relative"
                      style={{ height: `${Math.max(4, v)}%`, background: bg, opacity: .8, animationDelay: `${i * .04}s` }}>
                      <div className="absolute inset-x-0 top-0 h-px rounded-t-sm" style={{ background: bg, boxShadow: `0 0 4px ${bg}` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-muted mb-4">
                <span>Now</span><span>+6h</span><span>+12h</span><span>+18h</span><span>+24h</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { dot: "#2DD4BF", label:"24h Rainfall",  val:`${districts[0].rainfall24h.toFixed(1)}mm` },
                  { dot: "#FBBF24", label:"7-Day Total",    val:`${districts[0].rainfall7d.toFixed(1)}mm` },
                  { dot: RISK_COLORS[districts[0].riskLevel], label:"Risk Score", val:`${districts[0].riskScore}/100` },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 bg-white/4 rounded-xl p-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot, boxShadow: `0 0 6px ${item.dot}` }} />
                    <div>
                      <p className="text-muted text-[10px]">{item.label}</p>
                      <p className="text-foreground font-semibold">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted mt-3">
                Source: <span className="text-foreground">{districts[0].predictionSource ?? "rule_based"}</span> ·
                Model: <span className="text-foreground">{modelStatus.ready ? "ready" : "training"}</span> ·
                Samples: <span className="text-foreground">{modelStatus.sampleCount}</span>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
