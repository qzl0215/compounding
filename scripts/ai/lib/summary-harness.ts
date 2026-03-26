const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  appendCommandGainEvent,
  byteLength,
  estimateTokens,
  extractTaskIdFromArgv,
  resolveAgentSurface,
} = require("./command-gain.ts");
const { getSummaryProfile } = require("./summary-profiles.ts");

const INTERNAL_FLAGS = ["--json", "--quiet", "--fail-fast", "--verbose", "--agentSurface", "--agent-surface"];
const ERROR_PATTERN = /(error|fail|failed|warning|warn|invalid|missing|blocker|conflict|exception|traceback|denied|fatal|ERR_|ELIFECYCLE|scope)/i;

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function collectPassthroughArgs(argv = []) {
  return argv.filter((arg) => !INTERNAL_FLAGS.some((flag) => arg === flag || arg.startsWith(`${flag}=`)));
}

function resolveVerboseLevel(flags = {}) {
  const raw = flags.verbose ?? flags.v;
  if (raw === true) return 1;
  return Math.max(0, Math.round(toNumber(raw, 0)));
}

function stripAnsi(value) {
  return String(value || "").replace(/\u001b\[[0-9;]*m/g, "");
}

function normalizeLines(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""));
  const normalized = [];
  let blankRun = 0;
  for (const line of lines) {
    if (!line.trim()) {
      blankRun += 1;
      if (blankRun > 1) continue;
      normalized.push("");
      continue;
    }
    blankRun = 0;
    normalized.push(line);
  }
  while (normalized.length && !normalized[normalized.length - 1]) {
    normalized.pop();
  }
  return normalized;
}

function tryParseJsonFromText(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {}

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    try {
      return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
    } catch {}
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    } catch {}
  }

  return null;
}

function loadPackageScripts(root) {
  const packagePath = path.join(root, "package.json");
  if (!fs.existsSync(packagePath)) return {};
  try {
    const payload = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return payload?.scripts && typeof payload.scripts === "object" ? payload.scripts : {};
  } catch {
    return {};
  }
}

function abbreviateStep(step) {
  const value = normalizeString(step);
  if (!value) return "";
  if (value.startsWith("pnpm ")) return value.slice("pnpm ".length).trim();
  if (value.startsWith("node --experimental-strip-types ")) {
    const parts = value.split(/\s+/);
    const script = parts[2] || "";
    return script ? path.basename(script, path.extname(script)) : value;
  }
  return value.split(/\s+/).slice(0, 2).join(" ");
}

function extractScriptSteps(root, originalCmd) {
  const match = normalizeString(originalCmd).match(/^pnpm\s+([^\s]+)$/);
  if (!match) return { scriptName: "", steps: [] };
  const scriptName = match[1];
  const scripts = loadPackageScripts(root);
  const command = scripts[scriptName];
  if (!normalizeString(command)) {
    return { scriptName, steps: [] };
  }
  const steps = command
    .split(/\s*&&\s*/)
    .map((step) => abbreviateStep(step))
    .filter(Boolean);
  return { scriptName, steps };
}

function createContext(root, profile, commandSpec, capture, options = {}) {
  const stdout = stripAnsi(capture.stdout || "");
  const stderr = stripAnsi(capture.stderr || "");
  const combined = [stdout, stderr].filter(Boolean).join(stdout && stderr ? "\n" : "");
  return {
    root,
    profile,
    options,
    commandSpec,
    capture: {
      stdout,
      stderr,
      combined,
      exit_code: capture.exitCode,
      exec_time_ms: capture.execTimeMs,
      raw_bytes: byteLength(combined),
    },
    normalized: {
      lines: normalizeLines(combined),
    },
    parsed: {
      json: tryParseJsonFromText(stdout) || tryParseJsonFromText(combined),
    },
    reduced: {
      summary: "",
      stats: {},
      highlights: [],
      raw_focus_lines: [],
    },
  };
}

function pushUnique(list, values, limit = 8) {
  for (const item of values) {
    const value = normalizeString(item);
    if (!value || list.includes(value)) continue;
    list.push(value);
    if (list.length >= limit) break;
  }
}

function collectFailureLines(lines, limit = 12) {
  const matched = lines.filter((line) => ERROR_PATTERN.test(line));
  if (matched.length) return matched.slice(0, limit);
  return lines.filter(Boolean).slice(-limit);
}

