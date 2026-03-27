import { getRiskLevel } from "@/lib/utils";
import type { RiskLevel } from "@/types";

export interface DatasetFloodPrediction {
  floodLevelCm: number;
  riskLevel?: RiskLevel;
  riskScore?: number;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickFirstDefined<T>(...vals: Array<T | undefined>): T | undefined {
  for (const v of vals) if (v !== undefined) return v;
  return undefined;
}

/**
 * Dataset integration (configurable).
 *
 * Required env vars:
 * - DATASET_API_BASE_URL
 * - DATASET_API_KEY  (your provided id/key: e.g. dfa46577df53eed5e3775ec94b8c5c42)
 *
 * Optional:
 * - DATASET_API_ENDPOINT (default: /predict)
 *
 * If the API is misconfigured or returns an unexpected schema, this function
 * returns null and the app falls back to the existing Open-Meteo derived logic.
 */
export async function fetchDatasetFloodPrediction(
  districtKey: string,
): Promise<DatasetFloodPrediction | null> {
  const baseUrl = process.env.DATASET_API_BASE_URL ?? "";
  const apiKey = process.env.DATASET_API_KEY ?? "";
  const endpoint = process.env.DATASET_API_ENDPOINT ?? "/predict";

  if (!baseUrl || !apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const url = new URL(endpoint, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

    // Try a common request shape. If your API differs, just adjust in this file.
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Support common auth styles:
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ district: districtKey }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (!json) return null;

    // Try multiple possible response shapes.
    const candidate =
      json?.prediction ??
      json?.data ??
      json?.result ??
      json?.district ??
      json;

    const floodLevelCm =
      coerceNumber(pickFirstDefined(
        candidate?.floodLevelCm,
        candidate?.flood_depth_cm,
        candidate?.flood_depth,
        candidate?.floodLevel,
        candidate?.waterDepthCm,
        candidate?.water_depth_cm,
        candidate?.predicted_flood_level_cm,
      ));

    if (floodLevelCm === null) return null;

    const riskScore = coerceNumber(pickFirstDefined(
      candidate?.riskScore,
      candidate?.risk_score,
      candidate?.score,
    ));

    const riskLevelRaw = pickFirstDefined(
      candidate?.riskLevel,
      candidate?.risk_level,
      candidate?.level,
    );

    let riskLevel: RiskLevel | undefined;
    if (typeof riskLevelRaw === "string") {
      const v = riskLevelRaw.toLowerCase();
      riskLevel =
        v.includes("critical") ? "Critical" :
        v.includes("high") ? "High" :
        v.includes("medium") ? "Medium" :
        "Low";
    }

    return {
      floodLevelCm,
      riskScore: typeof riskScore === "number" ? riskScore : undefined,
      riskLevel: riskLevel ?? (typeof riskScore === "number" ? getRiskLevel(riskScore) : undefined),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

