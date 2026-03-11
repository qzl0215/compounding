import type { EnabledModules } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModuleTogglePanel({ modules }: { modules: EnabledModules }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.28em] text-accent">Enabled Modules</p>
      <h2 className="mt-2 text-xl font-semibold">治理模块开关</h2>
      <div className="mt-5 grid gap-3">
        {Object.entries(modules).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span className="font-mono text-sm text-white/78">{key}</span>
            <Badge tone={enabled ? "success" : "default"}>{enabled ? "enabled" : "disabled"}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