function dedupeLines(lines = [], limit = 8) {
  const counts = new Map();
  for (const line of lines) {
    const key = normalizeString(line);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([line, count]) => (count > 1 ? `${line} (x${count})` : line))
    .slice(0, limit);
}

function groupLinesByPattern(lines = [], limit = 8) {
  const groups = new Map();
  for (const line of lines) {
    const value = normalizeString(line);
    if (!value) continue;
    const fileMatch = value.match(/^([A-Za-z0-9_./-]+\.(ts|tsx|js|jsx|py|json|ya?ml|md|sh|css|html))(?::\d+)?/);
    const prefixMatch = value.match(/^([A-Za-z0-9_.-]+):/);
    const key = fileMatch?.[1] || prefixMatch?.[1] || "general";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }

  return Array.from(groups.entries())
    .map(([key, values]) => {
      const uniqueValues = dedupeLines(values, 2);
      if (key === "general") return uniqueValues[0];
      const suffix = uniqueValues.join(" | ");
      return `${key} (${values.length}): ${suffix}`;
    })
    .filter(Boolean)
    .slice(0, limit);
}

function applyStructureOnly(context) {
  const payload = context.parsed.json;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return;

  if (Array.isArray(payload.reviewers)) {
    const failedReviewers = payload.reviewers.filter((reviewer) => reviewer.pass === false);
    context.reduced.summary = payload.ok ? "review 通过" : "review 未通过";
    context.reduced.stats.reviewers = payload.reviewers.length;
    context.reduced.stats.failed_reviewers = failedReviewers.length;
    context.reduced.stats.merge_decision = normalizeString(payload.merge_decision) || "n/a";
    pushUnique(
      context.reduced.highlights,
      failedReviewers.map((reviewer) => {
        const detail = normalizeString(reviewer.summary || reviewer.scope_summary || reviewer.test_status || reviewer.name);
        return `${normalizeString(reviewer.name)}: ${detail}`;
      })
    );
    pushUnique(context.reduced.highlights, [normalizeString(payload.merge_decision_explanation)]);
    return;
  }

  if (payload.status && payload.check) {
    const runtimeLabel = payload.status?.profile === "dev" ? "preview" : "production";
    context.reduced.summary = payload.ok ? `${runtimeLabel} runtime 健康检查通过` : `${runtimeLabel} runtime 健康检查失败`;
    context.reduced.stats.runtime_status = normalizeString(payload.status?.status) || "unknown";
    context.reduced.stats.port = toNumber(payload.status?.port, 0);
    context.reduced.stats.drift = Boolean(payload.status?.drift);
    pushUnique(context.reduced.highlights, [normalizeString(payload.status?.reason), normalizeString(payload.message), normalizeString(payload.check?.reason)]);
    return;
  }

  if (payload.preflight_check || Array.isArray(payload.blockers) || normalizeString(payload.guard_level)) {
    context.reduced.summary = payload.ok ? "preflight 已通过" : "preflight 检测到 blocker";
    context.reduced.stats.guard_level = normalizeString(payload.guard_level) || "unknown";
    context.reduced.stats.change_class = normalizeString(payload.change_class) || "unknown";
    context.reduced.stats.blockers = Array.isArray(payload.blockers) ? payload.blockers.length : 0;
    context.reduced.stats.retro_hints = Array.isArray(payload.retro_hints) ? payload.retro_hints.length : 0;
    const blockers = Array.isArray(payload.blockers)
      ? payload.blockers.map((blocker) => `${normalizeString(blocker.step)}: ${normalizeString(blocker.issue)}`)
      : [];
    const notes = Array.isArray(payload.preflight_check?.notes)
      ? payload.preflight_check.notes.map((note) => `${normalizeString(note.step)}: ${normalizeString(note.issue)}`)
      : [];
    pushUnique(context.reduced.highlights, blockers);
    if (!blockers.length) {
      pushUnique(context.reduced.highlights, notes);
    }
    pushUnique(context.reduced.highlights, Array.isArray(payload.retro_hints) ? payload.retro_hints : []);
    pushUnique(context.reduced.highlights, [normalizeString(payload.reason)]);
    return;
  }

  context.reduced.summary = payload.ok === false ? "命令执行失败" : "命令执行完成";
  pushUnique(context.reduced.highlights, [normalizeString(payload.message), normalizeString(payload.reason)]);
}

