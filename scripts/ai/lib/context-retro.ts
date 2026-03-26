const fs = require("node:fs");
const path = require("node:path");
const { buildRetroCandidates, loadIterationDigests } = require("./retro-candidates.ts");
const { normalizeGainEvent, readCommandGainEvents } = require("./command-gain.ts");
const { readCompanion } = require("../../coord/lib/task-meta.ts");
const { readLatestLiveSummary } = require("../../coord/lib/task-activity.ts");
const { buildSummaryShortcutCommand } = require("../../../shared/ai-efficiency.ts");

const CONTEXT_RETRO_DIR = path.join("output", "ai", "context-retro");
const DETERMINISTIC_SHORTCUTS = new Set(["preflight_summary", "review_summary", "preview_summary", "prod_summary"]);
const IMMEDIATE_STAGE_THRESHOLD_MS = 3 * 60 * 1000;
const PROMOTION_LOST_TIME_MS = 10 * 60 * 1000;
const PROMOTION_MISSED_SAVINGS_EST = 20_000;

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseWindowMs(rawValue = "7d") {
  const normalized = normalizeString(rawValue, "7d").toLowerCase();
  const match = normalized.match(/^(\d+)([dh])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Math.max(1, Number(match[1]));
  const unit = match[2];
  return unit === "h" ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000;
}

function formatDurationMs(value) {
  const duration = Math.max(0, Math.round(toNumber(value, 0)));
  const minutes = Math.round((duration / 60000) * 10) / 10;
  if (minutes >= 1) return `${minutes} 分钟`;
  const seconds = Math.max(1, Math.round(duration / 1000));
  return `${seconds} 秒`;
}

function stageToShortcutId(stage) {
  const normalized = normalizeString(stage);
  if (normalized === "preflight") return "preflight_summary";
  if (normalized === "review" || normalized === "review_wait") return "review_summary";
  if (normalized === "release_prepare" || normalized === "acceptance_wait") return "preview_summary";
  if (normalized === "rollback") return "prod_summary";
  if (normalized === "execution") return "diff_summary";
  return "";
}

function getStageDuration(summary, stage) {
  if (!summary || !stage) return 0;
  return toNumber(summary.active_ms_by_stage?.[stage]) + toNumber(summary.wait_ms_by_stage?.[stage]);
}

function inWindow(timestamp, lowerBound) {
  const epoch = Date.parse(normalizeString(timestamp));
  if (!Number.isFinite(epoch)) return true;
  return epoch >= lowerBound;
}

function uniqueStrings(values = []) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}

function averageSavedByShortcut(events, shortcutId) {
  const runs = events.filter((event) => event.event_kind === "summary_run" && normalizeString(event.shortcut_id) === shortcutId);
  if (!runs.length) return 0;
  const total = runs.reduce((sum, event) => sum + toNumber(event.saved_tokens_est), 0);
  return total / runs.length;
}

function buildMissedShortcutRows(events, lowerBound) {
  const grouped = new Map();
  const normalizedEvents = events.map(normalizeGainEvent);
  for (const event of normalizedEvents) {
    if (event.event_kind !== "shortcut_opportunity") continue;
    if (!DETERMINISTIC_SHORTCUTS.has(normalizeString(event.shortcut_id))) continue;
    if (!inWindow(event.timestamp, lowerBound)) continue;
    if (event.adopted === true) continue;

    const shortcutId = normalizeString(event.shortcut_id);
    const current = grouped.get(shortcutId) || {
      shortcut_id: shortcutId,
      missed_count: 0,
      task_ids: [],
      which_summary_shortcut_to_use: buildSummaryShortcutCommand(shortcutId, { taskId: normalizeString(event.task_id) || null }),
    };
    current.missed_count += 1;
    current.task_ids = uniqueStrings([...current.task_ids, normalizeString(event.task_id)]);
    grouped.set(shortcutId, current);
  }

  return Array.from(grouped.values())
    .map((row) => {
      const averageSaved = averageSavedByShortcut(normalizedEvents, row.shortcut_id);
      return {
        shortcut_id: row.shortcut_id,
        missed_count: row.missed_count,
        task_count: row.task_ids.filter(Boolean).length,
        task_ids: row.task_ids.filter(Boolean),
        missed_savings_est: Math.round(row.missed_count * averageSaved),
        which_summary_shortcut_to_use: row.which_summary_shortcut_to_use || buildSummaryShortcutCommand(row.shortcut_id),
      };
    })
    .sort((left, right) => right.missed_savings_est - left.missed_savings_est || right.missed_count - left.missed_count);
}

