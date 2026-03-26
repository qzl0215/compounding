const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { parseModuleFeatureContract, collectLikelyTests } = require(path.join(process.cwd(), "shared", "module-feature-contract.ts"));
const { buildSummaryFirstWorkflow } = require(path.join(process.cwd(), "shared", "ai-efficiency.ts"));
const { buildContextRetroReport } = require("./context-retro.ts");
const { buildProjectJudgementContract } = require(path.join(process.cwd(), "shared", "project-judgement.ts"));
const { parseTaskContract, parseTaskMachineFacts } = require(path.join(process.cwd(), "shared", "task-contract.ts"));
const { readCompanion } = require(path.join(process.cwd(), "scripts", "coord", "lib", "task-meta.ts"));

const SURFACE_TO_MODULES = {
  home: ["apps/studio/src/modules/portal"],
  tasks: ["apps/studio/src/modules/tasks", "apps/studio/src/modules/delivery"],
  releases: ["apps/studio/src/modules/releases", "apps/studio/src/modules/delivery"],
  docs: ["apps/studio/src/modules/docs"],
  bootstrap: ["scripts/compounding_bootstrap"],
};

const ROUTE_TO_MODULES = {
  "/": SURFACE_TO_MODULES.home,
  "/tasks": SURFACE_TO_MODULES.tasks,
  "/releases": SURFACE_TO_MODULES.releases,
  "/knowledge-base": SURFACE_TO_MODULES.docs,
};

