const fs = require("node:fs");
const path = require("node:path");
const { loadIterationDigests } = require("./retro-candidates.ts");
const { normalizeGainEvent, readCommandGainEvents } = require("./command-gain.ts");
const { readCompanion } = require("../../coord/lib/task-meta.ts");
const { readLatestLiveSummary } = require("../../coord/lib/task-activity.ts");
const {
  LEARNING_HINT_REPEAT_THRESHOLD,
  LEARNING_PROMOTION_LOST_TIME_MS,
  LEARNING_PROMOTION_MISSED_SAVINGS_EST,
  LEARNING_PROMOTION_SEMANTICS,
  LEARNING_PROMOTION_TASK_THRESHOLD,
  buildExecutionBlockerPatternKey,
  buildShortcutGapPatternKey,
  normalizeLearningToken,
  slugifyLearningToken,
  uniqueLearningStrings,
} = require("../../../shared/learning-signals.ts");
const { deriveShortId, normalizeTaskReference } = require("../../../shared/task-identity.ts");
const { buildSummaryShortcutCommand } = require("../../../shared/ai-efficiency.ts");

const LEARNING_CANDIDATES_DIR = path.join("output", "ai", "learning-candidates");
const DEFAULT_LEARNING_CANDIDATES_WINDOW = "90d";
const DETERMINISTIC_SHORTCUTS = new Set(["preflight_summary", "review_summary", "preview_summary", "prod_summary"]);