function applyStatsExtraction(context) {
  const payload = context.parsed.json;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    if (!context.reduced.summary) {
      context.reduced.summary = payload.ok === false ? "命令执行失败" : "命令执行完成";
    }
    if (Array.isArray(payload.statuses)) {
      context.reduced.stats.statuses = payload.statuses.length;
    }
  }

  const scriptInfo = extractScriptSteps(context.root, context.commandSpec.original_cmd);
  if (scriptInfo.scriptName) {
    context.reduced.stats.script = scriptInfo.scriptName;
    context.reduced.stats.steps = scriptInfo.steps.length;
    if (scriptInfo.steps.length) {
      context.reduced.stats.step_names = scriptInfo.steps;
    }
    if (!context.reduced.summary || context.reduced.summary === "命令执行完成" || context.reduced.summary === "命令执行失败") {
      context.reduced.summary = context.capture.exit_code === 0 ? `${scriptInfo.scriptName} 通过` : `${scriptInfo.scriptName} 失败`;
    }
  }

  context.reduced.stats.raw_lines = context.normalized.lines.length;
}

function structuredErrorHighlights(payload) {
  if (!payload || typeof payload !== "object") return [];
  const results = [];
  if (Array.isArray(payload.blockers)) {
    for (const blocker of payload.blockers) {
      results.push(`${normalizeString(blocker.step)}: ${normalizeString(blocker.issue)}`);
    }
  }
  if (Array.isArray(payload.reviewers)) {
    for (const reviewer of payload.reviewers.filter((item) => item.pass === false)) {
      results.push(`${normalizeString(reviewer.name)}: ${normalizeString(reviewer.summary || reviewer.scope_summary || reviewer.test_status)}`);
    }
  }
  pushUnique(results, [normalizeString(payload.error), normalizeString(payload.message), normalizeString(payload.reason)], 12);
  return results;
}

function applyFailureFocus(context) {
  const payload = context.parsed.json;
  if (payload && typeof payload === "object" && payload.ok !== false && context.capture.exit_code === 0) return;
  context.reduced.raw_focus_lines = collectFailureLines(context.normalized.lines);
}

function applyErrorOnly(context) {
  const payload = context.parsed.json;
  if (payload && typeof payload === "object") {
    pushUnique(context.reduced.highlights, structuredErrorHighlights(payload), 12);
    return;
  }
  const source = context.reduced.raw_focus_lines.length ? context.reduced.raw_focus_lines : context.normalized.lines;
  const lines = source.filter((line) => ERROR_PATTERN.test(line));
  if (!lines.length && context.capture.exit_code !== 0) {
    context.reduced.highlights = source.slice(-6);
    return;
  }
  context.reduced.highlights = lines.slice(0, 12);
}

function applyGroupingByPattern(context) {
  const source = context.reduced.highlights.length ? context.reduced.highlights : context.reduced.raw_focus_lines;
  if (!source.length) return;
  context.reduced.highlights = groupLinesByPattern(source);
}

function applyDeduplication(context) {
  if (context.reduced.highlights.length) {
    context.reduced.highlights = dedupeLines(context.reduced.highlights);
    return;
  }
  if (context.reduced.raw_focus_lines.length) {
    context.reduced.highlights = dedupeLines(context.reduced.raw_focus_lines);
  }
}

const STRATEGIES = {
  structure_only: applyStructureOnly,
  stats_extraction: applyStatsExtraction,
  error_only: applyErrorOnly,
  grouping_by_pattern: applyGroupingByPattern,
  deduplication: applyDeduplication,
  failure_focus: applyFailureFocus,
};

function formatStats(stats = {}) {
  return Object.entries(stats)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const rendered = Array.isArray(value) ? value.slice(0, 6).join(", ") : String(value);
      return `${key}=${rendered}`;
    })
    .slice(0, 8);
}

function renderCompactText(context, meta = {}) {
  const header = `[${context.profile.profile_id}] ${context.capture.exit_code === 0 ? "ok" : "failed"} exit=${context.capture.exit_code} ${context.capture.exec_time_ms}ms`;
  const lines = [header];
  if (context.reduced.summary) {
    lines.push(`summary: ${context.reduced.summary}`);
  }
  const stats = formatStats(context.reduced.stats);
  if (stats.length) {
    lines.push(`stats: ${stats.join(" | ")}`);
  }
  if (context.reduced.highlights.length) {
    lines.push("highlights:");
    for (const highlight of context.reduced.highlights.slice(0, 8)) {
      lines.push(`- ${highlight}`);
    }
  }
  if (meta.filterError) {
    lines.push(`fallback: ${meta.filterError}`);
  }
  if (meta.teePath) {
    lines.push(`raw tee: ${meta.teePath}`);
  }
  return lines.join("\n");
}