function buildStageRows(digests, lowerBound) {
  const stages = new Map();
  for (const item of digests) {
    const updatedAt = normalizeString(item.digest?.updated_at || item.digest?.last_attempt?.ended_at);
    if (updatedAt && !inWindow(updatedAt, lowerBound)) continue;
    const taskId = normalizeString(item.task_id);
    const totals = {
      ...(item.digest?.active_ms_by_stage || {}),
      ...(item.digest?.wait_ms_by_stage || {}),
    };
    const seen = new Set();
    for (const [stage, duration] of Object.entries(totals)) {
      const current = stages.get(stage) || { stage, lost_time_ms: 0, task_ids: [] };
      current.lost_time_ms += toNumber(duration);
      if (!seen.has(stage)) {
        current.task_ids = uniqueStrings([...current.task_ids, taskId]);
        seen.add(stage);
      }
      stages.set(stage, current);
    }
  }

  return Array.from(stages.values())
    .map((row) => ({
      stage: row.stage,
      lost_time_ms: row.lost_time_ms,
      task_count: row.task_ids.length,
      task_ids: row.task_ids,
      which_summary_shortcut_to_use: buildSummaryShortcutCommand(stageToShortcutId(row.stage)),
    }))
    .sort((left, right) => right.lost_time_ms - left.lost_time_ms || left.stage.localeCompare(right.stage));
}

function buildRepeatedBlockerRows(digests, lowerBound) {
  return buildRetroCandidates({ digests })
    .filter((candidate) => inWindow(candidate.last_seen_at, lowerBound) || candidate.repeat_count >= 2)
    .map((candidate) => ({
      signature: candidate.signature,
      task_count: Array.isArray(candidate.affected_tasks) ? candidate.affected_tasks.length : 0,
      lost_time_ms: toNumber(candidate.lost_time_ms),
      why_time_was_lost: normalizeString(candidate.why_it_repeats),
      next_agent_should_do_instead: normalizeString(candidate.suggested_shortcut),
      which_summary_shortcut_to_use: buildSummaryShortcutCommand(stageToShortcutId(normalizeString(candidate.stage) || normalizeString(candidate.signature).split(":")[0])),
      related_docs: Array.isArray(candidate.related_docs) ? candidate.related_docs : [],
      affected_tasks: Array.isArray(candidate.affected_tasks) ? candidate.affected_tasks : [],
      repeat_count: toNumber(candidate.repeat_count),
    }))
    .sort((left, right) => right.lost_time_ms - left.lost_time_ms || right.task_count - left.task_count);
}

function buildPromotionCandidates(repeatedBlockers, missedShortcuts) {
  const blockerCandidates = repeatedBlockers
    .filter((item) => item.task_count >= 2 && item.lost_time_ms >= PROMOTION_LOST_TIME_MS)
    .map((item, index) => ({
      candidate_id: `promotion-blocker-${String(index + 1).padStart(2, "0")}`,
      label: item.signature,
      reason: item.why_time_was_lost,
      evidence: `${item.task_count} 个 tasks，累计浪费 ${formatDurationMs(item.lost_time_ms)}。`,
    }));

  const shortcutCandidates = missedShortcuts
    .filter((item) => item.task_count >= 2 && item.missed_savings_est >= PROMOTION_MISSED_SAVINGS_EST)
    .map((item, index) => ({
      candidate_id: `promotion-shortcut-${String(index + 1).padStart(2, "0")}`,
      label: item.shortcut_id,
      reason: `deterministic shortcut 在多个 tasks 里持续漏用。`,
      evidence: `${item.task_count} 个 tasks，潜在浪费约 ${item.missed_savings_est} tokens。`,
    }));

  return [...blockerCandidates, ...shortcutCandidates].slice(0, 6);
}

