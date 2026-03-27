import { fetchMultipleDistricts, generateAlertsFromWeather, DEFAULT_DISTRICTS } from "@/lib/api";
import { auth } from "@/lib/auth";
import { RiskPill } from "@/components/RiskPill";
import { DistrictCard } from "@/components/DistrictCard";
import Link from "next/link";
import { AlertTriangle, Droplets, Waves, TrendingUp, Plus } from "lucide-react";
import { getRiskModelStatus } from "@/lib/riskModel";

export const dynamic = "force-dynamic";
export const revalidate = 900; // 15 min

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  // Fetch live weather data for default districts
  const districts = await fetchMultipleDistricts(DEFAULT_DISTRICTS);
  const alerts = generateAlertsFromWeather(districts);
  const modelStatus = getRiskModelStatus();

  const totalRainfall = districts.reduce((a, d) => a + d.rainfall24h, 0) / (districts.length || 1);
  const highRiskCount = districts.filter(d => d.riskScore >= 60).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-57px)] border-r border-white/5 p-6 shrink-0">
        <div className="mb-8">
          <p className="text-muted text-xs">{greeting},</p>
          <p className="font-heading font-semibold text-foreground text-lg">{firstName}</p>
          <p className="text-muted text-xs mt-0.5">Operator Status</p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="glass rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs text-muted">Districts</span>
            <span className="font-heading font-semibold text-foreground">{districts.length}</span>
          </div>
          <div className="glass rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs text-muted">Active Alerts</span>
            <span className={`font-heading font-semibold ${alerts.length > 0 ? "text-danger" : "text-safe"}`}>{String(alerts.length).padStart(2, "0")}</span>
          </div>
          <div className="glass rounded-xl p-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              Last Sync: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
            </div>
          </div>
        </div>

        <p className="text-xs text-muted uppercase tracking-widest mb-3">Pinned Districts</p>
        <div className="space-y-1 flex-1">
          {districts.slice(0, 4).map(d => (
            <Link key={d.name} href={`/district/${d.name.toLowerCase()}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition group">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.riskLevel === "Critical" ? "bg-critical" : d.riskLevel === "High" ? "bg-danger" : d.riskLevel === "Medium" ? "bg-warning" : "bg-safe"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{d.name}</p>
                <p className="text-xs text-muted truncate">{d.state}</p>
              </div>
              <RiskPill level={d.riskLevel} className="text-[10px] px-2 py-0.5" />
            </Link>
          ))}
        </div>

        <Link href="/my-districts" className="mt-4 flex items-center gap-2 text-xs text-primary hover:underline">
          <Plus className="w-3 h-3" /> Manage Districts
        </Link>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            { label: "National Alert Level", value: highRiskCount > 3 ? "HIGH" : highRiskCount > 1 ? "MODERATE" : "LOW", sub: `${highRiskCount} districts elevated`, icon: <AlertTriangle className="w-5 h-5 text-danger" />, border: "border-t-danger" },
            { label: "Districts in Red", value: String(highRiskCount).padStart(2, "0"), sub: "Across monitored districts", icon: <TrendingUp className="w-5 h-5 text-critical" />, border: "border-t-critical" },
            { label: "Avg Rainfall Today", value: `${totalRainfall.toFixed(0)}mm`, sub: "OpenWeatherMap live data", icon: <Droplets className="w-5 h-5 text-primary" />, border: "border-t-primary" },
            {
              label: "ML Model Training",
              value: modelStatus.ready ? "READY" : "LEARNING",
              sub: `${modelStatus.sampleCount}/${modelStatus.minSamplesForPredict} live samples`,
              icon: <Waves className="w-5 h-5 text-warning" />,
              border: "border-t-warning",
            },
          ].map(card => (
            <div key={card.label} className={`glass rounded-2xl p-5 border-t-2 ${card.border}`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-muted text-xs font-medium uppercase tracking-wide leading-tight">{card.label}</p>
                {card.icon}
              </div>
              <p className="font-heading text-4xl font-semibold text-foreground mb-1">{card.value}</p>
              <p className="text-muted text-xs">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Districts at a glance */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-semibold text-foreground text-lg">Your Districts at a Glance</h2>
            <Link href="/my-districts" className="text-primary text-sm hover:underline">VIEW ALL →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {districts.map(d => (
              <div key={d.name} className="min-w-[200px] shrink-0">
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

        {/* Bottom two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Mini map */}
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">National Risk Heatmap</h3>
              <Link href="/map" className="text-primary text-xs hover:underline">Full map →</Link>
            </div>
            <Link href="/map">
              <div className="rounded-xl h-48 overflow-hidden relative cursor-pointer hover:brightness-110 transition border border-white/5 bg-gradient-to-br from-[#0a1628] to-[#020B18]">
                <div className="absolute top-6 left-16 w-14 h-14 rounded-full bg-critical/40 blur-xl" />
                <div className="absolute top-10 right-24 w-10 h-10 rounded-full bg-warning/30 blur-lg" />
                <div className="absolute bottom-8 left-1/3 w-16 h-16 rounded-full bg-danger/30 blur-2xl" />
                {districts.map((d, i) => (
                  <div key={d.name} className="absolute w-3 h-3 rounded-full animate-pulse"
                    style={{
                      background: d.riskLevel === "Critical" ? "#C0392B" : d.riskLevel === "High" ? "#E85D24" : d.riskLevel === "Medium" ? "#F0A500" : "#1D9E75",
                      left: `${15 + i * 15}%`, top: `${25 + (i % 3) * 20}%`,
                    }} />
                ))}
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-muted text-xs">Click to open Live Map</p>
              </div>
            </Link>
          </div>

          {/* Latest alerts */}
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Latest Alerts Feed</h3>
              <Link href="/alerts" className="text-primary text-xs hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? alerts.slice(0, 3).map(a => (
                <div key={a.id} className={`border-l-2 pl-3 py-2 rounded-r-xl ${
                  a.severity === "Critical" ? "border-critical bg-critical/5" :
                  a.severity === "High"     ? "border-danger bg-danger/5" :
                  a.severity === "Medium"   ? "border-warning" : "border-safe"
                }`}>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-foreground">{a.district}</p>
                    <span className="text-xs text-muted">{a.source}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{a.body}</p>
                </div>
              )) : (
                <p className="text-muted text-sm py-4 text-center">No active alerts for your districts.</p>
              )}
            </div>
          </div>
        </div>

        {/* AI forecast */}
        {districts[0] && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-1">AI Risk Forecast — Next 72 Hours</h3>
            <p className="text-muted text-xs mb-5">
              Based on {districts[0].name}, {districts[0].state} — OpenWeatherMap live data · updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
            </p>
            <div className="h-24 flex items-end gap-1 mb-4">
              {districts[0].forecast.slice(0, 24).map((pt, i) => {
                const v = Math.min(100, pt.rain * 20);
                return (
                  <div key={i} className="flex-1 rounded-t-sm relative rain-bar rain-glow"
                    style={{ 
                      height: `${Math.max(4, v)}%`, 
                      background: v > 70 ? "#E85D24" : v > 40 ? "#F0A500" : "#1A6FD4", 
                      opacity: 0.7,
                      animationDelay: `${i * 0.05}s`
                    }}>
                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm" style={{ background: v > 70 ? "#E85D24" : v > 40 ? "#F0A500" : "#1A6FD4" }} />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted">
              <p className="flex gap-2"><span className="text-primary shrink-0">•</span>Current rainfall: <span className="text-foreground font-medium">{districts[0].rainfall24h.toFixed(1)}mm/24h</span></p>
              <p className="flex gap-2"><span className="text-warning shrink-0">•</span>7-day total: <span className="text-foreground font-medium">{districts[0].rainfall7d.toFixed(1)}mm</span></p>
              <p className="flex gap-2"><span className={districts[0].riskScore >= 60 ? "text-danger" : "text-safe"}>•</span>Risk: <span className="text-foreground font-medium">{districts[0].riskLevel} ({districts[0].riskScore}/100)</span></p>
            </div>
            <p className="text-xs text-muted mt-3">
              Prediction source: <span className="text-foreground">{districts[0].predictionSource ?? "rule_based"}</span> ·
              Model status: <span className="text-foreground">{modelStatus.ready ? "ready" : "training"}</span> ·
              Samples: <span className="text-foreground">{modelStatus.sampleCount}</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
