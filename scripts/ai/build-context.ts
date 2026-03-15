const fs = require("node:fs");
const path = require("node:path");
const { extractSection, parseMarkdownSections } = require("./lib/markdown-sections.ts");

const taskPath = process.argv[2];
if (!taskPath) {
  console.error("Usage: node --experimental-strip-types scripts/ai/build-context.ts <task-path>");
  process.exit(1);
}

const root = process.cwd();
const relTask = taskPath.replace(/^\/+/, "");
const taskId = path.basename(relTask, path.extname(relTask));
const taskAbsolute = path.join(root, relTask);

function readIfExists(relPath) {
  const absolute = path.join(root, relPath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeModuleToken(token) {
  return token.replace(/`/g, "").replace(/\/\*$/, "").trim();
}

function extractRelatedModules(taskSections) {
  const raw = taskSections["Related Modules"] || taskSections["关联模块"] || "";
  const inline = Array.from(raw.matchAll(/`([^`]+)`/g)).map((match) => match[1]);
  const bullets = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean);
  return unique([...inline, ...bullets].map(normalizeModuleToken));
}

function loadFunctionIndex() {
  const absolute = path.join(root, "code_index", "function-index.json");
  if (!fs.existsSync(absolute)) return [];
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

function findModuleDocs(relatedModules) {
  return unique(
    relatedModules
      .map((modulePath) => path.join(modulePath, "module.md").replace(/\\/g, "/"))
      .filter((relPath) => fs.existsSync(path.join(root, relPath)))
  );
}

function findRelevantFunctions(relatedModules) {
  const functionIndex = loadFunctionIndex();
  return functionIndex.filter((entry) =>
    relatedModules.some((modulePath) => entry.module.startsWith(modulePath) || entry.file.startsWith(modulePath))
  );
}

function buildKeywords(taskSections, relatedModules) {
  const combined = [
    taskSections.Goal || taskSections["目标"],
    taskSections.Why || taskSections["为什么"] || taskSections["原因"],
    taskSections.Scope || taskSections["范围"],
    taskSections.Constraints || taskSections["约束"],
    ...relatedModules,
  ]
    .filter(Boolean)
    .join(" ");
  const matches = combined.match(/[\u4e00-\u9fff]{2,}|[A-Za-z][A-Za-z0-9_-]{3,}/g) || [];
  return unique(matches.map((item) => item.toLowerCase())).slice(0, 18);
}

function findRelevantMemoryDocs(keywords, relatedModules) {
  const memoryRoot = path.join(root, "memory");
  if (!fs.existsSync(memoryRoot)) return [];
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) files.push(full);
    }
  }

  walk(memoryRoot);
  const moduleKeywords = relatedModules
    .flatMap((item) => item.split("/"))
    .map((item) => item.toLowerCase())
    .filter(Boolean);
  const allKeywords = unique([...keywords, ...moduleKeywords]);

  return files
    .map((absolute) => {
      const text = fs.readFileSync(absolute, "utf8").toLowerCase();
      const score = allKeywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);
      return { rel: path.relative(root, absolute).replace(/\\/g, "/"), score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel))
    .slice(0, 5)
    .map((item) => item.rel);
}

function renderFileSection(relPath) {
  const text = readIfExists(relPath);
  if (!text) return "";
  return `## ${relPath}\n\n${text.slice(0, 8000)}\n`;
}

const taskContent = readIfExists(relTask);
if (!taskContent) {
  console.error(`Task not found: ${relTask}`);
  process.exit(1);
}

const taskSections = parseMarkdownSections(taskContent);
const relatedModules = extractRelatedModules(taskSections);
const relevantFunctions = findRelevantFunctions(relatedModules);
const keywords = buildKeywords(taskSections, relatedModules);
const moduleDocs = findModuleDocs(relatedModules);
const memoryDocs = findRelevantMemoryDocs(keywords, relatedModules);

const baseFiles = [
  "AGENTS.md",
  "docs/PROJECT_RULES.md",
  "docs/ARCHITECTURE.md",
  "docs/DEV_WORKFLOW.md",
  "docs/AI_OPERATING_MODEL.md",
  relTask,
  "memory/project/current-state.md",
  "memory/project/roadmap.md",
  "code_index/module-index.md",
  "code_index/dependency-map.md",
];

const includedFiles = unique([...baseFiles, ...moduleDocs, ...memoryDocs]);

let output = "# Context Packet\n\n";
output += `- Task: \`${relTask}\`\n`;
output += `- Related Modules: ${relatedModules.length ? relatedModules.map((item) => `\`${item}\``).join(", ") : "none"}\n`;
output += `- Memory Matches: ${memoryDocs.length ? memoryDocs.map((item) => `\`${item}\``).join(", ") : "none"}\n`;
output += `- Function Hits: ${relevantFunctions.length}\n\n`;

output += "## Task Summary\n\n";
output += `- Goal: ${taskSections.Goal || taskSections["目标"] || "n/a"}\n`;
output += `- Why: ${taskSections.Why || taskSections["为什么"] || taskSections["原因"] || "n/a"}\n`;
output += `- Scope: ${taskSections.Scope || taskSections["范围"] || "n/a"}\n`;
output += `- Constraints: ${taskSections.Constraints || taskSections["约束"] || "n/a"}\n`;

const updateTrace = extractSection(taskContent, "update_trace", root);
if (updateTrace) {
  output += `- Update Trace:\n${updateTrace
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `  - ${line}`)
    .join("\n")}\n\n`;
} else {
  output += "\n";
}

output += "## Relevant Function Index\n\n";
output += "```json\n";
output += JSON.stringify(relevantFunctions.slice(0, 40), null, 2);
output += "\n```\n\n";

for (const relPath of includedFiles) {
  output += renderFileSection(relPath);
  output += "\n";
}

const outputPath = path.join(root, "output", "ai", "context", `${taskId}.md`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(outputPath);
