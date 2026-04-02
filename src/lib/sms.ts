/**
 * SMS Service — Twilio
 * Role-based message dispatch for FloodSense India multi-stakeholder alert system.
 */

import twilio from "twilio";

// ─── Stakeholder Registry ────────────────────────────────────────────────────

export type StakeholderRole =
  | "admin"
  | "police_commissioner"
  | "police_field"
  | "fire_chief"
  | "qrt_commander"
  | "collector"
  | "minister"
  | "relief_officer"
  | "meteorologist"
  | "engineer"
  | "citizen";

export interface Stakeholder {
  phone: string;       // E.164 format e.g. +916378356809
  name: string;
  role: StakeholderRole;
  department: string;
}

export const STAKEHOLDERS: Stakeholder[] = [
  { phone: "+916378356809", name: "Admin / Command",          role: "admin",               department: "All Departments"       },
  { phone: "+918302675879", name: "Police Commissioner",      role: "police_commissioner", department: "Police HQ"             },
  { phone: "+917014121505", name: "SP (District Police)",     role: "police_field",        department: "Police Field"          },
  { phone: "+918824232707", name: "Fire Chief",               role: "fire_chief",          department: "Fire Brigade"          },
  { phone: "+917023500788", name: "QRT Commander",            role: "qrt_commander",       department: "Quick Response Team"   },
  { phone: "+918696153266", name: "District Collector",       role: "collector",           department: "Civil Administration"  },
  { phone: "+918306160481", name: "Revenue Minister",         role: "minister",            department: "State Ministry"        },
  { phone: "+917014987268", name: "Relief Officer",           role: "relief_officer",      department: "NDMA / SDMA"          },
  { phone: "+919462071511", name: "Meteorologist",            role: "meteorologist",       department: "IMD"                   },
  { phone: "+917073151234", name: "Flood Control Engineer",   role: "engineer",            department: "CWC / Irrigation"      },
  { phone: "+919373534587", name: "Public Citizen",           role: "citizen",             department: "General Public"        },
];

// ─── Send-log (in-memory) ────────────────────────────────────────────────────

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  to: string;
  name: string;
  department: string;
  district: string;
  riskLevel: string;
  message: string;
  status: "sent" | "failed" | "simulated";
  error?: string;
}

// Shared in-memory log (persists for lifetime of the Node process)
const smsLog: SmsLogEntry[] = [];

// Debounce tracker — district → last-sent timestamp
const lastSentAt: Record<string, number> = {};
const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes (use 60*60*1000 in production)

export function getSmsLog(): SmsLogEntry[] {
  return [...smsLog].reverse(); // newest first
}

// ─── Message Templates ───────────────────────────────────────────────────────

