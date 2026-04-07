import { VALIDATION_LAYERS, type ValidationLayer } from "../releases/validation";
import type { DiffAwareCategory, DiffAwareCheckLayer } from "./types";

export type FileImpact = {
  file: string;
  risk: "low" | "medium" | "high";
  category: string;
  focus: string[];
  evidencePoints: string[];
  takeaway: string;
  layerHints: ValidationLayer["id"][];
};

export function dedupe(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function severityRank(value: "low" | "medium" | "high") {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}

export function categoryLabel(value: string) {
  const labels: Record<string, string> = {
    "task-management": "任务管理",
    "ai-assets": "AI 资产",
    documentation: "文档",
    experience: "经验",
    memory: "记忆",
    dependencies: "依赖",
    "source-code": "源码",
    "python-code": "Python",
    config: "配置",
    misc: "通用改动",
  };
  return labels[value] || value;
}

export function analyzeFileImpact(filePath: string): FileImpact {
  const ext = filePath.includes(".") ? filePath.split(".").pop()?.toLowerCase() ?? "" : "";
  const focus: string[] = [];
  const evidencePoints: string[] = [];
  let risk: FileImpact["risk"] = "low";
  let category = "misc";
  let takeaway = "保持局部改动与回写一致，避免把小变更扩成新的重系统。";
  let layerHints: ValidationLayer["id"][] = ["static"];

  if (filePath.includes("tasks/queue/")) {
    category = "task-management";
    risk = "medium";
    focus.push("task 状态流转", "分支绑定", "更新痕迹完整性");
    evidencePoints.push("pnpm ai:validate-task-git", "pnpm validate:static");
    layerHints = ["static", "runtime"];
    takeaway = "任务状态、分支与发布版本必须同步回写，否则容易制造交付漂移。";
  } else if (filePath.includes("docs/prompts/") || filePath.includes("scripts/ai/")) {
    category = "ai-assets";
    risk = "medium";
    focus.push("prompt 真相源", "AI 路由契约", "输出结构");
    evidencePoints.push("pnpm validate:ai-output", "pnpm validate:static");
    layerHints = ["static", "ai-output"];
    takeaway = "prompt、路由和校验器要共用同一注册表，不要各自维护路径列表。";
  } else if (filePath.startsWith("docs/")) {
    category = "documentation";
    risk = "low";
    focus.push("文档一致性", "链接有效性", "来源边界");
    evidencePoints.push("文档渲染检查", "内部链接验证");
    takeaway = "文档优先服务导航和说明，不要在文档里重建业务状态。";
  } else if (filePath.startsWith("memory/experience/")) {
    category = "experience";
    risk = "low";
    focus.push("经验可比较性", "提炼是否过重", "复用边界");
    evidencePoints.push("经验索引检查", "人工 review");
    takeaway = "经验资产要短、稳、可比较，避免写成新的大段总结文档。";
  } else if (filePath.startsWith("memory/")) {
    category = "memory";
    risk = "low";
    focus.push("真相源边界", "current-state / roadmap 分工");
    evidencePoints.push("memory 交叉检查", "主源一致性检查");
    takeaway = "memory 只做沉淀与快照，不要重新承接执行细节。";
  } else if (filePath === "package.json" || filePath.endsWith("pnpm-lock.yaml")) {
    category = "dependencies";
    risk = "high";
    focus.push("脚本契约", "构建链", "依赖冲突");
    evidencePoints.push("pnpm install", "pnpm build", "pnpm test");
    layerHints = ["static", "build", "runtime"];
    takeaway = "依赖和脚本改动最容易牵出运行态，需要把构建和运行时一起看。";
  } else if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    category = "source-code";
    risk = "high";
    focus.push("类型检查", "单元测试", "运行时行为");
    evidencePoints.push("pnpm lint", "pnpm test", "pnpm build");
    layerHints = ["static", "build", "runtime"];
    takeaway = "代码改动要按静态、构建、运行时三层去验证，不要只看单测。";
  } else if (ext === "py") {
    category = "python-code";
    risk = "medium";
    focus.push("语法检查", "导入测试", "运行时验证");
    evidencePoints.push(`python -m py_compile ${filePath}`);
    layerHints = ["static", "build"];
    takeaway = "Python 脚本要先保证语法和导入，再看是否影响主链。";
  } else if (["json", "yaml", "yml", "toml"].includes(ext)) {
    category = "config";
    risk = "high";
    focus.push("配置加载", "环境变量", "运行态一致性");
    evidencePoints.push("pnpm build", "pnpm preview:check", "pnpm prod:check");
    layerHints = ["static", "build", "runtime"];
    takeaway = "配置和环境变量改动看起来很小，实际最容易把运行态带偏。";
  } else {
    focus.push("局部检查", "运行态确认");
    evidencePoints.push("按变更类型补充验证");
  }

  return {
    file: filePath,
    risk,
    category,
    focus,
    evidencePoints,
    takeaway,
    layerHints,
  };
}

export function buildCategories(impacts: FileImpact[]): DiffAwareCategory[] {
  const groups = new Map<string, DiffAwareCategory>();
  for (const impact of impacts) {
    const current = groups.get(impact.category) || {
      name: impact.category,
      files: [],
      risk: impact.risk,
      focus: [],
      takeaway: impact.takeaway,
    };
    current.files.push(impact.file);
    current.focus = dedupe([...current.focus, ...impact.focus]);
    current.risk = severityRank(current.risk) >= severityRank(impact.risk) ? current.risk : impact.risk;
    if (current.takeaway.length < impact.takeaway.length) {
      current.takeaway = impact.takeaway;
    }
    groups.set(impact.category, current);
  }

  return [...groups.values()].sort((left, right) => severityRank(right.risk) - severityRank(left.risk));
}

export function selectSuggestedChecks(impacts: FileImpact[]): DiffAwareCheckLayer[] {
  const needed = new Set<ValidationLayer["id"]>();
  impacts.forEach((impact) => impact.layerHints.forEach((id) => needed.add(id)));
  if (needed.size === 0 && impacts.length > 0) {
    needed.add("static");
  }
  return VALIDATION_LAYERS.filter((layer) => needed.has(layer.id));
}

export function collectEvidencePoints(impacts: FileImpact[], suggestedChecks: DiffAwareCheckLayer[]) {
  return dedupe([
    ...impacts.flatMap((impact) => impact.evidencePoints),
    ...suggestedChecks.flatMap((layer) => layer.commands),
  ]);
}
