"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield, Radio, Flame, Zap, Building2, Scale, ShieldCheck, CloudRain,
  Gauge, PhoneCall, MessageSquare, Send, AlertTriangle, CheckCircle2,
  RefreshCw, Bell, Users, Activity, ChevronRight, Clock, Wifi, WifiOff
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeptStatus = "standby" | "alerted" | "deployed" | "responding" | "resolved";

interface Department {
  id: string;
  name: string;
  icon: string;
  contacts: string[];
  status: DeptStatus;
  lastUpdated: string;
  activeIncident?: string;
}

interface FeedMessage {
  id: string;
  timestamp: string;
  department: string;
  departmentIcon: string;
  author: string;
  message: string;
  type: "update" | "alert" | "ack" | "resolved";
}

interface SmsLogEntry {
  id: string;
  timestamp: string;
  to: string;
  name: string;
  department: string;
  district: string;
  riskLevel: string;
  status: "sent" | "failed" | "simulated";
  error?: string;
}

interface DistrictAlert {
  id: string;
  district: string;
  state: string;
  riskLevel: string;
  riskScore: number;
  rainfall24h: number;
  floodLevelCm?: number;
  severity: string;
  timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeptStatus, { label: string; color: string; glow: string; bg: string }> = {
  standby:    { label: "Standby",    color: "#6B7280", glow: "#6B7280",  bg: "rgba(107,114,128,0.12)" },
  alerted:    { label: "Alerted",    color: "#FBBF24", glow: "#FBBF24",  bg: "rgba(251,191,36,0.12)"  },
  deployed:   { label: "Deployed",   color: "#F97316", glow: "#F97316",  bg: "rgba(249,115,22,0.12)"  },
  responding: { label: "Responding", color: "#FF5757", glow: "#FF5757",  bg: "rgba(255,87,87,0.12)"   },
  resolved:   { label: "Resolved",   color: "#10B981", glow: "#10B981",  bg: "rgba(16,185,129,0.12)"  },
};

const RISK_COLORS: Record<string, string> = {
  Critical: "#a855f7", High: "#FF5757", Medium: "#FBBF24", Low: "#10B981",
};

const DEPT_ICON_MAP: Record<string, React.ReactNode> = {
  "🚔": <Shield   className="w-5 h-5" />,
  "🚒": <Flame    className="w-5 h-5" />,
  "⚡": <Zap      className="w-5 h-5" />,
  "🏛️": <Building2 className="w-5 h-5" />,
  "⚖️": <Scale    className="w-5 h-5" />,
  "🛡️": <ShieldCheck className="w-5 h-5" />,
  "🌦️": <CloudRain className="w-5 h-5" />,
  "💧": <Gauge    className="w-5 h-5" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DeptStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function DeptCard({
  dept, onStatusChange
}: {
  dept: Department;
  onStatusChange: (id: string, status: DeptStatus) => void;
}) {
  const cfg = STATUS_CONFIG[dept.status];
  const [changing, setChanging] = useState(false);

  const statuses: DeptStatus[] = ["standby", "alerted", "deployed", "responding", "resolved"];

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300"
      style={{
        background: "rgba(6,15,28,0.7)",
        border: `1px solid ${cfg.color}30`,
        boxShadow: `0 0 16px ${cfg.glow}10`,
      }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
          {dept.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{dept.name}</p>
          <p className="text-[10px] text-gray-400 truncate">
            {dept.contacts.length} contact{dept.contacts.length > 1 ? "s" : ""}
          </p>
        </div>
        <StatusBadge status={dept.status} />
      </div>

      {dept.activeIncident && (
        <p className="text-[11px] text-amber-400 bg-amber-400/8 rounded-lg px-2 py-1.5 truncate">
          📍 {dept.activeIncident}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {statuses.map(s => (
          <button key={s}
            disabled={dept.status === s || changing}
            onClick={async () => {
              setChanging(true);
              await onStatusChange(dept.id, s);
              setChanging(false);
            }}
            className="text-[10px] px-2 py-0.5 rounded-full transition-all disabled:opacity-40"
            style={{
              background: dept.status === s ? STATUS_CONFIG[s].bg : "rgba(255,255,255,0.05)",
              color: dept.status === s ? STATUS_CONFIG[s].color : "#6B7280",
              border: `1px solid ${dept.status === s ? STATUS_CONFIG[s].color + "50" : "transparent"}`,
            }}>
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-500 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Updated {timeAgo(dept.lastUpdated)}
      </p>
    </div>
  );
}

function FeedEntry({ msg }: { msg: FeedMessage }) {
  const colors = { alert: "#FF5757", ack: "#FBBF24", resolved: "#10B981", update: "#2DD4BF" };
  const col = colors[msg.type] ?? "#2DD4BF";
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ background: `${col}15`, border: `1px solid ${col}30` }}>
          {msg.departmentIcon}
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: `${col}15` }} />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: col }}>{msg.author}</span>
          <span className="text-[10px] text-gray-500">{timeAgo(msg.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{msg.message}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollabPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [feed, setFeed] = useState<FeedMessage[]>([]);
  const [smsLog, setSmsLog] = useState<SmsLogEntry[]>([]);
  const [incidents, setIncidents] = useState<DistrictAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsLoading, setSmsLoading] = useState<string | null>(null);
  const [alertAllLoading, setAlertAllLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDept, setSelectedDept] = useState("police-hq");
  const [activeTab, setActiveTab] = useState<"departments" | "sms" | "feed">("departments");
  const [connected, setConnected] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  // ── Fetch collab state ──
  const fetchCollab = useCallback(async () => {
    try {
      const [collabRes, smsRes, alertsRes] = await Promise.all([
        fetch("/api/collab"),
        fetch("/api/sms/status"),
        fetch("/api/alerts"),
      ]);
      if (collabRes.ok) {
        const data = await collabRes.json();
        setDepartments(data.departments);
        setFeed(data.feedMessages);
      }
      if (smsRes.ok) {
        const data = await smsRes.json();
        setSmsLog(data.log ?? []);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        // Normalise alert shape into DistrictAlert
        const mapped: DistrictAlert[] = (data.alerts ?? []).map((a: {
          id: string; district: string; state: string; riskLevel: string;
          riskScore: number; rainfall24h?: number; floodLevelCm?: number;
          severity: string; timestamp: string;
        }) => ({
          id:          a.id,
          district:    a.district,
          state:       a.state,
          riskLevel:   a.severity ?? a.riskLevel ?? "Medium",
          riskScore:   a.riskScore ?? 50,
          rainfall24h: a.rainfall24h ?? 0,
          floodLevelCm: a.floodLevelCm,
          severity:    a.severity ?? "Medium",
          timestamp:   a.timestamp,
        }));
        setIncidents(mapped);
      }
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollab();
    const interval = setInterval(fetchCollab, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [fetchCollab]);

  // auto-scroll feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed]);

  // ── Actions ──

  const handleStatusChange = async (deptId: string, status: DeptStatus) => {
    await fetch("/api/collab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", deptId, status, author: "Command Center" }),
    });
    await fetchCollab();
  };

  const handleSendSMS = async (incident: DistrictAlert) => {
    setSmsLoading(incident.id);
    try {
      await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: incident.district,
          state: incident.state,
          riskLevel: incident.riskLevel,
          riskScore: incident.riskScore,
          rainfall24h: incident.rainfall24h,
          floodLevelCm: incident.floodLevelCm,
        }),
      });
      // Alert all departments in collab
      await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "alert_all",
          incident: `${incident.district}, ${incident.state} — ${incident.riskLevel} Risk`,
          riskLevel: incident.riskLevel,
        }),
      });
      await fetchCollab();
    } finally {
      setSmsLoading(null);
    }
  };

  const handleAlertAll = async () => {
    if (incidents.length === 0) return;
    setAlertAllLoading(true);
    const top = incidents[0];
    await handleSendSMS(top);
    setAlertAllLoading(false);
  };

  const handlePostMessage = async () => {
    if (!message.trim()) return;
    await fetch("/api/collab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "post_message", deptId: selectedDept, author: "Command Center", message, type: "update" }),
    });
    setMessage("");
    await fetchCollab();
  };

  // ── Derived stats ──
  const alertedCount   = departments.filter(d => d.status !== "standby" && d.status !== "resolved").length;
  const smsSent        = smsLog.filter(e => e.status === "sent").length;
  const smsSimulated   = smsLog.filter(e => e.status === "simulated").length;
  const highIncidents  = incidents.filter(i => i.riskScore >= 60).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading Operations Center…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#020B18 0%,#071220 100%)" }}>

      {/* ── Top Header Bar ── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: "rgba(2,11,24,0.85)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1A6FD4,#2DD4BF)" }}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">Operations Command Center</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">FloodSense India · Multi-Department Coordination</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums" style={{ color: alertedCount > 0 ? "#FF5757" : "#10B981" }}>{alertedCount}</p>
              <p className="text-[10px] text-gray-400">Depts Active</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-amber-400">{highIncidents}</p>
              <p className="text-[10px] text-gray-400">Live Incidents</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-cyan-400">{smsSent + smsSimulated}</p>
              <p className="text-[10px] text-gray-400">SMS Dispatched</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: connected ? "#10B981" : "#FF5757" }}>
              {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{connected ? "Live" : "Offline"}</span>
            </div>
            <button onClick={fetchCollab}
              className="p-2 rounded-lg transition hover:bg-white/5"
              title="Refresh">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={handleAlertAll} disabled={alertAllLoading || incidents.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#FF5757,#a855f7)", color: "white", boxShadow: "0 0 20px rgba(255,87,87,0.3)" }}>
              {alertAllLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              {alertAllLoading ? "Sending…" : "Alert All"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">

        {/* ── Live Incidents Row ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Live Flood Incidents
              {highIncidents > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  {highIncidents} Active
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">Auto-refreshed every 15s</p>
          </div>

          {incidents.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-semibold">No High-Risk Incidents</p>
              <p className="text-gray-500 text-sm mt-1">All monitored districts are within safe thresholds.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
              {incidents.map((incident) => {
                const riskCol = RISK_COLORS[incident.riskLevel] ?? "#FBBF24";
                const isSending = smsLoading === incident.id;
                return (
                  <div key={incident.id} className="min-w-[280px] rounded-2xl p-4 shrink-0 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(6,15,28,0.8)", border: `1px solid ${riskCol}30`, boxShadow: `0 0 20px ${riskCol}0A` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-white">{incident.district}</p>
                        <p className="text-xs text-gray-400">{incident.state}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${riskCol}18`, color: riskCol, border: `1px solid ${riskCol}30` }}>
                        {incident.riskLevel} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-gray-500">Risk Score</p>
                        <p className="font-bold tabular-nums" style={{ color: riskCol }}>{incident.riskScore}/100</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-gray-500">Rainfall 24h</p>
                        <p className="font-bold tabular-nums text-cyan-400">{incident.rainfall24h.toFixed(1)}mm</p>
                      </div>
                    </div>

                    {incident.floodLevelCm && incident.floodLevelCm > 0 && (
                      <div className="text-xs rounded-lg p-2 flex items-center gap-2"
                        style={{ background: `${riskCol}10`, border: `1px solid ${riskCol}20` }}>
                        <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: riskCol }} />
                        <span style={{ color: riskCol }}>Est. flood depth: ~{incident.floodLevelCm}cm</span>
                      </div>
                    )}

                    <button onClick={() => handleSendSMS(incident)} disabled={isSending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${riskCol}CC, ${riskCol}88)`, color: "white" }}>
                      {isSending ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Sending SMS…</>
                      ) : (
                        <><PhoneCall className="w-4 h-4" /> Dispatch SMS Alert</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["departments", "sms", "feed"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? "rgba(45,212,191,0.15)" : "transparent",
                color: activeTab === tab ? "#2DD4BF" : "#6B7280",
                border: activeTab === tab ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
              }}>
              {tab === "departments" && <><Users className="w-3.5 h-3.5 inline mr-1.5" />Departments</>}
              {tab === "sms"         && <><PhoneCall className="w-3.5 h-3.5 inline mr-1.5" />SMS Log</>}
              {tab === "feed"        && <><MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Comm Feed</>}
            </button>
          ))}
        </div>

        {/* ── DEPARTMENTS TAB ── */}
        {activeTab === "departments" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departments.map(dept => (
                <DeptCard key={dept.id} dept={dept} onStatusChange={handleStatusChange} />
              ))}
            </div>

            {/* Stakeholder directory */}
            <div className="mt-6 rounded-2xl p-5" style={{ background: "rgba(6,15,28,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Stakeholder Contact Directory
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { name: "Admin / Command",        phone: "+91 63783 56809", dept: "All Departments",     icon: "🎯" },
                  { name: "Police Commissioner",     phone: "+91 83026 75879", dept: "Police HQ",           icon: "🚔" },
                  { name: "SP (District Police)",    phone: "+91 70141 21505", dept: "Police Field",        icon: "🚔" },
                  { name: "Fire Chief",              phone: "+91 88242 32707", dept: "Fire Brigade",        icon: "🚒" },
                  { name: "QRT Commander",           phone: "+91 70235 00788", dept: "Quick Response Team", icon: "⚡" },
                  { name: "District Collector",      phone: "+91 86961 53266", dept: "Civil Admin",         icon: "🏛️" },
                  { name: "Revenue Minister",        phone: "+91 83061 60481", dept: "State Ministry",      icon: "⚖️" },
                  { name: "Relief Officer",          phone: "+91 70149 87268", dept: "NDMA / SDMA",         icon: "🛡️" },
                  { name: "Meteorologist",           phone: "+91 94620 71511", dept: "IMD",                 icon: "🌦️" },
                  { name: "Flood Control Engineer",  phone: "+91 70731 51234", dept: "CWC / Irrigation",    icon: "💧" },
                  { name: "Public Citizen",          phone: "+91 93735 34587", dept: "General Public",      icon: "👤" },
                ].map(c => (
                  <div key={c.phone} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-lg shrink-0">{c.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{c.dept}</p>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono shrink-0">{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SMS LOG TAB ── */}
        {activeTab === "sms" && (
          <div className="rounded-2xl" style={{ background: "rgba(6,15,28,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Stats */}
            <div className="p-5 border-b grid grid-cols-3 gap-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400 tabular-nums">{smsSent}</p>
                <p className="text-xs text-gray-400">SMS Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400 tabular-nums">{smsSimulated}</p>
                <p className="text-xs text-gray-400">Simulated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400 tabular-nums">{smsLog.filter(e => e.status === "failed").length}</p>
                <p className="text-xs text-gray-400">Failed</p>
              </div>
            </div>

            {smsSimulated > 0 && (
              <div className="mx-5 mt-4 p-3 rounded-xl text-xs text-amber-400 flex items-start gap-2"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Simulated mode active.</strong> Add your Twilio credentials to <code className="bg-white/10 px-1 rounded">.env.local</code> to send real SMS.
                  Visit <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="underline">console.twilio.com</a> to get your Account SID, Auth Token, and phone number.
                </span>
              </div>
            )}

            {smsLog.length === 0 ? (
              <div className="p-12 text-center">
                <PhoneCall className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No SMS dispatched yet</p>
                <p className="text-gray-600 text-sm mt-1">Click "Dispatch SMS Alert" on an incident to send alerts to all stakeholders.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {smsLog.map(entry => {
                  const statusColors = { sent: "#10B981", simulated: "#FBBF24", failed: "#FF5757" };
                  const col = statusColors[entry.status];
                  return (
                    <div key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/2 transition">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${col}15`, border: `1px solid ${col}30` }}>
                        {entry.status === "sent" ? <CheckCircle2 className="w-4 h-4" style={{ color: col }} /> :
                         entry.status === "failed" ? <AlertTriangle className="w-4 h-4" style={{ color: col }} /> :
                         <Activity className="w-4 h-4" style={{ color: col }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: `${col}15`, color: col }}>
                            {entry.status === "simulated" ? "SIMULATED" : entry.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{entry.department} · {entry.to} · {entry.district} ({entry.riskLevel})</p>
                        {entry.error && <p className="text-[10px] text-red-400 mt-0.5">{entry.error}</p>}
                      </div>
                      <p className="text-[10px] text-gray-500 shrink-0">{timeAgo(entry.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COMMUNICATION FEED TAB ── */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feed */}
            <div className="lg:col-span-2 rounded-2xl flex flex-col" style={{ background: "rgba(6,15,28,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Operational Feed
                </h3>
                <span className="text-xs text-gray-500">{feed.length} entries</span>
              </div>
              <div ref={feedRef} className="flex-1 overflow-y-auto p-5 space-y-1 max-h-[500px]" style={{ scrollbarWidth: "thin" }}>
                {feed.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No messages yet.</p>
                ) : (
                  [...feed].reverse().map(msg => <FeedEntry key={msg.id} msg={msg} />)
                )}
              </div>
            </div>

            {/* Post message */}
            <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "rgba(6,15,28,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" /> Post Update
              </h3>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Department</label>
                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Type operational update, acknowledgment, or status note…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <button onClick={handlePostMessage} disabled={!message.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#1A6FD4,#2DD4BF)", color: "white" }}>
                <Send className="w-4 h-4" /> Post to Feed
              </button>

              {/* Quick links */}
              <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
                <div className="space-y-1">
                  {[
                    { label: "All units on standby",       msg: "All units confirmed on standby. Monitoring situation." },
                    { label: "Boats pre-positioned",       msg: "Flood rescue boats pre-positioned at river ghats. Team ready." },
                    { label: "Relief camp opened",          msg: "Relief camp opened at district stadium. Capacity: 500 persons." },
                    { label: "Situation under control",    msg: "Situation assessed. Risk level stable. Continuing monitoring." },
                  ].map(q => (
                    <button key={q.label} onClick={() => setMessage(q.msg)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 shrink-0 text-cyan-500" />
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
