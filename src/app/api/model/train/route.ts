import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DISTRICTS, fetchMultipleDistricts } from "@/lib/api";
import { getRiskModelStatus } from "@/lib/riskModel";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ model: getRiskModelStatus() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const epochs = Math.max(1, Math.min(20, Number(body?.epochs ?? 3)));
  const districts = Array.isArray(body?.districts) && body.districts.length > 0
    ? body.districts.map((d: string) => String(d).toLowerCase().trim())
    : DEFAULT_DISTRICTS;

  for (let i = 0; i < epochs; i++) {
    await fetchMultipleDistricts(districts);
  }

  return NextResponse.json({
    ok: true,
    trainedEpochs: epochs,
    districtsUsed: districts.length,
    model: getRiskModelStatus(),
  });
}

