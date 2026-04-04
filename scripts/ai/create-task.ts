const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { listTaskRecords } = require("./lib/task-resolver.ts");
const { ensureCompanion } = require("../coord/lib/task-meta.ts");
const { syncTaskMaterialization } = require("../harness/lib.ts");
const { emitResult, exitWithError, parseCliArgs, renderTaskTemplate } = require("./lib/cli-kernel.js");
const {
  appendLinkedTaskToGovernanceGap,
  findGovernanceGapRecord,
  GOVERNANCE_GAPS_PATH,
} = require(path.join(process.cwd(), "shared", "governance-gap-contract.ts"));

const ALLOWED_WRITEBACK_TARGETS = Object.freeze(["Current", "Controlled Facts", "Code Index", "Tests"]);
const WRITEBACK_TARGET_ALIASES = Object.freeze({
  current: "Current",
  当前真相: "Current",
  currentstate: "Current",
  controlledfacts: "Controlled Facts",
  controlledfact: "Controlled Facts",
  受控事实: "Controlled Facts",
  受控事实入口: "Controlled Facts",
  codeindex: "Code Index",
  代码索引: "Code Index",
  索引: "Code Index",
  test: "Tests",
  tests: "Tests",
  测试: "Tests",
});

const cli = parseCliArgs(process.argv.slice(2));
const [taskId, summary, whyNow] = cli.positionals.slice(0, 3);
const argv = cli.flags;
if (!taskId || !summary || !whyNow) {
  exitWithError(
    "Missing required arguments for create-task.",
    cli,
    [
      "Usage: node --experimental-strip-types scripts/ai/create-task.ts <task-id> <summary> <why-now>",
      "Optional flags: --parentPlan=... --boundary=... --doneWhen=... --inScope=... --outOfScope=... --constraints=...",
      "                --deliveryTrack=... --risk=... --testReason=... --testScope=... --testSkip=... --testRoi=... --status=...",
      "                --acceptanceResult=... --deliveryResult=... --retro=... --branch=...",
      "                --linkedGap=... --fromAssertion=... --writebackTargets=Current,Tests ...",
      "                --relatedModules='- `path/file`\\n- `dir/`' --updateTraceMemory=... --updateTraceIndex=...",
      "                --updateTraceRoadmap=... --updateTraceDocs=...",
    ].join("\n")
  );
}

const root = process.cwd();
const outputPath = path.join(root, "tasks", "queue", `${taskId}.md`);
const shortIdMatch = taskId.match(/^task-(\d+)/);
const shortId = shortIdMatch ? `t-${shortIdMatch[1]}` : `t-${taskId}`;
const resolvedSummary = (argv.summary || summary || "").trim();
const governanceBinding = resolveGovernanceBinding(argv, root, cli);

assertChineseSummary(resolvedSummary, cli);

const existingTaskRecords = listTaskRecords(root);
if (existingTaskRecords.some((record) => record.id === taskId || record.path === path.posix.join("tasks/queue", `${taskId}.md`))) {
  exitWithError(`Task already exists: ${taskId}`, cli);
}
if (existingTaskRecords.some((record) => record.shortId === shortId)) {
  exitWithError(`Short task id already exists: ${shortId}`, cli);
}

const body = renderTaskTemplate(
  {
    task_id: taskId,
    short_id: shortId,
    parent_plan: argv.parentPlan || argv.parent_plan,
    summary: resolvedSummary,
    why_now: argv.whyNow || argv.why_now || whyNow,
    boundary: argv.boundary,
    done_when: argv.doneWhen || argv.done_when,
    delivery_track: argv.deliveryTrack || argv.delivery_track || "undetermined",
    governance_binding_block: renderGovernanceBindingBlock(governanceBinding),
    in_scope: argv.inScope || argv.in_scope,
    out_of_scope: argv.outOfScope || argv.out_of_scope,
    constraints: argv.constraints,
    risk: argv.risk,
    test_reason: argv.testReason || argv.test_reason,
    test_scope: argv.testScope || argv.test_scope,
    test_skip: argv.testSkip || argv.test_skip,
    test_roi: argv.testRoi || argv.test_roi,
    status: argv.status,
    acceptance_result: argv.acceptanceResult || argv.acceptance_result,
    delivery_result: argv.deliveryResult || argv.delivery_result,
    retro: argv.retro,
    branch: argv.branch || detectCurrentBranch(root) || `codex/${taskId}`,
    related_modules: argv.relatedModules || argv.related_modules || "",
    update_trace_memory: argv.updateTraceMemory || argv.update_trace_memory || "no change: 未更新",
    update_trace_index: argv.updateTraceIndex || argv.update_trace_index || "no change: 未更新",
    update_trace_roadmap: argv.updateTraceRoadmap || argv.update_trace_roadmap || "no change: 未更新",
    update_trace_docs: argv.updateTraceDocs || argv.update_trace_docs || "no change: 未更新",
  },
  root
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body);
if (governanceBinding) {
  appendLinkedTaskToGovernanceGap(governanceBinding.linkedGap, taskId, root);
}
ensureCompanion(taskId);
syncTaskMaterialization(taskId, {
  source: "ai:create-task",
  branch_name: argv.branch || detectCurrentBranch(root) || `codex/${taskId}`,
});
emitResult(
  {
    ok: true,
    task_id: taskId,
    short_id: shortId,
    path: outputPath,
  },
  cli,
  (result) => result.path
);

