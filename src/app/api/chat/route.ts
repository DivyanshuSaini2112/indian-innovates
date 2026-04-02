import { NextRequest, NextResponse } from "next/server";
import { fetchMultipleDistricts, DEFAULT_DISTRICTS } from "@/lib/api";

export const dynamic = "force-dynamic";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/* ── Build a rich live-data context string ─────────────── */
function buildContext(districts: Awaited<ReturnType<typeof fetchMultipleDistricts>>) {
  const highRisk = districts.filter(d => d.riskScore >= 60).sort((a, b) => b.riskScore - a.riskScore);
  const critical  = districts.filter(d => d.riskLevel === "Critical");
  const avgRain   = (districts.reduce((a, d) => a + d.rainfall24h, 0) / districts.length).toFixed(1);
  const top5      = [...districts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const safest    = [...districts].sort((a, b) => a.riskScore - b.riskScore).slice(0, 5);
  const now       = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return `
LIVE FLOOD INTELLIGENCE DATA (as of ${now} IST)
================================================
Total districts monitored: ${districts.length}
High or critical risk districts: ${highRisk.length}
Critical risk districts: ${critical.length}
National average 24h rainfall: ${avgRain} mm

TOP 5 HIGHEST RISK DISTRICTS:
${top5.map(d => `- ${d.name}, ${d.state}: Risk ${d.riskScore}/100 (${d.riskLevel}) | 24h Rain: ${d.rainfall24h.toFixed(1)}mm | 7d Rain: ${d.rainfall7d.toFixed(1)}mm | Temp: ${d.temperature}°C`).join("\n")}

SAFEST 5 DISTRICTS:
${safest.map(d => `- ${d.name}, ${d.state}: Risk ${d.riskScore}/100 (${d.riskLevel}) | 24h Rain: ${d.rainfall24h.toFixed(1)}mm`).join("\n")}

${highRisk.length > 0 ? `DISTRICTS AT HIGH/CRITICAL RISK:\n${highRisk.slice(0, 10).map(d => `- ${d.name}, ${d.state}: Risk ${d.riskScore}/100 (${d.riskLevel}) | Rain: ${d.rainfall24h.toFixed(1)}mm`).join("\n")}` : "No districts at high or critical flood risk currently."}

ALL DISTRICT SUMMARY:
${districts.slice(0, 30).map(d => `${d.name} (${d.state}): ${d.riskLevel} (${d.riskScore}/100), ${d.rainfall24h.toFixed(1)}mm/24h, ${d.temperature}°C`).join(" | ")}
...and ${Math.max(0, districts.length - 30)} more districts.
`.trim();
}

/* ── System prompt ────────────────────────────────────── */
function buildSystemPrompt(liveData: string, lang: string) {
  const isHindi = lang === "hi";
  return `You are **Badal** (meaning "Cloud" in Hindi ☁️), an intelligent AI assistant for FloodSense India — a real-time flood risk monitoring platform.

${isHindi ? `IMPORTANT: The user is communicating in Hindi. You MUST respond ENTIRELY in Hindi (use Devanagari script). Do not use English in your response except for proper names of districts, states, and technical terms that don't have standard Hindi equivalents.` : `Respond in clear, helpful English.`}

Your role:
- Answer questions about live flood risk, rainfall, district safety, and weather conditions across India.
- Give specific, data-driven answers using the live data provided below.
- Be concise but informative. If the user asks about a specific district, look it up in the data.
- Use emojis appropriately: 🌧️ for rain, 🚨 for high risk, ✅ for safe, 🌡️ for temperature, ☁️ for general.
- Keep responses under 200 words for voice readability.
- If you don't have specific data for a location, say so and give the closest available info.
- Do NOT make up data. Only use the live data provided.

Data source: Open-Meteo (free, real-time weather API). Updated every 15 minutes.
Platform: FloodSense India (floodsense.india)

${isHindi ? "हिंदी में जवाब दें। सटीक और उपयोगी जानकारी दें।" : ""}

--- LIVE DATA ---
${liveData}
--- END LIVE DATA ---

Answer the user's question using this data. Be direct and helpful.`;
}

/* ── Gemini REST call ─────────────────────────────────── */
async function callGemini(systemPrompt: string, userMessage: string, apiKey: string) {
  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature:     0.7,
      maxOutputTokens: 512,
      topP:            0.9,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
}

/* ── Fallback (no API key) ────────────────────────────── */
function fallbackReply(message: string, districts: Awaited<ReturnType<typeof fetchMultipleDistricts>>, lang: string): string {
  const highRisk  = districts.filter(d => d.riskScore >= 60).sort((a, b) => b.riskScore - a.riskScore);
  const avgRain   = (districts.reduce((a, d) => a + d.rainfall24h, 0) / districts.length).toFixed(1);
  const top3      = [...districts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
  const m         = message.toLowerCase();
  const specific  = districts.find(d => m.includes(d.name.toLowerCase()));
  const isHindi   = lang === "hi";

  if (specific) {
    const d = specific;
    if (isHindi) {
      return `📍 **${d.name}, ${d.state}** — लाइव रिपोर्ट\n\n**जोखिम स्तर:** ${d.riskLevel} (${d.riskScore}/100)\n**24 घंटे की बारिश:** ${d.rainfall24h.toFixed(1)} mm\n**7 दिन की बारिश:** ${d.rainfall7d.toFixed(1)} mm\n**तापमान:** ${d.temperature}°C\n\n${d.riskScore >= 60 ? "⚠️ यह जिला वर्तमान में बाढ़ के उच्च जोखिम में है।" : "✅ वर्तमान में इस जिले में बाढ़ का जोखिम कम है।"}`;
    }
    return `📍 **${d.name}, ${d.state}**\n\n**Risk:** ${d.riskLevel} (${d.riskScore}/100)\n**24h Rain:** ${d.rainfall24h.toFixed(1)} mm | **7d:** ${d.rainfall7d.toFixed(1)} mm\n**Temp:** ${d.temperature}°C\n\n${d.riskScore >= 60 ? "⚠️ Elevated flood risk. Stay alert." : "✅ Low risk currently."}`;
  }

  if (isHindi) {
    return `🌧️ **राष्ट्रीय बाढ़ सारांश**\n\n${districts.length} जिलों की निगरानी हो रही है।\n**उच्च जोखिम वाले जिले:** ${highRisk.length}\n**औसत बारिश:** ${avgRain} mm/24h\n\n**शीर्ष जोखिम वाले क्षेत्र:**\n${top3.map((d, i) => `${i + 1}. ${d.name} — ${d.riskScore}/100`).join("\n")}\n\n⚠️ कृपया अपना Gemini API key जोड़ें बेहतर जवाबों के लिए।`;
  }
  return `🌧️ **National Flood Summary** (${districts.length} districts)\n\n**High risk:** ${highRisk.length} | **Avg rain:** ${avgRain}mm\n\n**Top risks:**\n${top3.map((d, i) => `${i + 1}. ${d.name} — ${d.riskScore}/100`).join("\n")}\n\n💡 Add your Gemini API key to GEMINI_API_KEY in .env.local for smarter AI responses!`;
}

/* ── Route handler ────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const { message, lang = "en" } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
  }

  const districts = await fetchMultipleDistricts(DEFAULT_DISTRICTS);
  const apiKey    = process.env.GEMINI_API_KEY;

  /* Use Gemini if key is set and not placeholder */
  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      const liveData     = buildContext(districts);
      const systemPrompt = buildSystemPrompt(liveData, lang);
      const reply        = await callGemini(systemPrompt, message, apiKey);
      return NextResponse.json({ reply, source: "gemini", districtsChecked: districts.length });
    } catch (err) {
      console.error("[Badal] Gemini error:", err);
      const reply = fallbackReply(message, districts, lang);
      return NextResponse.json({ reply, source: "fallback_error", error: String(err) });
    }
  }

  /* No key — fallback with live data */
  const reply = fallbackReply(message, districts, lang);
  return NextResponse.json({ reply, source: "fallback_no_key", districtsChecked: districts.length });
}
