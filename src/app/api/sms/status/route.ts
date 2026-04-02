import { NextResponse } from "next/server";
import { getSmsLog } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function GET() {
  const log = getSmsLog();
  const sent      = log.filter(e => e.status === "sent").length;
  const simulated = log.filter(e => e.status === "simulated").length;
  const failed    = log.filter(e => e.status === "failed").length;

  return NextResponse.json({
    total: log.length,
    sent,
    simulated,
    failed,
    log,
  });
}
