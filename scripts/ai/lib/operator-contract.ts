const fs = require("node:fs");
const path = require("node:path");

const OPERATOR_CONTRACT_PATH = "bootstrap/project_operator.yaml";
const OPERATOR_SCHEMA_PATH = "schemas/project_operator.schema.yaml";
const OPERATOR_RUNBOOK_PATH = "docs/OPERATOR_RUNBOOK.md";
const CLAUDE_ENTRY_PATH = "CLAUDE.md";
const OPENCODE_ENTRY_PATH = "OPENCODE.md";
const CURSOR_ENTRY_PATH = ".cursor/rules/00-project-entry.mdc";

function splitInlineItems(text) {
  const items = [];
  let current = "";
  let quote = null;
  let depth = 0;
  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "[" || char === "{") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      const item = current.trim();
      if (item) items.push(item);
      current = "";
      continue;
    }
    current += char;
  }
  const tail = current.trim();
  if (tail) items.push(tail);
  return items;
}

function parseScalar(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text === "true" || text === "false") return text === "true";
  if (text === "null" || text === "~") return null;
  if (text === "[]") return [];
  if (text === "{}") return {};
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    return inner ? splitInlineItems(inner).map((item) => parseScalar(item)) : [];
  }
  if (text.startsWith("{") && text.endsWith("}")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return {};
    return Object.fromEntries(
      splitInlineItems(inner).map((item) => {
        const [key, raw = ""] = item.split(/:(.+)/, 2);
        return [key.trim(), parseScalar(raw)];
      }),
    );
  }
  if (/^-?\d+$/.test(text)) return Number.parseInt(text, 10);
  if (/^-?\d+\.\d+$/.test(text)) return Number.parseFloat(text);
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.startsWith('"') ? JSON.parse(text) : text.slice(1, -1);
  }
  return text;
}

function normalizeLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((raw) => ({
      indent: raw.length - raw.trimStart().length,
      content: raw.trim(),
    }))
    .filter((line) => line.content && !line.content.startsWith("#"));
}

function parseBlock(lines, index, indent) {
  if (index >= lines.length) return [{}, index];
  if (lines[index]?.content.startsWith("-")) return parseList(lines, index, indent);
  return parseMapping(lines, index, indent);
}

function parseMapping(lines, index, indent) {
  const result = {};
  let cursor = index;
  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line || line.indent < indent || line.indent !== indent || line.content.startsWith("-")) break;
    const colonIndex = line.content.indexOf(":");
    if (colonIndex === -1) throw new Error(`Invalid YAML mapping line: ${line.content}`);
    const key = line.content.slice(0, colonIndex).trim();
    const value = line.content.slice(colonIndex + 1).trimStart();
    cursor += 1;
    if (!value) {
      if (cursor < lines.length && lines[cursor].indent > indent) {
        const [child, next] = parseBlock(lines, cursor, lines[cursor].indent);
        result[key] = child;
        cursor = next;
      } else {
        result[key] = null;
      }
      continue;
    }
    result[key] = parseScalar(value);
  }
  return [result, cursor];
}

function parseList(lines, index, indent) {
  const result = [];
  let cursor = index;
  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line || line.indent < indent || line.indent !== indent || !line.content.startsWith("-")) break;
    const remainder = line.content.slice(1).trimStart();
    cursor += 1;
    if (!remainder) {
      if (cursor < lines.length && lines[cursor].indent > indent) {
        const [child, next] = parseBlock(lines, cursor, lines[cursor].indent);
        result.push(child);
        cursor = next;
      } else {
        result.push(null);
      }
      continue;
    }
    const mappingMatch = remainder.match(/^([A-Za-z0-9_.-]+):(.*)$/);
    if (mappingMatch) {
      const item = {};
      const key = mappingMatch[1].trim();
      const value = mappingMatch[2].trimStart();
      if (!value) {
        if (cursor < lines.length && lines[cursor].indent > indent) {
          const [child, next] = parseBlock(lines, cursor, lines[cursor].indent);
          item[key] = child;
          cursor = next;
        } else {
          item[key] = null;
        }
      } else {
        item[key] = parseScalar(value);
      }
      if (cursor < lines.length && lines[cursor].indent > indent) {
        const [extra, next] = parseMapping(lines, cursor, lines[cursor].indent);
        Object.assign(item, extra);
        cursor = next;
      }
      result.push(item);
      continue;
    }
    result.push(parseScalar(remainder));
  }
  return [result, cursor];
}

