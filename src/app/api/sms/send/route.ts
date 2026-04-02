import { NextResponse } from "next/server";
import { sendBulkAlertSMS } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { district, state, riskLevel, riskScore, rainfall24h, floodLevelCm } = body;

    if (!district || !riskScore) {
      return NextResponse.json({ error: "Missing required fields: district, riskScore" }, { status: 400 });
    }

    const entries = await sendBulkAlertSMS({
      district,
      state:       state       ?? "India",
      riskLevel:   riskLevel   ?? "High",
      riskScore:   Number(riskScore),
      rainfall24h: Number(rainfall24h ?? 0),
      floodLevelCm: floodLevelCm !== undefined ? Number(floodLevelCm) : undefined,
    });

    const sent      = entries.filter(e => e.status === "sent").length;
    const simulated = entries.filter(e => e.status === "simulated").length;
    const failed    = entries.filter(e => e.status === "failed").length;

    return NextResponse.json({ success: true, sent, simulated, failed, total: entries.length, log: entries });
  } catch (err) {
    console.error("[/api/sms/send] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
