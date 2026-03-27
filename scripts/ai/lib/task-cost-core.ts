const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { formatEstimatedTokens } = require("../../../shared/ai-efficiency.ts");
const {
  createEmptyTaskCostLedger,
  formatTaskCostCodeDelta,
  formatTaskCostDuration,
  summarizeTaskCostEffect,
  taskCostIntensityScore,
  toTaskCostSnapshot,
} = require("../../../shared/task-cost.ts");

const { parseTaskContract, parseTaskMachineFacts } = require("../../../shared/task-contract.ts");
const { matchesTaskReference } = require("../../../shared/task-identity.ts");
const { readCommandGainEvents, normalizeGainEvent } = require("./command-gain.ts");
const { resolveTaskRecord } = require("./task-resolver.ts");
const { readLatestLiveSummary } = require("../../coord/lib/task-activity.ts");
const { readRegistry } = require("../../release/registry.ts");

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function uniqueStrings(values = []) {
  return Array.from(new Set((values || []).map((value) => normalizeString(value)).filter(Boolean)));
}

function readCompanionRecord(root = process.cwd(), taskLike = "") {
  const normalized = normalizeString(taskLike).replace(/\.md$/, "");
  if (!normalized) return null;
  const companionPath = path.join(root, "agent-coordination", "tasks", `${normalized}.json`);
  if (!fs.existsSync(companionPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(companionPath, "utf8"));
  } catch {
    return null;
  }
}

function sumStageTotals(value = {}) {
  return Object.values(value || {}).reduce((sum, current) => sum + Math.max(0, Math.round(toNumber(current))), 0);
}