function parseSimpleYaml(text) {
  const lines = normalizeLines(text);
  if (!lines.length) return {};
  const [payload] = parseBlock(lines, 0, lines[0].indent);
  return payload;
}

function validateSimpleSchema(payload, schema, pointer = "root") {
  const errors = [];
  const expectedType = schema?.type;
  if (expectedType === "object") {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [`${pointer}: expected object`];
    for (const field of schema.required || []) {
      if (!(field in payload)) errors.push(`${pointer}.${field}: missing required field`);
    }
    for (const [key, value] of Object.entries(payload)) {
      if (schema.properties?.[key]) errors.push(...validateSimpleSchema(value, schema.properties[key], `${pointer}.${key}`));
    }
    return errors;
  }
  if (expectedType === "array") {
    if (!Array.isArray(payload)) return [`${pointer}: expected array`];
    if (schema.items) {
      payload.forEach((item, index) => {
        errors.push(...validateSimpleSchema(item, schema.items, `${pointer}[${index}]`));
      });
    }
    return errors;
  }
  if (expectedType === "string" && typeof payload !== "string") return [`${pointer}: expected string`];
  if (expectedType === "integer" && (!Number.isInteger(payload) || typeof payload !== "number")) return [`${pointer}: expected integer`];
  if (expectedType === "boolean" && typeof payload !== "boolean") return [`${pointer}: expected boolean`];
  if (Array.isArray(schema?.enum) && !schema.enum.includes(payload)) {
    errors.push(`${pointer}: expected one of ${schema.enum.join(", ")}`);
  }
  return errors;
}

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function normalizeNotes(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeString(item)).filter(Boolean);
  const note = normalizeString(value);
  return note ? [note] : [];
}

function readYamlFile(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  return parseSimpleYaml(fs.readFileSync(absolutePath, "utf8"));
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

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function loadOperatorContract(root = process.cwd()) {
  const payload = readYamlFile(root, OPERATOR_CONTRACT_PATH);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("bootstrap/project_operator.yaml must be an object.");
  }
  return payload;
}

function renderSurface(surface) {
  const notes = normalizeNotes(surface.notes);
  const noteLines = notes.length ? notes.map((item) => `- ${item}`).join("\n") : "- 无";
  return [
    `### ${normalizeString(surface.surface_id) || "unnamed-surface"}`,
    "",
    `- 目的：\`${normalizeString(surface.purpose)}\``,
    `- 启用：\`${String(Boolean(surface.enabled))}\``,
    `- 传输：\`${normalizeString(surface.transport)}\``,
    `- 地址：\`${normalizeString(surface.base_url) || `${normalizeString(surface.host)}:${normalizeString(surface.port)}`}\``,
    `- 进入方式：\`${normalizeString(surface.access_via)}\``,
    `- 认证：\`${normalizeString(surface.auth?.mode)}\``,
    `- secret refs：${(surface.auth?.secret_refs || []).map((item) => `\`${normalizeString(item)}\``).join("、") || "无"}`,
    `- 启动：\`${normalizeString(surface.commands?.start)}\``,
    `- 停止：\`${normalizeString(surface.commands?.stop)}\``,
    `- 状态：\`${normalizeString(surface.commands?.status)}\``,
    `- 检查：\`${normalizeString(surface.commands?.check)}\``,
    "- 备注：",
    noteLines,
    "",
  ].join("\n");
}

