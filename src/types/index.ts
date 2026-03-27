// District short codes → Open-Meteo lat/lng
export const DISTRICT_COORDS: Record<string, { lat: number; lon: number; state: string }> = {
  // Andhra Pradesh
  visakhapatnam: { lat: 17.6869, lon: 83.2185, state: "Andhra Pradesh" },
  vijayawada: { lat: 16.5062, lon: 80.6480, state: "Andhra Pradesh" },
  tirupati: { lat: 13.1939, lon: 79.8941, state: "Andhra Pradesh" },
  kurnool: { lat: 15.8281, lon: 78.8358, state: "Andhra Pradesh" },
  // Arunachal Pradesh
  itanagar: { lat: 28.0983, lon: 93.6149, state: "Arunachal Pradesh" },
  namsai: { lat: 27.9921, lon: 95.2217, state: "Arunachal Pradesh" },
  // Assam
  guwahati: { lat: 26.1445, lon: 91.7362, state: "Assam" },
  dibrugarh: { lat: 27.4728, lon: 94.9120, state: "Assam" },
  silchar: { lat: 24.8338, lon: 91.9829, state: "Assam" },
  barpeta: { lat: 26.3204, lon: 90.8083, state: "Assam" },
  nagaon: { lat: 26.1509, lon: 92.6814, state: "Assam" },
  // Bihar
  patna: { lat: 25.5941, lon: 85.1376, state: "Bihar" },
  darbhanga: { lat: 26.1542, lon: 85.8918, state: "Bihar" },
  bhagalpur: { lat: 25.2523, lon: 86.4871, state: "Bihar" },
  gaya: { lat: 24.7958, lon: 84.9944, state: "Bihar" },
  madhubani: { lat: 26.3884, lon: 86.4755, state: "Bihar" },
  muzaffarpur: { lat: 26.1209, lon: 85.3849, state: "Bihar" },
  // Chhattisgarh
  raipur: { lat: 21.2514, lon: 81.6296, state: "Chhattisgarh" },
  bilaspur: { lat: 22.0796, lon: 82.1469, state: "Chhattisgarh" },
  durg: { lat: 20.1809, lon: 80.8661, state: "Chhattisgarh" },
  // Goa
  panaji: { lat: 15.4909, lon: 73.8278, state: "Goa" },
  margao: { lat: 15.2993, lon: 73.9567, state: "Goa" },
  // Gujarat
  surat: { lat: 21.1702, lon: 72.8311, state: "Gujarat" },
  ahmedabad: { lat: 23.0225, lon: 72.5714, state: "Gujarat" },
  vadodara: { lat: 22.3072, lon: 73.1812, state: "Gujarat" },
  rajkot: { lat: 22.3039, lon: 70.8022, state: "Gujarat" },
  bhavnagar: { lat: 21.7645, lon: 71.9520, state: "Gujarat" },
  jamnagar: { lat: 22.4707, lon: 70.0883, state: "Gujarat" },
  gandhinagar: { lat: 23.2156, lon: 72.6369, state: "Gujarat" },
  // Haryana
  faridabad: { lat: 28.4089, lon: 77.3178, state: "Haryana" },
  gurgaon: { lat: 28.4595, lon: 77.0266, state: "Haryana" },
  hisar: { lat: 29.1437, lon: 75.7185, state: "Haryana" },
  // Himachal Pradesh
  shimla: { lat: 31.7739, lon: 77.1277, state: "Himachal Pradesh" },
  mandi: { lat: 32.2393, lon: 76.9385, state: "Himachal Pradesh" },
  solan: { lat: 30.9050, lon: 77.1665, state: "Himachal Pradesh" },
  // Jharkhand
  ranchi: { lat: 23.3441, lon: 85.2960, state: "Jharkhand" },
  dhanbad: { lat: 23.7957, lon: 86.4304, state: "Jharkhand" },
  giridih: { lat: 24.1916, lon: 85.3206, state: "Jharkhand" },
  // Karnataka
  bangalore: { lat: 12.9716, lon: 77.5946, state: "Karnataka" },
  bengaluru: { lat: 12.9716, lon: 77.5946, state: "Karnataka" },
  mysore: { lat: 12.2958, lon: 76.6394, state: "Karnataka" },
  mangalore: { lat: 12.8628, lon: 74.8547, state: "Karnataka" },
  belgaum: { lat: 15.8497, lon: 74.5119, state: "Karnataka" },
  tumkur: { lat: 13.2206, lon: 77.1143, state: "Karnataka" },
  // Kerala
  kottayam: { lat: 9.5916, lon: 76.5222, state: "Kerala" },
  wayanad: { lat: 11.6854, lon: 76.1320, state: "Kerala" },
  ernakulam: { lat: 9.9312, lon: 76.2673, state: "Kerala" },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366, state: "Kerala" },
  kozhikode: { lat: 11.2588, lon: 75.7804, state: "Kerala" },
  alappuzha: { lat: 9.5088, lon: 76.3393, state: "Kerala" },
  kollam: { lat: 8.8932, lon: 76.5997, state: "Kerala" },
  // Madhya Pradesh
  bhopal: { lat: 23.1815, lon: 79.9864, state: "Madhya Pradesh" },
  indore: { lat: 22.7196, lon: 75.8577, state: "Madhya Pradesh" },
  jabalpur: { lat: 23.1815, lon: 79.9864, state: "Madhya Pradesh" },
  gwalior: { lat: 26.2183, lon: 78.1627, state: "Madhya Pradesh" },
  // Maharashtra
  mumbai: { lat: 19.0760, lon: 72.8777, state: "Maharashtra" },
  pune: { lat: 18.5204, lon: 73.8567, state: "Maharashtra" },
  nagpur: { lat: 21.1458, lon: 79.0882, state: "Maharashtra" },
  aurangabad: { lat: 19.8762, lon: 75.3433, state: "Maharashtra" },
  nashik: { lat: 19.9975, lon: 73.7898, state: "Maharashtra" },
  kolhapur: { lat: 16.7050, lon: 73.7421, state: "Maharashtra" },
  amravati: { lat: 20.8531, lon: 77.7532, state: "Maharashtra" },
  // Manipur
  imphal: { lat: 24.8170, lon: 94.9062, state: "Manipur" },
  // Meghalaya
  shillong: { lat: 25.5788, lon: 91.8933, state: "Meghalaya" },
  garo: { lat: 25.2047, lon: 90.3340, state: "Meghalaya" },
  // Mizoram
  aizawl: { lat: 23.1815, lon: 92.7879, state: "Mizoram" },
  // Nagaland
  kohima: { lat: 25.6816, lon: 94.1193, state: "Nagaland" },
  // Odisha
  bhubaneswar: { lat: 20.2961, lon: 85.8245, state: "Odisha" },
  cuttack: { lat: 20.4625, lon: 85.8830, state: "Odisha" },
  rourkela: { lat: 22.2038, lon: 84.8536, state: "Odisha" },
  balasore: { lat: 21.4954, lon: 86.9271, state: "Odisha" },
  // Punjab
  chandigarh: { lat: 30.7333, lon: 76.8277, state: "Punjab" },
  amritsar: { lat: 31.6340, lon: 74.8723, state: "Punjab" },
  ludhiana: { lat: 30.9010, lon: 75.8573, state: "Punjab" },
  jalandhar: { lat: 31.3260, lon: 75.5762, state: "Punjab" },
  // Rajasthan
  jaipur: { lat: 26.9124, lon: 75.7873, state: "Rajasthan" },
  jodhpur: { lat: 26.2389, lon: 73.0243, state: "Rajasthan" },
  ajmer: { lat: 26.4499, lon: 74.6399, state: "Rajasthan" },
  bikaner: { lat: 28.0230, lon: 71.8305, state: "Rajasthan" },
  udaipur: { lat: 24.5854, lon: 73.7125, state: "Rajasthan" },
  // Sikkim
  gangtok: { lat: 27.5330, lon: 88.6109, state: "Sikkim" },
  // Tamil Nadu
  chennai: { lat: 13.0827, lon: 80.2707, state: "Tamil Nadu" },
  coimbatore: { lat: 11.0066, lon: 76.9558, state: "Tamil Nadu" },
  madurai: { lat: 9.9252, lon: 78.1198, state: "Tamil Nadu" },
  salem: { lat: 11.6643, lon: 78.1460, state: "Tamil Nadu" },
  tirunelveli: { lat: 8.7139, lon: 77.7567, state: "Tamil Nadu" },
  trichy: { lat: 10.7905, lon: 78.7047, state: "Tamil Nadu" },
  // Telangana
  hyderabad: { lat: 17.3850, lon: 78.4867, state: "Telangana" },
  warangal: { lat: 17.9689, lon: 78.6294, state: "Telangana" },
  khammam: { lat: 17.2696, lon: 78.6429, state: "Telangana" },
  // Tripura
  agartala: { lat: 23.8103, lon: 91.2787, state: "Tripura" },
  // Uttar Pradesh
  lucknow: { lat: 26.8467, lon: 80.9462, state: "Uttar Pradesh" },
  jhansi: { lat: 25.4484, lon: 78.5685, state: "Uttar Pradesh" },
  kanpur: { lat: 26.4499, lon: 80.3319, state: "Uttar Pradesh" },
  agra: { lat: 27.1767, lon: 78.0081, state: "Uttar Pradesh" },
  varanasi: { lat: 25.3200, lon: 82.9789, state: "Uttar Pradesh" },
  allahabad: { lat: 25.4358, lon: 81.8463, state: "Uttar Pradesh" },
  meerut: { lat: 28.9845, lon: 77.7064, state: "Uttar Pradesh" },
  noida: { lat: 28.5737, lon: 77.3560, state: "Uttar Pradesh" },
  // Uttarakhand
  dehradun: { lat: 30.3165, lon: 78.0322, state: "Uttarakhand" },
  haldwani: { lat: 29.2170, lon: 79.5110, state: "Uttarakhand" },
  // West Bengal
  kolkata: { lat: 22.5726, lon: 88.3639, state: "West Bengal" },
  darjeeling: { lat: 27.0410, lon: 88.2664, state: "West Bengal" },
  siliguri: { lat: 26.5124, lon: 88.4262, state: "West Bengal" },
  asansol: { lat: 23.6839, lon: 86.9641, state: "West Bengal" },
  // Union Territories
  delhi: { lat: 28.6139, lon: 77.2090, state: "Delhi" },
  srinagar: { lat: 34.0837, lon: 74.7973, state: "Jammu & Kashmir" },
  jammu: { lat: 32.7267, lon: 74.8570, state: "Jammu & Kashmir" },
  leh: { lat: 34.1642, lon: 77.5770, state: "Ladakh" },
  puducherry: { lat: 11.9416, lon: 79.8083, state: "Puducherry" },
  yanam: { lat: 14.5421, lon: 79.8704, state: "Puducherry" },
  andaman: { lat: 11.7401, lon: 92.6586, state: "Andaman & Nicobar" },
  port_blair: { lat: 11.7401, lon: 92.6586, state: "Andaman & Nicobar" },
  silvassa: { lat: 20.1809, lon: 72.9789, state: "Dadra & Nagar Haveli" },
  kavaratti: { lat: 10.5669, lon: 72.6417, state: "Lakshadweep" },
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
  /** Predicted flood water depth (cm). If not available, estimated from risk score. */
  floodLevelCm?: number;
  /** Data provider for current temperature/humidity/wind */
  weatherSource?: "OpenWeather" | "Open-Meteo";
  /** True when OpenWeather API key exists on the server and OpenWeather calls can succeed */
  openWeatherConfigured?: boolean;
  /** Source of risk prediction shown on dashboard/details */
  predictionSource?: "dataset" | "ml_model" | "rule_based";
  /** Current training sample count for the online model */
  modelSamples?: number;
  /** Whether the online model is ready to infer */
  modelReady?: boolean;
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
  /** Optional enrichment used for level-wise control measures */
  riskScore?: number;
  /** Optional enrichment used for level-wise control measures */
  floodLevelCm?: number;
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
