import { NextRequest, NextResponse } from "next/server";
import { fetchMultipleDistricts, DEFAULT_DISTRICTS } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtParam = searchParams.get("districts");

  const districts = districtParam
    ? districtParam.split(",").map(d => d.trim().toLowerCase())
    : DEFAULT_DISTRICTS;

  const data = await fetchMultipleDistricts(districts);
  return NextResponse.json({ districts: data, updatedAt: new Date().toISOString() });
}