function renderRunbook(contract) {
  const serverSections = Array.isArray(contract.server_surfaces) ? contract.server_surfaces.map((surface) => renderSurface(surface)).join("\n") : "";
  const githubNotes = normalizeNotes(contract.github_surface?.notes);
  const topNotes = normalizeNotes(contract.notes);
  const shortcuts = Array.isArray(contract.agent_shortcuts) ? contract.agent_shortcuts : [];
  const requiredPacks = Array.isArray(contract.project?.required_packs) ? contract.project.required_packs : [];
  const githubOwner = normalizeString(contract.github_surface?.owner);
  const githubRepo = normalizeString(contract.github_surface?.repo);
  const githubRepoLabel = githubOwner && githubRepo ? `${githubOwner}/${githubRepo}` : "未配置";
  return [
    "---",
    "title: OPERATOR_RUNBOOK",
    "update_mode: generated",
    "status: active",
    `last_reviewed_at: ${todayString()}`,
    `source_of_truth: ${OPERATOR_CONTRACT_PATH}`,
    "related_docs:",
    "  - AGENTS.md",
    "  - docs/DEV_WORKFLOW.md",
    "  - docs/AI_OPERATING_MODEL.md",
    "---",
    "<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->",
    "# 运维接入手册",
    "",
    "## 使用规则",
    "",
    `- canonical source：\`${OPERATOR_CONTRACT_PATH}\``,
    "- 真实密钥不入库；仓库里只保存 secret ref 名称和标准命令。",
    "- Codex / Claude Code / Cursor / OpenCode 都必须通过同一份 contract 读取服务器、GitHub 和发布流。",
    "",
    `## 项目`,
    "",
    `- 名称：\`${normalizeString(contract.project?.name)}\``,
    `- 模式：\`${normalizeString(contract.project?.bootstrap_mode)}\``,
    `- adapter：\`${normalizeString(contract.project?.adapter_id)}\``,
    `- profile：\`${normalizeString(contract.project?.profile)}\``,
    `- required packs：${requiredPacks.map((item) => `\`${normalizeString(item)}\``).join("、") || "无"}`,
    "- 顶层备注：",
    ...(topNotes.length ? topNotes.map((item) => `  - ${item}`) : ["  - 无"]),
    "",
    "## 推荐命令",
    "",
    `- install：\`${normalizeString(contract.toolchain_commands?.install)}\``,
    `- dev：\`${normalizeString(contract.toolchain_commands?.dev)}\``,
    `- build：\`${normalizeString(contract.toolchain_commands?.build)}\``,
    `- test：\`${normalizeString(contract.toolchain_commands?.test)}\``,
    `- bootstrap doctor：\`${normalizeString(contract.toolchain_commands?.bootstrap_doctor)}\``,
    `- bootstrap attach：\`${normalizeString(contract.toolchain_commands?.bootstrap_attach)}\``,
    `- bootstrap audit：\`${normalizeString(contract.toolchain_commands?.bootstrap_audit)}\``,
    `- bootstrap proposal：\`${normalizeString(contract.toolchain_commands?.bootstrap_proposal)}\``,
    `- preflight：\`${normalizeString(contract.toolchain_commands?.preflight)}\``,
    `- task preflight：\`${normalizeString(contract.toolchain_commands?.task_preflight)}\``,
    `- create task：\`${normalizeString(contract.toolchain_commands?.create_task)}\``,
    `- review：\`${normalizeString(contract.toolchain_commands?.review)}\``,
    "",
    ...renderModeGuide(contract),
    ...renderAiFeatureEntry(contract),
    "## 服务器访问面",
    "",
    serverSections.trim(),
    "## GitHub 接入面",
    "",
    `- 启用：\`${String(Boolean(contract.github_surface?.enabled))}\``,
    `- provider：\`${normalizeString(contract.github_surface?.provider)}\``,
    `- 仓库：\`${githubRepoLabel}\``,
    `- 远端：\`${normalizeString(contract.github_surface?.remote_name)}\``,
    `- 默认分支：\`${normalizeString(contract.github_surface?.default_branch)}\``,
    `- 认证：\`${normalizeString(contract.github_surface?.auth?.mode)}\``,
    `- secret refs：${(contract.github_surface?.auth?.secret_refs || []).map((item) => `\`${normalizeString(item)}\``).join("、") || "无"}`,
    `- 查看状态：\`${normalizeString(contract.github_surface?.commands?.status)}\``,
    `- 同步：\`${normalizeString(contract.github_surface?.commands?.sync)}\``,
    `- 开 PR：\`${normalizeString(contract.github_surface?.commands?.open_pr)}\``,
    `- 检查：\`${normalizeString(contract.github_surface?.commands?.checks)}\``,
    `- required checks：${(contract.github_surface?.required_checks || []).map((item) => `\`${normalizeString(item)}\``).join("、") || "无"}`,
    "- 备注：",
    ...(githubNotes.length ? githubNotes.map((item) => `  - ${item}`) : ["  - 无"]),
    "",
    "## 标准发布流",
    "",
    `- 基础 preflight：\`${normalizeString(contract.standard_flows?.preflight?.basic)}\``,
    `- task preflight：\`${normalizeString(contract.standard_flows?.preflight?.task)}\``,
    `- preview prepare：\`${normalizeString(contract.standard_flows?.preview_release?.prepare)}\``,
    `- preview accept：\`${normalizeString(contract.standard_flows?.preview_release?.accept)}\``,
    `- preview reject：\`${normalizeString(contract.standard_flows?.preview_release?.reject)}\``,
    `- 晋升 main：\`${normalizeString(contract.standard_flows?.production_release?.promote_to_main)}\``,
    `- 启动 production runtime：\`${normalizeString(contract.standard_flows?.production_release?.start_runtime)}\``,
    `- production status：\`${normalizeString(contract.standard_flows?.production_release?.status)}\``,
    `- production check：\`${normalizeString(contract.standard_flows?.production_release?.check)}\``,
    `- rollback：\`${normalizeString(contract.standard_flows?.production_release?.rollback)}\``,
    "",
    "## Agent Shortcut",
    "",
    ...(shortcuts.length
      ? shortcuts.flatMap((shortcut) => [
          `- ${normalizeString(shortcut.label)}：\`${normalizeString(shortcut.canonical_command)}\``,
          `  - 适用场景：${normalizeString(shortcut.applies_when)}`,
          `  - 原因：${normalizeString(shortcut.why)}`,
          `  - 工具面：${Array.isArray(shortcut.tool_surfaces) ? shortcut.tool_surfaces.map((item) => `\`${normalizeString(item)}\``).join("、") : "无"}`,
        ])
      : ["- 无"]),
    "<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->",
    "",
  ].join("\n");
}

function renderShortcutLines(contract) {
  const shortcuts = Array.isArray(contract.agent_shortcuts) ? contract.agent_shortcuts : [];
  if (!shortcuts.length) return ["- 当前没有额外 shortcut。"];
  return shortcuts.map(
    (shortcut) => `- ${normalizeString(shortcut.label)}：\`${normalizeString(shortcut.canonical_command)}\``
  );
}