function parseWindowMs(rawValue = DEFAULT_LEARNING_CANDIDATES_WINDOW) {
  const normalized = normalizeLearningToken(rawValue, DEFAULT_LEARNING_CANDIDATES_WINDOW).toLowerCase();
  const match = normalized.match(/^(\d+)([dh])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Math.max(1, Number(match[1]));
  return match[2] === "h" ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function canonicalTaskId(value) {
  const normalized = normalizeTaskReference(normalizeLearningToken(value));
  if (!normalized) return null;
  const shortId = normalizeTaskReference(deriveShortId(normalized));
  return shortId || normalized;
}

function inWindow(timestamp, lowerBound) {
  const epoch = Date.parse(normalizeLearningToken(timestamp));
  if (!Number.isFinite(epoch)) return true;
  return epoch >= lowerBound;
}

function formatDurationMs(value) {
  const duration = Math.max(0, Math.round(toNumber(value, 0)));
  const minutes = Math.round((duration / 60000) * 10) / 10;
  if (minutes >= 1) return `${minutes} 分钟`;
  const seconds = Math.max(1, Math.round(duration / 1000));
  return `${seconds} 秒`;
}

function stageToShortcutId(stage) {
  const normalized = normalizeLearningToken(stage);
  if (normalized === "preflight") return "preflight_summary";
  if (normalized === "review" || normalized === "review_wait") return "review_summary";
  if (normalized === "release_prepare" || normalized === "acceptance_wait") return "preview_summary";
  if (normalized === "rollback") return "prod_summary";
  return "";
}

function stageFromShortcut(shortcutId) {
  const normalized = normalizeLearningToken(shortcutId);
  if (normalized === "preflight_summary") return "preflight";
  if (normalized === "review_summary") return "review";
  if (normalized === "preview_summary") return "release_prepare";
  if (normalized === "prod_summary") return "rollback";
  return "shortcut";
}

function averageSavedByShortcut(events, shortcutId) {
  const runs = events.filter(
    (event) => normalizeLearningToken(event.event_kind) === "summary_run" && normalizeLearningToken(event.shortcut_id) === shortcutId,
  );
  if (!runs.length) return 0;
  return runs.reduce((sum, event) => sum + toNumber(event.saved_tokens_est), 0) / runs.length;
}

function buildExecutionBlockerSignals(digests, lowerBound) {
  const signals = [];
  for (const item of digests) {
    const digestUpdatedAt = normalizeLearningToken(item.digest?.updated_at || item.digest?.last_attempt?.ended_at);
    const blockers = Array.isArray(item.digest?.top_blockers) ? item.digest.top_blockers : [];
    for (const blocker of blockers) {
      const lastSeenAt = normalizeLearningToken(blocker.last_seen_at || digestUpdatedAt) || null;
      if (lastSeenAt && !inWindow(lastSeenAt, lowerBound)) continue;
      const signature = normalizeLearningToken(blocker.signature || `${blocker.stage || "unknown"}:${blocker.reason || "unspecified"}`);
      signals.push({
        kind: "execution_blocker",
        pattern_key: buildExecutionBlockerPatternKey(blocker.stage, signature),
        task_id: canonicalTaskId(item.task_id),
        stage: normalizeLearningToken(blocker.stage, "unknown"),
        source: "iteration_digest",
        first_seen_at: normalizeLearningToken(blocker.first_seen_at || lastSeenAt) || lastSeenAt,
        last_seen_at: lastSeenAt,
        repeat_count: Math.max(1, toNumber(blocker.repeat_count, 1)),
        lost_time_ms: Math.max(0, toNumber(blocker.lost_time_ms)),
        missed_savings_est: 0,
        related_docs: uniqueLearningStrings(blocker.related_docs || []),
        evidence: {
          signature,
          reason: normalizeLearningToken(blocker.reason),
          why_it_repeats: normalizeLearningToken(blocker.why_it_repeats),
          suggested_shortcut: normalizeLearningToken(blocker.suggested_shortcut),
          promotion_hint: normalizeLearningToken(blocker.promotion_hint),
        },
      });
    }
  }
  return signals;
}

function buildShortcutGapSignals(events, lowerBound) {
  const grouped = new Map();
  const normalizedEvents = events.map(normalizeGainEvent);

  for (const event of normalizedEvents) {
    if (normalizeLearningToken(event.event_kind) !== "shortcut_opportunity") continue;
    const shortcutId = normalizeLearningToken(event.shortcut_id);
    if (!DETERMINISTIC_SHORTCUTS.has(shortcutId)) continue;
    if (event.adopted === true) continue;
    if (!inWindow(event.timestamp, lowerBound)) continue;

    const taskId = canonicalTaskId(event.task_id);
    const key = `${taskId || "none"}::${shortcutId}`;
    const current = grouped.get(key) || {
      task_id: taskId,
      shortcut_id: shortcutId,
      first_seen_at: event.timestamp,
      last_seen_at: event.timestamp,
      repeat_count: 0,
      missed_savings_est: 0,
      original_cmd: normalizeLearningToken(event.original_cmd),
    };
    current.repeat_count += 1;
    current.last_seen_at = event.timestamp;
    current.missed_savings_est += Math.round(averageSavedByShortcut(normalizedEvents, shortcutId));
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map((row) => ({
    kind: "shortcut_gap",
    pattern_key: buildShortcutGapPatternKey(row.shortcut_id),
    task_id: row.task_id,
    stage: stageFromShortcut(row.shortcut_id),
    source: "command_gain",
    first_seen_at: row.first_seen_at,
    last_seen_at: row.last_seen_at,
    repeat_count: row.repeat_count,
    lost_time_ms: 0,
    missed_savings_est: row.missed_savings_est,
    related_docs: [],
    evidence: {
      shortcut_id: row.shortcut_id,
      original_cmd: row.original_cmd,
    },
  }));
}

function buildCandidateFromSignals(patternKey, signals, taskId = null) {
  const first = signals[0] || {};
  const kind = normalizeLearningToken(first.kind) || "execution_blocker";
  const taskIds = uniqueLearningStrings(signals.map((signal) => signal.task_id).filter(Boolean));
  const repeatCount = signals.reduce((sum, signal) => sum + Math.max(1, toNumber(signal.repeat_count, 1)), 0);
  const lostTimeMs = signals.reduce((sum, signal) => sum + Math.max(0, toNumber(signal.lost_time_ms, 0)), 0);
  const missedSavings = signals.reduce((sum, signal) => sum + Math.max(0, toNumber(signal.missed_savings_est, 0)), 0);
  const relatedDocs = uniqueLearningStrings(signals.flatMap((signal) => signal.related_docs || []));
  const evidence = first.evidence || {};
  const shortcutId =
    kind === "shortcut_gap" ? normalizeLearningToken(evidence.shortcut_id) : stageToShortcutId(normalizeLearningToken(first.stage));
  const recommendedSummaryShortcut = shortcutId ? buildSummaryShortcutCommand(shortcutId, { taskId }) || null : null;
  const recommendedNextAction =
    kind === "execution_blocker"
      ? normalizeLearningToken(evidence.suggested_shortcut) || "先把重复 blocker 前置成更短的执行入口。"
      : `把 ${normalizeLearningToken(evidence.shortcut_id, "summary shortcut")} 提升为默认入口，只有摘要不足时再回退 raw。`;
  const promotionReady =
    taskIds.length >= LEARNING_PROMOTION_TASK_THRESHOLD &&
    (lostTimeMs >= LEARNING_PROMOTION_LOST_TIME_MS || missedSavings >= LEARNING_PROMOTION_MISSED_SAVINGS_EST);

  return {
    candidate_id: `learning-${slugifyLearningToken(patternKey)}`,
    pattern_key: patternKey,
    kind,
    task_count: taskIds.length,
    repeat_count: repeatCount,
    lost_time_ms: lostTimeMs,
    missed_savings_est: missedSavings,
    current_task_alert: taskId ? signals.some((signal) => normalizeLearningToken(signal.task_id) === normalizeLearningToken(taskId)) : false,
    promotion_ready: promotionReady,
    recommended_next_action: recommendedNextAction,
    recommended_summary_shortcut: recommendedSummaryShortcut,
    related_docs: relatedDocs,
    sample_tasks: taskIds.slice(0, 5),
    evidence,
  };
}

function buildPromotionProposal(candidate) {
  const evidenceLine =
    candidate.kind === "execution_blocker"
      ? `${candidate.task_count} 个 tasks，累计浪费 ${formatDurationMs(candidate.lost_time_ms)}。`
      : `${candidate.task_count} 个 tasks，潜在浪费约 ${candidate.missed_savings_est} tokens。`;
  const planningSummary =
    candidate.kind === "execution_blocker"
      ? `把重复 blocker「${candidate.pattern_key}」前置成 harness 默认入口`
      : `把重复漏用的 shortcut「${candidate.pattern_key}」收成默认 harness 入口`;
  const boundary =
    candidate.kind === "execution_blocker"
      ? "只收口重复 blocker 的默认入口、提示文案或校验前置，不扩到新的状态源或全局自动化。"
      : "只收口 deterministic shortcut 的默认入口与提示链，不改 raw 判定逻辑或新增治理层。";
  const doneWhen =
    candidate.kind === "execution_blocker"
      ? "operating-blueprint 已新增 planning item，且 task draft 能说明该 blocker 应如何前置收口。"
      : "operating-blueprint 已新增 planning item，且 task draft 能说明该 shortcut 应如何前置成默认入口。";
  const whyNow =
    candidate.kind === "execution_blocker"
      ? `${candidate.pattern_key} 已在多个 tasks 重复出现，${evidenceLine}`
      : `${candidate.pattern_key} 已在多个 tasks 持续漏用，${evidenceLine}`;

  return {
    proposal_id: `proposal-${slugifyLearningToken(candidate.pattern_key)}`,
    promotion_semantics: LEARNING_PROMOTION_SEMANTICS,
    planning_summary: planningSummary,
    why_now: whyNow,
    boundary,
    done_when: doneWhen,
    evidence: {
      task_count: candidate.task_count,
      repeat_count: candidate.repeat_count,
      lost_time_ms: candidate.lost_time_ms,
      missed_savings_est: candidate.missed_savings_est,
      sample_task_ids: candidate.sample_tasks,
    },
    suggested_target: "operating-blueprint",
    task_draft_scaffold: {
      summary: planningSummary,
      why: whyNow,
      boundary,
      done_when: doneWhen,
    },
  };
}

function buildCurrentTaskHints(root, taskId, digests, events) {
  if (!taskId) return [];
  const normalizedTaskId = canonicalTaskId(taskId);
  const companion = readCompanion(taskId);
  const digest = companion?.artifacts?.iteration_digest || null;
  const liveSummary = readLatestLiveSummary(taskId);
  const blockers = []
    .concat(Array.isArray(liveSummary?.blockers) ? liveSummary.blockers : [])
    .concat(Array.isArray(digest?.top_blockers) ? digest.top_blockers : []);
  const blockerHints = blockers
    .filter((blocker) => Math.max(0, toNumber(blocker.repeat_count)) >= LEARNING_HINT_REPEAT_THRESHOLD)
    .map((blocker) => {
      const signature = normalizeLearningToken(blocker.signature || `${blocker.stage || "unknown"}:${blocker.reason || "unspecified"}`);
      const shortcutId = stageToShortcutId(blocker.stage);
      return {
        kind: "execution_blocker",
        pattern_key: buildExecutionBlockerPatternKey(blocker.stage, signature),
        label: signature,
        reason:
          normalizeLearningToken(blocker.why_it_repeats) ||
          normalizeLearningToken(blocker.reason) ||
          "相同 blocker 在当前 task 内重复出现。",
        recommended_next_action:
          normalizeLearningToken(blocker.suggested_shortcut) || "先把重复 blocker 对应的默认入口前置出来。",
        recommended_summary_shortcut: shortcutId ? buildSummaryShortcutCommand(shortcutId, { taskId: normalizedTaskId }) || null : null,
        repeat_count: Math.max(1, toNumber(blocker.repeat_count, 1)),
        lost_time_ms: Math.max(0, toNumber(blocker.lost_time_ms, 0)),
        missed_savings_est: 0,
      };
    });

  const normalizedEvents = events.map(normalizeGainEvent);
  const shortcutHints = [];
  const grouped = new Map();
  for (const event of normalizedEvents) {
    if (normalizeLearningToken(event.event_kind) !== "shortcut_opportunity") continue;
    if (event.adopted === true) continue;
    if (canonicalTaskId(event.task_id) !== normalizedTaskId) continue;
    const shortcutId = normalizeLearningToken(event.shortcut_id);
    if (!DETERMINISTIC_SHORTCUTS.has(shortcutId)) continue;
    const current = grouped.get(shortcutId) || {
      repeat_count: 0,
      missed_savings_est: 0,
    };
    current.repeat_count += 1;
    current.missed_savings_est += Math.round(averageSavedByShortcut(normalizedEvents, shortcutId));
    grouped.set(shortcutId, current);
  }
  for (const [shortcutId, item] of grouped.entries()) {
    if (item.repeat_count < LEARNING_HINT_REPEAT_THRESHOLD) continue;
    shortcutHints.push({
      kind: "shortcut_gap",
      pattern_key: buildShortcutGapPatternKey(shortcutId),
      label: shortcutId,
      reason: `${shortcutId} 在当前 task 已漏用 ${item.repeat_count} 次。`,
      recommended_next_action: `把 ${shortcutId} 提升为默认入口，只有摘要不足时再回退 raw。`,
      recommended_summary_shortcut: buildSummaryShortcutCommand(shortcutId, { taskId: normalizedTaskId }) || null,
      repeat_count: item.repeat_count,
      lost_time_ms: 0,
      missed_savings_est: item.missed_savings_est,
    });
  }

  return [...blockerHints, ...shortcutHints]
    .sort((left, right) => (right.lost_time_ms + right.missed_savings_est) - (left.lost_time_ms + left.missed_savings_est))
    .slice(0, 2);
}

function buildLearningCandidatesReport(root = process.cwd(), options = {}) {
  const taskId = canonicalTaskId(options.taskId);
  const window = normalizeLearningToken(options.window, DEFAULT_LEARNING_CANDIDATES_WINDOW);
  const lowerBound = Date.now() - parseWindowMs(window);
  const digests = loadIterationDigests(root);
  const events = readCommandGainEvents(root);
  const signals = [
    ...buildExecutionBlockerSignals(digests, lowerBound),
    ...buildShortcutGapSignals(events, lowerBound),
  ];
  const grouped = new Map();
  for (const signal of signals) {
    const key = `${signal.kind}::${signal.pattern_key}`;
    const current = grouped.get(key) || [];
    current.push(signal);
    grouped.set(key, current);
  }

  const candidates = Array.from(grouped.entries())
    .map(([key, groupedSignals]) => buildCandidateFromSignals(key.split("::")[1], groupedSignals, taskId))
    .sort((left, right) => {
      if (Number(right.promotion_ready) !== Number(left.promotion_ready)) return Number(right.promotion_ready) - Number(left.promotion_ready);
      const rightWeight = right.lost_time_ms + right.missed_savings_est;
      const leftWeight = left.lost_time_ms + left.missed_savings_est;
      if (rightWeight !== leftWeight) return rightWeight - leftWeight;
      if (right.task_count !== left.task_count) return right.task_count - left.task_count;
      return left.pattern_key.localeCompare(right.pattern_key, "zh-Hans-CN");
    });

  const promotionQueue = candidates.filter((candidate) => candidate.promotion_ready).slice(0, 5).map(buildPromotionProposal);

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    window,
    window_ms: parseWindowMs(window),
    task_id: taskId,
    truth_sources: [
      "agent-coordination/tasks/*.json artifacts.iteration_digest",
      "output/agent_session/task-activity/*",
      "output/ai/command-gain/events.jsonl",
    ],
    current_task: {
      task_id: taskId,
      hints: buildCurrentTaskHints(root, taskId, digests, events),
    },
    candidates: candidates.slice(0, 10),
    promotion_queue: promotionQueue,
  };
}

function renderLearningCandidatesMarkdown(report) {
  const lines = [
    "# Learning Candidates",
    "",
    `- generated_at: ${report.generated_at}`,
    `- window: ${report.window}`,
    `- task_id: ${report.task_id || "none"}`,
    "",
    "## Current Task Hints",
    "",
  ];

  if (report.current_task.hints.length) {
    for (const item of report.current_task.hints) {
      lines.push(`- ${item.label}`);
      lines.push(`  - reason: ${item.reason}`);
      lines.push(`  - next: ${item.recommended_next_action}`);
      lines.push(`  - shortcut: ${item.recommended_summary_shortcut || "无"}`);
    }
  } else {
    lines.push("- 当前没有命中 learning hint 阈值。");
  }
  lines.push("");

  lines.push("## Candidates", "");
  if (report.candidates.length) {
    for (const item of report.candidates) {
      lines.push(`- ${item.pattern_key}`);
      lines.push(`  - kind: ${item.kind}`);
      lines.push(`  - tasks: ${item.task_count}`);
      lines.push(`  - repeat_count: ${item.repeat_count}`);
      lines.push(`  - lost_time_ms: ${item.lost_time_ms}`);
      lines.push(`  - missed_savings_est: ${item.missed_savings_est}`);
      lines.push(`  - promotion_ready: ${item.promotion_ready ? "yes" : "no"}`);
      lines.push(`  - next: ${item.recommended_next_action}`);
      lines.push(`  - shortcut: ${item.recommended_summary_shortcut || "无"}`);
    }
  } else {
    lines.push("- 当前窗口内没有 learning candidate。");
  }
  lines.push("");

  lines.push("## Promotion Queue", "");
  if (report.promotion_queue.length) {
    for (const item of report.promotion_queue) {
      lines.push(`- ${item.planning_summary}`);
      lines.push(`  - why_now: ${item.why_now}`);
      lines.push(`  - suggested_target: ${item.suggested_target}`);
      lines.push(`  - task_draft: ${item.task_draft_scaffold.summary}`);
    }
  } else {
    lines.push("- 当前没有达到晋升阈值的 proposal。");
  }
  lines.push("");

  return lines.join("\n");
}

function writeLearningCandidatesReport(root = process.cwd(), report) {
  const outputDir = path.join(root, LEARNING_CANDIDATES_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "latest.json");
  const markdownPath = path.join(outputDir, "latest.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(markdownPath, renderLearningCandidatesMarkdown(report), "utf8");
  return { jsonPath, markdownPath };
}

function buildAndWriteLearningCandidatesReport(root = process.cwd(), options = {}) {
  const report = buildLearningCandidatesReport(root, options);
  const output = writeLearningCandidatesReport(root, report);
  return {
    ...report,
    json_path: output.jsonPath,
    markdown_path: output.markdownPath,
  };
}

function refreshLearningCandidatesSnapshot(root = process.cwd(), options = {}) {
  try {
    return buildAndWriteLearningCandidatesReport(root, options);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to refresh learning candidates snapshot.",
      json_path: null,
      markdown_path: null,
      current_task: { task_id: normalizeLearningToken(options.taskId) || null, hints: [] },
      candidates: [],
      promotion_queue: [],
    };
  }
}

module.exports = {
  LEARNING_CANDIDATES_DIR,
  buildAndWriteLearningCandidatesReport,
  buildLearningCandidatesReport,
  parseWindowMs,
  refreshLearningCandidatesSnapshot,
  renderLearningCandidatesMarkdown,
  writeLearningCandidatesReport,
};
