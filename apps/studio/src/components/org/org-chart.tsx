import { ArrowDown, Building2 } from "lucide-react";
import type { OrgRole } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function OrgChart({ roles }: { roles: OrgRole[] }) {
  const grouped = roles.reduce<Record<string, OrgRole[]>>((acc, role) => {
    acc[role.department] ??= [];
    acc[role.department].push(role);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([department, members]) => (
        <Card key={department}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3">
              <Building2 className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-accent">Department</p>
              <h3 className="mt-1 text-xl font-semibold">{department}</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {members.map((member) => (
              <div key={member.role} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{member.role}</h4>
                    <p className="mt-2 text-sm text-white/60">Reports to {member.reports_to}</p>
                  </div>
                  <ArrowDown className="size-4 text-accent" />
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/42">Responsibilities</p>
                    <ul className="mt-2 space-y-1 text-sm text-white/76">
                      {member.responsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/42">Scope</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.scope.map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/72">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