function hasAiExecPack(contract) {
  const requiredPacks = Array.isArray(contract.project?.required_packs) ? contract.project.required_packs : [];
  return requiredPacks.includes("ai_exec_pack");
}

function renderModeGuide(contract) {
  const attach = normalizeString(contract.toolchain_commands?.bootstrap_attach);
  const doctor = normalizeString(contract.toolchain_commands?.bootstrap_doctor);
  const audit = normalizeString(contract.toolchain_commands?.bootstrap_audit);
  return [
    "## 三模式入口",
    "",
    "- `cold_start`：新项目冷启动",
    `  - 推荐命令：\`python3 scripts/init_project_compounding.py bootstrap --target . --mode=cold_start\``,
    "  - 适用：空仓或新仓，先装协议层、operator 契约和 repo-local AI 入口。",
    "- `normalize`：老项目规范化",
    `  - 推荐命令：\`${attach} --mode=normalize\``,
    "  - 适用：已有业务代码，但还没有统一协议、operator contract 和 AI 入口。",
    "- `ai_upgrade`：老项目 AI 底座升级",
    `  - 推荐命令：\`${attach} --mode=ai_upgrade\``,
    `  - 先自检：\`${doctor} --mode=ai_upgrade\` / \`${audit}\``,
    "  - 适用：项目已准备长期按 AI feature 流开发，需要 preflight/task/review 与 summary harness。",
    "",
  ];
}

function renderAiFeatureEntry(contract) {
  if (!hasAiExecPack(contract)) return [];
  return [
    "## AI 默认入口",
    "",
    "- 默认 feature 上下文：`pnpm ai:feature-context -- --surface=home`",
    "- 带 task 的 feature 上下文：`pnpm ai:feature-context -- --taskPath=tasks/queue/task-xxx.md`",
    "- 默认摘要链：`pnpm ai:preflight:summary` / `pnpm ai:diff:summary` / `pnpm ai:tree:summary` / `pnpm ai:find:summary -- --query=keyword` / `pnpm ai:read:summary -- --path=memory/project/current-state.md`",
    "- 原始回退链：`pnpm preflight` / `git diff` / `rg --files --hidden` / `rg -n --hidden keyword` / `sed -n '1,200p' <path>`",
    "- 看当前令牌效率：`pnpm ai:command-gain --json` 或打开 `/ai-efficiency`",
    "- 默认先看 feature packet 里的 `Project Judgement` 和 `Default Loop`，再动手改代码。",
    "",
  ];
}

