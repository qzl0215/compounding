/**
 * Task companion JSON read/write for agent-coordination
 */

const fs = require("node:fs");
const path = require("node:path");
const { extractSection, stripMarkdown } = require("../../ai/lib/markdown-sections.ts");

const ROOT = process.cwd();
const TASKS_DIR = path.join(ROOT, "agent-coordination", "tasks");
const QUEUE_DIR = path.join(ROOT, "tasks", "queue");

function ensureDir() {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

function getTaskPath(taskId) {
  if (!fs.existsSync(QUEUE_DIR)) return null;
  const files = fs.readdirSync(QUEUE_DIR).filter((n) => n.endsWith(".md"));
  const num = taskId.replace(/^t-/, "").replace(/^task-/, "");
  for (const f of files) {
    const base = path.basename(f, ".md");
    const short = "t-" + base.replace(/^task-/, "");
    if (base === taskId || short === taskId || base.startsWith("task-" + num + "-") || base === "task-" + num) {
      return path.join("tasks", "queue", f);
    }
  }
  return null;
}

function readTaskContent(taskId) {
  const taskPath = getTaskPath(taskId);
  if (!taskPath) return null;
  const abs = path.join(ROOT, taskPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

function parseTaskToCompanion(taskId, content) {
  const goal = stripMarkdown(extractSection(content, "goal", ROOT) || extractSection(content, "目标", ROOT) || "");
  const scope = stripMarkdown(extractSection(content, "scope", ROOT) || extractSection(content, "范围", ROOT) || "");
  const branch = stripMarkdown(extractSection(content, "branch", ROOT) || extractSection(content, "分支", ROOT) || "").replace(/`/g, "").trim();
  const status = stripMarkdown(extractSection(content, "status", ROOT) || extractSection(content, "状态", ROOT) || "").toLowerCase();
  const related = extractSection(content, "related_modules", ROOT) || extractSection(content, "关联模块", ROOT) || "";
  const modules = (related.match(/`([^`]+)`/g) || []).map((m) => m.replace(/`/g, ""));

  const plannedFiles = modules.filter((m) => m.includes("/") || /\.(md|ts|tsx|js|json|yaml|yml)$/.test(m));
  const plannedModules = modules.filter((m) => !plannedFiles.includes(m));

  return {
    task_id: taskId,
    title: goal.slice(0, 80),
    goal: goal,
    owner_agent: "default",
    base_branch: "dev",
    branch_name: branch || `codex/${taskId.replace(/^t-/, "task-")}`,
    planned_files: plannedFiles,
    planned_modules: plannedModules,
    risk_assessment: "medium",
    execution_mode: "direct_edit",
    status: status === "done" ? "merged" : status === "doing" ? "active" : "planned",
    human_decision_needed: false,
    human_decision_reason: null,
    ui_validation_required: false,
    summary_artifacts: [],
  };
}

function getCompanionPath(taskId) {
  const taskPath = getTaskPath(taskId);
  if (taskPath) {
    const base = path.basename(taskPath, ".md");
    return path.join(TASKS_DIR, base + ".json");
  }
  return path.join(TASKS_DIR, (taskId.startsWith("t-") ? "task-" + taskId.slice(2) : taskId) + ".json");
}

function readCompanion(taskId) {
  const p = getCompanionPath(taskId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeCompanion(taskId, companion) {
  ensureDir();
  const p = getCompanionPath(taskId);
  fs.writeFileSync(p, JSON.stringify(companion, null, 2) + "\n");
}

function ensureCompanion(taskId) {
  const content = readTaskContent(taskId);
  if (!content) return { ok: false, error: "Task not found" };
  let comp = parseTaskToCompanion(taskId, content);
  const existing = readCompanion(taskId);
  if (existing) {
    comp = { ...existing, ...comp, planned_files: comp.planned_files, planned_modules: comp.planned_modules };
  }
  writeCompanion(taskId, comp);
  return { ok: true, companion: comp };
}

module.exports = {
  ensureCompanion,
  readCompanion,
  writeCompanion,
  getCompanionPath,
  getTaskPath,
  readTaskContent,
  parseTaskToCompanion,
};
