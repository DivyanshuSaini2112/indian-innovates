"use client";

import { useEffect, useState } from "react";
import { RiskPill } from "@/components/RiskPill";
import type { Alert } from "@/types";
import { timeAgo } from "@/lib/utils";
import { X, Map, Info } from "lucide-react";

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"] as const;
const SOURCES = ["IMD", "CWC", "NDMA", "AI"] as const;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Alert | null>(null);

  useEffect(() => {
    fetch("/api/alerts")
      .then(r => r.json())
      .then(d => { setAlerts(d.alerts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const dismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = filter === "All" ? alerts : alerts.filter(a => a.severity === filter);

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Sidebar filters */}
      <aside className="w-56 border-r border-white/5 p-5 shrink-0 flex flex-col gap-6 overflow-y-auto">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Severity</p>
          <div className="space-y-0.5">
            {SEVERITIES.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition ${filter === s ? "bg-primary/20 text-primary" : "text-muted hover:text-foreground hover:bg-white/5"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Source</p>
          {SOURCES.map(src => (
            <label key={src} className="flex items-center gap-2 py-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-primary rounded" />
              <span className="text-sm text-muted">{src}</span>
            </label>
          ))}
        </div>
      </aside>

      {/* Alert list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
          <h1 className="font-heading text-xl font-semibold text-foreground">Alerts Center</h1>
          <div className="flex gap-2">
            <button className="glass rounded-xl px-3 py-2 text-xs text-muted hover:text-foreground transition">Mark all read</button>
            <button className="glass rounded-xl px-3 py-2 text-xs text-muted hover:text-foreground transition">Export</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && (
            <p className="text-muted text-sm py-8 text-center">Loading live alerts...</p>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-muted">
              <Info className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No alerts at this severity level.</p>
            </div>
          )}
          {filtered.map(a => (
            <div key={a.id} onClick={() => setSelected(a)}
              className={`border-l-4 glass rounded-r-2xl p-4 cursor-pointer hover:bg-white/5 transition ${
                selected?.id === a.id ? "ring-1 ring-primary/40" : ""
              } ${a.severity === "Critical" ? "border-critical" : a.severity === "High" ? "border-danger" : a.severity === "Medium" ? "border-warning" : "border-safe"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <RiskPill level={a.severity} className="text-[10px] px-2 py-0.5" />
                    <span className="glass rounded-full px-2 py-0.5 text-[10px] text-muted">{a.source}</span>
                    {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <p className="font-medium text-foreground text-sm">{a.title}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{a.body}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="glass rounded-full px-2 py-0.5 text-[10px] text-muted">{a.district}</span>
                    <span className="glass rounded-full px-2 py-0.5 text-[10px] text-muted">{a.state}</span>
                    <span className="text-[10px] text-muted ml-auto">{timeAgo(a.timestamp)}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Link href={`/map`} onClick={e => e.stopPropagation()}
                    className="glass rounded-lg p-2 text-muted hover:text-primary transition"><Map className="w-3.5 h-3.5" /></Link>
                  <button onClick={e => { e.stopPropagation(); dismiss(a.id); }}
                    className="glass rounded-lg p-2 text-muted hover:text-danger transition"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <aside className="w-72 border-l border-white/5 p-5 shrink-0 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <RiskPill level={selected.severity} />
            <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <h3 className="font-heading font-semibold text-foreground mb-2">{selected.title}</h3>
          <p className="text-muted text-sm leading-relaxed mb-4">{selected.body}</p>
          <div className="space-y-2 text-sm border-t border-white/8 pt-4 mb-4">
            {[["District", selected.district], ["State", selected.state], ["Source", selected.source], ["Time", timeAgo(selected.timestamp)]].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted">{k}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-2">Recommended Actions</p>
            <ul className="text-sm text-muted space-y-1.5">
              <li>• Stay updated on official NDMA channels</li>
              <li>• Avoid flooded or waterlogged roads</li>
              <li>• NDRF Helpline: <span className="text-foreground font-medium">1078</span></li>
              <li>• State control room: <span className="text-foreground font-medium">1070</span></li>
            </ul>
          </div>
          <Link href={`/district/${selected.district.toLowerCase()}`}
            className="mt-4 block w-full text-center py-3 bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm hover:bg-primary/30 transition">
            View {selected.district} Details →
          </Link>
        </aside>
      )}
    </div>
  );
}

// Fix unresolved import
import Link from "next/link";