function renderClaudeEntry(contract) {
  return [
    "# CLAUDE",
    "",
    "- Canonical source: `AGENTS.md`",
    `- 涉及服务器 / GitHub / 发布访问面时必须先读 \`${OPERATOR_CONTRACT_PATH}\``,
    `- 人类扫读版在 \`${OPERATOR_RUNBOOK_PATH}\``,
    `- 当前 mode：\`${normalizeString(contract.project?.bootstrap_mode)}\`；adapter：\`${normalizeString(contract.project?.adapter_id)}\``,
    `- 推荐 preflight：\`${normalizeString(contract.toolchain_commands?.preflight)}\``,
    ...(hasAiExecPack(contract)
      ? [
          "- 默认 AI feature 入口：`pnpm ai:feature-context -- --surface=home`",
          "- 默认摘要链：`pnpm ai:preflight:summary` / `pnpm ai:diff:summary` / `pnpm ai:tree:summary` / `pnpm ai:find:summary -- --query=keyword` / `pnpm ai:read:summary -- --path=memory/project/current-state.md`",
          "- 当前令牌效率：`pnpm ai:command-gain --json` / `/ai-efficiency`",
        ]
      : []),
    "",
    "## 优先摘要命令",
    "",
    ...renderShortcutLines(contract),
    "",
  ].join("\n");
}

function renderOpenCodeEntry(contract) {
  return [
    "# OPENCODE",
    "",
    "- Canonical source: `AGENTS.md`",
    `- 涉及服务器 / GitHub / 发布访问面时必须先读 \`${OPERATOR_CONTRACT_PATH}\``,
    `- 人类扫读版在 \`${OPERATOR_RUNBOOK_PATH}\``,
    `- 当前 mode：\`${normalizeString(contract.project?.bootstrap_mode)}\`；adapter：\`${normalizeString(contract.project?.adapter_id)}\``,
    `- 推荐 preflight：\`${normalizeString(contract.toolchain_commands?.preflight)}\``,
    ...(hasAiExecPack(contract)
      ? [
          "- 默认 AI feature 入口：`pnpm ai:feature-context -- --surface=home`",
          "- 默认摘要链：`pnpm ai:preflight:summary` / `pnpm ai:diff:summary` / `pnpm ai:tree:summary` / `pnpm ai:find:summary -- --query=keyword` / `pnpm ai:read:summary -- --path=memory/project/current-state.md`",
          "- 当前令牌效率：`pnpm ai:command-gain --json` / `/ai-efficiency`",
        ]
      : []),
    "",
    "## 优先摘要命令",
    "",
    ...renderShortcutLines(contract),
    "",
  ].join("\n");
}

function renderCursorEntry(contract) {
  return [
    "---",
    "description: Project entry contract",
    "alwaysApply: true",
    "---",
    "- Canonical source: `AGENTS.md`",
    `- 涉及服务器 / GitHub / 发布访问面时必须先读 \`${OPERATOR_CONTRACT_PATH}\``,
    `- 人类扫读版在 \`${OPERATOR_RUNBOOK_PATH}\``,
    `- 当前 mode：\`${normalizeString(contract.project?.bootstrap_mode)}\`；adapter：\`${normalizeString(contract.project?.adapter_id)}\``,
    `- 推荐 preflight：\`${normalizeString(contract.toolchain_commands?.preflight)}\``,
    ...(hasAiExecPack(contract)
      ? [
          "- 默认 AI feature 入口：`pnpm ai:feature-context -- --surface=home`",
          "- 默认摘要链：`pnpm ai:preflight:summary` / `pnpm ai:diff:summary` / `pnpm ai:tree:summary` / `pnpm ai:find:summary -- --query=keyword` / `pnpm ai:read:summary -- --path=memory/project/current-state.md`",
          "- 当前令牌效率：`pnpm ai:command-gain --json` / `/ai-efficiency`",
        ]
      : []),
    "",
    "## 优先摘要命令",
    "",
    ...renderShortcutLines(contract),
    "",
  ].join("\n");
}