function buildMessage(
  role: StakeholderRole,
  data: {
    district: string;
    state: string;
    riskLevel: string;
    riskScore: number;
    rainfall24h: number;
    floodLevelCm?: number;
  }
): string {
  const { district, state, riskLevel, riskScore, rainfall24h, floodLevelCm } = data;
  const level = floodLevelCm ? `~${floodLevelCm}cm flood level` : "";
  const urgency = riskScore >= 80 ? "🔴 CRITICAL" : riskScore >= 60 ? "🟠 HIGH" : "🟡 MEDIUM";

  switch (role) {
    case "admin":
      return (
        `[FloodSense COMMAND] ${urgency}\n` +
        `District: ${district}, ${state}\n` +
        `Risk Score: ${riskScore}/100 | ${riskLevel} Risk\n` +
        `Rainfall 24h: ${rainfall24h}mm ${level}\n` +
        `All departments notified. Monitor dashboard.`
      );

    case "police_commissioner":
    case "police_field":
      return (
        `[FloodSense POLICE ALERT] ${urgency}\n` +
        `District: ${district}, ${state} — ${riskLevel} Flood Risk (${riskScore}/100)\n` +
        `ACTION REQUIRED:\n` +
        `• Deploy flood patrol units to low-lying areas\n` +
        `• Coordinate evacuation if riskScore > 75\n` +
        `• Alert PCR vans for rescue standby\n` +
        `Rainfall: ${rainfall24h}mm in 24h. ${level}`
      );

    case "fire_chief":
      return (
        `[FloodSense FIRE BRIGADE] ${urgency}\n` +
        `District: ${district}, ${state} — ${riskLevel} Risk (${riskScore}/100)\n` +
        `ACTION REQUIRED:\n` +
        `• Pre-position boats & flood rescue equipment\n` +
        `• Activate flood rescue team on standby\n` +
        `• Coordinate with SDRF for joint ops\n` +
        `Rainfall: ${rainfall24h}mm/24h. ${level}`
      );

    case "qrt_commander":
      return (
        `[FloodSense QRT DEPLOY] ${urgency}\n` +
        `District: ${district}, ${state}\n` +
        `Risk Score: ${riskScore}/100 — ${riskLevel} Alert\n` +
        `• Mobilise Quick Response Team NOW\n` +
        `• Stock relief kits (food/water/medical)\n` +
        `• Establish emergency control point\n` +
        `Estimated flood: ${level || "monitor situation"}`
      );

    case "collector":
      return (
        `[FloodSense DISTRICT COLLECTOR] ${urgency}\n` +
        `${district}, ${state}: ${riskLevel} Flood Risk (Score: ${riskScore}/100)\n` +
        `Recommended measures:\n` +
        `• Issue evacuation advisory if score > 75\n` +
        `• Open relief camps at 3+ shelter points\n` +
        `• Alert tehsildars for ground-level action\n` +
        `Rainfall: ${rainfall24h}mm/24h`
      );

    case "minister":
      return (
        `[FloodSense MINISTRY BRIEF] ${urgency}\n` +
        `${district}, ${state} — ${riskLevel} Flood Risk\n` +
        `Risk Index: ${riskScore}/100 | Rainfall: ${rainfall24h}mm (24h)\n` +
        `Strategic recommendations:\n` +
        `• Review SDRF/NDRF deployment budget\n` +
        `• Expedite ex-gratia release for affected zones\n` +
        `• Coordinate inter-ministerial response if critical\n` +
        `Full dashboard: floodsense.gov.in/collab`
      );

    case "relief_officer":
      return (
        `[FloodSense NDMA RELIEF] ${urgency}\n` +
        `${district}, ${state} — ${riskLevel} Flood Alert\n` +
        `Risk Score: ${riskScore}/100 | ${rainfall24h}mm/24h\n` +
        `• Pre-position relief materials at district HQ\n` +
        `• Activate SDRF helpline: 1800-180-1253\n` +
        `• Coordinate with collector's office for camps\n` +
        `${level}`
      );

    case "meteorologist":
      return (
        `[FloodSense IMD DATA] ${urgency}\n` +
        `District: ${district}, ${state}\n` +
        `ML Risk Score: ${riskScore}/100 | Level: ${riskLevel}\n` +
        `24h Rainfall: ${rainfall24h}mm\n` +
        `Est. Flood Depth: ${level || "N/A"}\n` +
        `Source: Open-Meteo + FloodSense ML Model\n` +
        `Validate & issue updated bulletin if needed.`
      );

    case "engineer":
      return (
        `[FloodSense CWC ALERT] ${urgency}\n` +
        `${district}, ${state} — ${riskLevel} Risk (${riskScore}/100)\n` +
        `24h Precip: ${rainfall24h}mm\n` +
        `${level}\n` +
        `• Monitor upstream gauges\n` +
        `• Check reservoir/barrage discharge rates\n` +
        `• Alert downstream communities if needed`
      );

    case "citizen":
    default:
      return (
        `⚠️ FLOOD ALERT — FloodSense India\n` +
        `${district}, ${state}: ${riskLevel} Flood Risk\n` +
        `${rainfall24h}mm rain in last 24 hours.\n\n` +
        `सावधानी बरतें / Stay Safe:\n` +
        `• ऊंची जगह जाएं / Move to higher ground\n` +
        `• बिजली उपकरण बंद करें / Turn off electricity\n` +
        `• Emergency: 112 | NDMA: 1800-180-1253\n` +
        `Updates: floodsense.gov.in`
      );
  }
}

// ─── Core Send Functions ─────────────────────────────────────────────────────

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith("ACxxx")) return null;
  twilioClient = twilio(sid, token);
  return twilioClient;
}

/** Send a single SMS — falls back to "simulated" mode if Twilio is not configured */
export async function sendSMS(to: string, message: string): Promise<{ status: "sent" | "failed" | "simulated"; error?: string }> {
  const client    = getTwilioClient();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  // If Twilio creds are placeholders / missing, run in simulated mode
  const isConfigured = client && fromPhone &&
    !fromPhone.includes("xxx") &&
    !fromPhone.includes("xxxxxxx");

  if (!isConfigured) {
    console.log(`[SMS SIMULATED] To: ${to}\n${message}\n`);
    return { status: "simulated" };
  }

  try {
    await client!.messages.create({ body: message, from: fromPhone, to });
    console.log(`[SMS SENT] To: ${to}`);
    return { status: "sent" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS FAILED] ${to}: ${msg}`);
    return { status: "failed", error: msg };
  }
}

/** Dispatch role-tailored SMS to ALL stakeholders for a given alert */
export async function sendBulkAlertSMS(payload: {
  district: string;
  state: string;
  riskLevel: string;
  riskScore: number;
  rainfall24h: number;
  floodLevelCm?: number;
}): Promise<SmsLogEntry[]> {
  // Debounce — skip if we already sent for this district within 1h
  const key = payload.district.toLowerCase();
  if (lastSentAt[key] && Date.now() - lastSentAt[key] < DEBOUNCE_MS) {
    console.log(`[SMS] Debounced — already sent for ${payload.district} recently.`);
    return [];
  }
  lastSentAt[key] = Date.now();

  const entries: SmsLogEntry[] = [];
  await Promise.all(
    STAKEHOLDERS.map(async (s) => {
      const message = buildMessage(s.role, payload);
      const result  = await sendSMS(s.phone, message);
      const entry: SmsLogEntry = {
        id:         `sms-${Date.now()}-${s.phone.slice(-4)}`,
        timestamp:  new Date().toISOString(),
        to:         s.phone,
        name:       s.name,
        department: s.department,
        district:   payload.district,
        riskLevel:  payload.riskLevel,
        message,
        status:     result.status,
        error:      result.error,
      };
      smsLog.push(entry);
      entries.push(entry);
    })
  );

  return entries;
}
