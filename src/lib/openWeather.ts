export type OpenWeatherGeocodeResult = {
  lat: number;
  lon: number;
  state?: string;
  name: string;
};

export type OpenWeatherCurrent = {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmH: number;
  cityName?: string;
};

function getApiKey(): string {
  // Support multiple common env var names.
  return (
    process.env.OPENWEATHER_API_KEY ??
    process.env.OPENWEATHER_APPID ??
    process.env.OPENWEATHER_KEY ??
    process.env.APPID ??
    ""
  );
}

function coerceFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Uses OpenWeather Geocoding to resolve a district/place name to lat/lon */
export async function geocodeDistrict(query: string): Promise<OpenWeatherGeocodeResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  // Keep it India-focused. Users often type only the district name.
  const q = `${query},IN`;
  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as unknown;
  if (!Array.isArray(json) || json.length === 0) return null;

  // Pick the first result. If you want district-precision, we can extend this to
  // show multiple matches for selection in the UI.
  const first = json[0] as Record<string, unknown>;

  const lat = coerceFiniteNumber(first?.lat);
  const lon = coerceFiniteNumber(first?.lon);
  const name = typeof first?.name === "string" ? first.name : query;
  const state = typeof first?.state === "string" ? first.state : undefined;

  if (lat === null || lon === null) return null;
  return { lat, lon, state, name };
}

/** Calls OpenWeather current weather using lat/lon */
export async function fetchCurrentWeatherByLatLon(
  lat: number,
  lon: number,
): Promise<OpenWeatherCurrent | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", apiKey);
  // Ensure temperatures are returned in Celsius to avoid Kelvin mismatches.
  url.searchParams.set("units", "metric");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  const main = (typeof obj.main === "object" && obj.main ? obj.main : undefined) as
    | Record<string, unknown>
    | undefined;
  const wind = (typeof obj.wind === "object" && obj.wind ? obj.wind : undefined) as
    | Record<string, unknown>
    | undefined;

  const temperatureC = coerceFiniteNumber(main?.temp);
  const humidityPercent = coerceFiniteNumber(main?.humidity);
  const windMps = coerceFiniteNumber(wind?.speed);
  const cityName = typeof obj.name === "string" ? obj.name : undefined;

  if (temperatureC === null || humidityPercent === null || windMps === null) return null;

  return {
    temperatureC,
    humidityPercent,
    windSpeedKmH: windMps * 3.6,
    cityName,
  };
}

/**
 * Calls OpenWeather current weather using `q` (matches your URL style).
 * This avoids locality drift from geocoding and should match your manual API results more closely.
 */
export async function fetchCurrentWeatherByQuery(query: string): Promise<OpenWeatherCurrent | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const q = `${query.trim()},IN`;
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", q);
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric"); // Celsius

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  const main = (typeof obj.main === "object" && obj.main ? obj.main : undefined) as
    | Record<string, unknown>
    | undefined;
  const wind = (typeof obj.wind === "object" && obj.wind ? obj.wind : undefined) as
    | Record<string, unknown>
    | undefined;

  const temperatureC = coerceFiniteNumber(main?.temp);
  const humidityPercent = coerceFiniteNumber(main?.humidity);
  const windMps = coerceFiniteNumber(wind?.speed);
  const cityName = typeof obj.name === "string" ? obj.name : undefined;

  if (temperatureC === null || humidityPercent === null || windMps === null) return null;

  return {
    temperatureC,
    humidityPercent,
    windSpeedKmH: windMps * 3.6,
    cityName,
  };
}

export type OpenWeatherHourlyForecast = {
  hourlyRain: number[];
  hourlyTemp: number[];
  hourlyHumidity: number[];
  hourlyWind: number[];
  hourlyTime: string[];
  dailyRain: number[];
  current24hRain: number;
  currentTemp: number;
  currentHumidity: number;
  currentWind: number;
};

/**
 * Uses FREE OpenWeather endpoints:
 *  - data/2.5/weather  → current conditions (temp, humidity, wind, rain)
 *  - data/2.5/forecast → 5-day / 3h forecast (40 slots, free tier)
 *
 * This replaces the paywalled One Call 3.0 endpoint.
 */
