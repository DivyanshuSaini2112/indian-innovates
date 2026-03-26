// District short codes → Open-Meteo lat/lng
export const DISTRICT_COORDS: Record<string, { lat: number; lon: number; state: string }> = {
  kottayam:     { lat: 9.5916,  lon: 76.5222, state: "Kerala" },
  patna:        { lat: 25.5941, lon: 85.1376, state: "Bihar" },
  bhubaneswar:  { lat: 20.2961, lon: 85.8245, state: "Odisha" },
  surat:        { lat: 21.1702, lon: 72.8311, state: "Gujarat" },
  wayanad:      { lat: 11.6854, lon: 76.1320, state: "Kerala" },
  guwahati:     { lat: 26.1445, lon: 91.7362, state: "Assam" },
  darbhanga:    { lat: 26.1542, lon: 85.8918, state: "Bihar" },
  jhansi:       { lat: 25.4484, lon: 78.5685, state: "Uttar Pradesh" },
  kolkata:      { lat: 22.5726, lon: 88.3639, state: "West Bengal" },
  chennai:      { lat: 13.0827, lon: 80.2707, state: "Tamil Nadu" },
  mumbai:       { lat: 19.0760, lon: 72.8777, state: "Maharashtra" },
  delhi:        { lat: 28.6139, lon: 77.2090, state: "Delhi" },
  lucknow:      { lat: 26.8467, lon: 80.9462, state: "Uttar Pradesh" },
  jaipur:       { lat: 26.9124, lon: 75.7873, state: "Rajasthan" },
  hyderabad:    { lat: 17.3850, lon: 78.4867, state: "Telangana" },
  bangalore:    { lat: 12.9716, lon: 77.5946, state: "Karnataka" },
  pune:         { lat: 18.5204, lon: 73.8567, state: "Maharashtra" },
  nagpur:       { lat: 21.1458, lon: 79.0882, state: "Maharashtra" },
  ahmedabad:    { lat: 23.0225, lon: 72.5714, state: "Gujarat" },
  dibrugarh:    { lat: 27.4728, lon: 94.9120, state: "Assam" },
};

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface DistrictWeather {
  name: string;
  state: string;
  rainfall24h: number;  // mm
  rainfall7d: number;   // mm
  rainfall30d: number;  // mm (estimated)
  temperature: number;  // °C
  humidity: number;     // %
  windSpeed: number;    // km/h
  riskScore: number;    // 0-100
  riskLevel: RiskLevel;
  riverName?: string;
  riverLevel?: number;
  dangerMark?: number;
  forecast: ForecastPoint[];
  lastUpdated: string;
}

export interface ForecastPoint {
  time: string;
  rain: number;         // mm/h
  temp: number;
}

export interface Alert {
  id: string;
  severity: RiskLevel;
  title: string;
  body: string;
  source: "IMD" | "CWC" | "NDMA" | "AI";
  district: string;
  state: string;
  timestamp: string;
  read: boolean;
}

export interface UserDistrict {
  id: string;
  user_id: string;
  district_name: string;
  district_state: string;
  pinned_order: number;
}

export interface UserPreferences {
  email_alerts: boolean;
  sms_alerts: boolean;
  push_alerts: boolean;
  whatsapp_alerts: boolean;
  threshold: "Low" | "Medium" | "High" | "Critical";
}
