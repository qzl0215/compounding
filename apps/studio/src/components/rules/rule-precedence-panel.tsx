import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const rules = [
  "AGENTS.md",
  "docs/00_SYSTEM/PROJECT_RULES.md",
  "docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md",
  "docs/00_SYSTEM/ARCHITECTURE_BOUNDARIES.md",
  "docs/60_TEMPLATES/*",
  "docs/30_STRATEGY/OPPORTUNITY_POOL.md + docs/70_MEMORY/TECH_DEBT.md"
];

export function RulePrecedencePanel() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3">
          <ShieldCheck className="size-5 text-accent" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Rule Precedence</p>
          <h2 className="mt-1 text-xl font-semibold">固定裁决顺序</h2>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {rules.map((rule, index) => (
          <li key={rule} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">
              {index + 1}
            </span>
            <span className="font-mono text-sm text-white/78">{rule}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