function assertChineseSummary(value, cli) {
  if (!value) {
    exitWithError("Task summary is required.", cli);
  }
  if (/[A-Za-z]/.test(value)) {
    exitWithError(
      [
        "任务标题必须使用中文直给概述，不能包含英文字符。",
        `当前输入：${value}`,
        "示例：把“unify preflight entry”改成“统一改动前门禁入口”。",
      ].join("\n"),
      cli
    );
  }
}

function resolveGovernanceBinding(argv, root, cli) {
  const linkedGap = normalizeSingleValue(argv.linkedGap || argv.linked_gap);
  const fromAssertion = normalizeSingleValue(argv.fromAssertion || argv.from_assertion);
  const writebackTargets = normalizeWritebackTargets(argv.writebackTargets || argv.writeback_targets, cli);
  const hasGovernanceInput = Boolean(linkedGap || fromAssertion || writebackTargets.length);

  if (!hasGovernanceInput) {
    return null;
  }

  if (!linkedGap || !fromAssertion || writebackTargets.length === 0) {
    exitWithError(
      "治理类 task 必须同时声明 linked_gap、from_assertion 和 writeback_targets。",
      cli,
      [
        `linked_gap: ${linkedGap || "(missing)"}`,
        `from_assertion: ${fromAssertion || "(missing)"}`,
        `writeback_targets: ${writebackTargets.length ? writebackTargets.join(", ") : "(missing)"}`,
      ]
    );
  }

  const record = findGovernanceGapRecord(linkedGap, root);
  if (!record) {
    exitWithError(`linked_gap 不存在：${linkedGap}`, cli, [`治理 gap 主源：${GOVERNANCE_GAPS_PATH}`]);
  }
  if (String(record.status || "").trim().toLowerCase() === "closed") {
    exitWithError(`linked_gap 已关闭，不能新开 task：${linkedGap}`, cli, [`治理 gap 主源：${GOVERNANCE_GAPS_PATH}`]);
  }
  if (record.fromAssertion && record.fromAssertion !== fromAssertion) {
    exitWithError(
      `from_assertion 与治理 gap 主源不一致：${fromAssertion}`,
      cli,
      [`${linkedGap} expects ${record.fromAssertion}`]
    );
  }

  return {
    linkedGap,
    fromAssertion,
    writebackTargets,
  };
}

function normalizeSingleValue(value) {
  return String(value || "").replace(/`/g, "").trim();
}

function normalizeWritebackTargets(raw, cli) {
  const values = String(raw || "")
    .split(/\r?\n|,|、/)
    .map((entry) => entry.replace(/^-\s*/, "").replace(/`/g, "").trim())
    .filter(Boolean);

  const normalized = [];
  for (const value of values) {
    const canonical = normalizeWritebackTarget(value);
    if (!canonical) {
      exitWithError(
        `writeback_targets 包含不允许的目标：${value}`,
        cli,
        [`允许值：${ALLOWED_WRITEBACK_TARGETS.join(", ")}`]
      );
    }
    if (!normalized.includes(canonical)) {
      normalized.push(canonical);
    }
  }
  return normalized;
}

function normalizeWritebackTarget(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }
  const collapsed = trimmed.replace(/[\s_-]+/g, "").toLowerCase();
  return WRITEBACK_TARGET_ALIASES[collapsed] || "";
}

function renderGovernanceBindingBlock(binding) {
  if (!binding) {
    return "";
  }
  return [
    "## 治理绑定",
    "",
    `- 主治理差距：\`${binding.linkedGap}\``,
    `- 来源断言：\`${binding.fromAssertion}\``,
    "- 回写目标：",
    ...binding.writebackTargets.map((target) => `  - \`${target}\``),
  ].join("\n");
}

function detectCurrentBranch(root) {
  try {
    return childProcess.execFileSync("git", ["branch", "--show-current"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}