function readIfExists(root, relPath) {
  const absolute = path.join(root, relPath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function normalizeModuleToken(token) {
  return String(token || "").replace(/`/g, "").replace(/\/\*$/, "").trim();
}

function normalizeSurface(surface) {
  const normalized = String(surface || "").trim().toLowerCase();
  if (normalized === "home" || normalized === "/") return "home";
  if (normalized === "tasks" || normalized === "/tasks") return "tasks";
  if (normalized === "releases" || normalized === "/releases") return "releases";
  if (normalized === "docs" || normalized === "knowledge-base" || normalized === "/knowledge-base") return "docs";
  if (normalized === "bootstrap") return "bootstrap";
  return normalized;
}

function findModuleDoc(startPath, root) {
  const normalized = normalizeModuleToken(startPath);
  if (!normalized) return "";
  const direct = normalized.endsWith("module.md") ? normalized : path.posix.join(normalized.replace(/\/+$/, ""), "module.md");
  if (fs.existsSync(path.join(root, direct))) {
    return direct;
  }

  let cursor = normalized.replace(/\/+$/, "");
  while (cursor && cursor !== "." && cursor !== "/") {
    const candidate = path.posix.join(cursor, "module.md");
    if (fs.existsSync(path.join(root, candidate))) {
      return candidate;
    }
    const parent = path.posix.dirname(cursor);
    if (!parent || parent === cursor || parent === ".") {
      break;
    }
    cursor = parent;
  }

  return "";
}

function listModuleDocPaths(root) {
  const candidates = [
    "apps/studio/src/modules/portal/module.md",
    "apps/studio/src/modules/tasks/module.md",
    "apps/studio/src/modules/releases/module.md",
    "apps/studio/src/modules/delivery/module.md",
    "apps/studio/src/modules/docs/module.md",
    "scripts/compounding_bootstrap/module.md",
  ];
  return candidates.filter((relPath) => fs.existsSync(path.join(root, relPath)));
}

function loadModuleContracts(root, moduleDocPaths) {
  return moduleDocPaths.map((moduleDocPath) => {
    const content = readIfExists(root, moduleDocPath);
    return parseModuleFeatureContract(moduleDocPath, content);
  });
}

function resolveModuleDocPaths(root, options) {
  const surface = normalizeSurface(options.surface || options.route);
  const explicitModules = unique(
    []
      .concat(options.module || [])
      .concat(SURFACE_TO_MODULES[surface] || [])
      .concat(ROUTE_TO_MODULES[options.route || ""] || [])
  );

  const docs = explicitModules.map((item) => resolveModuleDocPath(root, item)).filter(Boolean);
  return unique(docs);
}

function resolveModuleDocPath(root, token) {
  const normalized = normalizeModuleToken(token);
  if (!normalized) {
    return "";
  }
  const direct = findModuleDoc(normalized, root);
  if (direct) {
    return direct;
  }
  const all = listModuleDocPaths(root);
  return (
    all.find((relPath) => {
      const parsed = parseModuleFeatureContract(relPath, readIfExists(root, relPath));
      return parsed.moduleId === normalized || relPath.includes(`/${normalized}/`);
    }) || ""
  );
}

function buildTaskOverlay(root, taskPath) {
  if (!taskPath) {
    return { overlay: null, moduleDocPaths: [] };
  }
  const relTask = taskPath.replace(/^\/+/, "");
  const taskContent = readIfExists(root, relTask);
  if (!taskContent) {
    throw new Error(`Task not found: ${relTask}`);
  }

  const taskContract = parseTaskContract(relTask, taskContent);
  const taskMachineFacts = parseTaskMachineFacts(taskContent);
  const companion = readCompanion(taskContract.id);
  const moduleDocPaths = unique(
    [
      ...taskMachineFacts.relatedModules,
      ...(companion?.planned_files || []).map(normalizeModuleToken),
      ...(companion?.planned_modules || []).map(normalizeModuleToken),
    ]
      .map((item) => findModuleDoc(item, root))
      .filter(Boolean)
  );

  return {
    overlay: {
      taskId: taskContract.id,
      shortId: taskContract.shortId,
      taskPath: relTask,
      summary: taskContract.summary,
      boundary: taskContract.boundary,
      doneWhen: taskContract.doneWhen,
    },
    moduleDocPaths,
  };
}

function buildMustRead(moduleContracts, options, taskOverlay) {
  const moduleIds = moduleContracts.map((contract) => contract.moduleId);
  const mustRead = ["AGENTS.md", "memory/project/current-state.md"];

  if (
    normalizeSurface(options.surface) === "home" ||
    options.route === "/" ||
    moduleIds.includes("portal")
  ) {
    mustRead.push("memory/project/roadmap.md", "memory/project/operating-blueprint.md");
  }

  if (moduleIds.includes("releases") || normalizeSurface(options.surface) === "releases" || options.route === "/releases") {
    mustRead.push("docs/DEV_WORKFLOW.md");
  }

  if (moduleIds.includes("docs") || moduleIds.includes("compounding_bootstrap")) {
    mustRead.push("docs/ARCHITECTURE.md");
  }

  if (taskOverlay) {
    mustRead.push(taskOverlay.taskPath);
  }

  mustRead.push(...moduleContracts.map((contract) => contract.path));
  return unique(mustRead);
}

function buildReadPlan(candidates, projectJudgement, taskOverlay) {
  const prioritized = unique([
    taskOverlay?.taskPath,
    normalizeString(projectJudgement?.recommendedRead?.path),
    ...candidates,
  ]);
  return {
    must_read: prioritized.slice(0, 5),
    read_on_demand: prioritized.slice(5, 10),
  };
}

function buildChecks(moduleContracts, diffAware) {
  const required = [];
  const recommended = [];

  for (const contract of moduleContracts) {
    for (const command of contract.recommendedChecks) {
      required.push({
        label: `${contract.moduleId} 最小校验`,
        commands: [command],
        reason: `来自 ${contract.moduleId} 模块合同的最小检查集合。`,
        source: "module-contract",
      });
    }
  }

  for (const layer of diffAware.selectedChecks.required) {
    required.push({
      label: layer.title,
      commands: layer.commands,
      reason: layer.reason,
      source: "diff-aware",
    });
  }

  for (const layer of diffAware.selectedChecks.recommended) {
    recommended.push({
      label: layer.title,
      commands: layer.commands,
      reason: layer.reason,
      source: "diff-aware",
    });
  }

  return {
    required: dedupeChecks(required),
    recommended: dedupeChecks(recommended).filter(
      (candidate) => !required.some((item) => item.label === candidate.label && item.commands.join("||") === candidate.commands.join("||"))
    ),
  };
}

function dedupeChecks(checks) {
  const seen = new Set();
  return checks.filter((check) => {
    const key = `${check.label}::${check.commands.join("||")}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function flattenCommands(checks) {
  return unique(checks.flatMap((check) => check.commands || []).map((command) => String(command || "").trim()).filter(Boolean));
}

function buildLikelyFiles(moduleContracts, taskOverlay) {
  return unique([
    ...(taskOverlay ? [taskOverlay.taskPath] : []),
    ...moduleContracts.flatMap((contract) => contract.likelyFiles),
  ]);
}

function buildLikelyTests(moduleContracts, checks) {
  return unique([
    ...moduleContracts.flatMap((contract) => collectLikelyTests(contract)),
    ...checks.required.flatMap((check) => extractLikelyTestPaths(check.commands)),
    ...checks.recommended.flatMap((check) => extractLikelyTestPaths(check.commands)),
  ]);
}

function extractLikelyTestPaths(commands) {
  return commands
    .flatMap((command) => command.match(/(?:apps\/studio\/src\/modules\/[^\s`]+__tests__[^\s`]+|tests\/test_[^\s`]+|[^\s`]+\.test\.[^\s`]+)/g) || [])
    .map((value) => value.replace(/[,"']/g, ""));
}

function buildTargetSurface(options, moduleContracts) {
  if (options.surface) {
    return normalizeSurface(options.surface);
  }
  if (options.route) {
    return options.route;
  }
  if (moduleContracts.length === 1) {
    return moduleContracts[0].moduleId;
  }
  return "feature";
}

function buildCommonChanges(moduleContracts) {
  return unique(moduleContracts.flatMap((contract) => contract.commonChanges));
}

function buildInvariants(moduleContracts) {
  return unique(moduleContracts.flatMap((contract) => contract.invariants));
}

function buildProjectJudgement(root) {
  return buildProjectJudgementContract({
    currentStateContent: readIfExists(root, "memory/project/current-state.md"),
    roadmapContent: readIfExists(root, "memory/project/roadmap.md"),
    blueprintContent: readIfExists(root, "memory/project/operating-blueprint.md"),
  });
}

function buildEntryCommand(options, overlay, targetSurface) {
  if (overlay?.taskPath) {
    return `pnpm ai:feature-context -- --taskPath=${overlay.taskPath}`;
  }
  if (options.surface) {
    return `pnpm ai:feature-context -- --surface=${normalizeSurface(options.surface)}`;
  }
  if (options.route) {
    return `pnpm ai:feature-context -- --route=${options.route}`;
  }
  const modules = unique([].concat(options.module || []).map((item) => normalizeModuleToken(item)));
  if (modules.length === 1) {
    return `pnpm ai:feature-context -- --module=${modules[0]}`;
  }
  return `pnpm ai:feature-context -- --surface=${targetSurface}`;
}

function buildDefaultFlow(packet, options) {
  const taskId = normalizeString(packet.task_overlay?.shortId) || normalizeString(packet.task_overlay?.taskId);
  const readPath = normalizeString(packet.project_judgement?.recommendedRead?.path) || normalizeString(packet.must_read?.[0]);
  const querySeed =
    normalizeString(packet.related_modules?.[0]) ||
    normalizeString(packet.project_judgement?.recommendedSurface?.label) ||
    normalizeString(packet.target_surface) ||
    "keyword";
  const summaryWorkflow = buildSummaryFirstWorkflow({
    taskId,
    querySeed,
    readPath,
  });
  return {
    entry_command: buildEntryCommand(options, packet.task_overlay, packet.target_surface),
    summary_first_commands: summaryWorkflow.summary_first_commands,
    raw_fallback_commands: summaryWorkflow.raw_fallback_commands,
    required_commands: flattenCommands(packet.required_checks),
    recommended_commands: flattenCommands(packet.recommended_checks),
    next_action: packet.project_judgement.nextAction,
    recommended_surface: packet.project_judgement.recommendedSurface,
    recommended_read: packet.project_judgement.recommendedRead,
  };
}

function buildFeatureContextPacket(root, options = {}) {
  const explicitDocPaths = resolveModuleDocPaths(root, options);
  const { overlay, moduleDocPaths: taskModuleDocPaths } = buildTaskOverlay(root, options.taskPath);
  const moduleDocPaths = unique([...explicitDocPaths, ...taskModuleDocPaths]);
  const moduleContracts = loadModuleContracts(root, moduleDocPaths);
  const diffAware = collectSelectedChecks(root);
  const checks = buildChecks(moduleContracts, diffAware);
  const projectJudgement = buildProjectJudgement(root);
  const readPlan = buildReadPlan(buildMustRead(moduleContracts, options, overlay), projectJudgement, overlay);
  const wasteAlerts =
    overlay?.shortId || overlay?.taskId
      ? buildContextRetroReport(root, { taskId: normalizeString(overlay.shortId || overlay.taskId) }).current_task.alerts || []
      : [];
  const packet = {
    target_surface: buildTargetSurface(options, moduleContracts),
    related_modules: moduleContracts.map((contract) => contract.moduleId),
    must_read: readPlan.must_read,
    read_on_demand: readPlan.read_on_demand,
    likely_files: buildLikelyFiles(moduleContracts, overlay),
    likely_tests: buildLikelyTests(moduleContracts, checks),
    required_checks: checks.required,
    recommended_checks: checks.recommended,
    invariants: buildInvariants(moduleContracts),
    common_changes: buildCommonChanges(moduleContracts),
    waste_alerts: wasteAlerts.slice(0, 3),
    task_overlay: overlay,
    project_judgement: projectJudgement,
  };

  return {
    ...packet,
    default_flow: buildDefaultFlow(packet, options),
  };
}

function collectSelectedChecks(root) {
  const changedFiles = readChangedFiles(root);
  const selected = {
    required: [],
    recommended: [],
  };

  if (changedFiles.length === 0) {
    return { selectedChecks: selected };
  }

  selected.required.push({
    id: "static",
    title: "静态门禁",
    summary: "先拦结构和语义漂移。",
    commands: ["pnpm lint"],
    runWhen: "所有改动",
    failureMeaning: "当前改动存在静态问题。",
    nextStep: "先修静态问题，再继续。",
    reason: "所有 feature 改动都先过静态门禁，避免把结构漂移带进后续链路。",
  });

  if (changedFiles.some((file) => isBuildSensitive(file))) {
    selected.required.push({
      id: "build",
      title: "构建门禁",
      summary: "确认类型、依赖和打包没有回归。",
      commands: ["pnpm build"],
      runWhen: "源码、依赖、配置变化",
      failureMeaning: "构建链被破坏。",
      nextStep: "先修构建失败，再讨论运行态。",
      reason: "当前 diff 涉及源码/依赖/配置，必须先确认构建链保持稳定。",
    });
  }

  if (changedFiles.some((file) => isRuntimeSensitive(file))) {
    selected.recommended.push({
      id: "runtime",
      title: "运行时检查",
      summary: "确认预览或 production 运行态仍可用。",
      commands: ["pnpm preview:check"],
      runWhen: "页面、状态模型、发布链变化",
      failureMeaning: "当前运行态可能不可用。",
      nextStep: "先看 release/runtime 面板再继续。",
      reason: "当前改动可能影响真实页面或发布链，建议补一层运行时确认。",
    });
  }

  if (changedFiles.some((file) => file.startsWith("docs/prompts/") || file.startsWith("scripts/ai/"))) {
    selected.required.push({
      id: "ai-output",
      title: "AI 输出门禁",
      summary: "确认 prompt 与 AI 脚本输出结构没有漂移。",
      commands: ["pnpm validate:ai-output"],
      runWhen: "AI 资产变化",
      failureMeaning: "AI 输出契约已漂移。",
      nextStep: "先修输出契约，再恢复 feature 开发。",
      reason: "当前改动直接触碰 AI 资产，必须补这一层输出验证。",
    });
  }

  return { selectedChecks: selected };
}

function readChangedFiles(root) {
  try {
    const output = childProcess.execSync("git status --short", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isBuildSensitive(file) {
  return (
    file === "package.json" ||
    file.endsWith("pnpm-lock.yaml") ||
    file.endsWith(".ts") ||
    file.endsWith(".tsx") ||
    file.endsWith(".js") ||
    file.endsWith(".jsx") ||
    file.endsWith(".json") ||
    file.endsWith(".yaml") ||
    file.endsWith(".yml") ||
    file.endsWith(".toml") ||
    file.endsWith(".py")
  );
}

function isRuntimeSensitive(file) {
  return (
    file.startsWith("apps/") ||
    file.startsWith("scripts/release/") ||
    file.startsWith("scripts/local-runtime/") ||
    file.startsWith("tasks/queue/") ||
    file === "package.json"
  );
}

function renderFeatureContextMarkdown(packet) {
  const lines = ["# Feature Context Packet", ""];
  lines.push(`- Target: \`${packet.target_surface}\``);
  lines.push(
    `- Related Modules: ${packet.related_modules.length ? packet.related_modules.map((item) => `\`${item}\``).join(", ") : "none"}`
  );
  if (packet.task_overlay) {
    lines.push(`- Task Overlay: \`${packet.task_overlay.taskPath}\``);
  }
  lines.push("");

  if (packet.task_overlay) {
    lines.push("## Task Delta", "");
    lines.push(`- Summary: ${packet.task_overlay.summary}`);
    lines.push(`- Boundary: ${packet.task_overlay.boundary}`);
    lines.push(`- Done When: ${packet.task_overlay.doneWhen}`);
    lines.push("");
  }

  lines.push("## Project Judgement", "");
  lines.push(`- 当前判断：${packet.project_judgement.overallSummary}`);
  lines.push(`- 健康结论：${packet.project_judgement.healthSummary}`);
  lines.push(`- 下一步：${packet.project_judgement.nextAction}`);
  lines.push(`- 推荐入口：${packet.project_judgement.recommendedSurface.label} (${packet.project_judgement.recommendedSurface.reason})`);
  lines.push(`- 推荐先读：\`${packet.project_judgement.recommendedRead.path}\``);
  lines.push("");

  lines.push("## Default Loop", "");
  lines.push(`- 入口命令：\`${packet.default_flow.entry_command}\``);
  lines.push(`- 下一步判断：${packet.default_flow.next_action}`);
  lines.push(`- 先看页面：${packet.default_flow.recommended_surface.label}`);
  lines.push(`- 先读文档：\`${packet.default_flow.recommended_read.path}\``);
  lines.push(
    `- 默认摘要链：${packet.default_flow.summary_first_commands.length ? packet.default_flow.summary_first_commands.map((command) => `\`${command}\``).join(" / ") : "暂无"}`
  );
  lines.push(
    `- 原始回退链：${packet.default_flow.raw_fallback_commands.length ? packet.default_flow.raw_fallback_commands.map((command) => `\`${command}\``).join(" / ") : "暂无"}`
  );
  lines.push(
    `- 必跑命令：${packet.default_flow.required_commands.length ? packet.default_flow.required_commands.map((command) => `\`${command}\``).join(" / ") : "暂无"}`
  );
  lines.push(
    `- 附加命令：${packet.default_flow.recommended_commands.length ? packet.default_flow.recommended_commands.map((command) => `\`${command}\``).join(" / ") : "暂无"}`
  );
  lines.push("");

  lines.push("## Waste Alerts", "");
  if (packet.waste_alerts.length > 0) {
    for (const item of packet.waste_alerts) {
      lines.push(`- ${item.signature}`);
      lines.push(`  - 为什么浪费时间：${item.why_time_was_lost}`);
      lines.push(`  - 下个 Agent 应怎么做：${item.next_agent_should_do_instead}`);
      lines.push(`  - 建议摘要命令：${item.which_summary_shortcut_to_use || "无"}`);
    }
  } else {
    lines.push("- 当前没有命中即时复盘阈值。");
  }
  lines.push("");

  lines.push("## Must Read Now", "");
  for (const item of packet.must_read) {
    lines.push(`- \`${item}\``);
  }
  lines.push("");

  lines.push("## Read On Demand", "");
  if (packet.read_on_demand.length > 0) {
    for (const item of packet.read_on_demand) {
      lines.push(`- \`${item}\``);
    }
  } else {
    lines.push("- 当前没有额外按需阅读项。");
  }
  lines.push("");

  lines.push("## Likely Files", "");
  for (const item of packet.likely_files) {
    lines.push(`- \`${item}\``);
  }
  lines.push("");

  lines.push("## Likely Tests", "");
  if (packet.likely_tests.length > 0) {
    for (const item of packet.likely_tests) {
      lines.push(`- \`${item}\``);
    }
  } else {
    lines.push("- 暂无模块级测试文件提示。");
  }
  lines.push("");

  lines.push("## Required Checks", "");
  if (packet.required_checks.length > 0) {
    for (const check of packet.required_checks) {
      lines.push(`- ${check.label}`);
      lines.push(`  - 命令：${check.commands.map((command) => `\`${command}\``).join(" / ")}`);
      lines.push(`  - 原因：${check.reason}`);
    }
  } else {
    lines.push("- 暂无必跑检查。");
  }
  lines.push("");

  lines.push("## Recommended Checks", "");
  if (packet.recommended_checks.length > 0) {
    for (const check of packet.recommended_checks) {
      lines.push(`- ${check.label}`);
      lines.push(`  - 命令：${check.commands.map((command) => `\`${command}\``).join(" / ")}`);
      lines.push(`  - 原因：${check.reason}`);
    }
  } else {
    lines.push("- 暂无附加建议。");
  }
  lines.push("");

  return lines.join("\n");
}

module.exports = {
  buildExpandedContextExcerpts,
  buildFeatureContextPacket,
  estimateContextPacketSourceBytes,
  renderFeatureContextMarkdown,
};

function estimateContextPacketSourceBytes(root, packet, options = {}) {
  const includeReadOnDemand = options.includeReadOnDemand !== false;
  const files = unique([
    ...(packet.must_read || []),
    ...(includeReadOnDemand ? packet.read_on_demand || [] : []),
  ]);
  const fileBytes = files.reduce((sum, relPath) => sum + Buffer.byteLength(readIfExists(root, relPath), "utf8"), 0);
  const taskBytes = packet.task_overlay
    ? Buffer.byteLength(
        [packet.task_overlay.summary, packet.task_overlay.boundary, packet.task_overlay.doneWhen].filter(Boolean).join("\n"),
        "utf8",
      )
    : 0;
  return fileBytes + taskBytes;
}

function buildExpandedContextExcerpts(root, packet, options = {}) {
  const maxItems = Math.max(1, Number(options.maxItems || 3));
  const paths = unique([
    packet.task_overlay?.taskPath,
    packet.project_judgement?.recommendedRead?.path,
    ...(options.includeReadOnDemand ? packet.read_on_demand || [] : []),
  ]).slice(0, maxItems);

  return paths
    .map((relPath) => {
      const text = readIfExists(root, relPath);
      if (!text) return null;
      return {
        path: relPath,
        excerpt: text.slice(0, 1200),
      };
    })
    .filter(Boolean);
}
