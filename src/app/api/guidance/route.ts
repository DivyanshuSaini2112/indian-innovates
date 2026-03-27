import { NextRequest, NextResponse } from "next/server";
import { getControlMeasures, estimateFloodLevelCm, type ControlMeasures } from "@/lib/floodGuidance";
import type { RiskLevel } from "@/types";

type GuidanceRequest = {
  district: string;
  state: string;
  riskLevel: RiskLevel;
  riskScore: number;
  floodLevelCm?: number;
};

type GuidanceResponse = {
  source: "TEMPLATED" | "AI";
  summary: string;
  groups: ControlMeasures["groups"];
  checklist: string[];
};

function buildTemplated(req: GuidanceRequest): GuidanceResponse {
  const floodLevelCm = typeof req.floodLevelCm === "number" ? req.floodLevelCm : estimateFloodLevelCm(req.riskScore);
  const measures = getControlMeasures(req.riskLevel, floodLevelCm);
  return {
    source: "TEMPLATED",
    summary: measures.shortSummary,
    groups: measures.groups,
    checklist: measures.checklist,
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GuidanceRequest;
  if (!body?.district || !body?.state || !body?.riskLevel || typeof body?.riskScore !== "number") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const templated = buildTemplated(body);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    // No AI key configured: return best deterministic guidance.
    return NextResponse.json(templated);
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const floodLevelCm = typeof body.floodLevelCm === "number" ? body.floodLevelCm : estimateFloodLevelCm(body.riskScore);

  const prompt = {
    system:
      "You are a flood safety adviser for India. Produce practical, non-alarming guidance. " +
      "Always include a short reminder to follow official NDMA/IMD/CWC/state advisories. " +
      "Return ONLY valid JSON matching the requested schema. No markdown.",
    user:
      `District: ${body.district}, ${body.state}\n` +
      `Predicted risk level: ${body.riskLevel}\n` +
      `Predicted flood depth: ~${floodLevelCm} cm\n\n` +
      "Create control measures and suggestions.\n\n" +
      "JSON schema:\n" +
      "{\n" +
      '  "summary": string,\n' +
      '  "groups": [ { "title": string, "items": string[] } ],\n' +
      '  "checklist": string[]\n' +
      "}\n\n" +
      "Rules:\n" +
      "- groups: 3-4 groups maximum, each with 4-7 concise bullet items.\n" +
      "- checklist: 8-12 concise items.\n" +
      "- Keep items action-oriented and India-relevant.\n" +
      "- Do not invent official hotline numbers; if mentioned, stick to general ones (e.g., NDRF 1078) only.\n",
  };

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        // Many models support this; if it errors, we still parse the JSON from text.
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      // Return templated guidance on AI failures.
      return NextResponse.json(templated);
    }

    const json = await openaiRes.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return NextResponse.json(templated);

    const parsed = JSON.parse(content) as Omit<GuidanceResponse, "source">;
    if (!parsed?.summary || !Array.isArray(parsed.groups) || !Array.isArray(parsed.checklist)) {
      return NextResponse.json(templated);
    }

    return NextResponse.json({
      source: "AI",
      summary: String(parsed.summary),
      groups: parsed.groups.map((g) => ({ title: String(g.title), items: Array.isArray(g.items) ? g.items.map(String) : [] })),
      checklist: parsed.checklist.map(String),
    } satisfies GuidanceResponse);
  } catch {
    return NextResponse.json(templated);
  }
}