function buildOperatorAssets(root = process.cwd(), contract = loadOperatorContract(root)) {
  return {
    [OPERATOR_RUNBOOK_PATH]: renderRunbook(contract),
    [CLAUDE_ENTRY_PATH]: renderClaudeEntry(contract),
    [OPENCODE_ENTRY_PATH]: renderOpenCodeEntry(contract),
    [CURSOR_ENTRY_PATH]: renderCursorEntry(contract),
  };
}

function looksLikeSecretValue(value) {
  const text = normalizeString(value);
  if (!text) return false;
  return (
    text.includes("://") ||
    text.includes("@") ||
    text.includes("-----BEGIN ") ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ||
    /^gh[pousr]_[A-Za-z0-9]{20,}$/.test(text) ||
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(text) ||
    /^[A-Za-z0-9+/=]{32,}$/.test(text) ||
    /\.(pem|key|json|env)$/i.test(text)
  );
}

function commandExists(command, root, packageScripts) {
  const value = normalizeString(command);
  if (!value) return false;
  const tokens = value.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  if (tokens[0] === "pnpm") {
    const subcommand = tokens[1];
    if (!subcommand) return false;
    if (subcommand === "run") return Boolean(packageScripts[tokens[2]]);
    if (["install", "add", "remove", "update", "up", "dlx", "exec"].includes(subcommand)) return true;
    return Boolean(packageScripts[subcommand]);
  }
  if (tokens[0] === "git" || tokens[0] === "gh" || tokens[0] === "ssh" || tokens[0] === "bash" || tokens[0] === "sh") return true;
  for (const token of tokens) {
    if (/\.(ts|js|py)$/.test(token)) {
      return fs.existsSync(path.join(root, token));
    }
  }
  return fs.existsSync(path.join(root, tokens[0]));
}

function hasAccessSurface(surface) {
  return Boolean(normalizeString(surface.base_url) || normalizeString(surface.access_via) || normalizeString(surface.host));
}