function buildImmediateAlerts(root, taskId, options = {}) {
  const liveSummary = readLatestLiveSummary(taskId);
  const companion = readCompanion(taskId);
  const digest = companion?.artifacts?.iteration_digest || null;
  const summary = liveSummary || digest;
  const alerts = [];
  const normalizedEvents = readCommandGainEvents(root).map(normalizeGainEvent);

  const dominantStage = normalizeString(summary?.last_attempt?.dominant_stage);
  const dominantStageMs = dominantStage ? getStageDuration(summary, dominantStage) : 0;
  if (dominantStage && dominantStageMs >= IMMEDIATE_STAGE_THRESHOLD_MS) {
    const shortcutId = stageToShortcutId(dominantStage);
    alerts.push({
      signature: `stage:${dominantStage}`,
      why_time_was_lost: `最近一次 attempt 主要耗在 ${dominantStage}，累计约 ${formatDurationMs(dominantStageMs)}。`,
      next_agent_should_do_instead: `先沿 ${dominantStage} 的摘要入口定位结论，再决定是否需要原始输出。`,
      which_summary_shortcut_to_use: buildSummaryShortcutCommand(shortcutId, options),
      lost_time_ms: dominantStageMs,
      missed_savings_est: 0,
    });
  }

  const blockers = Array.isArray(summary?.blockers)
    ? summary.blockers
    : Array.isArray(digest?.top_blockers)
      ? digest.top_blockers
      : [];
  for (const blocker of blockers) {
    if (toNumber(blocker.repeat_count) < 2) continue;
    alerts.push({
      signature: normalizeString(blocker.signature),
      why_time_was_lost: normalizeString(blocker.why_it_repeats || blocker.reason),
      next_agent_should_do_instead: normalizeString(blocker.suggested_shortcut || "先缩短路径，再继续执行。"),
      which_summary_shortcut_to_use: buildSummaryShortcutCommand(stageToShortcutId(blocker.stage || dominantStage), options),
      lost_time_ms: toNumber(blocker.lost_time_ms),
      missed_savings_est: 0,
    });
  }

  const taskShortcutRows = buildMissedShortcutRows(
    normalizedEvents.filter((event) => normalizeString(event.task_id) === normalizeString(taskId)),
    0,
  );
  for (const item of taskShortcutRows) {
    if (item.missed_count < 2) continue;
    alerts.push({
      signature: `shortcut:${item.shortcut_id}`,
      why_time_was_lost: `${item.shortcut_id} 在当前 task 已漏用 ${item.missed_count} 次。`,
      next_agent_should_do_instead: `把 ${item.shortcut_id} 提升为默认入口，只有摘要不足时再回退 raw。`,
      which_summary_shortcut_to_use: item.which_summary_shortcut_to_use || null,
      lost_time_ms: 0,
      missed_savings_est: item.missed_savings_est,
    });
  }

  return alerts
    .sort((left, right) => (right.lost_time_ms + right.missed_savings_est) - (left.lost_time_ms + left.missed_savings_est))
    .slice(0, 3);
}

function buildTopTokenTasks(events, lowerBound) {
  const grouped = new Map();
  for (const event of events.map(normalizeGainEvent)) {
    if (event.event_kind === "shortcut_opportunity") continue;
    if (!inWindow(event.timestamp, lowerBound)) continue;
    const taskId = normalizeString(event.task_id);
    if (!taskId) continue;
    const current = grouped.get(taskId) || { task_id: taskId, input_tokens_est: 0, saved_tokens_est: 0, runs: 0 };
    current.input_tokens_est += toNumber(event.input_tokens_est);
    current.saved_tokens_est += toNumber(event.saved_tokens_est);
    current.runs += 1;
    grouped.set(taskId, current);
  }
  return Array.from(grouped.values()).sort((left, right) => right.input_tokens_est - left.input_tokens_est || left.task_id.localeCompare(right.task_id)).slice(0, 5);
}

