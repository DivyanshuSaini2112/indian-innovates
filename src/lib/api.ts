import { DISTRICT_COORDS, type DistrictWeather, type ForecastPoint, type Alert } from "@/types";
import type { RiskLevel } from "@/types";
import { computeRiskScore, getRiskLevel } from "@/lib/utils";
import { estimateFloodLevelCm } from "@/lib/floodGuidance";
import { fetchDatasetFloodPrediction } from "@/lib/datasetFlood";
import { geocodeDistrict, fetchHourlyForecast } from "@/lib/openWeather";
import { getRiskModelStatus, predictRiskModel, trainRiskModel } from "@/lib/riskModel";

/**
 * Fetches hourly rainfall + temperature from OpenWeatherMap One Call 3.0 API.
 * Falls back to Open-Meteo if OpenWeather key is not configured.
 */
export async function fetchDistrictWeather(districtKey: string): Promise<DistrictWeather | null> {
  const districtLower = districtKey.toLowerCase().trim();

  // Prefer static coordinates for known districts (fast path), but fall back to
  // OpenWeather geocoding so users can type any district name.
  const mappedCoords = DISTRICT_COORDS[districtLower];
  const coords =
    mappedCoords ?? (await geocodeDistrict(districtLower));

  if (!coords) return null;

  try {
    const datasetPromise = fetchDatasetFloodPrediction(districtKey.toLowerCase());

    // Try OpenWeather One Call API first
    let hourlyPrecip: number[] = [];
    let hourlyTemp: number[] = [];
    let hourlyHumid: number[] = [];
    let hourlyWind: number[] = [];
    let hourlyTime: string[] = [];
    let dailySums: number[] = [];
    let weatherSource: "OpenWeather" | "Open-Meteo" = "Open-Meteo";
    let lastHourlyTempC = 28;
    let lastHourlyHumid = 70;
    let lastHourlyWind = 10;

    // Fetch from OpenWeather first
    const openWeatherHourly = await fetchHourlyForecast(coords.lat, coords.lon);
    if (openWeatherHourly && openWeatherHourly.hourlyTime.length > 0) {
      hourlyPrecip = openWeatherHourly.hourlyRain;
      hourlyTemp = openWeatherHourly.hourlyTemp;
      hourlyHumid = openWeatherHourly.hourlyHumidity;
      hourlyWind = openWeatherHourly.hourlyWind;
      hourlyTime = openWeatherHourly.hourlyTime;
      dailySums = openWeatherHourly.dailyRain;
      lastHourlyTempC = openWeatherHourly.currentTemp;
      lastHourlyHumid = openWeatherHourly.currentHumidity;
      lastHourlyWind = openWeatherHourly.currentWind;
      weatherSource = "OpenWeather";
    } else {
      // Fall back to Open-Meteo (for backwards compatibility)
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

      const res = await fetch(url.toString(), { next: { revalidate: 900 } });
      if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

      const json = await res.json();
      hourlyPrecip = json.hourly.precipitation ?? [];
      const hourlyTempRaw: number[] = json.hourly.temperature_2m ?? [];
      hourlyHumid = json.hourly.relative_humidity_2m ?? [];
      hourlyWind = json.hourly.wind_speed_10m ?? [];
      hourlyTime = json.hourly.time ?? [];
      
      hourlyTemp = hourlyTempRaw.map((v) => (v > 100 ? v - 273.15 : v));
      dailySums = json.daily?.precipitation_sum ?? [];
      lastHourlyTempC = hourlyTemp.slice(-1)[0] ?? 28;
      lastHourlyHumid = hourlyHumid.slice(-1)[0] ?? 70;
      lastHourlyWind = hourlyWind.slice(-1)[0] ?? 10;
      weatherSource = "Open-Meteo";
    }

    // Continue with existing logic
    const last24  = hourlyPrecip.slice(-24);
    const past7d  = dailySums.slice(-7);
    const rainfall24h = last24.reduce((a, b) => a + (b ?? 0), 0);
    const rainfall7d  = past7d.reduce((a, b) => a + (b ?? 0), 0);
    const rainfall30d = dailySums.length > 0
      ? (dailySums.reduce((a, b) => a + (b ?? 0), 0) * (30 / Math.max(1, dailySums.length)))
      : rainfall7d * 4.3;

    const lastTemp = lastHourlyTempC;
    const lastHumid = lastHourlyHumid;
    const lastWind = lastHourlyWind;

    const riskScore = computeRiskScore(rainfall24h, rainfall7d);

    // Build 72h forecast
    const forecastStart = Math.max(0, hourlyTime.length - 24);
    const forecast: ForecastPoint[] = hourlyTime.slice(forecastStart).map((t, i) => ({
      time: t,
      rain: hourlyPrecip[forecastStart + i] ?? 0,
      temp: hourlyTemp[forecastStart + i] ?? 0,
    }));

    const dataset = await datasetPromise;
    const trainingTarget =
      typeof dataset?.riskScore === "number" ? Math.max(0, Math.min(100, dataset.riskScore)) : riskScore;

    trainRiskModel(
      {
        rainfall24h,
        rainfall7d,
        temperature: lastTemp,
        humidity: lastHumid,
        windSpeed: lastWind,
      },
      trainingTarget
    );
    const learnedRisk = predictRiskModel({
      rainfall24h,
      rainfall7d,
      temperature: lastTemp,
      humidity: lastHumid,
      windSpeed: lastWind,
    });

    const usedDataset = typeof dataset?.riskScore === "number";
    const usedModel = !usedDataset && typeof learnedRisk === "number";
    const finalRiskScore =
      usedDataset
        ? Math.max(0, Math.min(100, Math.round(dataset.riskScore as number)))
        : (learnedRisk ?? riskScore);

    const finalRiskLevel: RiskLevel =
      dataset?.riskLevel ?? getRiskLevel(finalRiskScore);

    const finalFloodLevelCm =
      typeof dataset?.floodLevelCm === "number" ? dataset.floodLevelCm : estimateFloodLevelCm(finalRiskScore);

    const weatherSourceConfigured = Boolean(
      process.env.OPENWEATHER_API_KEY ||
        process.env.OPENWEATHER_APPID ||
        process.env.OPENWEATHER_KEY ||
        process.env.APPID
    );
    const modelStatus = getRiskModelStatus();

    return {
      name:        districtLower.charAt(0).toUpperCase() + districtLower.slice(1),
      state:       typeof coords.state === "string" && coords.state.length > 0 ? coords.state : "India",
      rainfall24h: Math.round(rainfall24h * 10) / 10,
      rainfall7d:  Math.round(rainfall7d  * 10) / 10,
      rainfall30d: Math.round(rainfall30d * 10) / 10,
      temperature: Math.round(lastTemp),
      humidity:    Math.round(lastHumid),
      windSpeed:   Math.round(lastWind),
      riskScore: finalRiskScore,
      riskLevel: finalRiskLevel,
      floodLevelCm: Math.round(finalFloodLevelCm * 10) / 10,
      forecast,
      openWeatherConfigured: weatherSourceConfigured,
      weatherSource: weatherSource,
      predictionSource: usedDataset ? "dataset" : usedModel ? "ml_model" : "rule_based",
      modelSamples: modelStatus.sampleCount,
      modelReady: modelStatus.ready,
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
        riskScore: d.riskScore,
        floodLevelCm: d.floodLevelCm ?? estimateFloodLevelCm(d.riskScore),
      });
    }
  });

  return alerts.sort((a, b) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });
}

/** Default districts to show when user hasn't configured any */
export const DEFAULT_DISTRICTS = Object.keys(DISTRICT_COORDS);