function validateOperatorContract(root = process.cwd()) {
  const errors = [];
  const warnings = [];
  const checkedFiles = [];
  const packageScripts = loadPackageScripts(root);
  const contractPath = path.join(root, OPERATOR_CONTRACT_PATH);
  const schemaPath = path.join(root, OPERATOR_SCHEMA_PATH);
  if (!fs.existsSync(contractPath)) {
    return { ok: false, layer: "operator-contract", errors: [`Missing required file: ${OPERATOR_CONTRACT_PATH}`], warnings, details: { checked_files: [], generated_assets: [] } };
  }
  if (!fs.existsSync(schemaPath)) {
    return { ok: false, layer: "operator-contract", errors: [`Missing required file: ${OPERATOR_SCHEMA_PATH}`], warnings, details: { checked_files: [OPERATOR_CONTRACT_PATH], generated_assets: [] } };
  }

  const contract = loadOperatorContract(root);
  const schema = readYamlFile(root, OPERATOR_SCHEMA_PATH);
  checkedFiles.push(OPERATOR_CONTRACT_PATH, OPERATOR_SCHEMA_PATH);
  errors.push(...validateSimpleSchema(contract, schema));

  const serverSurfaces = Array.isArray(contract.server_surfaces) ? contract.server_surfaces : [];
  for (const surface of serverSurfaces) {
    if (!surface?.enabled) continue;
    if (!hasAccessSurface(surface)) {
      errors.push(`Enabled server surface lacks an access surface: ${normalizeString(surface.surface_id)}`);
    }
    for (const key of ["start", "stop", "status", "check"]) {
      if (!commandExists(surface.commands?.[key], root, packageScripts)) {
        errors.push(`Server surface command is missing or invalid: ${normalizeString(surface.surface_id)}.${key}`);
      }
    }
    for (const secretRef of surface.auth?.secret_refs || []) {
      if (looksLikeSecretValue(secretRef)) {
        errors.push(`Server surface secret_refs must contain names only: ${normalizeString(surface.surface_id)}`);
        break;
      }
    }
  }

  const github = contract.github_surface || {};
  if (github.enabled) {
    if (!normalizeString(github.owner) || !normalizeString(github.repo)) {
      errors.push("github_surface.enabled=true requires owner and repo.");
    }
  }
  for (const key of ["status", "sync", "open_pr", "checks"]) {
    const command = github.commands?.[key];
    if (normalizeString(command) && !commandExists(command, root, packageScripts)) {
      errors.push(`GitHub command is missing or invalid: github_surface.${key}`);
    }
  }
  for (const secretRef of github.auth?.secret_refs || []) {
    if (looksLikeSecretValue(secretRef)) {
      errors.push("github_surface.secret_refs must contain names only.");
      break;
    }
  }

  const flowCommands = [
    ["standard_flows.preflight.basic", contract.standard_flows?.preflight?.basic],
    ["standard_flows.preflight.task", contract.standard_flows?.preflight?.task],
    ["standard_flows.preview_release.prepare", contract.standard_flows?.preview_release?.prepare],
    ["standard_flows.preview_release.accept", contract.standard_flows?.preview_release?.accept],
    ["standard_flows.preview_release.reject", contract.standard_flows?.preview_release?.reject],
    ["standard_flows.production_release.promote_to_main", contract.standard_flows?.production_release?.promote_to_main],
    ["standard_flows.production_release.start_runtime", contract.standard_flows?.production_release?.start_runtime],
    ["standard_flows.production_release.status", contract.standard_flows?.production_release?.status],
    ["standard_flows.production_release.check", contract.standard_flows?.production_release?.check],
    ["standard_flows.production_release.rollback", contract.standard_flows?.production_release?.rollback],
  ];
  for (const [label, command] of flowCommands) {
    if (!commandExists(command, root, packageScripts)) {
      errors.push(`Standard flow command is missing or invalid: ${label}`);
    }
  }

  const toolchainCommands = contract.toolchain_commands && typeof contract.toolchain_commands === "object" ? contract.toolchain_commands : {};
  for (const [label, command] of Object.entries(toolchainCommands)) {
    if (!normalizeString(command)) continue;
    if (!commandExists(command, root, packageScripts)) {
      errors.push(`Toolchain command is missing or invalid: toolchain_commands.${label}`);
    }
  }

  const shortcuts = Array.isArray(contract.agent_shortcuts) ? contract.agent_shortcuts : [];
  for (const shortcut of shortcuts) {
    if (normalizeString(shortcut.mode) !== "suggest") {
      errors.push(`Agent shortcut mode must be suggest: ${normalizeString(shortcut.shortcut_id)}`);
    }
    if (!commandExists(shortcut.canonical_command, root, packageScripts)) {
      errors.push(`Agent shortcut command is missing or invalid: ${normalizeString(shortcut.shortcut_id)}`);
    }
    if (!Array.isArray(shortcut.tool_surfaces) || shortcut.tool_surfaces.length === 0) {
      errors.push(`Agent shortcut must declare tool_surfaces: ${normalizeString(shortcut.shortcut_id)}`);
    }
  }

  const assets = buildOperatorAssets(root, contract);
  for (const [relativePath, content] of Object.entries(assets)) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Missing generated operator asset: ${relativePath}`);
      continue;
    }
    checkedFiles.push(relativePath);
    if (fs.readFileSync(absolutePath, "utf8") !== content) {
      errors.push(`Generated operator asset is out of sync: ${relativePath}`);
    }
  }

  return {
    ok: errors.length === 0,
    layer: "operator-contract",
    errors,
    warnings,
    details: {
      checked_files: checkedFiles,
      generated_assets: Object.keys(assets),
      enabled_server_surfaces: serverSurfaces.filter((surface) => surface?.enabled).map((surface) => normalizeString(surface.surface_id)),
      github_enabled: Boolean(github.enabled),
      shortcut_ids: shortcuts.map((shortcut) => normalizeString(shortcut.shortcut_id)).filter(Boolean),
    },
  };
}

module.exports = {
  buildOperatorAssets,
  loadOperatorContract,
  OPENCODE_ENTRY_PATH,
  OPERATOR_CONTRACT_PATH,
  OPERATOR_RUNBOOK_PATH,
  validateOperatorContract,
};
