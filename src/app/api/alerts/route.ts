import { NextResponse } from "next/server";
import { fetchMultipleDistricts, generateAlertsFromWeather, DEFAULT_DISTRICTS } from "@/lib/api";
import { estimateFloodLevelCm } from "@/lib/floodGuidance";
import { sendBulkAlertSMS } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get weather for key districts to derive alerts
  const districts = await fetchMultipleDistricts(DEFAULT_DISTRICTS);
  const weatherAlerts = generateAlertsFromWeather(districts);

  // Hard-coded authoritative alerts (simulating IMD/NDMA feed)
  const imdAlerts = [
    {
      id: "imd-001",
      severity: "High" as const,
      title: "Orange Alert — Heavy Rainfall Warning",
      body: "IMD issues orange alert for coastal Kerala districts. Extremely heavy rainfall (>20cm) expected in the next 24 hours.",
      source: "IMD" as const,
      district: "Kottayam",
      state: "Kerala",
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      read: false,
      riskScore: 72,
      floodLevelCm: estimateFloodLevelCm(72),
    },
    {
      id: "cwc-001",
      severity: "High" as const,
      title: "River Level Warning — Ganga at Patna",
      body: "CWC reports Ganga at Digha Ghat crossing caution level. Rate of rise: 3cm/hr. Low-lying areas advised to remain vigilant.",
      source: "CWC" as const,
      district: "Patna",
      state: "Bihar",
      timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
      read: false,
      riskScore: 68,
      floodLevelCm: estimateFloodLevelCm(68),
    },
    {
      id: "ndma-001",
      severity: "Medium" as const,
      title: "Flood Watch — Brahmaputra Basin",
      body: "NDMA monitoring Brahmaputra river levels in Assam. Pre-emptive advisory for riverbank communities.",
      source: "NDMA" as const,
      district: "Guwahati",
      state: "Assam",
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      read: true,
      riskScore: 45,
      floodLevelCm: estimateFloodLevelCm(45),
    },
  ];

  const allAlerts = [...weatherAlerts, ...imdAlerts];
  return NextResponse.json({ alerts: allAlerts });
}

/** POST — manual alert trigger from the Operations dashboard */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { district, state, riskLevel, riskScore, rainfall24h, floodLevelCm } = body;
    if (!district || riskScore == null) {
      return NextResponse.json({ error: "Missing district or riskScore" }, { status: 400 });
    }
    const entries = await sendBulkAlertSMS({
      district,
      state:        state        ?? "India",
      riskLevel:    riskLevel    ?? "High",
      riskScore:    Number(riskScore),
      rainfall24h:  Number(rainfall24h ?? 0),
      floodLevelCm: floodLevelCm !== undefined ? Number(floodLevelCm) : undefined,
    });
    return NextResponse.json({ success: true, smsSent: entries.length, entries });
  } catch (err) {
    console.error("[/api/alerts POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
