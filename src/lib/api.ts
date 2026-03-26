import { DISTRICT_COORDS, type DistrictWeather, type ForecastPoint, type Alert } from "@/types";
import { computeRiskScore, getRiskLevel } from "@/lib/utils";

/**
 * Fetches hourly rainfall + temperature from Open-Meteo (100% free, no key needed).
 * Docs: https://open-meteo.com/en/docs
 */
export async function fetchDistrictWeather(districtKey: string): Promise<DistrictWeather | null> {
  const coords = DISTRICT_COORDS[districtKey.toLowerCase()];
  if (!coords) return null;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",  String(coords.lat));
    url.searchParams.set("longitude", String(coords.lon));
    url.searchParams.set("hourly", [
      "precipitation",
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
    ].join(","));
    url.searchParams.set("daily", "precipitation_sum");
    url.searchParams.set("timezone", "Asia/Kolkata");
    url.searchParams.set("past_days",    "7");
    url.searchParams.set("forecast_days", "3");

    const res = await fetch(url.toString(), { next: { revalidate: 900 } }); // 15 min cache
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

    const json = await res.json();

    const hourlyPrecip: number[] = json.hourly.precipitation ?? [];
    const hourlyTemp:   number[] = json.hourly.temperature_2m ?? [];
    const hourlyHumid:  number[] = json.hourly.relative_humidity_2m ?? [];
    const hourlyWind:   number[] = json.hourly.wind_speed_10m ?? [];
    const hourlyTime:   string[] = json.hourly.time ?? [];
    const dailySums:    number[] = json.daily?.precipitation_sum ?? [];

    // Past 24h = last 24 hourly entries
    const last24  = hourlyPrecip.slice(-24);
    const past7d  = dailySums.slice(-7);

    const rainfall24h = last24.reduce((a, b) => a + (b ?? 0), 0);
    const rainfall7d  = past7d.reduce((a, b) => a + (b ?? 0), 0);
    const rainfall30d = rainfall7d * 4.3; // estimate

    const lastTemp    = hourlyTemp.slice(-1)[0]  ?? 28;
    const lastHumid   = hourlyHumid.slice(-1)[0] ?? 70;
    const lastWind    = hourlyWind.slice(-1)[0]  ?? 10;

    const riskScore = computeRiskScore(rainfall24h, rainfall7d);
    const riskLevel = getRiskLevel(riskScore);

    // Build 72h forecast
    const forecastStart = Math.max(0, hourlyTime.length - 24);
    const forecast: ForecastPoint[] = hourlyTime.slice(forecastStart).map((t, i) => ({
      time: t,
      rain: hourlyPrecip[forecastStart + i] ?? 0,
      temp: hourlyTemp[forecastStart + i] ?? 0,
    }));

    return {
      name:        districtKey.charAt(0).toUpperCase() + districtKey.slice(1),
      state:       coords.state,
      rainfall24h: Math.round(rainfall24h * 10) / 10,
      rainfall7d:  Math.round(rainfall7d  * 10) / 10,
      rainfall30d: Math.round(rainfall30d * 10) / 10,
      temperature: Math.round(lastTemp),
      humidity:    Math.round(lastHumid),
      windSpeed:   Math.round(lastWind),
      riskScore,
      riskLevel,
      forecast,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error("fetchDistrictWeather error:", err);
    return null;
  }
}

/** Fetch weather for multiple districts in parallel */
export async function fetchMultipleDistricts(keys: string[]): Promise<DistrictWeather[]> {
  const results = await Promise.all(keys.map(fetchDistrictWeather));
  return results.filter((r): r is DistrictWeather => r !== null);
}

/** 
 * Generate alert objects from high-risk districts.
 * In production you would also pull NDMA RSS / IMD XML here.
 */
export function generateAlertsFromWeather(districts: DistrictWeather[]): Alert[] {
  const alerts: Alert[] = [];

  districts.forEach((d) => {
    if (d.riskScore >= 60) {
      alerts.push({
        id:        `weather-${d.name.toLowerCase()}-${Date.now()}`,
        severity:  d.riskLevel,
        title:     `${d.riskLevel} Flood Risk — ${d.name}`,
        body:      `${d.rainfall24h}mm rain in 24h. Risk score ${d.riskScore}/100. ${
          d.riskScore >= 80 ? "Immediate evacuation of low-lying areas recommended." :
          d.riskScore >= 60 ? "Caution advised. Monitor official channels." : ""
        }`,
        source:    "AI",
        district:  d.name,
        state:     d.state,
        timestamp: d.lastUpdated,
        read:      false,
      });
    }
  });

  return alerts.sort((a, b) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });
}

/** Default districts to show when user hasn't configured any */
export const DEFAULT_DISTRICTS = ["kottayam", "patna", "bhubaneswar", "guwahati", "surat"];