function deriveSummaryFromCommand(context) {
  if (normalizeString(context.reduced.summary)) return;
  const scriptInfo = extractScriptSteps(context.root, context.commandSpec.original_cmd);
  const commandLabel = scriptInfo.scriptName || normalizeString(context.commandSpec.original_cmd).split(/\s+/).slice(0, 2).join(" ");
  if (!commandLabel) return;
  context.reduced.summary = context.capture.exit_code === 0 ? `${commandLabel} 通过` : `${commandLabel} 失败`;
}

function renderRawFallback(context, meta = {}) {
  const lines = [context.capture.combined || "(no output)"];
  const footer = [];
  if (meta.filterError) {
    footer.push(`fallback: ${meta.filterError}`);
  }
  if (meta.teePath) {
    footer.push(`raw tee: ${meta.teePath}`);
  }
  return footer.length ? `${lines.join("\n")}\n\n${footer.join("\n")}` : lines.join("\n");
}

function captureCommand(commandSpec, passthroughArgs = [], env = {}) {
  const startedAt = Date.now();
  try {
    const result = spawnSync(commandSpec.cmd, [...(commandSpec.args || []), ...passthroughArgs], {
      cwd: commandSpec.cwd || process.cwd(),
      env: { ...process.env, ...env },
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: typeof result.status === "number" ? result.status : 1,
      execTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: 1,
      execTimeMs: Date.now() - startedAt,
    };
  }
}

function getTeeDir(root = process.cwd()) {
  return path.join(root, "output", "ai", "command-tee");
}

function cleanupTeeFiles(root, policy) {
  const teeDir = getTeeDir(root);
  if (!fs.existsSync(teeDir)) return;
  const entries = fs
    .readdirSync(teeDir)
    .map((name) => {
      const absolutePath = path.join(teeDir, name);
      const stat = fs.statSync(absolutePath);
      return {
        absolutePath,
        mtimeMs: stat.mtimeMs,
        size: stat.size,
      };
    })
    .sort((a, b) => a.mtimeMs - b.mtimeMs);

  const now = Date.now();
  const ttlMs = Math.max(0, toNumber(policy.ttl_hours, 24)) * 60 * 60 * 1000;
  let active = entries.filter((entry) => {
    if (ttlMs <= 0) return true;
    const expired = now - entry.mtimeMs > ttlMs;
    if (expired) {
      fs.rmSync(entry.absolutePath, { force: true });
      return false;
    }
    return true;
  });

  while (active.length > Math.max(1, toNumber(policy.max_files, 100))) {
    const oldest = active.shift();
    if (!oldest) break;
    fs.rmSync(oldest.absolutePath, { force: true });
  }

  let totalBytes = active.reduce((sum, entry) => sum + entry.size, 0);
  const maxTotalBytes = Math.max(0, toNumber(policy.max_total_bytes, 100 * 1024 * 1024));
  while (active.length && totalBytes > maxTotalBytes) {
    const oldest = active.shift();
    if (!oldest) break;
    totalBytes -= oldest.size;
    fs.rmSync(oldest.absolutePath, { force: true });
  }
}

function shouldWriteTee(context, verboseLevel, wasFallback, filterError) {
  return context.capture.exit_code !== 0 || verboseLevel > 0 || wasFallback || Boolean(filterError);
}

function writeRawTee(root, context) {
  const teeDir = getTeeDir(root);
  fs.mkdirSync(teeDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${timestamp}-${context.profile.profile_id}.json`;
  const teePath = path.join(teeDir, fileName);
  fs.writeFileSync(
    teePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        profile_id: context.profile.profile_id,
        profile_version: context.profile.profile_version,
        original_cmd: context.commandSpec.original_cmd,
        exit_code: context.capture.exit_code,
        exec_time_ms: context.capture.exec_time_ms,
        stdout: context.capture.stdout,
        stderr: context.capture.stderr,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  cleanupTeeFiles(root, context.profile.tee_policy || {});
  return teePath;
}

function runSummaryHarness(options = {}) {
  const root = options.root || process.cwd();
  const profile = typeof options.profileId === "string" ? getSummaryProfile(options.profileId) : options.profile;
  if (!profile) {
    throw new Error(`Unknown summary profile: ${options.profileId || "unknown"}`);
  }

  const verboseLevel = resolveVerboseLevel(options.cliFlags || {});
  const passthroughArgs = options.passthroughArgs || [];
  const taskId = normalizeString(options.taskId) || extractTaskIdFromArgv(passthroughArgs) || null;
  const agentSurface = resolveAgentSurface(options.agentSurface);
  const childEnv = {
    ...options.command.env,
    COMPOUNDING_AGENT_SURFACE: agentSurface,
  };

  if (options.command.enableShortcutOpportunity && normalizeString(profile.shortcut_id)) {
    childEnv.COMPOUNDING_SUMMARY_SHORTCUT_ID = normalizeString(profile.shortcut_id);
    childEnv.COMPOUNDING_SUMMARY_ADOPTED = "1";
    childEnv.COMPOUNDING_SUMMARY_ORIGINAL_CMD = normalizeString(options.command.original_cmd);
  }

  const capture = captureCommand(options.command, passthroughArgs, childEnv);
  const context = createContext(root, profile, options.command, capture, options);
  let wasFallback = false;
  let filterError = null;
  let teePath = null;
  let displayText = "";

  try {
    for (const strategyId of profile.pipeline || []) {
      const strategy = STRATEGIES[strategyId];
      if (typeof strategy === "function") {
        strategy(context);
      }
    }
    deriveSummaryFromCommand(context);
  } catch (error) {
    wasFallback = true;
    filterError = error instanceof Error ? error.message : String(error);
  }

  if (shouldWriteTee(context, verboseLevel, wasFallback, filterError)) {
    teePath = writeRawTee(root, context);
  }

  if (wasFallback) {
    displayText = renderRawFallback(context, { filterError, teePath });
  } else {
    displayText = renderCompactText(context, { teePath });
  }

  const compactBytes = byteLength(displayText);
  const inputTokens = estimateTokens(context.capture.combined);
  const outputTokens = estimateTokens(displayText);
  const savedTokens = wasFallback ? 0 : Math.max(0, inputTokens - outputTokens);
  const savingsPct = inputTokens > 0 ? Number(((savedTokens / inputTokens) * 100).toFixed(2)) : 0;

  appendCommandGainEvent(root, {
    event_kind: "summary_run",
    profile_id: profile.profile_id,
    profile_version: profile.profile_version,
    task_id: taskId,
    shortcut_id: normalizeString(profile.shortcut_id) || null,
    agent_surface: agentSurface,
    original_cmd: normalizeString(options.command.original_cmd),
    input_tokens_est: inputTokens,
    output_tokens_est: outputTokens,
    saved_tokens_est: savedTokens,
    savings_pct_est: savingsPct,
    exec_time_ms: context.capture.exec_time_ms,
    exit_code: context.capture.exit_code,
    was_fallback: wasFallback,
    filter_error: filterError,
    raw_bytes: context.capture.raw_bytes,
    compact_bytes: compactBytes,
    tee_path: teePath,
  });

  return {
    exitCode: context.capture.exit_code,
    payload: {
      ok: context.capture.exit_code === 0,
      profile_id: profile.profile_id,
      profile_version: profile.profile_version,
      parser_slots: profile.parser_slots || [],
      pipeline: profile.pipeline || [],
      shortcut_id: normalizeString(profile.shortcut_id) || null,
      task_id: taskId,
      agent_surface: agentSurface,
      original_cmd: normalizeString(options.command.original_cmd),
      exec_time_ms: context.capture.exec_time_ms,
      exit_code: context.capture.exit_code,
      was_fallback: wasFallback,
      filter_error: filterError,
      tee_path: teePath,
      input_tokens_est: inputTokens,
      output_tokens_est: outputTokens,
      saved_tokens_est: savedTokens,
      savings_pct_est: savingsPct,
      summary: context.reduced.summary,
      stats: context.reduced.stats,
      highlights: context.reduced.highlights,
      display_text: displayText,
    },
  };
}

module.exports = {
  collectPassthroughArgs,
  runSummaryHarness,
};
