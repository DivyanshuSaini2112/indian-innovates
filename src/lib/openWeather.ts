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

export async function fetchHourlyForecast(
  lat: number,
  lon: number,
): Promise<OpenWeatherHourlyForecast | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) return null;

    const json = (await res.json().catch(() => null)) as unknown;
    if (!json || typeof json !== "object") return null;

    const data = json as Record<string, unknown>;
    const current = data.current as Record<string, unknown> | undefined;
    const hourly = (data.hourly as Array<Record<string, unknown>>) ?? [];
    const daily = (data.daily as Array<Record<string, unknown>>) ?? [];

    if (!current || hourly.length === 0) return null;

    const hourlyRain: number[] = hourly.map(h => {
      const rain = h.rain as Record<string, unknown> | undefined;
      return (coerceFiniteNumber(rain?.['1h']) ?? coerceFiniteNumber(h.precipitation) ?? 0);
    });
    const hourlyTemp: number[] = hourly.map(h => coerceFiniteNumber(h.temp) ?? 0);
    const hourlyHumidity: number[] = hourly.map(h => coerceFiniteNumber(h.humidity) ?? 70);
    const hourlyWind: number[] = hourly.map(h => (coerceFiniteNumber(h.wind_speed) ?? 0) * 3.6);
    const hourlyTime: string[] = hourly.map(h => {
      const ts = coerceFiniteNumber(h.dt);
      return ts !== null ? new Date(ts * 1000).toISOString() : new Date().toISOString();
    });
    const dailyRain: number[] = daily.map((d) => coerceFiniteNumber(d.rain) ?? 0);

    const current24hRain = hourlyRain.slice(-24).reduce((a, b) => a + b, 0);
    const currentTemp = coerceFiniteNumber(current.temp) ?? 28;
    const currentHumidity = coerceFiniteNumber(current.humidity) ?? 70;
    const currentWind = ((coerceFiniteNumber(current.wind_speed) ?? 0) * 3.6);

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
      currentWind,
    };
  } catch (err) {
    console.error("fetchHourlyForecast error:", err);
    return null;
  }
}

