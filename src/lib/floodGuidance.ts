import type { RiskLevel } from "@/types";

export interface ControlActionGroup {
  title: string;
  subtitle?: string;
  items: string[];
}

export interface ControlMeasures {
  floodLevelLabel: string;
  shortSummary: string;
  groups: ControlActionGroup[];
  checklist: string[];
}

export const FLOOD_LEVEL_TEXT: Record<RiskLevel, { label: string; colorToken: string }> = {
  Low: { label: "Low Flooding Risk", colorToken: "text-safe" },
  Medium: { label: "Moderate Flooding Risk", colorToken: "text-warning" },
  High: { label: "High Flooding Risk", colorToken: "text-danger" },
  Critical: { label: "Very High / Critical Risk", colorToken: "text-critical" },
};

/**
 * Estimate flood water depth (cm) from risk score.
 * Note: once the dataset API is connected, replace this with real predicted water depth.
 */
export function estimateFloodLevelCm(riskScore: number): number {
  const s = Math.max(0, Math.min(100, riskScore));
  // Piecewise curve: keeps low-risk shallow but rapidly increases at higher risk.
  const cm =
    s < 40 ? 8 + s * 0.7 :
    s < 70 ? 30 + (s - 40) * 1.4 :
             70 + (s - 70) * 2.2;

  return Math.round(Math.max(0, Math.min(350, cm)));
}

export function getControlMeasures(riskLevel: RiskLevel, floodLevelCm: number): ControlMeasures {
  const levelText = FLOOD_LEVEL_TEXT[riskLevel];
  const floodLabel =
    floodLevelCm < 20 ? "Shallow inundation" :
    floodLevelCm < 50 ? "Local inundation" :
    floodLevelCm < 100 ? "Widespread flooding" :
                         "Severe flooding";

  const commonChecklist = [
    "Keep a torch, power bank, and emergency water ready",
    "Save helpline numbers and district/state control room contacts (e.g., NDRF 1078)",
    "Avoid walking/standing in moving water",
    "Turn off main electrical supply if water enters your premises (if safe)",
  ];

  const groups: ControlActionGroup[] = [];
  let shortSummary = "";
  let checklist: string[] = [];

  if (riskLevel === "Low") {
    shortSummary = "Monitor conditions and avoid minor waterlogging risks around drains and low streets.";
    groups.push({
      title: "Now (0–3 hours)",
      subtitle: "Reduce small impacts quickly",
      items: [
        "Clear nearby drains, gutters, and clogged culverts",
        "Check your home’s entry points (door thresholds, floor drains)",
        "Keep shoes/footwear and a dry bag for documents",
      ],
    });
    groups.push({
      title: "Next 12 hours",
      subtitle: "Stay ahead of escalation",
      items: [
        "Follow IMD/NDMA advisories and local alerts",
        "Charge phones and ensure radio/flashlight access",
        "Be cautious near underpasses and waterlogged roads",
      ],
    });
    groups.push({
      title: "Community support",
      items: [
        "Help neighbors identify safe routes to higher ground",
        "Share timely updates with households in flood-prone pockets",
      ],
    });

    checklist = [...commonChecklist, "Know your nearest higher-ground route and relief center"];
  } else if (riskLevel === "Medium") {
    shortSummary = "Prepare for possible inundation. Keep valuables safe and verify evacuation routes.";
    groups.push({
      title: "Now (0–3 hours)",
      items: [
        "Move essential items (documents, chargers, medicines) to higher shelves",
        "Stock drinking water and basic medicines for 48 hours",
        "Identify 2 evacuation routes: primary + alternate",
      ],
    });
    groups.push({
      title: "Next 12 hours",
      items: [
        "Avoid low-lying roads and crossings—delay travel if possible",
        "Prepare an emergency kit (first aid, torch, whistles, gloves)",
        "Ensure family members know the meeting point",
      ],
    });
    groups.push({
      title: "Next 24–48 hours",
      items: [
        "Coordinate with neighbors for elderly/children assistance",
        "Keep vehicles parked away from likely water entry points",
        "Monitor water level updates from official sources",
      ],
    });

    checklist = [...commonChecklist, "Prepare a ‘grab bag’ (documents + medication) for fast exit"];
  } else if (riskLevel === "High") {
    shortSummary = "Take decisive action. Avoid travel, secure documents, and follow evacuation advisories early.";
    groups.push({
      title: "Immediate actions",
      items: [
        "If you live in low-lying areas, relocate to safer ground early",
        "Secure electrical appliances; keep important documents in waterproof cover",
        "Do not attempt to cross flooded roads—turn back early",
      ],
    });
    groups.push({
      title: "Next 12 hours",
      items: [
        "Ready cash, ID cards, and medical prescriptions",
        "Confirm relief center address + contact person",
        "Check on vulnerable neighbors (elderly, disabled, people with medical needs)",
      ],
    });
    groups.push({
      title: "Evacuation readiness",
      items: [
        "Prepare transport plan (if authorities allow)",
        "Keep children and pets leashed/contained before movement",
        "Follow official radio/TV and district control room instructions",
      ],
    });

    checklist = [...commonChecklist, "Set a family evacuation plan with a shared checklist"];
  } else {
    shortSummary = "Critical risk: prioritize safety. Follow evacuation orders and protect life first.";
    groups.push({
      title: "Critical actions (do not delay)",
      items: [
        "Evacuate immediately if advised for your area/ward/locality",
        "Turn off gas/electric if safe to do so and move to higher ground",
        "Avoid driving in flooded areas—vehicles can stall and drift",
      ],
    });
    groups.push({
      title: "Next 12–24 hours",
      items: [
        "Stay with the group at the designated shelter/relief center",
        "Avoid contaminated water—risk of waterborne disease",
        "Use masks/clean water for hygiene where advised",
      ],
    });
    groups.push({
      title: "Emergency coordination",
      items: [
        "Contact NDRF assistance (Helpline 1078) when needed",
        "Share location + family status with a single trusted contact",
        "Assist people who cannot evacuate quickly",
      ],
    });

    checklist = [
      ...commonChecklist,
      "Prepare for sustained disruption: food/water, sanitation, communication",
      "Do not return to submerged areas until official clearance",
    ];
  }

  return {
    floodLevelLabel: `${levelText.label} · ${floodLabel} (~${floodLevelCm}cm)`,
    shortSummary,
    groups,
    checklist,
  };
}

