import { listSkills } from "@/modules/skills";
import { SkillTableClient } from "@/modules/skills/components/skill-table-client";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await listSkills();
  const subscribedCount = skills.filter((s) => s.status === "subscribed").length;

  return (
    <div className="skills-page">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-end justify-between mb-4">
            <h1 className="skills-title">Skills</h1>
            <div className="text-right">
              <div className="skills-stat">
                {subscribedCount}
                <span className="skills-stat-suffix">/{skills.length}</span>
              </div>
              <p className="skills-label">激活</p>
            </div>
          </div>
          <p className="skills-subtitle">
            开启技能开关，AI 将自动调用对应能力
          </p>
        </header>

        {/* Skills */}
        <div className="mb-16">
          <SkillTableClient initialSkills={skills} />
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="skills-subtitle text-xs">
            配置存储于 <code className="font-mono">memory/skills/</code>
          </p>
        </footer>
      </div>
    </div>
  );
}
