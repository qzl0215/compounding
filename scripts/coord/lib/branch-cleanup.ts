const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { listTaskRecords, resolveTaskRecord } = require("../../ai/lib/task-resolver.ts");
const { loadOperatorContract } = require("../../ai/lib/operator-contract.ts");
const { parseTaskContract, parseTaskMachineFacts } = require("../../../shared/task-contract.ts");
const {
  branchCleanupIsOverdue,
  buildTaskBranchCleanupView,
  createEmptyBranchCleanupRecord,
  deriveBranchCleanupOverallState,
  normalizeBranchCleanupRecord,
  summarizeBranchCleanup,
} = require("../../../shared/branch-cleanup.ts");
const { readCompanion, updateCompanion } = require("./task-meta.ts");

function nowIso() {
  return new Date().toISOString();
}

function addHours(iso, hours) {
  const base = Number.isFinite(Date.parse(iso)) ? new Date(iso) : new Date();
  base.setHours(base.getHours() + Math.max(0, Number(hours) || 0));
  return base.toISOString();
}

function normalizeString(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function normalizeTaskStatus(value) {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "已完成") return "done";
  if (normalized === "阻塞中") return "blocked";
  if (normalized === "进行中" || normalized === "in_progress") return "doing";
  if (normalized === "待开始") return "todo";
  return normalized || "todo";
}

