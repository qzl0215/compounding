const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const COMPANION_DIR = path.join(ROOT, "agent-coordination", "tasks");

function uniqueStrings(values = []) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function slugify(value, fallback = "candidate") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

function normalizeSignature(value, stage = "", reason = "") {
  const explicit = String(value || "").trim();
  if (explicit) return explicit;
  const stageLabel = String(stage || "").trim() || "unknown";
  const reasonLabel = String(reason || "").trim().replace(/\s+/g, " ") || "unspecified";
  return `${stageLabel}:${reasonLabel}`;
}

function deriveRetroPattern({ signature, stage, reason }) {
  const lowered = `${signature} ${stage} ${reason}`.toLowerCase();
  if (lowered.includes("工作区未清理") || lowered.includes("worktree") || lowered.includes("staged")) {
    return {
      why_it_repeats: "任务合同或临时改动没有先收口，导致 preflight 每次都被工作区状态拦住。",
      suggested_shortcut: "先单独提交 task 合同或整理 worktree，再进入实现和重跑 preflight。",
      related_docs: ["AGENTS.md", "docs/DEV_WORKFLOW.md"],
      promotion_hint: "若持续重复，可把“先提交 task 合同再开工”收成更显式 runbook 提示。",
    };
  }
  if (lowered.includes("范围越界") || lowered.includes("scope")) {
    return {
      why_it_repeats: "task 边界与实际改动路径没有同步，导致 scope guard 反复拦截。",
      suggested_shortcut: "先回写 task 的 planned_files 或收缩改动面，再继续执行。",
      related_docs: ["AGENTS.md", "docs/DEV_WORKFLOW.md"],
      promotion_hint: "若高频发生，可把范围回写做成更强的 task 创建默认项。",
    };
  }
  if (lowered.includes("锁冲突") || lowered.includes("lock")) {
    return {
      why_it_repeats: "并行任务共享同一批路径，但锁状态没有在开工前确认。",
      suggested_shortcut: "进入执行前先查 lock 状态，冲突时先协调 owner_task_id。",
      related_docs: ["docs/DEV_WORKFLOW.md"],
      promotion_hint: "若稳定复现，可把锁冲突热点升格成专项规则或模板。",
    };
  }
  if (lowered.includes("验收") || lowered.includes("acceptance_wait") || lowered.includes("review_wait")) {
    return {
      why_it_repeats: "等待阶段缺少显式推进动作，任务在 review 或验收之间反复停滞。",
      suggested_shortcut: "handoff 后立刻约束下一步 review/验收动作，不让等待阶段无主。",
      related_docs: ["docs/DEV_WORKFLOW.md", "docs/WORK_MODES.md"],
      promotion_hint: "若多次复现，可把等待阶段提示收进 task handoff 的默认输出。",
    };
  }
  return {
    why_it_repeats: "相同阻塞在不同任务里重复出现，说明当前入口提示还不够前置。",
    suggested_shortcut: "把这类阻塞前置成更明确的预检查或更短的执行提示。",
    related_docs: ["AGENTS.md", "docs/AI_OPERATING_MODEL.md"],
    promotion_hint: "若继续重复，可考虑升格成 experience candidate。",
  };
}

function loadIterationDigests(root = ROOT) {
  const directory = path.join(root, "agent-coordination", "tasks");
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => {
      const absPath = path.join(directory, entry);
      const raw = JSON.parse(fs.readFileSync(absPath, "utf8"));
      const digest = raw?.artifacts?.iteration_digest || null;
      if (!digest) {
        return null;
      }
      return {
        task_id: raw.task_id || entry.replace(/\.json$/, ""),
        task_path: raw.task_path || null,
        companion_path: absPath,
        digest,
      };
    })
    .filter(Boolean);
}

function buildRetroCandidates({ digests = [] }) {
  const aggregated = new Map();

  for (const item of digests) {
    const blockers = Array.isArray(item.digest?.top_blockers) ? item.digest.top_blockers : [];
    for (const blocker of blockers) {
      const signature = normalizeSignature(blocker.signature, blocker.stage, blocker.reason);
      const pattern = deriveRetroPattern({
        signature,
        stage: blocker.stage || "",
        reason: blocker.reason || "",
      });
      const existing = aggregated.get(signature) || {
        signature,
        repeat_count: 0,
        affected_tasks: [],
        lost_time_ms: 0,
        why_it_repeats: pattern.why_it_repeats,
        suggested_shortcut: pattern.suggested_shortcut,
        related_docs: pattern.related_docs,
        promotion_hint: pattern.promotion_hint,
      };

      existing.repeat_count += Number(blocker.repeat_count || 0);
      existing.lost_time_ms += Number(blocker.lost_time_ms || 0);
      existing.affected_tasks = uniqueStrings([...existing.affected_tasks, item.task_id]);
      existing.related_docs = uniqueStrings([...existing.related_docs, ...(blocker.related_docs || []), ...pattern.related_docs]);
      if (!existing.why_it_repeats) existing.why_it_repeats = pattern.why_it_repeats;
      if (!existing.suggested_shortcut) existing.suggested_shortcut = pattern.suggested_shortcut;
      if (!existing.promotion_hint) existing.promotion_hint = pattern.promotion_hint;
      aggregated.set(signature, existing);
    }
  }

  return Array.from(aggregated.values())
    .filter((candidate) => candidate.repeat_count >= 2)
    .sort((left, right) => {
      if (right.lost_time_ms !== left.lost_time_ms) return right.lost_time_ms - left.lost_time_ms;
      if (right.repeat_count !== left.repeat_count) return right.repeat_count - left.repeat_count;
      return left.signature.localeCompare(right.signature, "zh-Hans-CN");
    })
    .map((candidate, index) => ({
      candidate_id: `retro-${String(index + 1).padStart(3, "0")}-${slugify(candidate.signature)}`,
      signature: candidate.signature,
      repeat_count: candidate.repeat_count,
      affected_tasks: candidate.affected_tasks,
      lost_time_ms: candidate.lost_time_ms,
      why_it_repeats: candidate.why_it_repeats,
      suggested_shortcut: candidate.suggested_shortcut,
      related_docs: candidate.related_docs,
      promotion_hint: candidate.promotion_hint,
    }));
}

function renderRetroCandidatesMarkdown(payload) {
  const lines = ["# Retro Candidates", "", `- generated_at: ${payload.generated_at}`, `- candidate_count: ${payload.candidate_count}`, ""];
  if (!payload.candidates.length) {
    lines.push("当前没有达到重复阈值的耗时/阻塞模式。");
    lines.push("");
    return lines.join("\n");
  }

  for (const candidate of payload.candidates) {
    lines.push(`## ${candidate.signature}`);
    lines.push("");
    lines.push(`- candidate_id: ${candidate.candidate_id}`);
    lines.push(`- repeat_count: ${candidate.repeat_count}`);
    lines.push(`- lost_time_ms: ${candidate.lost_time_ms}`);
    lines.push(`- affected_tasks: ${candidate.affected_tasks.join(", ")}`);
    lines.push(`- why_it_repeats: ${candidate.why_it_repeats}`);
    lines.push(`- suggested_shortcut: ${candidate.suggested_shortcut}`);
    lines.push(`- related_docs: ${candidate.related_docs.join(", ")}`);
    lines.push(`- promotion_hint: ${candidate.promotion_hint}`);
    lines.push("");
  }

  return lines.join("\n");
}

module.exports = {
  COMPANION_DIR,
  buildRetroCandidates,
  deriveRetroPattern,
  loadIterationDigests,
  normalizeSignature,
  renderRetroCandidatesMarkdown,
  uniqueStrings,
};
