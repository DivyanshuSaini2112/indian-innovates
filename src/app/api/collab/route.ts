/**
 * /api/collab — In-memory collaborative Operations dashboard state.
 * Stores department statuses and communication feed entries.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeptStatus = "standby" | "alerted" | "deployed" | "responding" | "resolved";

export interface Department {
  id: string;
  name: string;
  icon: string;
  contacts: string[];
  status: DeptStatus;
  lastUpdated: string;
  activeIncident?: string;
}

export interface FeedMessage {
  id: string;
  timestamp: string;
  department: string;
  departmentIcon: string;
  author: string;
  message: string;
  type: "update" | "alert" | "ack" | "resolved";
}

// ─── In-memory State ──────────────────────────────────────────────────────────

const departments: Department[] = [
  {
    id: "police-hq",
    name: "Police HQ",
    icon: "🚔",
    contacts: ["Police Commissioner (8302675879)", "SP Field (7014121505)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "fire-brigade",
    name: "Fire Brigade",
    icon: "🚒",
    contacts: ["Fire Chief (8824232707)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "qrt",
    name: "Quick Response Team",
    icon: "⚡",
    contacts: ["QRT Commander (7023500788)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "civil-admin",
    name: "Civil Administration",
    icon: "🏛️",
    contacts: ["District Collector (8696153266)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ministry",
    name: "State Ministry",
    icon: "⚖️",
    contacts: ["Revenue Minister (8306160481)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ndma",
    name: "NDMA / SDMA",
    icon: "🛡️",
    contacts: ["Relief Officer (7014987268)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "imd",
    name: "IMD Meteorology",
    icon: "🌦️",
    contacts: ["Meteorologist (9462071511)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "cwc",
    name: "CWC / Irrigation",
    icon: "💧",
    contacts: ["Flood Control Engineer (7073151234)"],
    status: "standby",
    lastUpdated: new Date().toISOString(),
  },
];

const feedMessages: FeedMessage[] = [
  {
    id: "init-001",
    timestamp: new Date().toISOString(),
    department: "Command Center",
    departmentIcon: "🎯",
    author: "FloodSense System",
    message: "Operations Command Center is live. All departments connected. Monitoring active.",
    type: "update",
  },
];

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ departments, feedMessages });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "update_status") {
      const { deptId, status, incident, author } = body;
      const dept = departments.find(d => d.id === deptId);
      if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });

      const old = dept.status;
      dept.status = status;
      dept.lastUpdated = new Date().toISOString();
      if (incident) dept.activeIncident = incident;

      feedMessages.push({
        id:             `feed-${Date.now()}`,
        timestamp:      new Date().toISOString(),
        department:     dept.name,
        departmentIcon: dept.icon,
        author:         author ?? dept.name,
        message:        `Status changed from ${old} → ${status}${incident ? ` for incident: ${incident}` : ""}`,
        type:           status === "resolved" ? "resolved" : status === "alerted" ? "alert" : "update",
      });

      return NextResponse.json({ success: true, dept });
    }

    if (action === "post_message") {
      const { deptId, author, message, type } = body;
      const dept = departments.find(d => d.id === deptId) ?? { name: "Command Center", icon: "🎯" };

      const entry: FeedMessage = {
        id:             `feed-${Date.now()}`,
        timestamp:      new Date().toISOString(),
        department:     dept.name,
        departmentIcon: dept.icon,
        author:         author ?? dept.name,
        message,
        type:           type ?? "update",
      };
      feedMessages.push(entry);
      // Keep last 200 messages
      if (feedMessages.length > 200) feedMessages.splice(0, feedMessages.length - 200);

      return NextResponse.json({ success: true, entry });
    }

    if (action === "alert_all") {
      const { incident, riskLevel } = body;
      const urgency = riskLevel === "Critical" ? "🔴 CRITICAL" : riskLevel === "High" ? "🟠 HIGH" : "🟡 MEDIUM";
      departments.forEach(d => {
        d.status = "alerted";
        d.lastUpdated = new Date().toISOString();
        d.activeIncident = incident;
      });
      feedMessages.push({
        id:             `feed-${Date.now()}`,
        timestamp:      new Date().toISOString(),
        department:     "Command Center",
        departmentIcon: "🎯",
        author:         "FloodSense System",
        message:        `${urgency} ALL DEPARTMENTS ALERTED — ${incident}. SMS dispatched to all stakeholders.`,
        type:           "alert",
      });
      return NextResponse.json({ success: true, departments });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[/api/collab] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
