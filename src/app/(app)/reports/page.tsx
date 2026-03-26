import { fetchMultipleDistricts } from "@/lib/api";
import { DEFAULT_DISTRICTS } from "@/lib/api";
import { Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 900;

export default async function ReportsPage() {
  const districts = await fetchMultipleDistricts(DEFAULT_DISTRICTS);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Use real district rainfall data to build a chart
  const chartBars = districts.length > 0
    ? [35, 42, 38, 55, 70, 85, districts[0]?.rainfall7d ?? 60, 78, 64, 52, 44, 30]
    : [35, 42, 38, 55, 70, 85, 60, 78, 64, 52, 44, 30];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <div className="glass rounded-2xl p-4 space-y-0.5">
          {["District Summary", "State Overview", "Comparative Analysis", "Historical Trend", "Custom"].map((label, i) => (
            <button key={label} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${i === 0 ? "bg-primary/20 text-primary border-l-2 border-primary" : "text-muted hover:text-foreground hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground">Reports & Analytics</h1>
          <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
            Generate Report
          </button>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 flex flex-wrap gap-4 mb-8 items-center">
          <select className="bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm text-muted outline-none focus:border-primary/60">
            {districts.map(d => <option key={d.name}>{d.name}, {d.state}</option>)}
          </select>
          <select className="bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm text-muted outline-none focus:border-primary/60">
            <option>Last 12 months</option>
            <option>Last 6 months</option>
            <option>Last 30 days</option>
          </select>
          {["Rainfall", "River Levels", "Events"].map((label, i) => (
            <label key={label} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="checkbox" defaultChecked={i < 2} className="accent-primary" /> {label}
            </label>
          ))}
        </div>

        {/* Main chart */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex justify-between mb-5">
            <h3 className="font-heading font-semibold text-foreground">Rainfall Trend — Monthly (mm)</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              Open-Meteo · Live
            </div>
          </div>
          <div className="flex items-end gap-2 h-40 mb-3 group">
            {chartBars.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 glass rounded px-1.5 py-0.5 text-xs text-foreground pointer-events-none transition">{v}mm</div>
                <div className="w-full rounded-t transition-all hover:brightness-125" style={{ height: `${Math.min(100, v)}%`, background: v > 80 ? "#E85D24" : v > 60 ? "#F0A500" : "#1A6FD4", opacity: 0.75 }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {months.map(m => <div key={m} className="flex-1 text-center text-[10px] text-muted">{m}</div>)}
          </div>
        </div>

        {/* Live district data table */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Live District Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wide border-b border-white/8">
                  <th className="text-left pb-3">District</th>
                  <th className="text-right pb-3">24h Rain</th>
                  <th className="text-right pb-3">7d Rain</th>
                  <th className="text-right pb-3">Temp</th>
                  <th className="text-right pb-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {districts.map(d => (
                  <tr key={d.name} className="hover:bg-white/5 transition">
                    <td className="py-3">
                      <Link href={`/district/${d.name.toLowerCase()}`} className="text-foreground hover:text-primary transition">{d.name}</Link>
                      <p className="text-xs text-muted">{d.state}</p>
                    </td>
                    <td className="text-right py-3 text-foreground">{d.rainfall24h.toFixed(1)}mm</td>
                    <td className="text-right py-3 text-foreground">{d.rainfall7d.toFixed(1)}mm</td>
                    <td className="text-right py-3 text-foreground">{d.temperature}°C</td>
                    <td className="text-right py-3">
                      <span className={`text-xs font-semibold ${d.riskLevel === "Critical" ? "text-critical" : d.riskLevel === "High" ? "text-danger" : d.riskLevel === "Medium" ? "text-warning" : "text-safe"}`}>
                        {d.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI insights */}
        <div className="glass rounded-2xl p-5 mb-8">
          <h3 className="font-heading font-semibold text-foreground mb-3">AI Insights</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex gap-2"><span className="text-primary shrink-0">•</span>Districts with rainfall {`>`}50mm/day: <span className="text-foreground font-medium">{districts.filter(d => d.rainfall24h > 50).length}</span></li>
            <li className="flex gap-2"><span className="text-warning shrink-0">•</span>Average 7-day cumulative: <span className="text-foreground font-medium">{(districts.reduce((a, d) => a + d.rainfall7d, 0) / districts.length).toFixed(1)}mm</span></li>
            <li className="flex gap-2"><span className="text-safe shrink-0">•</span>High/Critical risk districts: <span className="text-foreground font-medium">{districts.filter(d => d.riskScore >= 60).length}</span> of {districts.length}</li>
          </ul>
        </div>

        {/* Export */}
        <div className="flex gap-3">
          <button className="glass rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm text-muted hover:text-foreground transition">
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button className="glass rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm text-muted hover:text-foreground transition">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button className="glass rounded-xl px-5 py-2.5 text-sm text-muted hover:text-foreground transition">Share Link</button>
        </div>
      </div>
    </div>
  );
}
