"use client";

import { useState, useEffect, useMemo } from "react";
import { DISTRICT_COORDS, type DistrictWeather } from "@/types";
import { Download, Share2, FileText } from "lucide-react";
import { getRiskLevel } from "@/lib/utils";

export default function ReportsPage() {
  type ReportType = "summary" | "state" | "comparative" | "trend" | "custom";
  const allDistrictKeys = Object.keys(DISTRICT_COORDS);
  const [districts, setDistricts] = useState<DistrictWeather[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(allDistrictKeys[0] ?? "jaipur");
  const [selectedState, setSelectedState] = useState<string>("Kerala");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(["kottayam", "wayanad"]);
  const [timeRange, setTimeRange] = useState<string>("12");
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>("summary");

  const reportTypes = [
    { id: "summary", label: "District Summary" },
    { id: "state", label: "State Overview" },
    { id: "comparative", label: "Comparative Analysis" },
    { id: "trend", label: "Historical Trend" },
    { id: "custom", label: "Custom" },
  ];

  const allDistrictNames = useMemo(
    () =>
      Object.keys(DISTRICT_COORDS)
        .map(key => ({ key, name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "), state: DISTRICT_COORDS[key].state }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const states = Array.from(new Set(allDistrictNames.map(d => d.state))).sort();

  const generateHistoricalData = (monthCount: number, districtKey: string) => {
    // Generate data based on time range with realistic variation
    const allMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const startMonth = now.getMonth() - monthCount + 1;
    
    const selectedMonths = [];
    for (let i = 0; i < monthCount; i++) {
      const idx = (startMonth + i + 12) % 12;
      selectedMonths.push(allMonths[idx]);
    }

    // Create consistent data per district, but varies by time range
    const districtHash = districtKey.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    
    return selectedMonths.map((m, i) => {
      // Base pattern: monsoon season (June-Sept) has more rain
      const monthNum = allMonths.indexOf(m);
      const monsoonFactor = (monthNum >= 5 && monthNum <= 8) ? 1.8 : 0.8;
      
      // More variation for longer time ranges
      const variance = Math.sin((i + districtHash) * 0.5) * 30 * (monthCount / 12);
      const rainfall = Math.max(10, (Math.sin((i + districtHash) * 0.3) * 40 + 60) * monsoonFactor + variance);
      // Keep synthetic risk conservative and rainfall-driven to avoid false "Critical" in dry periods.
      const risk = Math.max(0, Math.min(100, (rainfall / 180) * 100 + Math.sin((i + districtHash) * 0.2) * 6));
      
      return {
        month: m,
        rainfall: Math.round(rainfall * 10) / 10,
        risk: Math.round(risk)
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let districtList = [selectedDistrict];
        
        if (reportType === "state") {
          // Fetch all mapped districts in the selected state
          districtList = allDistrictNames.filter(d => d.state === selectedState).map(d => d.key);
        } else if (reportType === "comparative") {
          districtList = selectedDistricts;
        } else if (reportType === "trend" || reportType === "custom") {
          districtList = [selectedDistrict];
        }

        const queryDistricts = (districtList.length > 0 ? districtList : [selectedDistrict]).join(",");
        const res = await fetch(`/api/weather?districts=${queryDistricts}`, { cache: "no-store" });
        const data = await res.json();
        setDistricts(data?.districts ?? []);
      } catch (err) {
        console.error("Failed to load district data:", err);
      }
      setLoading(false);
    };
    loadData();
  }, [allDistrictNames, selectedDistrict, selectedState, selectedDistricts, reportType]);

  const avgRainfall = districts.length > 0 ? (districts.reduce((a, d) => a + d.rainfall7d, 0) / districts.length) : 0;
  const monthCount = Math.max(1, parseInt(timeRange, 10) || 1);
  const selectedHistorical = useMemo(
    () => generateHistoricalData(monthCount, selectedDistrict),
    [monthCount, selectedDistrict]
  );
  const historicalAvgRain = selectedHistorical.length
    ? selectedHistorical.reduce((a, d) => a + d.rainfall, 0) / selectedHistorical.length
    : 0;
  const historicalMaxRain = selectedHistorical.length ? Math.max(...selectedHistorical.map(d => d.rainfall)) : 0;
  const historicalMinRain = selectedHistorical.length ? Math.min(...selectedHistorical.map(d => d.rainfall)) : 0;
  const historicalAvgRisk = selectedHistorical.length
    ? selectedHistorical.reduce((a, d) => a + d.risk, 0) / selectedHistorical.length
    : 0;
  const liveDistrict = districts[0];
  const effectiveAvgRain = monthCount === 1 && liveDistrict ? liveDistrict.rainfall24h : historicalAvgRain;
  const effectivePeakRain = monthCount === 1 && liveDistrict ? liveDistrict.rainfall24h : historicalMaxRain;
  const effectiveAvgRisk = monthCount === 1 && liveDistrict ? liveDistrict.riskScore : historicalAvgRisk;
  const historicalRiskLevel =
    monthCount === 1 && liveDistrict
      ? liveDistrict.riskLevel
      : getRiskLevel(Math.round(effectiveAvgRisk));

  const handleDownloadCSV = () => {
    const report = reportType;
    let csvContent = "District Report Export\n";
    csvContent += `Report Type: ${report}\n`;
    csvContent += `Generated: ${new Date().toISOString()}\n\n`;

    if (report === "trend") {
      csvContent += "Month,Rainfall (mm),Risk Score\n";
      selectedHistorical.forEach(point => {
        csvContent += `${point.month},${point.rainfall},${point.risk}\n`;
      });
    } else if (report === "state") {
      csvContent += "District,State,Rainfall 7d (mm),Risk Score,Risk Level\n";
      districts.forEach(d => {
        csvContent += `${d.name},${d.state},${d.rainfall7d},${d.riskScore},${d.riskLevel}\n`;
      });
    } else {
      csvContent += "District,Rainfall 24h,Rainfall 7d,Temperature,Humidity,Risk Score,Risk Level\n";
      districts.forEach(d => {
        csvContent += `${d.name},${d.rainfall24h},${d.rainfall7d},${d.temperature},${d.humidity},${d.riskScore},${d.riskLevel}\n`;
      });
    }

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
    element.setAttribute("download", `floodsense-report-${reportType}-${Date.now()}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPDF = () => {
    alert(`PDF download for ${reportType} report coming soon! For now, use CSV export.`);
  };

  const handleShareLink = () => {
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/reports?type=${reportType}&district=${selectedDistrict}&state=${selectedState}&range=${timeRange}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Report link copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <div className="glass rounded-2xl p-4 space-y-0.5">
          {reportTypes.map((item) => (
            <button 
              key={item.id}
              type="button"
              onClick={() => setReportType(item.id as ReportType)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition cursor-pointer ${reportType === item.id ? "bg-primary/20 text-primary border-l-2 border-primary" : "text-muted hover:text-foreground hover:bg-white/5"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
            {reportType === "summary" && "District Summary"}
            {reportType === "state" && "State Overview"}
            {reportType === "comparative" && "Comparative Analysis"}
            {reportType === "trend" && "Historical Trend"}
            {reportType === "custom" && "Custom Report"}
          </h1>
          <p className="text-muted text-sm">
            {reportType === "summary" && "Detailed flood risk analysis for a single district"}
            {reportType === "state" && "Aggregated flood risk data for all districts in a state"}
            {reportType === "comparative" && "Compare rainfall and risk levels across multiple districts"}
            {reportType === "trend" && "Historical rainfall and risk trends over the selected period"}
            {reportType === "custom" && "Build custom reports with your own filters and data"}
          </p>
        </div>

        {/* District Summary View */}
        {reportType === "summary" && (
          <>
            <div className="glass rounded-xl p-4 flex flex-wrap gap-4 mb-8 items-center">
              <select 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer hover:border-primary/40 transition">
                {allDistrictNames.map(d => (
                  <option key={d.key} value={d.key}>{d.name} ({d.state})</option>
                ))}
              </select>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer hover:border-primary/40 transition">
                <option value="1">Last 1 month</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
              </select>
            </div>

            {!loading && districts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Avg Monthly Rainfall</p>
                    <p className="text-2xl font-bold text-primary">{effectiveAvgRain.toFixed(1)}mm</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Peak Monthly Rainfall</p>
                    <p className="text-2xl font-bold text-warning">{effectivePeakRain.toFixed(1)}mm</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Avg Risk Score</p>
                    <p className={`text-2xl font-bold ${effectiveAvgRisk >= 80 ? "text-critical" : effectiveAvgRisk >= 60 ? "text-danger" : effectiveAvgRisk >= 35 ? "text-warning" : "text-safe"}`}>{effectiveAvgRisk.toFixed(0)}/100</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Risk Level</p>
                    <p className={`text-xl font-bold ${historicalRiskLevel === "Critical" ? "text-critical" : historicalRiskLevel === "High" ? "text-danger" : historicalRiskLevel === "Medium" ? "text-warning" : "text-safe"}`}>{historicalRiskLevel}</p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 mb-8">
                  <h3 className="font-heading font-semibold text-foreground mb-4">Rainfall Trend ({timeRange} months)</h3>
                  <div className="flex items-end gap-2 h-64 bg-background/20 rounded-lg p-6 overflow-x-auto">
                    {selectedHistorical.length > 0 && (
                      selectedHistorical.map((point, i) => {
                        const maxRain = Math.max(...selectedHistorical.map(d => d.rainfall || 1));
                        const heightPercent = (point.rainfall / maxRain) * 100;
                        return (
                          <div key={`${point.month}-${i}`} className="flex-1 flex flex-col items-center relative group h-full justify-end">
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 glass rounded px-2 py-1 text-xs text-foreground pointer-events-none transition whitespace-nowrap z-10">{point.rainfall}mm</div>
                            <div 
                              className="w-full rounded-t transition-all duration-300" 
                              style={{ 
                                height: `${heightPercent}%`,
                                background: point.rainfall > 100 ? "#C0392B" : point.rainfall > 80 ? "#E85D24" : point.rainfall > 60 ? "#F0A500" : "#1A6FD4",
                                minHeight: "6px",
                                opacity: 0.85,
                                boxShadow: `0 0 12px ${point.rainfall > 80 ? "rgba(232, 93, 36, 0.4)" : point.rainfall > 60 ? "rgba(240, 165, 0, 0.4)" : "rgba(26, 111, 212, 0.4)"}`,
                                cursor: "pointer"
                              }} 
                            />
                            <div className="text-[10px] text-muted text-center font-medium">{point.month}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </>
            )}
          </>
        )}

        {/* State Overview View */}
        {reportType === "state" && (
          <>
            <div className="glass rounded-xl p-4 flex flex-wrap gap-4 mb-8 items-center">
              <select 
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer hover:border-primary/40 transition">
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {!loading && districts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">State Avg Rainfall (7d)</p>
                    <p className="text-2xl font-bold text-primary">{avgRainfall.toFixed(1)}mm</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">High Risk Districts</p>
                    <p className="text-2xl font-bold text-danger">{districts.filter(d => d.riskScore >= 60).length}</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Total Districts</p>
                    <p className="text-2xl font-bold text-safe">{districts.length}</p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 mb-8">
                  <h3 className="font-heading font-semibold text-foreground mb-4">Districts in {selectedState}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted text-xs uppercase tracking-wide border-b border-white/8">
                          <th className="text-left pb-3">District</th>
                          <th className="text-right pb-3">Rainfall 7d</th>
                          <th className="text-right pb-3">Risk Score</th>
                          <th className="text-right pb-3">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {districts.map(d => (
                          <tr key={d.name} className="hover:bg-white/5 transition">
                            <td className="py-3 text-foreground">{d.name}</td>
                            <td className="text-right py-3 text-foreground">{d.rainfall7d.toFixed(1)}mm</td>
                            <td className="text-right py-3 text-foreground">{d.riskScore}</td>
                            <td className="text-right py-3">
                              <span className={`text-xs font-semibold ${d.riskLevel === "Critical" ? "text-critical" : d.riskLevel === "High" ? "text-danger" : "text-safe"}`}>{d.riskLevel}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Comparative Analysis View */}
        {reportType === "comparative" && (
          <>
            <div className="glass rounded-xl p-4 mb-8">
              <p className="text-sm text-muted mb-3">Select up to 3 districts to compare:</p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {allDistrictNames.map(d => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDistricts(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key].slice(-3))}
                    className={`px-3 py-2 rounded-lg text-xs transition ${selectedDistricts.includes(d.key) ? "bg-primary/30 text-primary border border-primary" : "glass text-muted hover:text-foreground"}`}>
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {!loading && districts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {districts.map(d => (
                  <div key={d.name} className="glass rounded-2xl p-6">
                    <p className="font-heading font-semibold text-foreground mb-4">{d.name}</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted">Rainfall 24h</span><span className="text-foreground font-medium">{d.rainfall24h.toFixed(1)}mm</span></div>
                      <div className="flex justify-between"><span className="text-muted">Rainfall 7d</span><span className="text-foreground font-medium">{d.rainfall7d.toFixed(1)}mm</span></div>
                      <div className="flex justify-between"><span className="text-muted">Temperature</span><span className="text-foreground font-medium">{d.temperature}°C</span></div>
                      <div className="flex justify-between"><span className="text-muted">Risk Score</span><span className={`font-medium ${d.riskLevel === "Critical" ? "text-critical" : d.riskLevel === "High" ? "text-danger" : "text-safe"}`}>{d.riskScore}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Historical Trend View - FULL WIDTH BARS */}
        {reportType === "trend" && (
          <>
            <div className="glass rounded-xl p-4 flex flex-wrap gap-4 mb-8 items-center">
              <select 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer hover:border-primary/40 transition">
                {allDistrictNames.map(d => (
                  <option key={d.key} value={d.key}>{d.name} ({d.state})</option>
                ))}
              </select>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer hover:border-primary/40 transition">
                <option value="1">Last 1 month</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
              </select>
            </div>

            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="font-heading font-semibold text-foreground mb-4">Rainfall Trend ({timeRange} months)</h3>
              <div className="flex items-end gap-2 h-64 bg-background/20 rounded-lg p-4">
                {selectedHistorical.length > 0 && (
                  selectedHistorical.map((data, i) => {
                    const maxRain = Math.max(...selectedHistorical.map(d => d.rainfall || 1));
                    const heightPercent = (data.rainfall / maxRain) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group h-full justify-end">
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 glass rounded px-2 py-1 text-xs text-foreground pointer-events-none transition whitespace-nowrap z-10">{data.rainfall}mm</div>
                        <div 
                          className="w-full rounded-t transition-all duration-300" 
                          style={{ 
                            height: `${heightPercent}%`, 
                            background: data.rainfall > 100 ? "#C0392B" : data.rainfall > 80 ? "#E85D24" : data.rainfall > 60 ? "#F0A500" : "#1A6FD4",
                            minHeight: "4px",
                            opacity: 0.85,
                            boxShadow: `0 0 12px ${data.rainfall > 80 ? "rgba(232, 93, 36, 0.4)" : data.rainfall > 60 ? "rgba(240, 165, 0, 0.4)" : "rgba(26, 111, 212, 0.4)"}`,
                            cursor: "pointer" 
                          }} 
                        />
                        <div className="text-[10px] text-muted mt-2">{data.month}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">Highest Monthly</p>
                <p className="text-2xl font-bold text-danger">{historicalMaxRain.toFixed(0)}mm</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">Average Monthly</p>
                <p className="text-2xl font-bold text-warning">{historicalAvgRain.toFixed(0)}mm</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">Lowest Monthly</p>
                <p className="text-2xl font-bold text-safe">{historicalMinRain.toFixed(0)}mm</p>
              </div>
            </div>
          </>
        )}

        {/* Custom Report View */}
        {reportType === "custom" && (
          <>
            <div className="glass rounded-xl p-6 mb-8">
              <h3 className="font-heading font-semibold text-foreground mb-4">Custom Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-2 block">Select District</label>
                  <select 
                    value={selectedDistrict} 
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer">
                    {allDistrictNames.map(d => (
                      <option key={d.key} value={d.key}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted mb-2 block">Time Range</label>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer">
                    <option value="1">Last 1 month</option>
                    <option value="6">Last 6 months</option>
                    <option value="12">Last 12 months</option>
                  </select>
                </div>
              </div>
            </div>

            {!loading && districts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Avg Monthly Rainfall</p>
                    <p className="text-2xl font-bold text-primary">{effectiveAvgRain.toFixed(1)}mm</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Peak Monthly Rainfall</p>
                    <p className="text-2xl font-bold text-warning">{effectivePeakRain.toFixed(1)}mm</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Lowest Monthly Rainfall</p>
                    <p className="text-2xl font-bold text-safe">{historicalMinRain.toFixed(1)}mm</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs text-muted mb-1">Avg Risk (Selected Range)</p>
                    <p className="text-2xl font-bold text-foreground">{effectiveAvgRisk.toFixed(0)}/100</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Export */}
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={handleDownloadCSV} className="glass rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm text-muted hover:text-foreground hover:bg-white/5 active:scale-95 transition cursor-pointer">
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button type="button" onClick={handleDownloadPDF} className="glass rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm text-muted hover:text-foreground hover:bg-white/5 active:scale-95 transition cursor-pointer">
            <FileText className="w-4 h-4" /> Download PDF
          </button>
          <button type="button" onClick={handleShareLink} className="glass rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm text-muted hover:text-foreground hover:bg-white/5 active:scale-95 transition cursor-pointer">
            <Share2 className="w-4 h-4" /> Share Link
          </button>
        </div>
      </div>
    </div>
  );
}
