"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DistrictWeather } from "@/types";
import { DISTRICT_COORDS } from "@/types";
import Link from "next/link";
import {
  AlertTriangle, Droplets, Waves, TrendingUp,
  ChevronRight, X, Layers, ZoomIn, ZoomOut,
  Locate, Activity,
} from "lucide-react";

/* ─── risk palette ─────────────────────────────────── */
const RISK_HEX: Record<string, string> = {
  Low:      "#22c55e",
  Medium:   "#f59e0b",
  High:     "#ef4444",
  Critical: "#a855f7",
};

type LayerMode = "risk" | "rainfall" | "temperature";
type TileMode  = "dark" | "satellite";

/* ─── tiny helpers ──────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const win = () => (window as any).L as L;

/* ─── component ─────────────────────────────────────── */
interface Props {
  initialDistricts: DistrictWeather[];
}

export default function MapClient({ initialDistricts }: Props) {
  const mapEl      = useRef<HTMLDivElement>(null);
  const mapObj     = useRef<L>(null);
  const markers    = useRef<L[]>([]);
  const tileLayer  = useRef<L>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [districts,    setDistricts]    = useState<DistrictWeather[]>(initialDistricts);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState<DistrictWeather | null>(null);
  const [layerMode,    setLayerMode]    = useState<LayerMode>("risk");
  const [tileMode,     setTileMode]     = useState<TileMode>("dark");

  const stats = (() => {
    const alerts   = districts.filter(d => d.riskScore >= 50).length;
    const highRisk = districts.filter(d => d.riskScore >= 60).length;
    const avgRisk  = Math.round(districts.reduce((a, d) => a + d.riskScore, 0) / Math.max(1, districts.length));
    return { alerts, highRisk, avgRisk };
  })();

  /* ── 1. Load Leaflet CSS + JS from CDN ────────────── */
  useEffect(() => {
    // If already loaded (e.g. HMR), flip ready immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).L) { setLeafletReady(true); return; }

    if (!document.getElementById("lf-css")) {
      const css = document.createElement("link");
      css.id    = "lf-css";
      css.rel   = "stylesheet";
      css.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }

    if (!document.getElementById("lf-js")) {
      const js  = document.createElement("script");
      js.id     = "lf-js";
      js.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(js);
    }

    // Poll until window.L is defined (avoids onload race condition)
    const poll = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).L) { clearInterval(poll); setLeafletReady(true); }
    }, 100);
    return () => clearInterval(poll);
  }, []);

  /* ── 2. Init map once Leaflet is ready ────────────── */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!leafletReady || !L || !mapEl.current || mapObj.current) return;

    const map = L.map(mapEl.current, {
      center:           [22.5, 82.5],
      zoom:             5,
      zoomControl:      false,
      attributionControl: true,
      minZoom:          4,
      maxZoom:          13,
    });

    tileLayer.current = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19,
        attribution: '© <a href="https://openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>' }
    ).addTo(map);

    mapObj.current = map;
  }, [leafletReady]);

  /* ── 3. Fetch live data from API ──────────────────── */
  useEffect(() => {
    if (!leafletReady) return;
    const keys = Object.keys(DISTRICT_COORDS).join(",");
    fetch(`/api/weather?districts=${keys}`)
      .then(r => r.json())
      .then(r => { setDistricts(r.districts ?? initialDistricts); setLoading(false); })
      .catch(() => { setDistricts(initialDistricts); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  /* ── 4. Place / refresh markers ───────────────────── */
  const rebuildMarkers = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!mapObj.current || !leafletReady || !L || districts.length === 0) return;
    const map = mapObj.current;

    markers.current.forEach(m => m.remove());
    markers.current = [];

    districts.forEach(d => {
      const key   = d.name.toLowerCase();
      const coord = DISTRICT_COORDS[key];
      if (!coord) return;

      const color = RISK_HEX[d.riskLevel] ?? "#22c55e";
      const value =
        layerMode === "risk"        ? d.riskScore :
        layerMode === "rainfall"    ? Math.min(100, d.rainfall24h * 2) :
        Math.min(100, ((d.temperature - 10) / 30) * 100);

      const r    = 8 + (value / 100) * 18;
      const glow = d.riskScore >= 60;

      const html = `
        <div style="position:relative;width:${r*3}px;height:${r*3}px;display:flex;align-items:center;justify-content:center;">
          ${glow ? `
            <div class="mk-pulse" style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.1;"></div>
            <div class="mk-pulse2" style="position:absolute;inset:${r*0.4}px;border-radius:50%;background:${color};opacity:0.18;"></div>
          ` : ""}
          <div style="width:${r}px;height:${r}px;border-radius:50%;background:${color};
                      opacity:${0.6 + (value/100)*0.35};
                      box-shadow:0 0 ${glow ? 18 : 8}px ${color};
                      border:2px solid rgba(255,255,255,0.35);
                      position:relative;z-index:2;">
            <div style="position:absolute;inset:25%;border-radius:50%;background:rgba(255,255,255,0.85);"></div>
          </div>
        </div>`;

      const icon = L.divIcon({
        html,
        className:  "",
        iconSize:   [r * 3, r * 3],
        iconAnchor: [r * 1.5, r * 1.5],
      });

      const marker = L.marker([coord.lat, coord.lon], { icon })
        .addTo(map)
        .on("click", () => {
          setSelected(d);
          map.flyTo([coord.lat, coord.lon], Math.max(map.getZoom(), 7), { duration: 0.9 });
        });

      marker.bindTooltip(`
        <div style="background:#0d1b2a;border:1px solid rgba(255,255,255,0.1);
                    padding:8px 11px;border-radius:10px;color:#f5f7ff;
                    font-family:system-ui;min-width:150px;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
          <div style="font-weight:700;font-size:13px;">${d.name}</div>
          <div style="font-size:11px;color:#94a3b8;">${d.state}</div>
          <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 6px ${color};"></span>
            <span style="font-weight:600;color:${color};font-size:12px;">${d.riskLevel} · ${d.riskScore}/100</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:3px;">
            Rain: ${d.rainfall24h.toFixed(1)}mm/24h · ${d.temperature}°C
          </div>
        </div>`, {
        permanent:  false,
        direction:  "top",
        offset:     [0, -(r * 1.5 + 6)],
        opacity:    1,
        className:  "lf-tt",
      });

      markers.current.push(marker);
    });
  }, [districts, layerMode, leafletReady]);

  useEffect(() => { rebuildMarkers(); }, [rebuildMarkers]);

  /* ── 5. Switch tile layer ─────────────────────────── */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!mapObj.current || !leafletReady || !L) return;
    const map = mapObj.current;
    if (tileLayer.current) tileLayer.current.remove();

    const url = tileMode === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    tileLayer.current = L.tileLayer(url, {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: tileMode === "dark"
        ? '© <a href="https://openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>'
        : "© Esri",
    }).addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileMode, leafletReady]);

  /* ── map control helpers ──────────────────────────── */
  const zoomIn  = () => mapObj.current?.zoomIn();
  const zoomOut = () => mapObj.current?.zoomOut();
  const reset   = () => mapObj.current?.flyTo([22.5, 82.5], 5, { duration: 1.2 });
  const flyTo   = (lat: number, lon: number) =>
    mapObj.current?.flyTo([lat, lon], Math.max(mapObj.current.getZoom(), 7), { duration: 0.9 });

  /* ── derived lists ────────────────────────────────── */
  const topRisk  = [...districts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);
  const alertList = districts.filter(d => d.riskScore >= 50)
                              .sort((a, b) => b.riskScore - a.riskScore);

  /* ─────────────────────────────── RENDER ─────────── */
  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden bg-[#020B18] relative">

      {/* Global styles injected once */}
      <style>{`
        @keyframes mk-pulse {
          0%,100% { transform:scale(1);   opacity:.10; }
          50%      { transform:scale(1.8); opacity:0;   }
        }
        @keyframes mk-pulse2 {
          0%,100% { transform:scale(1);   opacity:.18; }
          50%      { transform:scale(1.5); opacity:0;   }
        }
        @keyframes scan { 0%{top:-2px;opacity:0} 5%{opacity:.35} 95%{opacity:.35} 100%{top:100%;opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }

        .mk-pulse  { animation: mk-pulse  2.2s ease-in-out infinite; }
        .mk-pulse2 { animation: mk-pulse2 2.2s ease-in-out infinite .5s; }
        .scan-bar  { position:absolute;left:0;right:0;height:2px;
                     background:linear-gradient(90deg,transparent,rgba(45,212,191,.35),transparent);
                     animation:scan 5s ease-in-out infinite;pointer-events:none;z-index:10; }
        .fade-up   { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) forwards; }
        .slide-r   { animation:slideRight .35s cubic-bezier(.16,1,.3,1) forwards; }

        .lf-tt { background:transparent!important;border:none!important;
                 box-shadow:none!important;padding:0!important; }
        .leaflet-container { background:#020B18!important; }
        .leaflet-control-attribution {
          background:rgba(2,11,24,.85)!important;color:#475569!important;
          font-size:9px!important;border-radius:6px 0 0 0!important;
          backdrop-filter:blur(8px);
        }
        .leaflet-control-attribution a { color:#2dd4bf!important; }

        .map-sb::-webkit-scrollbar { width:3px; }
        .map-sb::-webkit-scrollbar-thumb { background:rgba(45,212,191,.3);border-radius:99px; }
      `}</style>

      {/* ════════ MAP CANVAS ════════ */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapEl} className="absolute inset-0 z-0" />
        <div className="scan-bar" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020B18]/95">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-t-2 border-warning/60 animate-spin"
                style={{ animationDirection: "reverse", animationDuration: ".8s" }} />
            </div>
            <p className="text-primary font-semibold text-sm tracking-widest uppercase">Loading Live Data</p>
            <p className="text-muted text-xs mt-1">
              Fetching {Object.keys(DISTRICT_COORDS).length} districts…
            </p>
          </div>
        )}

        {/* Top HUD ─────────────────────────────── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 fade-up">
          <div className="flex items-center gap-4 px-5 py-2.5 rounded-2xl"
            style={{ background: "rgba(2,11,24,.88)", backdropFilter: "blur(20px)",
                     border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-warning" : "bg-safe"} animate-pulse`} />
              <span className="text-xs font-medium text-muted">{loading ? "Fetching…" : "Live"}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-xs text-muted">{districts.length} districts</span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-xs font-semibold"
              style={{ color: stats.highRisk > 3 ? "#ef4444" : "#f59e0b" }}>
              {stats.highRisk} high-risk
            </span>
          </div>
        </div>

        {/* Layer Controls ─ top-left ───────────── */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 fade-up">
          {/* Tile toggle */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(2,11,24,.88)", backdropFilter: "blur(20px)",
                     border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Basemap
              </p>
            </div>
            {(["dark", "satellite"] as TileMode[]).map(t => (
              <button key={t} onClick={() => setTileMode(t)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs transition-all hover:bg-white/5"
                style={{
                  color:       tileMode === t ? "#2dd4bf" : "#94a3b8",
                  fontWeight:  tileMode === t ? 600 : 400,
                  borderLeft:  tileMode === t ? "2px solid #2dd4bf" : "2px solid transparent",
                }}>
                {t === "dark" ? "🌑 Dark" : "🛰 Satellite"}
              </button>
            ))}
          </div>

          {/* Data layer */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(2,11,24,.88)", backdropFilter: "blur(20px)",
                     border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Data Layer</p>
            </div>
            {([
              { id: "risk",        label: "Risk Score",   dot: "#ef4444" },
              { id: "rainfall",    label: "Rainfall 24h", dot: "#2dd4bf" },
              { id: "temperature", label: "Temperature",  dot: "#f59e0b" },
            ] as { id: LayerMode; label: string; dot: string }[]).map(l => (
              <button key={l.id} onClick={() => setLayerMode(l.id)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs transition-all hover:bg-white/5"
                style={{
                  color:      layerMode === l.id ? "#2dd4bf" : "#94a3b8",
                  fontWeight: layerMode === l.id ? 600 : 400,
                  borderLeft: layerMode === l.id ? "2px solid #2dd4bf" : "2px solid transparent",
                }}>
                <span className="w-2 h-2 rounded-full" style={{ background: l.dot }} />
                {l.label}
              </button>
            ))}
          </div>

          {/* Risk legend */}
          <div className="rounded-2xl px-3 py-3"
            style={{ background: "rgba(2,11,24,.88)", backdropFilter: "blur(20px)",
                     border: "1px solid rgba(255,255,255,.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2.5">Risk Level</p>
            {(["Low", "Medium", "High", "Critical"] as const).map(l => (
              <div key={l} className="flex items-center gap-2 py-1">
                <div className="w-3 h-3 rounded-full"
                  style={{ background: RISK_HEX[l], boxShadow: `0 0 6px ${RISK_HEX[l]}80` }} />
                <span className="text-xs text-muted">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom controls ─ right-centre ─────────── */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          {[
            { icon: <ZoomIn  className="w-4 h-4" />, fn: zoomIn,  tip: "Zoom in"    },
            { icon: <ZoomOut className="w-4 h-4" />, fn: zoomOut, tip: "Zoom out"   },
            { icon: <Locate  className="w-4 h-4" />, fn: reset,   tip: "Reset view" },
          ].map(({ icon, fn, tip }) => (
            <button key={tip} onClick={fn} title={tip}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(2,11,24,.88)", backdropFilter: "blur(20px)",
                       border: "1px solid rgba(255,255,255,.08)", color: "#94a3b8" }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Selected district card ─ bottom-centre ── */}
        {selected && (() => {
          const coord = DISTRICT_COORDS[selected.name.toLowerCase()];
          const color = RISK_HEX[selected.riskLevel];
          return (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 fade-up">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(2,11,24,.97)", backdropFilter: "blur(24px)",
                         border: `1px solid ${color}40`, boxShadow: `0 0 40px ${color}25` }}>
                <div className="h-0.5" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* badges */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                          {selected.riskLevel}
                        </span>
                        <span className="text-xs text-muted">{selected.state}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{selected.name}</h3>

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { label: "Risk",   value: `${selected.riskScore}/100`, color },
                          { label: "Rain/24h", value: `${selected.rainfall24h.toFixed(1)}mm`, color: "#2dd4bf" },
                          { label: "Rain/7d",  value: `${selected.rainfall7d.toFixed(1)}mm`,  color: "#94a3b8" },
                          { label: "Temp",     value: `${selected.temperature}°C`,             color: "#f59e0b" },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl p-2.5"
                            style={{ background: "rgba(255,255,255,.04)" }}>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">{item.label}</div>
                            <div className="font-bold text-sm" style={{ color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Forecast bars */}
                      {selected.forecast && selected.forecast.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">72h Forecast</p>
                          <div className="flex items-end gap-0.5 h-8">
                            {selected.forecast.slice(0, 36).map((pt, i) => {
                              const pct = Math.max(4, Math.min(100, pt.rain * 25));
                              const bg  = pct > 70 ? "#ef4444" : pct > 35 ? "#f59e0b" : "#1A6FD4";
                              return (
                                <div key={i} className="flex-1 rounded-sm transition-all"
                                  style={{ height: `${pct}%`, background: bg, opacity: .8 }} />
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[9px] text-muted mt-1">
                            <span>Now</span><span>+24h</span><span>+48h</span><span>+72h</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action column */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/district/${selected.name.toLowerCase()}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 text-white"
                        style={{ background: color }}>
                        Details <ChevronRight className="w-3 h-3" />
                      </Link>
                      {coord && (
                        <button onClick={() => flyTo(coord.lat, coord.lon)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/10 text-xs"
                          style={{ border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8" }}
                          title="Fly to">
                          <Locate className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setSelected(null)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/10"
                        style={{ border: "1px solid rgba(255,255,255,.08)", color: "#94a3b8" }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ════════ RIGHT SIDEBAR ════════ */}
      <aside className="slide-r w-80 flex flex-col border-l overflow-hidden shrink-0"
        style={{ background: "rgba(2,11,24,.92)", backdropFilter: "blur(20px)",
                 borderColor: "rgba(255,255,255,.06)" }}>

        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-white text-base">National Status</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stats.highRisk > 3 ? "bg-danger" : "bg-warning"}`} />
                <span className="text-xs text-muted">
                  {loading ? "Fetching live data…" : "Updated just now"}
                </span>
              </div>
            </div>
            <Activity className="w-5 h-5 text-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Districts", value: districts.length, color: "#2dd4bf" },
              { label: "Alerts",    value: stats.alerts,     color: "#ef4444" },
              { label: "Avg Risk",  value: stats.avgRisk,    color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center"
                style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
                <div className="font-bold text-lg leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto map-sb">
          {/* Top at-risk list */}
          <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Top At-Risk</p>
              <TrendingUp className="w-3.5 h-3.5 text-muted" />
            </div>
            <div className="space-y-1.5">
              {topRisk.map((d, i) => {
                const coord = DISTRICT_COORDS[d.name.toLowerCase()];
                const color = RISK_HEX[d.riskLevel];
                const active = selected?.name === d.name;
                return (
                  <button key={d.name}
                    onClick={() => { setSelected(d); if (coord) flyTo(coord.lat, coord.lon); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01] text-left"
                    style={{
                      background:    active ? `${color}12` : "rgba(255,255,255,.03)",
                      border:        `1px solid ${active ? color + "40" : "rgba(255,255,255,.05)"}`,
                    }}>
                    <span className="text-xs font-bold w-4 text-right shrink-0"
                      style={{ color: "#3a4350" }}>{String(i+1).padStart(2,"0")}</span>
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{d.name}</p>
                      <p className="text-[10px] text-muted truncate">{d.state}</p>
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color }}>{d.riskScore}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live alerts */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Live Alerts
              </p>
              <Link href="/alerts" className="text-[10px] text-primary hover:underline">See all →</Link>
            </div>
            {alertList.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-muted text-sm">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertList.slice(0, 5).map(a => {
                  const color = RISK_HEX[a.riskLevel];
                  const coord = DISTRICT_COORDS[a.name.toLowerCase()];
                  return (
                    <button key={a.name}
                      onClick={() => { setSelected(a); if (coord) flyTo(coord.lat, coord.lon); }}
                      className="w-full text-left rounded-xl p-3 transition-all hover:scale-[1.01]"
                      style={{ background: `${color}08`, borderLeft: `3px solid ${color}`,
                               border: "1px solid rgba(255,255,255,.05)", borderLeftColor: color }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{a.name}</span>
                        <span className="text-[10px] font-bold" style={{ color }}>
                          {a.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-2.5 h-2.5" />{a.rainfall24h.toFixed(0)}mm
                        </span>
                        <span className="flex items-center gap-1">
                          <Waves className="w-2.5 h-2.5" />{a.riskScore}/100
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,.06)" }}>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/alerts"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "rgba(255,87,87,.12)", border: "1px solid rgba(255,87,87,.25)", color: "#FF5757" }}>
              <AlertTriangle className="w-3.5 h-3.5" /> Alerts
            </Link>
            <Link href="/reports"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.25)", color: "#2DD4BF" }}>
              <Activity className="w-3.5 h-3.5" /> Reports
            </Link>
          </div>
          <Link href="/dashboard"
            className="block w-full text-center py-2.5 rounded-xl text-xs text-muted border border-white/8 hover:bg-white/5 transition">
            ← Dashboard
          </Link>
        </div>
      </aside>
    </div>
  );
}
