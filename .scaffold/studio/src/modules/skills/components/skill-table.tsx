"use client";

import { useMemo, useState } from "react";
import type { SkillTableRow, SkillStatus } from "../types";

type Props = {
  skills: SkillTableRow[];
  onStatusChange?: (id: string, newStatus: SkillStatus) => void;
};

export function SkillTable({ skills, onStatusChange }: Props) {
  const [filter, setFilter] = useState<"all" | SkillStatus>("all");

  const filteredSkills = useMemo(() => {
    if (filter === "all") return skills;
    return skills.filter((s) => s.status === filter);
  }, [filter, skills]);

  const counts = useMemo(() => ({
    all: skills.length,
    subscribed: skills.filter((s) => s.status === "subscribed").length,
    paused: skills.filter((s) => s.status === "paused").length,
  }), [skills]);

  const toggleStatus = (skill: SkillTableRow) => {
    const newStatus: SkillStatus = skill.status === "subscribed" ? "paused" : "subscribed";
    onStatusChange?.(skill.id, newStatus);
  };

  return (
    <div>
      {/* Filter */}
      <div className="skills-filter mb-8">
        {(["all", "subscribed", "paused"] as const).map((f) => {
          const labels = { all: "全部", subscribed: "生效", paused: "暂停" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`skills-filter-btn ${filter === f ? "active" : ""}`}
            >
              {labels[f]} {counts[f]}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filteredSkills.map((skill, idx) => (
          <div
            key={skill.id}
            className={`skills-card skills-card-animate skills-card ${skill.status === "subscribed" ? "active" : ""}`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center justify-between p-5">
              {/* Left: Status + Info */}
              <div className="flex items-center gap-4">
                <div className={`skills-status ${skill.status === "subscribed" ? "active" : ""}`} />
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text)]">
                    {skill.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed max-w-xs">
                    {skill.capability_zh}
                  </p>
                </div>
              </div>

              {/* Right: Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(skill);
                }}
                className="skills-toggle"
                data-state={skill.status === "subscribed" ? "on" : "off"}
                aria-label={skill.status === "subscribed" ? "关闭" : "开启"}
              >
                <div className="skills-toggle-thumb" />
              </button>
            </div>

            {/* Bottom: Invocation hint */}
            <div className="px-5 pb-4 -mt-2">
              <p className="text-xs text-[var(--text-light)]">
                {skill.invocation_phrase}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
