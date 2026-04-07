#!/usr/bin/env node
/**
 * Generate a compact code-volume snapshot for the active repo.
 *
 * The report separates:
 * - code-like files: executable source and support files
 * - docs: markdown and knowledge assets
 * - other: everything text-like that does not fit the first two buckets
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const { getDerivedAssetObservationIgnoredDirs } = require(path.join(ROOT, "shared", "derived-asset-contract.ts"));
const OUTPUT_DIR = path.join(ROOT, "output", "pipeline", "state", "code-volume");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "latest.json");
const OUTPUT_MD = path.join(OUTPUT_DIR, "latest.md");

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "__pycache__",
  ".pytest_cache",
  ...getDerivedAssetObservationIgnoredDirs(ROOT),
]);
const IGNORE_FILES = new Set([".DS_Store"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".sh"]);
const SUPPORT_EXTS = new Set([".json", ".yaml", ".yml", ".toml", ".css", ".scss", ".tmpl", ".conf"]);
const DOC_EXTS = new Set([".md"]);
const ROOT_ORDER = ["apps", "bootstrap", "code_index", "deploy", "docs", "memory", "scripts", "shared", "tasks", "tests", ".github", "<root>"];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name) || IGNORE_FILES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (IGNORE_DIRS.has(path.basename(rel))) continue;
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(rel);
  }
  return files;
}

function classify(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  const lower = relPath.toLowerCase();
  if (
    lower.startsWith("docs/") ||
    lower.startsWith("memory/") ||
    lower.startsWith("tasks/") ||
    lower.startsWith("code_index/") ||
    relPath === "AGENTS.md" ||
    relPath === "README.md"
  ) {
    return "docs";
  }
  if (CODE_EXTS.has(ext)) return "code";
  if (SUPPORT_EXTS.has(ext)) return "support";
  return "other";
}

function lineCount(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function nonEmptyLineCount(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function rootBucket(relPath) {
  const parts = relPath.split("/");
  if (parts.length === 1) return "<root>";
  return ROOT_ORDER.includes(parts[0]) ? parts[0] : "<root>";
}

function scan() {
  const files = walk(ROOT);
  const fileRows = [];
  const summary = {
    code: { files: 0, lines: 0, non_empty_lines: 0 },
    support: { files: 0, lines: 0, non_empty_lines: 0 },
    docs: { files: 0, lines: 0, non_empty_lines: 0 },
    other: { files: 0, lines: 0, non_empty_lines: 0 },
  };
  const byRoot = {};

  for (const relPath of files.sort()) {
    try {
      const raw = fs.readFileSync(path.join(ROOT, relPath), "utf8");
      const kind = classify(relPath);
      const lines = lineCount(raw);
      const nonEmptyLines = nonEmptyLineCount(raw);
      const root = rootBucket(relPath);

      summary[kind].files += 1;
      summary[kind].lines += lines;
      summary[kind].non_empty_lines += nonEmptyLines;

      byRoot[root] ||= { files: 0, lines: 0, non_empty_lines: 0, code_files: 0, code_lines: 0, support_files: 0, support_lines: 0, docs_files: 0, docs_lines: 0, other_files: 0, other_lines: 0 };
      byRoot[root].files += 1;
      byRoot[root].lines += lines;
      byRoot[root].non_empty_lines += nonEmptyLines;
      if (kind === "code") {
        byRoot[root].code_files += 1;
        byRoot[root].code_lines += lines;
      } else if (kind === "support") {
        byRoot[root].support_files += 1;
        byRoot[root].support_lines += lines;
      } else if (kind === "docs") {
        byRoot[root].docs_files += 1;
        byRoot[root].docs_lines += lines;
      } else {
        byRoot[root].other_files += 1;
        byRoot[root].other_lines += lines;
      }

      fileRows.push({
        path: relPath,
        kind,
        lines,
        non_empty_lines: nonEmptyLines,
      });
    } catch {
      // Skip binary or unreadable files. The snapshot is for text assets only.
    }
  }

  fileRows.sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));

  return { summary, byRoot, fileRows };
}

function renderMarkdown(snapshot) {
  const roots = Object.entries(snapshot.by_root)
    .sort((left, right) => right[1].lines - left[1].lines || left[0].localeCompare(right[0]))
    .slice(0, 12);

  const topFiles = snapshot.top_files.slice(0, 20);

  const rows = [
    "# Code Volume Snapshot",
    "",
    `- Generated at: ${snapshot.generated_at}`,
    `- Source of truth: workspace filesystem`,
    `- Scope: text assets outside output / agent-coordination / runtime caches`,
    "",
    "## Totals",
    "",
    `- Code-like files: ${snapshot.summary.code.files}`,
    `- Code-like lines: ${snapshot.summary.code.lines}`,
    `- Support files: ${snapshot.summary.support.files}`,
    `- Support lines: ${snapshot.summary.support.lines}`,
    `- Docs files: ${snapshot.summary.docs.files}`,
    `- Docs lines: ${snapshot.summary.docs.lines}`,
    `- Other files: ${snapshot.summary.other.files}`,
    `- Other lines: ${snapshot.summary.other.lines}`,
    `- Non-empty lines: ${snapshot.summary.code.non_empty_lines + snapshot.summary.support.non_empty_lines + snapshot.summary.docs.non_empty_lines + snapshot.summary.other.non_empty_lines}`,
    "",
    "## By Root",
    "",
    "| Root | Files | Lines | Non-empty | Code lines | Support lines | Docs lines | Other lines |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...roots.map(([root, stats]) => `| ${root} | ${stats.files} | ${stats.lines} | ${stats.non_empty_lines} | ${stats.code_lines} | ${stats.support_lines} | ${stats.docs_lines} | ${stats.other_lines} |`),
    "",
    "## Top Files",
    "",
    "| Path | Kind | Lines | Non-empty |",
    "| --- | --- | ---: | ---: |",
    ...topFiles.map((item) => `| \`${item.path}\` | ${item.kind} | ${item.lines} | ${item.non_empty_lines} |`),
    "",
  ];

  return rows.join("\n");
}

function main() {
  const snapshot = scan();
  const payload = {
    generated_at: new Date().toISOString(),
    source_of_truth: "workspace filesystem",
    source_script: "scripts/ai/generate-code-volume.ts",
    excluded_dirs: Array.from(IGNORE_DIRS),
    summary: snapshot.summary,
    by_root: snapshot.byRoot,
    top_files: snapshot.fileRows.slice(0, 50),
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(payload), "utf8");
  console.log(JSON.stringify({ ok: true, code_like_lines: payload.summary.code.lines, docs_lines: payload.summary.docs.lines, path: OUTPUT_JSON }, null, 2));
}

main();
