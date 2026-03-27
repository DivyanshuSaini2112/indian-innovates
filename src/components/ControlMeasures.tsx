"use client";

import { useEffect, useMemo, useState } from "react";
import type { RiskLevel } from "@/types";
import { estimateFloodLevelCm, getControlMeasures, type ControlActionGroup } from "@/lib/floodGuidance";
import { RISK_COLORS } from "@/lib/utils";

type AIGroup = { title: string; items: string[] };
type AIResponse = {
  source: "TEMPLATED" | "AI";
  summary: string;
  groups: AIGroup[];
  checklist: string[];
};

export function ControlMeasures({
  district,
  state,
  riskLevel,
  riskScore,
  floodLevelCm,
}: {
  district: string;
  state: string;
  riskLevel: RiskLevel;
  riskScore: number;
  floodLevelCm?: number;
}) {
  const floodCm = typeof floodLevelCm === "number" ? floodLevelCm : estimateFloodLevelCm(riskScore);

  const templated = useMemo(() => getControlMeasures(riskLevel, floodCm), [riskLevel, floodCm]);

  const [ai, setAi] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const active = ai ?? {
    source: "TEMPLATED",
    summary: templated.shortSummary,
    groups: templated.groups as ControlActionGroup[],
    checklist: templated.checklist,
  };

  useEffect(() => {
    // Reset checklist when district/risk changes.
    setChecked({});
    setAi(null);
  }, [district, riskLevel, riskScore, floodCm]);

  const toggleItem = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const allCount = active.checklist.length;
  const doneCount = active.checklist.reduce((acc, _item, idx) => acc + (checked[idx] ? 1 : 0), 0);

  const generate = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district,
          state,
          riskLevel,
          riskScore,
          floodLevelCm: floodCm,
        }),
      });
      const json = (await res.json()) as AIResponse;
      setAi(json);
    } finally {
      setLoading(false);
    }
  };

  const accent = RISK_COLORS[riskLevel];

  return (
    <section className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-heading font-semibold text-foreground mb-2">Control Measures & Suggestions</h3>
          <p className="text-muted text-sm leading-relaxed">
            {templated.floodLevelLabel}. {active.source === "AI" ? "AI refined guidance is available below." : "Instant templated guidance."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted uppercase tracking-widest">Predicted flood depth</div>
            <div className="font-heading text-4xl font-semibold" style={{ color: accent }}>
              {floodCm}cm
            </div>
            <div className="text-xs text-muted">Risk: {riskLevel}</div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2 glass rounded-xl text-sm text-primary hover:bg-primary/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            title="Refine guidance using an AI model (optional)"
          >
            {loading ? "Generating..." : ai?.source === "AI" ? "Re-generate AI" : "Generate AI Guidance"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-5">
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(10, Math.min(100, riskScore))}%`, background: `linear-gradient(to right, ${accent}, #F0A500)` }}
          />
        </div>
        <p className="text-sm text-muted leading-relaxed">
          {active.summary}
          <span className="block text-xs text-muted mt-2">Reminder: Always follow official NDMA/IMD/CWC and state advisories.</span>
        </p>
      </div>

      {/* Action groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {active.groups.slice(0, 4).map((g, i) => (
          <div key={`${g.title}-${i}`} className="glass rounded-xl p-4 border border-white/5 bg-background/50">
            <div className="text-sm font-semibold text-foreground mb-2">{g.title}</div>
            <ul className="space-y-1.5">
              {g.items.slice(0, 7).map((item, idx) => (
                <li key={idx} className="text-muted text-sm flex gap-2">
                  <span className="text-white/20 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Interactive checklist */}
      <div className="border-t border-white/8 pt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h4 className="font-heading font-semibold text-foreground">Personal Checklist</h4>
          <div className="text-xs text-muted">
            {doneCount}/{allCount} done
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={() => {
              const next: Record<number, boolean> = {};
              active.checklist.forEach((_item, idx) => (next[idx] = true));
              setChecked(next);
            }}
            className="glass rounded-xl px-3 py-1.5 text-xs text-muted hover:text-foreground transition"
          >
            Mark all done
          </button>
          <button
            onClick={() => setChecked({})}
            className="glass rounded-xl px-3 py-1.5 text-xs text-muted hover:text-foreground transition"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {active.checklist.map((item, idx) => {
            const isOn = !!checked[idx];
            return (
              <label
                key={`${item}-${idx}`}
                className={`flex items-start gap-3 glass rounded-xl px-3 py-2 cursor-pointer border border-white/5 ${
                  isOn ? "bg-primary/10" : "bg-background/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggleItem(idx)}
                  className="mt-0.5 accent-primary"
                />
                <span className={`text-sm ${isOn ? "text-foreground" : "text-muted"}`}>{item}</span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}