function buildContextRetroReport(root = process.cwd(), options = {}) {
  const window = normalizeString(options.window, "7d");
  const windowMs = parseWindowMs(window);
  const lowerBound = Date.now() - windowMs;
  const taskId = normalizeString(options.taskId) || null;
  const digests = loadIterationDigests(root);
  const events = readCommandGainEvents(root);
  const repeatedBlockers = buildRepeatedBlockerRows(digests, lowerBound);
  const topLostTimeStages = buildStageRows(digests, lowerBound);
  const topMissedShortcuts = buildMissedShortcutRows(events, lowerBound).slice(0, 5);
  const topTimeLossPatterns = [
    ...repeatedBlockers.map((item) => ({
      signature: item.signature,
      task_count: item.task_count,
      lost_time_ms: item.lost_time_ms,
      why_time_was_lost: item.why_time_was_lost,
      next_agent_should_do_instead: item.next_agent_should_do_instead,
      which_summary_shortcut_to_use: item.which_summary_shortcut_to_use || null,
    })),
    ...topLostTimeStages.map((item) => ({
      signature: `stage:${item.stage}`,
      task_count: item.task_count,
      lost_time_ms: item.lost_time_ms,
      why_time_was_lost: `${item.stage} 在窗口内累计浪费约 ${formatDurationMs(item.lost_time_ms)}。`,
      next_agent_should_do_instead: `先把 ${item.stage} 阶段的默认摘要链跑出来，再决定是否需要 raw。`,
      which_summary_shortcut_to_use: item.which_summary_shortcut_to_use || null,
    })),
  ]
    .sort((left, right) => right.lost_time_ms - left.lost_time_ms || right.task_count - left.task_count)
    .slice(0, 5);

  const report = {
    ok: true,
    generated_at: new Date().toISOString(),
    window,
    window_ms: windowMs,
    task_id: taskId,
    current_task: {
      task_id: taskId,
      alerts: taskId ? buildImmediateAlerts(root, taskId, { taskId }) : [],
    },
    top_lost_time_stages: topLostTimeStages.slice(0, 5),
    repeated_blockers: repeatedBlockers.slice(0, 5),
    top_missed_shortcuts: topMissedShortcuts,
    top_token_burning_tasks: buildTopTokenTasks(events, lowerBound),
    top_time_loss_patterns: topTimeLossPatterns,
    promotion_candidates: buildPromotionCandidates(repeatedBlockers, topMissedShortcuts),
  };

  return report;
}

function renderContextRetroMarkdown(report) {
  const lines = [
    "# Context Retro",
    "",
    `- generated_at: ${report.generated_at}`,
    `- window: ${report.window}`,
    `- task_id: ${report.task_id || "none"}`,
    "",
  ];

  lines.push("## Current Task Alerts", "");
  if (report.current_task.alerts.length) {
    for (const item of report.current_task.alerts) {
      lines.push(`- ${item.signature}`);
      lines.push(`  - why_time_was_lost: ${item.why_time_was_lost}`);
      lines.push(`  - next_agent_should_do_instead: ${item.next_agent_should_do_instead}`);
      lines.push(`  - which_summary_shortcut_to_use: ${item.which_summary_shortcut_to_use || "无"}`);
    }
  } else {
    lines.push("- 当前没有命中即时复盘阈值。");
  }
  lines.push("");

  lines.push("## Top Time Loss Patterns", "");
  if (report.top_time_loss_patterns.length) {
    for (const item of report.top_time_loss_patterns) {
      lines.push(`- ${item.signature}: ${formatDurationMs(item.lost_time_ms)} / ${item.task_count} tasks`);
      lines.push(`  - why: ${item.why_time_was_lost}`);
      lines.push(`  - next: ${item.next_agent_should_do_instead}`);
      lines.push(`  - shortcut: ${item.which_summary_shortcut_to_use || "无"}`);
    }
  } else {
    lines.push("- 当前窗口内没有高价值 time-loss pattern。");
  }
  lines.push("");

  lines.push("## Promotion Candidates", "");
  if (report.promotion_candidates.length) {
    for (const item of report.promotion_candidates) {
      lines.push(`- ${item.label}`);
      lines.push(`  - reason: ${item.reason}`);
      lines.push(`  - evidence: ${item.evidence}`);
    }
  } else {
    lines.push("- 当前没有达到升格阈值的候选。");
  }
  lines.push("");

  return lines.join("\n");
}

function writeContextRetroReport(root = process.cwd(), report) {
  const outputDir = path.join(root, CONTEXT_RETRO_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "latest.json");
  const markdownPath = path.join(outputDir, "latest.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(markdownPath, renderContextRetroMarkdown(report), "utf8");
  return { jsonPath, markdownPath };
}

function buildAndWriteContextRetroReport(root = process.cwd(), options = {}) {
  const report = buildContextRetroReport(root, options);
  const output = writeContextRetroReport(root, report);
  return {
    ...report,
    json_path: output.jsonPath,
    markdown_path: output.markdownPath,
  };
}

function summarizeContextRetroHints(report) {
  const alerts = Array.isArray(report?.current_task?.alerts) ? report.current_task.alerts : [];
  return alerts
    .slice(0, 3)
    .map((item) => `${item.signature}：${item.next_agent_should_do_instead}`)
    .filter(Boolean);
}

module.exports = {
  CONTEXT_RETRO_DIR,
  buildAndWriteContextRetroReport,
  buildContextRetroReport,
  parseWindowMs,
  renderContextRetroMarkdown,
  summarizeContextRetroHints,
  writeContextRetroReport,
};