function cleanValue(value) {
  return normalizeString(value).replace(/`/g, "");
}

function isPendingCommit(value) {
  const normalized = cleanValue(value).toLowerCase();
  return !normalized || normalized === "pending" || normalized === "auto" || normalized.startsWith("auto:");
}

function isLegacyMainBranch(branch, defaultBranch = "main") {
  return branch === defaultBranch || branch.startsWith(`${defaultBranch} `);
}

function runGit(args, root = process.cwd()) {
  try {
    return {
      ok: true,
      output: childProcess.execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      output: error instanceof Error ? error.message : "",
    };
  }
}

function branchExists(branch, root = process.cwd()) {
  return Boolean(branch) && runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], root).ok;
}

function branchHead(branch, root = process.cwd()) {
  const result = runGit(["rev-parse", branch], root);
  return result.ok ? result.output : "";
}

function commitExists(commit, root = process.cwd()) {
  return Boolean(commit) && runGit(["cat-file", "-e", `${commit}^{commit}`], root).ok;
}

function currentBranch(root = process.cwd()) {
  const result = runGit(["branch", "--show-current"], root);
  return result.ok ? result.output : "";
}

function isMergedIntoBranch(commit, branch = "main", root = process.cwd()) {
  return Boolean(commit) && runGit(["merge-base", "--is-ancestor", commit, branch], root).ok;
}

function remoteExists(remoteName, root = process.cwd()) {
  return Boolean(remoteName) && runGit(["remote", "get-url", remoteName], root).ok;
}

function listRemoteBranchRefs(branch, root = process.cwd()) {
  const result = runGit(["branch", "-r", "--list", `*/${branch}`], root);
  if (!result.ok) return [];
  return result.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes("->"));
}

function upstreamRef(branch, root = process.cwd()) {
  if (!branch) return "";
  const result = runGit(["rev-parse", "--abbrev-ref", `${branch}@{upstream}`], root);
  return result.ok ? result.output : "";
}

function loadGithubSurface(root = process.cwd()) {
  try {
    const contract = loadOperatorContract(root);
    const github = contract?.github_surface || {};
    return {
      enabled: Boolean(github.enabled),
      remote_name: normalizeString(github.remote_name, "origin"),
      default_branch: normalizeString(github.default_branch, "main"),
    };
  } catch {
    return {
      enabled: false,
      remote_name: "origin",
      default_branch: "main",
    };
  }
}

function parseRemoteRef(ref) {
  const normalized = normalizeString(ref);
  if (!normalized.includes("/")) {
    return { remote_name: null, remote_ref: normalized || null, branch_name: null };
  }
  const [remoteName, ...rest] = normalized.split("/");
  return {
    remote_name: remoteName || null,
    remote_ref: normalized,
    branch_name: rest.join("/") || null,
  };
}

function resolveRemoteTarget(branch, root = process.cwd(), githubSurface = loadGithubSurface(root)) {
  if (!branch || isLegacyMainBranch(branch, githubSurface.default_branch)) {
    return { mode: "not_configured", remote_name: null, remote_ref: null, branch_name: branch || null, message: "main branch" };
  }
  if (!githubSurface.enabled) {
    return { mode: "not_configured", remote_name: githubSurface.remote_name, remote_ref: null, branch_name: branch, message: "github disabled" };
  }
  if (!remoteExists(githubSurface.remote_name, root)) {
    return { mode: "not_configured", remote_name: githubSurface.remote_name, remote_ref: null, branch_name: branch, message: "remote missing" };
  }

  const upstream = upstreamRef(branch, root);
  if (upstream) {
    const parsed = parseRemoteRef(upstream);
    if (parsed.remote_name && parsed.remote_name !== githubSurface.remote_name) {
      return {
        mode: "ambiguous",
        remote_name: parsed.remote_name,
        remote_ref: upstream,
        branch_name: branch,
        error_code: "ambiguous_remote_target",
        message: `branch upstream is ${upstream}, not ${githubSurface.remote_name}`,
      };
    }
    return {
      mode: "scheduled",
      remote_name: parsed.remote_name || githubSurface.remote_name,
      remote_ref: upstream,
      branch_name: parsed.branch_name || branch,
      message: null,
    };
  }

  const candidates = listRemoteBranchRefs(branch, root)
    .map((ref) => parseRemoteRef(ref))
    .filter((candidate) => candidate.remote_name === githubSurface.remote_name || !githubSurface.remote_name);
  if (candidates.length === 1) {
    return {
      mode: "scheduled",
      remote_name: candidates[0].remote_name || githubSurface.remote_name,
      remote_ref: candidates[0].remote_ref,
      branch_name: candidates[0].branch_name || branch,
      message: null,
    };
  }
  if (candidates.length > 1) {
    return {
      mode: "ambiguous",
      remote_name: null,
      remote_ref: null,
      branch_name: branch,
      error_code: "ambiguous_remote_target",
      message: `multiple remote refs match ${branch}`,
    };
  }
  return {
    mode: "not_configured",
    remote_name: githubSurface.remote_name,
    remote_ref: `${githubSurface.remote_name}/${branch}`,
    branch_name: branch,
    message: "remote branch missing",
  };
}

function remoteBranchExists(remoteName, branch, root = process.cwd()) {
  if (!remoteName || !branch) return false;
  return listRemoteBranchRefs(branch, root).includes(`${remoteName}/${branch}`);
}

function appendAttempt(record, payload) {
  const attempts = Array.isArray(record.attempts) ? [...record.attempts] : [];
  attempts.push({
    attempted_at: payload.attempted_at || nowIso(),
    scope: payload.scope,
    ok: Boolean(payload.ok),
    action: payload.action || "",
    error_code: payload.error_code || null,
    message: payload.message || null,
  });
  record.attempt_count = (record.attempt_count || 0) + 1;
  record.last_attempt_at = attempts.at(-1)?.attempted_at || record.last_attempt_at || null;
  record.attempts = attempts.slice(-10);
  return record;
}

function buildTaskContext(taskLike, root = process.cwd()) {
  const record = resolveTaskRecord(taskLike, root);
  if (!record) return null;
  const file = path.join(root, record.path);
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, "utf8");
  const parsed = parseTaskContract(record.path, content);
  const machine = parseTaskMachineFacts(content);
  const companion = readCompanion(record.id);
  const githubSurface = loadGithubSurface(root);
  const branch = cleanValue(companion?.branch_name || machine.branch || "");
  const companionCleanup = normalizeBranchCleanupRecord(companion?.artifacts?.branch_cleanup);
  const storedCommit = isPendingCommit(companion?.lifecycle?.handoff?.git_head || machine.recentCommit)
    ? ""
    : cleanValue(companion?.lifecycle?.handoff?.git_head || machine.recentCommit || "");
  const localBranchExists = branch && !isLegacyMainBranch(branch, githubSurface.default_branch) ? branchExists(branch, root) : false;
  const branchCommit = localBranchExists ? branchHead(branch, root) : "";
  const cleanupCommit = cleanValue(companionCleanup?.source_commit || "");
  const effectiveCommit =
    branchCommit || (commitExists(cleanupCommit, root) ? cleanupCommit : commitExists(storedCommit, root) ? storedCommit : "");
  const activeBranch = currentBranch(root);
  const mergedToDefault =
    isLegacyMainBranch(branch, githubSurface.default_branch) ||
    (branch !== activeBranch && isMergedIntoBranch(effectiveCommit, githubSurface.default_branch, root));
  const remoteTarget = resolveRemoteTarget(branch, root, githubSurface);
  return {
    root,
    id: record.id,
    shortId: parsed.shortId || record.shortId,
    title: parsed.title || record.title,
    path: record.path,
    status: normalizeTaskStatus(parsed.status),
    branch,
    storedCommit,
    effectiveCommit,
    localBranchExists,
    activeBranch,
    mergedToDefault,
    githubSurface,
    branchCleanup: companionCleanup,
    remoteTarget,
  };
}

function buildCleanupCandidateRecord(taskContext, options = {}) {
  const current = normalizeBranchCleanupRecord(options.existingRecord || taskContext.branchCleanup) || createEmptyBranchCleanupRecord(taskContext.branch);
  const delayHours = Number(options.delayHours) > 0 ? Number(options.delayHours) : current.delay_hours || 24;
  const eligibleAt = options.eligibleAt || nowIso();
  const scheduledFor = options.scheduledFor || addHours(eligibleAt, delayHours);
  const sourceCommit = cleanValue(options.sourceCommit || current.source_commit || taskContext.effectiveCommit || "");
  const sourceReleaseId = cleanValue(options.sourceReleaseId || current.source_release_id || "");
  const remoteTarget = options.remoteTarget || taskContext.remoteTarget;
  const eligible =
    taskContext.status === "done" &&
    Boolean(taskContext.branch) &&
    !isLegacyMainBranch(taskContext.branch, taskContext.githubSurface.default_branch) &&
    taskContext.mergedToDefault &&
    taskContext.branch !== taskContext.activeBranch;

  const next = {
    ...current,
    schema_version: "1",
    trigger: options.trigger || current.trigger || "prod_accepted",
    delay_hours: delayHours,
    source_release_id: sourceReleaseId || null,
    source_commit: sourceCommit || null,
    local: {
      ...current.local,
      branch_name: taskContext.branch || current.local.branch_name || null,
      deleted_at: current.local.deleted_at || null,
      last_error: null,
      error_code: null,
    },
    remote: {
      ...current.remote,
      remote_name: remoteTarget.remote_name || current.remote.remote_name || null,
      remote_ref: remoteTarget.remote_ref || current.remote.remote_ref || null,
      deleted_at: current.remote.deleted_at || null,
      last_error: null,
      error_code: null,
    },
    canceled_reason: null,
  };

  if (!eligible) {
    next.eligible_at = null;
    next.scheduled_for = null;
    next.local.state = current.local.state === "deleted" ? "deleted" : "active";
    next.remote.state = current.remote.state === "deleted" ? "deleted" : "not_configured";
    next.overall_state = deriveBranchCleanupOverallState(next.local.state, next.remote.state);
    return { eligible: false, record: next, remoteTarget };
  }

  next.eligible_at = eligibleAt;
  next.scheduled_for = taskContext.localBranchExists || remoteTarget.mode === "scheduled" ? scheduledFor : null;
  next.local.state = taskContext.localBranchExists ? "scheduled" : "deleted";
  if (next.local.state === "deleted" && !next.local.deleted_at) {
    next.local.deleted_at = options.recordedAt || nowIso();
  }

  if (remoteTarget.mode === "scheduled") {
    next.remote.state = remoteBranchExists(remoteTarget.remote_name, remoteTarget.branch_name, taskContext.root) ? "scheduled" : "deleted";
    if (next.remote.state === "deleted" && !next.remote.deleted_at) {
      next.remote.deleted_at = options.recordedAt || nowIso();
    }
  } else {
    next.remote.state = "not_configured";
    next.remote.deleted_at = null;
  }

  next.overall_state = deriveBranchCleanupOverallState(next.local.state, next.remote.state);
  return { eligible: true, record: next, remoteTarget };
}

function scheduleTaskBranchCleanup(taskLike, options = {}, root = process.cwd()) {
  const taskContext = buildTaskContext(taskLike, root);
  if (!taskContext) {
    return { ok: false, error: `Unknown task: ${taskLike}` };
  }
  return updateCompanion(taskContext.id, (companion) => {
    const current = normalizeBranchCleanupRecord(companion.artifacts?.branch_cleanup);
    if (current?.overall_state === "deleted") {
      return companion;
    }
    const scheduled = buildCleanupCandidateRecord(taskContext, {
      existingRecord: current,
      trigger: options.trigger || "prod_accepted",
      eligibleAt: options.eligibleAt || nowIso(),
      scheduledFor: options.scheduledFor || null,
      delayHours: options.delayHours || 24,
      sourceReleaseId: options.sourceReleaseId || null,
      sourceCommit: options.sourceCommit || null,
      recordedAt: options.recordedAt || nowIso(),
    });
    companion.artifacts.branch_cleanup = scheduled.record;
    return companion;
  });
}

function cancelTaskBranchCleanup(taskLike, options = {}, root = process.cwd()) {
  const taskContext = buildTaskContext(taskLike, root);
  if (!taskContext) {
    return { ok: false, error: `Unknown task: ${taskLike}` };
  }
  return updateCompanion(taskContext.id, (companion) => {
    const current = normalizeBranchCleanupRecord(companion.artifacts?.branch_cleanup);
    if (!current || current.overall_state === "deleted") {
      return companion;
    }
    const next = {
      ...current,
      scheduled_for: null,
      canceled_reason: normalizeString(options.reason, "cleanup_canceled"),
      local: {
        ...current.local,
        state: current.local.state === "deleted" ? "deleted" : "canceled",
        last_error: current.local.state === "deleted" ? current.local.last_error : null,
        error_code: current.local.state === "deleted" ? current.local.error_code : null,
      },
      remote: {
        ...current.remote,
        state: current.remote.state === "deleted" || current.remote.state === "not_configured" ? current.remote.state : "canceled",
        last_error:
          current.remote.state === "deleted" || current.remote.state === "not_configured" ? current.remote.last_error : null,
        error_code:
          current.remote.state === "deleted" || current.remote.state === "not_configured" ? current.remote.error_code : null,
      },
    };
    next.overall_state = deriveBranchCleanupOverallState(next.local.state, next.remote.state);
    companion.artifacts.branch_cleanup = next;
    return companion;
  });
}

function collectReleaseTaskIds(primaryTaskId, linkedTaskIds = []) {
  return Array.from(new Set([primaryTaskId, ...(Array.isArray(linkedTaskIds) ? linkedTaskIds : [])].map((item) => normalizeString(item)).filter(Boolean)));
}

function scheduleBranchCleanupForRelease(primaryTaskId, linkedTaskIds, options = {}, root = process.cwd()) {
  return collectReleaseTaskIds(primaryTaskId, linkedTaskIds).map((taskId) => {
    const result = scheduleTaskBranchCleanup(taskId, options, root);
    return {
      task_id: taskId,
      ok: Boolean(result.ok),
      error: result.ok ? null : result.error || null,
      branch_cleanup: result.ok ? normalizeBranchCleanupRecord(result.companion?.artifacts?.branch_cleanup) : null,
    };
  });
}

function assessTaskBranchCleanup(taskLike, root = process.cwd()) {
  const taskContext = buildTaskContext(taskLike, root);
  if (!taskContext) return null;
  const record = normalizeBranchCleanupRecord(taskContext.branchCleanup);
  const candidate =
    !record &&
    taskContext.status === "done" &&
    Boolean(taskContext.branch) &&
    !isLegacyMainBranch(taskContext.branch, taskContext.githubSurface.default_branch) &&
    taskContext.mergedToDefault &&
    taskContext.branch !== taskContext.activeBranch
      ? buildCleanupCandidateRecord(taskContext, {
          trigger: "legacy_merged",
          eligibleAt: nowIso(),
          delayHours: 24,
          sourceCommit: taskContext.effectiveCommit,
        }).record
      : null;
  const effectiveRecord = record || candidate || null;
  return {
    task_id: taskContext.id,
    short_id: taskContext.shortId,
    title: taskContext.title,
    path: taskContext.path,
    status: taskContext.status,
    branch: taskContext.branch,
    effective_commit: taskContext.effectiveCommit || null,
    merged_to_default: taskContext.mergedToDefault,
    local_branch_exists: taskContext.localBranchExists,
    active_branch: taskContext.activeBranch,
    github_surface: taskContext.githubSurface,
    branch_cleanup: effectiveRecord,
    branch_cleanup_view: buildTaskBranchCleanupView(effectiveRecord),
    branch_cleanup_summary: summarizeBranchCleanup(effectiveRecord),
    has_persisted_record: Boolean(record),
    legacy_candidate: Boolean(!record && candidate && candidate.trigger === "legacy_merged"),
    overdue: branchCleanupIsOverdue(effectiveRecord),
  };
}

function listBranchCleanupRows(options = {}, root = process.cwd()) {
  const filterTaskId = normalizeString(options.taskId);
  const records = (filterTaskId ? [resolveTaskRecord(filterTaskId, root)].filter(Boolean) : listTaskRecords(root)).map((record) =>
    assessTaskBranchCleanup(record.id, root),
  );
  return records.filter(Boolean);
}

function buildBranchCleanupReport(options = {}, root = process.cwd()) {
  const rows = listBranchCleanupRows(options, root);
  const summary = {
    total: rows.length,
    scheduled: rows.filter((row) => row.branch_cleanup_view?.overallState === "scheduled").length,
    deleted: rows.filter((row) => row.branch_cleanup_view?.overallState === "deleted").length,
    failed: rows.filter((row) => row.branch_cleanup_view?.overallState === "failed").length,
    canceled: rows.filter((row) => row.branch_cleanup_view?.overallState === "canceled").length,
    overdue: rows.filter((row) => row.overdue).length,
    legacy_backlog: rows.filter((row) => row.legacy_candidate).length,
    remote_not_configured: rows.filter((row) => row.branch_cleanup_view?.remoteState === "not_configured").length,
  };
  return {
    ok: true,
    generated_at: nowIso(),
    github_surface: loadGithubSurface(root),
    summary,
    tasks: rows,
  };
}

function backfillBranchCleanup(options = {}, root = process.cwd()) {
  const apply = Boolean(options.apply);
  const recordedAt = options.recordedAt || nowIso();
  const rows = listBranchCleanupRows(options, root).filter((row) => row.legacy_candidate);
  const results = rows.map((row) => {
    if (!apply) {
      return {
        task_id: row.task_id,
        ok: true,
        applied: false,
        branch_cleanup: row.branch_cleanup,
      };
    }
    const scheduled = scheduleTaskBranchCleanup(row.task_id, {
      trigger: "legacy_merged",
      eligibleAt: recordedAt,
      scheduledFor: addHours(recordedAt, 24),
      sourceCommit: row.effective_commit,
      delayHours: 24,
      recordedAt,
    }, root);
    return {
      task_id: row.task_id,
      ok: Boolean(scheduled.ok),
      applied: true,
      error: scheduled.ok ? null : scheduled.error || null,
      branch_cleanup: scheduled.ok ? normalizeBranchCleanupRecord(scheduled.companion?.artifacts?.branch_cleanup) : null,
    };
  });
  return {
    ok: results.every((item) => item.ok),
    apply,
    generated_at: recordedAt,
    summary: {
      candidates: rows.length,
      applied: results.filter((item) => item.applied && item.ok).length,
      failed: results.filter((item) => !item.ok).length,
    },
    tasks: results,
  };
}

function markLocalDeleted(record, timestamp, message = null) {
  record.local.state = "deleted";
  record.local.deleted_at = record.local.deleted_at || timestamp;
  record.local.last_error = message;
  record.local.error_code = null;
  return record;
}

function markRemoteDeleted(record, timestamp, message = null) {
  record.remote.state = "deleted";
  record.remote.deleted_at = record.remote.deleted_at || timestamp;
  record.remote.last_error = message;
  record.remote.error_code = null;
  return record;
}

function runBranchCleanup(options = {}, root = process.cwd()) {
  const dueOnly = options.dueOnly !== false;
  const dryRun = Boolean(options.dryRun);
  const rows = listBranchCleanupRows({ taskId: options.taskId }, root);
  const generatedAt = nowIso();
  const results = [];

  for (const row of rows) {
    const persisted = normalizeBranchCleanupRecord(row.has_persisted_record ? row.branch_cleanup : null);
    if (!persisted) {
      continue;
    }

    const shouldAttempt =
      (persisted.overall_state === "scheduled" && (!dueOnly || branchCleanupIsOverdue(persisted, Date.parse(generatedAt)))) ||
      (!dueOnly && persisted.overall_state === "failed");
    if (!shouldAttempt) {
      continue;
    }

    const taskContext = buildTaskContext(row.task_id, root);
    if (!taskContext) {
      results.push({ task_id: row.task_id, ok: false, skipped: false, error: "task_not_found" });
      continue;
    }

    const eligible =
      taskContext.status === "done" &&
      taskContext.mergedToDefault &&
      Boolean(taskContext.branch) &&
      !isLegacyMainBranch(taskContext.branch, taskContext.githubSurface.default_branch) &&
      taskContext.branch !== taskContext.activeBranch;

    if (!eligible) {
      if (!dryRun) {
        cancelTaskBranchCleanup(row.task_id, { reason: "eligibility_changed" }, root);
      }
      results.push({
        task_id: row.task_id,
        ok: true,
        skipped: false,
        canceled: true,
        reason: "eligibility_changed",
      });
      continue;
    }

    if (dryRun) {
      results.push({
        task_id: row.task_id,
        ok: true,
        skipped: false,
        dry_run: true,
        branch_cleanup: persisted,
      });
      continue;
    }

    const update = updateCompanion(row.task_id, (companion) => {
      let record = normalizeBranchCleanupRecord(companion.artifacts?.branch_cleanup) || persisted;
      const timestamp = generatedAt;
      const refreshedTarget = resolveRemoteTarget(taskContext.branch, root, taskContext.githubSurface);

      if (record.local.state !== "deleted") {
        if (!taskContext.localBranchExists) {
          record = appendAttempt(markLocalDeleted(record, timestamp, "local branch already absent"), {
            attempted_at: timestamp,
            scope: "local",
            ok: true,
            action: "delete_branch",
            message: "local branch already absent",
          });
        } else if (taskContext.branch === taskContext.activeBranch) {
          record.local.state = "failed";
          record.local.last_error = `current branch ${taskContext.branch} is checked out`;
          record.local.error_code = "current_branch_checked_out";
          record = appendAttempt(record, {
            attempted_at: timestamp,
            scope: "local",
            ok: false,
            action: "delete_branch",
            error_code: "current_branch_checked_out",
            message: record.local.last_error,
          });
        } else {
          const deleted = runGit(["branch", "-d", taskContext.branch], root);
          if (deleted.ok) {
            record = appendAttempt(markLocalDeleted(record, timestamp, null), {
              attempted_at: timestamp,
              scope: "local",
              ok: true,
              action: "delete_branch",
              message: deleted.output || null,
            });
          } else {
            record.local.state = "failed";
            record.local.last_error = deleted.output || "failed to delete local branch";
            record.local.error_code = "local_delete_failed";
            record = appendAttempt(record, {
              attempted_at: timestamp,
              scope: "local",
              ok: false,
              action: "delete_branch",
              error_code: "local_delete_failed",
              message: record.local.last_error,
            });
          }
        }
      }

      if (taskContext.githubSurface.enabled) {
        if (refreshedTarget.mode === "ambiguous") {
          record.remote.state = "failed";
          record.remote.remote_name = refreshedTarget.remote_name || record.remote.remote_name || null;
          record.remote.remote_ref = refreshedTarget.remote_ref || record.remote.remote_ref || null;
          record.remote.last_error = refreshedTarget.message || "ambiguous remote target";
          record.remote.error_code = refreshedTarget.error_code || "ambiguous_remote_target";
          record = appendAttempt(record, {
            attempted_at: timestamp,
            scope: "remote",
            ok: false,
            action: "delete_branch",
            error_code: record.remote.error_code,
            message: record.remote.last_error,
          });
        } else if (refreshedTarget.mode === "scheduled") {
          record.remote.remote_name = refreshedTarget.remote_name || record.remote.remote_name || null;
          record.remote.remote_ref = refreshedTarget.remote_ref || record.remote.remote_ref || null;
          if (!remoteBranchExists(refreshedTarget.remote_name, refreshedTarget.branch_name, root)) {
            record = appendAttempt(markRemoteDeleted(record, timestamp, "remote branch already absent"), {
              attempted_at: timestamp,
              scope: "remote",
              ok: true,
              action: "delete_branch",
              message: "remote branch already absent",
            });
          } else {
            const deleted = runGit(["push", refreshedTarget.remote_name, "--delete", refreshedTarget.branch_name], root);
            if (deleted.ok) {
              record = appendAttempt(markRemoteDeleted(record, timestamp, null), {
                attempted_at: timestamp,
                scope: "remote",
                ok: true,
                action: "delete_branch",
                message: deleted.output || null,
              });
            } else {
              record.remote.state = "failed";
              record.remote.last_error = deleted.output || "failed to delete remote branch";
              record.remote.error_code = "remote_delete_failed";
              record = appendAttempt(record, {
                attempted_at: timestamp,
                scope: "remote",
                ok: false,
                action: "delete_branch",
                error_code: "remote_delete_failed",
                message: record.remote.last_error,
              });
            }
          }
        } else {
          record.remote.state = "not_configured";
          record.remote.last_error = null;
          record.remote.error_code = null;
        }
      } else {
        record.remote.state = "not_configured";
        record.remote.last_error = null;
        record.remote.error_code = null;
      }

      record.overall_state = deriveBranchCleanupOverallState(record.local.state, record.remote.state);
      companion.artifacts.branch_cleanup = record;
      return companion;
    });

    results.push({
      task_id: row.task_id,
      ok: Boolean(update.ok),
      skipped: false,
      branch_cleanup: update.ok ? normalizeBranchCleanupRecord(update.companion?.artifacts?.branch_cleanup) : null,
      error: update.ok ? null : update.error || null,
    });
  }

  return {
    ok: results.every((item) => item.ok && item.branch_cleanup?.overall_state !== "failed"),
    generated_at: generatedAt,
    due_only: dueOnly,
    dry_run: dryRun,
    summary: {
      attempted: results.length,
      deleted: results.filter((item) => item.branch_cleanup?.overall_state === "deleted").length,
      failed: results.filter((item) => item.branch_cleanup?.overall_state === "failed" || !item.ok).length,
      canceled: results.filter((item) => item.canceled).length,
    },
    tasks: results,
  };
}

module.exports = {
  assessTaskBranchCleanup,
  backfillBranchCleanup,
  branchExists,
  buildBranchCleanupReport,
  buildCleanupCandidateRecord,
  buildTaskContext,
  cancelTaskBranchCleanup,
  collectReleaseTaskIds,
  currentBranch,
  isLegacyMainBranch,
  isMergedIntoBranch,
  listBranchCleanupRows,
  loadGithubSurface,
  resolveRemoteTarget,
  runBranchCleanup,
  scheduleBranchCleanupForRelease,
  scheduleTaskBranchCleanup,
};
