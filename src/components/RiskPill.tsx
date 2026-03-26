import { cn, RISK_PILL_CLASS } from "@/lib/utils";
import type { RiskLevel } from "@/types";

export function RiskPill({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
      RISK_PILL_CLASS[level],
      className
    )}>
      {level}
    </span>
  );
}