export async function fetchHourlyForecast(
  lat: number,
  lon: number,
): Promise<OpenWeatherHourlyForecast | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    /* ── 1. Current weather (free) ── */
    const currentUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
    currentUrl.searchParams.set("lat",   String(lat));
    currentUrl.searchParams.set("lon",   String(lon));
    currentUrl.searchParams.set("units", "metric");
    currentUrl.searchParams.set("appid", apiKey);

    const currentRes = await fetch(currentUrl.toString(), { next: { revalidate: 900 } });
    if (!currentRes.ok) return null;
    const currentJson = (await currentRes.json().catch(() => null)) as Record<string, unknown> | null;
    if (!currentJson) return null;

    const mainBlock = currentJson.main as Record<string, unknown> | undefined;
    const windBlock = currentJson.wind as Record<string, unknown> | undefined;
    const rainBlock = currentJson.rain as Record<string, unknown> | undefined;

    const currentTemp     = coerceFiniteNumber(mainBlock?.temp)     ?? 28;
    const currentHumidity = coerceFiniteNumber(mainBlock?.humidity) ?? 70;
    const currentWindMps  = coerceFiniteNumber(windBlock?.speed)    ?? 0;
    const currentRain1h   = coerceFiniteNumber(rainBlock?.["1h"])   ?? 0;

    /* ── 2. 5-day / 3h forecast (free) ── */
    const forecastUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
    forecastUrl.searchParams.set("lat",   String(lat));
    forecastUrl.searchParams.set("lon",   String(lon));
    forecastUrl.searchParams.set("units", "metric");
    forecastUrl.searchParams.set("cnt",   "40");          // max 40 slots = 5 days
    forecastUrl.searchParams.set("appid", apiKey);

    const forecastRes = await fetch(forecastUrl.toString(), { next: { revalidate: 900 } });
    if (!forecastRes.ok) return null;
    const forecastJson = (await forecastRes.json().catch(() => null)) as Record<string, unknown> | null;
    if (!forecastJson) return null;

    const slots = (forecastJson.list as Array<Record<string, unknown>>) ?? [];
    if (slots.length === 0) return null;

    /* Each slot covers 3 hours — expand to pseudo-hourly by repeating each 3 times */
    const hourlyRain:     number[] = [];
    const hourlyTemp:     number[] = [];
    const hourlyHumidity: number[] = [];
    const hourlyWind:     number[] = [];
    const hourlyTime:     string[] = [];
    const dailyMap       = new Map<string, number>();

    for (const slot of slots) {
      const mainS = slot.main  as Record<string, unknown> | undefined;
      const windS = slot.wind  as Record<string, unknown> | undefined;
      const rainS = slot.rain  as Record<string, unknown> | undefined;
      const ts    = coerceFiniteNumber(slot.dt);
      const dt    = ts !== null ? new Date(ts * 1000) : new Date();

      const rain3h = coerceFiniteNumber(rainS?.["3h"]) ?? 0;
      const rain1h = rain3h / 3;                         // average per hour
      const temp   = coerceFiniteNumber(mainS?.temp)     ?? currentTemp;
      const humid  = coerceFiniteNumber(mainS?.humidity) ?? currentHumidity;
      const wind   = (coerceFiniteNumber(windS?.speed)   ?? 0) * 3.6;

      // Spread each 3h slot into 3 × 1h buckets
      for (let i = 0; i < 3; i++) {
        const slotTime = new Date(dt.getTime() + i * 3_600_000).toISOString();
        hourlyRain.push(rain1h);
        hourlyTemp.push(temp);
        hourlyHumidity.push(humid);
        hourlyWind.push(wind);
        hourlyTime.push(slotTime);
      }

      // Accumulate daily totals
      const dayKey = dt.toISOString().slice(0, 10);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + rain3h);
    }

    const dailyRain = Array.from(dailyMap.values());
    const current24hRain = hourlyRain.slice(0, 24).reduce((a, b) => a + b, 0) + currentRain1h;

    return {
      hourlyRain,
      hourlyTemp,
      hourlyHumidity,
      hourlyWind,
      hourlyTime,
      dailyRain,
      current24hRain,
      currentTemp,
      currentHumidity,
      currentWind: currentWindMps * 3.6,
    };
  } catch (err) {
    console.error("fetchHourlyForecast error:", err);
    return null;
  }
}