function currentBranch(root = process.cwd()) {
  try {
    return execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function git(root, args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function toInt(value) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function summarizeNumStat(output) {
  if (!normalizeString(output)) {
    return { files: 0, insertions: 0, deletions: 0 };
  }

  let files = 0;
  let insertions = 0;
  let deletions = 0;
  for (const line of String(output).split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const [insert, remove] = row.split(/\s+/);
    if (insert === "-" || remove === "-") continue;
    files += 1;
    insertions += toInt(insert);
    deletions += toInt(remove);
  }
  return { files, insertions, deletions };
}

function readLiveDiffStats(root = process.cwd()) {
  const status = git(root, ["status", "--short"]);
  if (status) {
    const changedFiles = uniqueStrings(
      status
        .split(/\r?\n/)
        .map((line) => {
          const match = line.match(/^.. (.+)$/);
          if (!match) return "";
          const value = match[1].trim();
          return value.includes(" -> ") ? value.split(" -> ").at(-1)?.trim() || "" : value;
        })
        .filter(Boolean),
    );
    const unstaged = summarizeNumStat(git(root, ["diff", "--numstat"]));
    const staged = summarizeNumStat(git(root, ["diff", "--numstat", "--cached"]));
    return {
      files: Math.max(changedFiles.length, unstaged.files + staged.files),
      insertions: unstaged.insertions + staged.insertions,
      deletions: unstaged.deletions + staged.deletions,
    };
  }

  const branch = currentBranch(root);
  const range = branch && branch !== "main" ? `${git(root, ["merge-base", "HEAD", "main"])}..HEAD` : "HEAD^..HEAD";
  return summarizeNumStat(git(root, ["diff", "--numstat", range]));
}

function matchesTaskId(value, taskId, shortId) {
  if (!value) return false;
  return matchesTaskReference(taskId, shortId, value);
}

function sortStamp(release) {
  return normalizeString(release?.cutover_at || release?.created_at);
}

function sortReleases(releases = []) {
  return [...(releases || [])].sort((left, right) => sortStamp(right).localeCompare(sortStamp(left)));
}

function summarizeLiveBlockers(summary, digest) {
  const blockers = Array.isArray(summary?.blockers)
    ? summary.blockers
    : Array.isArray(digest?.top_blockers)
      ? digest.top_blockers
      : [];
  return uniqueStrings(
    blockers
      .map((item) => normalizeString(item?.reason || item?.dominant_blocker || item?.signature))
      .filter(Boolean),
  ).slice(0, 3);
}

function summarizeRepeatedBlockers(summary, digest) {
  const blockers = Array.isArray(summary?.blockers)
    ? summary.blockers
    : Array.isArray(digest?.top_blockers)
      ? digest.top_blockers
      : [];
  return blockers.filter((item) => toNumber(item?.repeat_count) >= 2).length;
}

function resolveDominantStage(summary, digest) {
  const direct = normalizeString(summary?.last_attempt?.dominant_stage || digest?.last_attempt?.dominant_stage);
  if (direct) return direct;
  const buckets = {
    ...(summary?.active_ms_by_stage || {}),
    ...(summary?.wait_ms_by_stage || {}),
    ...(digest?.active_ms_by_stage || {}),
    ...(digest?.wait_ms_by_stage || {}),
  };
  return (
    Object.entries(buckets)
      .sort((left, right) => toNumber(right[1]) - toNumber(left[1]))
      .map(([stage]) => stage)
      .find(Boolean) || null
  );
}

function normalizeGateFailure(event) {
  const label = normalizeString(event.profile_id) || normalizeString(event.original_cmd) || "unknown_gate";
  return `${label} exit=${Math.round(toNumber(event.exit_code, 0))}`;
}

function buildStatusSummary({ releaseState, versionLabel, gateFailures, blockers, buildResult, acceptanceStatus }) {
  if (gateFailures.length > 0) {
    return `最近 gate 失败：${gateFailures[0]}。`;
  }
  if (blockers.length > 0) {
    return `当前仍受 ${blockers[0]} 阻塞。`;
  }
  if (releaseState === "pending_acceptance") {
    return `${versionLabel || "当前版本"} 待验收${buildResult ? `；构建 ${buildResult}` : ""}。`;
  }
  if (releaseState === "released" || releaseState === "rolled_back") {
    return `${versionLabel || "当前版本"} ${releaseState === "rolled_back" ? "已回滚" : "已进入发布链"}${acceptanceStatus ? `；验收 ${acceptanceStatus}` : ""}。`;
  }
  if (releaseState === "blocked") {
    return "当前 task 仍处于阻塞状态。";
  }
  if (releaseState === "in_progress") {
    return "当前 task 仍在执行中。";
  }
  return "当前还没有可用的交付推进信号。";
}

function resolveTaskContext(root, input = {}) {
  if (input.task) {
    const task = input.task;
    const companion = input.companion || readCompanionRecord(root, task.id || input.taskId || "");
    return {
      id: normalizeString(task.id || input.taskId),
      shortId: normalizeString(task.shortId || companion?.task_id),
      path: normalizeString(task.path),
      title: normalizeString(task.title),
      status: normalizeString(task.status, "todo"),
      branch: normalizeString(task.machine?.branch || companion?.branch_name),
      companion,
      explicitReleaseIds: uniqueStrings([
        task.machine?.primaryRelease,
        ...(task.machine?.linkedReleases || []),
        ...(task.machine?.companionReleaseIds || []),
        ...((companion?.artifacts?.release_notes || []).map((item) => item.release_id) || []),
      ]),
    };
  }

  const record = resolveTaskRecord(input.taskId, root);
  if (!record) return null;
  const taskPath = path.join(root, record.path);
  const content = fs.existsSync(taskPath) ? fs.readFileSync(taskPath, "utf8") : "";
  const contract = parseTaskContract(record.path, content);
  const machine = parseTaskMachineFacts(content);
  const companion = input.companion || readCompanionRecord(root, record.id);
  return {
    id: contract.id,
    shortId: contract.shortId,
    path: contract.path,
    title: contract.title,
    status: contract.status,
    branch: normalizeString(companion?.branch_name || machine.branch),
    companion,
    explicitReleaseIds: uniqueStrings([
      machine.primaryRelease,
      ...(machine.linkedReleases || []),
      ...((companion?.artifacts?.release_notes || []).map((item) => item.release_id) || []),
    ]),
  };
}

function resolveAssociatedReleases(taskContext, releases) {
  const registryReleases = Array.isArray(releases) ? releases : readRegistry().releases || [];
  return sortReleases(
    registryReleases.filter((release) => {
      if (!release) return false;
      if (normalizeString(release.primary_task_id) === taskContext.id) return true;
      if (Array.isArray(release.linked_task_ids) && release.linked_task_ids.includes(taskContext.id)) return true;
      return taskContext.explicitReleaseIds.includes(release.release_id);
    }),
  );
}

function inferDeliveryStatus(taskContext, releases) {
  const latestRelease = releases[0] || null;
  if (normalizeString(taskContext.status) === "blocked") return "blocked";
  if (latestRelease?.channel === "dev" && latestRelease?.acceptance_status === "pending") return "pending_acceptance";
  if (latestRelease?.channel === "prod" && latestRelease?.acceptance_status === "accepted") {
    return latestRelease?.status === "rolled_back" ? "rolled_back" : "released";
  }
  if (normalizeString(taskContext.status) === "doing") return "in_progress";
  if (normalizeString(taskContext.status) === "done") return "released";
  return "not_started";
}

function buildTaskCostLedger(root = process.cwd(), input = {}) {
  const taskContext = resolveTaskContext(root, input);
  if (!taskContext) {
    return createEmptyTaskCostLedger(normalizeString(input.taskId), normalizeString(input.title), normalizeString(input.deliveryStatus, "not_started"));
  }

  const associatedReleases = resolveAssociatedReleases(taskContext, input.associatedReleases);
  const latestRelease = associatedReleases[0] || null;
  const frozenSnapshot =
    latestRelease?.delivery_snapshot?.change_cost ||
    taskContext.companion?.artifacts?.change_cost_snapshot ||
    null;
  const empty = createEmptyTaskCostLedger(
    taskContext.shortId || taskContext.id,
    taskContext.title,
    normalizeString(input.deliveryStatus) || inferDeliveryStatus(taskContext, associatedReleases),
  );
  const liveSummary = readLatestLiveSummary(taskContext.id);
  const digest = taskContext.companion?.artifacts?.iteration_digest || null;
  const activeMs = liveSummary ? sumStageTotals(liveSummary.active_ms_by_stage) : digest ? sumStageTotals(digest.active_ms_by_stage) : 0;
  const waitMs = liveSummary ? sumStageTotals(liveSummary.wait_ms_by_stage) : digest ? sumStageTotals(digest.wait_ms_by_stage) : 0;
  const liveBlockers = summarizeLiveBlockers(liveSummary, digest);
  const repeatedBlockers = summarizeRepeatedBlockers(liveSummary, digest);
  const events = readCommandGainEvents(root)
    .map(normalizeGainEvent)
    .filter((event) => matchesTaskId(event.task_id, taskContext.id, taskContext.shortId));
  const summaryEvents = events.filter((event) => event.event_kind === "summary_run");
  const contextEvents = events.filter((event) => event.event_kind === "context_packet");
  const gateFailures = uniqueStrings(
    summaryEvents
      .filter((event) => toNumber(event.exit_code) !== 0)
      .sort((left, right) => normalizeString(right.timestamp).localeCompare(normalizeString(left.timestamp)))
      .map(normalizeGateFailure),
  ).slice(0, 3);
  const summaryTokensLive = {
    summary_runs: summaryEvents.length,
    context_packets: contextEvents.length,
    summary_input_est: summaryEvents.reduce((sum, event) => sum + toNumber(event.input_tokens_est), 0),
    summary_output_est: summaryEvents.reduce((sum, event) => sum + toNumber(event.output_tokens_est), 0),
    summary_saved_est: summaryEvents.reduce((sum, event) => sum + toNumber(event.saved_tokens_est), 0),
    context_input_est: contextEvents.reduce((sum, event) => sum + toNumber(event.input_tokens_est), 0),
    context_output_est: contextEvents.reduce((sum, event) => sum + toNumber(event.output_tokens_est), 0),
    context_saved_est: contextEvents.reduce((sum, event) => sum + toNumber(event.saved_tokens_est), 0),
  };

  const branch = currentBranch(root);
  const useLiveDiff = Boolean(taskContext.branch) && branch === taskContext.branch;
  const liveDiff = useLiveDiff ? readLiveDiffStats(root) : null;
  const releaseState = normalizeString(input.deliveryStatus) || inferDeliveryStatus(taskContext, associatedReleases);
  const versionLabel = normalizeString(input.versionLabel) || normalizeString(latestRelease?.release_id) || null;

  const ledger = {
    ...empty,
    updated_at: new Date().toISOString(),
    task_id: taskContext.shortId || taskContext.id,
    title: taskContext.title,
    delivery_status: releaseState,
    version_label: versionLabel,
  };

  if (activeMs > 0 || waitMs > 0 || liveBlockers.length > 0) {
    ledger.time = {
      active_ms: activeMs,
      wait_ms: waitMs,
      total_ms: activeMs + waitMs,
      dominant_stage: resolveDominantStage(liveSummary, digest),
      repeated_blockers: repeatedBlockers,
      latest_blockers: liveBlockers,
    };
  } else if (frozenSnapshot?.time) {
    ledger.time = {
      ...frozenSnapshot.time,
      active_ms: Math.max(0, Math.round(toNumber(frozenSnapshot.time.active_ms))),
      wait_ms: Math.max(0, Math.round(toNumber(frozenSnapshot.time.wait_ms))),
      total_ms: Math.max(0, Math.round(toNumber(frozenSnapshot.time.total_ms))),
      dominant_stage: normalizeString(frozenSnapshot.time.dominant_stage) || null,
      repeated_blockers: Math.max(0, Math.round(toNumber(frozenSnapshot.time.repeated_blockers))),
      latest_blockers: uniqueStrings(frozenSnapshot.time.latest_blockers || []),
    };
  }

  if (summaryEvents.length > 0 || contextEvents.length > 0) {
    ledger.tokens = summaryTokensLive;
  } else if (frozenSnapshot?.tokens) {
    ledger.tokens = {
      summary_runs: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.summary_runs))),
      context_packets: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.context_packets))),
      summary_input_est: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.summary_input_est))),
      summary_output_est: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.summary_output_est))),
      summary_saved_est: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.summary_saved_est))),
      context_input_est: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.context_input_est))),
      context_output_est: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.context_output_est))),
      context_saved_est: Math.max(0, Math.round(toNumber(frozenSnapshot.tokens.context_saved_est))),
    };
  }

  if (liveDiff && (liveDiff.files > 0 || liveDiff.insertions > 0 || liveDiff.deletions > 0 || useLiveDiff)) {
    ledger.code = {
      source: "live",
      files: liveDiff.files,
      insertions: liveDiff.insertions,
      deletions: liveDiff.deletions,
    };
  } else if (frozenSnapshot?.code) {
    ledger.code = {
      source: "snapshot",
      files: Math.max(0, Math.round(toNumber(frozenSnapshot.code.files))),
      insertions: Math.max(0, Math.round(toNumber(frozenSnapshot.code.insertions))),
      deletions: Math.max(0, Math.round(toNumber(frozenSnapshot.code.deletions))),
    };
  }

  const blockers = liveBlockers.length > 0 ? liveBlockers : uniqueStrings(frozenSnapshot?.effect?.blockers || []);
  const lastGateFailures = gateFailures.length > 0 ? gateFailures : uniqueStrings(frozenSnapshot?.effect?.last_gate_failures || []);
  const buildResult = normalizeString(latestRelease?.build_result || frozenSnapshot?.effect?.build_result) || null;
  const smokeResult = normalizeString(latestRelease?.smoke_result || frozenSnapshot?.effect?.smoke_result) || null;
  const acceptanceStatus = normalizeString(latestRelease?.acceptance_status || frozenSnapshot?.effect?.acceptance_status) || null;

  ledger.effect = {
    last_gate_failures: lastGateFailures,
    release_state: releaseState,
    build_result: buildResult,
    smoke_result: smokeResult,
    acceptance_status: acceptanceStatus,
    blockers,
    status_summary: buildStatusSummary({
      releaseState,
      versionLabel,
      gateFailures: lastGateFailures,
      blockers,
      buildResult,
      acceptanceStatus,
    }),
  };

  return ledger;
}

