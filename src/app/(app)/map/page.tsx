import { fetchMultipleDistricts, DEFAULT_DISTRICTS } from "@/lib/api";
import MapClient from "@/components/MapClient";

export const dynamic    = "force-dynamic";
export const revalidate = 900;

export default async function MapPage() {
  // Pre-fetch for initial paint; client will refresh via /api/weather
  const districts = await fetchMultipleDistricts(DEFAULT_DISTRICTS);
  return <MapClient initialDistricts={districts} />;
}
