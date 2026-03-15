const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const moduleIndexPath = path.join(root, "code_index", "module-index.md");
const dependencyMapPath = path.join(root, "code_index", "dependency-map.md");
const functionIndexPath = path.join(root, "code_index", "function-index.json");
const today = new Date().toISOString().slice(0, 10);
const meta = {
  "code_index/module-index.md": {
    title: "模块索引",
    doc_role: "reference",
    update_mode: "generated",
    owner_role: "Builder",
    status: "active",
    source_of_truth: "scripts/ai/generate-module-index.ts",
    related_docs: ["docs/ARCHITECTURE.md", "code_index/dependency-map.md", "code_index/function-index.json"]
  },
  "code_index/dependency-map.md": {
    title: "依赖图",
    doc_role: "reference",
    update_mode: "generated",
    owner_role: "Builder",
    status: "active",
    source_of_truth: "scripts/ai/generate-module-index.ts",
    related_docs: ["code_index/module-index.md", "docs/ARCHITECTURE.md"]
  }
};

function readFunctions(file) {
  const text = fs.readFileSync(file, "utf8");
  const results = [];
  const tsMatches = text.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)|function\s+([A-Za-z0-9_]+)/g);
  for (const match of tsMatches) {
    const symbol = match[1] || match[2];
    if (!symbol) continue;
    results.push(symbol);
  }
  const pyMatches = text.matchAll(/^def\s+([A-Za-z0-9_]+)\s*\(/gm);
  for (const match of pyMatches) results.push(match[1]);
  return Array.from(new Set(results));
}

function scanModuleRoot(relRoot) {
  const absRoot = path.join(root, relRoot);
  if (!fs.existsSync(absRoot)) return [];
  const entries = fs.readdirSync(absRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  return entries.map((entry) => ({ name: entry.name, path: path.join(relRoot, entry.name).replace(/\\/g, "/") }));
}

function currentDateFor(relPath) {
  const absolute = path.join(root, relPath);
  if (!fs.existsSync(absolute)) return today;
  const raw = fs.readFileSync(absolute, "utf8");
  const match = raw.match(/last_reviewed_at:\s*(.+)/);
  return match ? match[1].trim() : today;
}

function renderManagedDoc(relPath, body) {
  const frontmatter = meta[relPath];
  return [
    "---",
    `title: ${frontmatter.title}`,
    `doc_role: ${frontmatter.doc_role}`,
    `update_mode: ${frontmatter.update_mode}`,
    `owner_role: ${frontmatter.owner_role}`,
    `status: ${frontmatter.status}`,
    `last_reviewed_at: ${currentDateFor(relPath)}`,
    `source_of_truth: ${frontmatter.source_of_truth}`,
    "related_docs:",
    ...frontmatter.related_docs.map((doc) => `  - ${doc}`),
    "---",
    "<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->",
    body.trim(),
    "<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->",
    ""
  ].join("\n");
}

const studioModules = scanModuleRoot("apps/studio/src/modules");
const bootstrapFiles = fs.existsSync(path.join(root, "scripts", "compounding_bootstrap"))
  ? fs.readdirSync(path.join(root, "scripts", "compounding_bootstrap"), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".py") && entry.name !== "__init__.py")
      .map((entry) => ({ name: entry.name.replace(/\.py$/, ""), path: path.join("scripts/compounding_bootstrap", entry.name).replace(/\\/g, "/") }))
  : [];

const functionIndex = [];
for (const moduleInfo of studioModules) {
  const moduleDir = path.join(root, moduleInfo.path);
  for (const entry of fs.readdirSync(moduleDir)) {
    const full = path.join(moduleDir, entry);
    if (!fs.statSync(full).isFile() || !/\.(ts|tsx)$/.test(entry) || entry === "module.md") continue;
    for (const symbol of readFunctions(full)) {
      functionIndex.push({ module: moduleInfo.path, file: path.relative(root, full).replace(/\\/g, "/"), symbol, kind: "function", language: "TypeScript", exported: true });
    }
  }
}
for (const moduleInfo of bootstrapFiles) {
  const full = path.join(root, moduleInfo.path);
  for (const symbol of readFunctions(full)) {
    functionIndex.push({ module: "scripts/compounding_bootstrap", file: moduleInfo.path, symbol, kind: "function", language: "Python", exported: !symbol.startsWith("_") });
  }
}

const moduleIndex = [
  "# 模块索引",
  "",
  "## 前端模块",
  "",
  ...studioModules.map((item) => `- \`${item.path}\``),
  "",
  "## Bootstrap 引擎模块",
  "",
  ...bootstrapFiles.map((item) => `- \`${item.path}\``),
  "",
  "## 修改前先看",
  "",
  "- 先读对应 `module.md`",
  "- 再读相关 task / docs / memory / code_index",
  "",
].join("\n");
const dependencyMap = [
  "# 依赖图",
  "",
  "## 允许的依赖方向",
  "",
  "- `apps/studio/src/app/*` -> `apps/studio/src/modules/*`",
  "- `scripts/init_project_compounding.py` -> `scripts/compounding_bootstrap/engine.py` -> split modules",
  "- `scripts/ai/*` -> docs / memory / code_index / tasks",
  "",
  "## 禁止的依赖方向",
  "",
  "- app 层直接读取任意仓库文件而绕过模块仓储层",
  "- 模块之间跨层访问私有实现",
  "- 任务、记忆、索引互相覆盖职责",
  "",
].join("\n");

fs.mkdirSync(path.dirname(moduleIndexPath), { recursive: true });
fs.writeFileSync(moduleIndexPath, renderManagedDoc("code_index/module-index.md", moduleIndex));
fs.writeFileSync(dependencyMapPath, renderManagedDoc("code_index/dependency-map.md", dependencyMap));
fs.writeFileSync(functionIndexPath, JSON.stringify(functionIndex, null, 2) + "\n");
console.log(JSON.stringify({ studioModules: studioModules.length, bootstrapModules: bootstrapFiles.length, functions: functionIndex.length }, null, 2));