function buildTaskCostReport(root = process.cwd(), input = {}) {
  const ledger = buildTaskCostLedger(root, input);
  return {
    ok: true,
    task_id: ledger.task_id,
    title: ledger.title,
    ledger,
  };
}

function buildTaskCostLedgers(root = process.cwd(), items = []) {
  return [...(items || [])]
    .map((item) => buildTaskCostLedger(root, { task: item }))
    .sort((left, right) => taskCostIntensityScore(right) - taskCostIntensityScore(left) || left.task_id.localeCompare(right.task_id));
}

function formatTaskCostReportText(payload = {}) {
  const ledger = payload.ledger || payload;
  if (!ledger?.task_id) {
    return "当前没有可用的 task 成本账单。";
  }
  const totalInput = ledger.tokens.summary_input_est + ledger.tokens.context_input_est;
  const totalSaved = ledger.tokens.summary_saved_est + ledger.tokens.context_saved_est;
  const lines = [
    `${ledger.task_id} ${ledger.title}`.trim(),
    `- 时间：active ${formatTaskCostDuration(ledger.time.active_ms)} / wait ${formatTaskCostDuration(ledger.time.wait_ms)}${ledger.time.dominant_stage ? ` / dominant ${ledger.time.dominant_stage}` : ""}`,
    `- Token：输入 ~${formatEstimatedTokens(totalInput)} / 节省 ~${formatEstimatedTokens(totalSaved)}`,
    `- 代码量：${formatTaskCostCodeDelta(ledger.code)}`,
    `- 效果：${summarizeTaskCostEffect(ledger.effect)}`,
  ];
  if (ledger.effect.last_gate_failures.length > 0) {
    lines.push(`- 最近失败：${ledger.effect.last_gate_failures.join("；")}`);
  }
  return lines.join("\n");
}

function buildTaskCostSnapshot(root = process.cwd(), input = {}) {
  return toTaskCostSnapshot(buildTaskCostLedger(root, input));
}

module.exports = {
  buildTaskCostLedger,
  buildTaskCostReport,
  buildTaskCostLedgers,
  formatTaskCostReportText,
  buildTaskCostSnapshot,
};
