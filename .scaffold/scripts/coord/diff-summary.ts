#!/usr/bin/env node
/**
 * Diff summary generator: human-readable comparison of two versions.
 * Usage: node --experimental-strip-types scripts/coord/diff-summary.ts --refA=main --refB=HEAD [--taskId=t-027]
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { loadManifest } = require("./lib/manifest.ts");

const ROOT = process.cwd();

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return args;
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function getDiffStat(refA, refB) {
  const out = git(["diff", "--stat", refA, refB]);
  if (!out) return { files: [], insertions: 0, deletions: 0 };
  const lines = out.split("\n").filter(Boolean);
  const summary = lines.pop() || "";
  const m = summary.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
  const insertions = m ? parseInt(m[2] || "0", 10) : 0;
  const deletions = m ? parseInt(m[3] || "0", 10) : 0;
  const files = lines.map((l) => {
    const pipeIdx = l.indexOf("|");
    return pipeIdx >= 0 ? l.slice(0, pipeIdx).trim() : l.split(/\s+/)[0]?.trim();
  }).filter(Boolean);
  return { files, insertions, deletions };
}

function getDiffSummary(refA, refB) {
  const out = git(["diff", "--no-color", refA, refB]);
  if (!out) return "";
  const lines = out.split("\n");
  const summary = [];
  let currentFile = "";
  let changeCount = 0;
  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const m = line.match(/diff --git a\/(.+?) b\//);
      currentFile = m ? m[1] : "";
      changeCount = 0;
    } else if (line.startsWith("@@") && currentFile) {
      changeCount++;
      if (changeCount <= 3) {
        const m = line.match(/@@ -(\d+,\d+) \+(\d+,\d+) @@/);
        summary.push(`  - ${currentFile}: ${m ? `行 ${m[1]} → ${m[2]}` : "有改动"}`);
      }
    }
  }
  return summary.join("\n") || "无结构化差异";
}

function classifyFiles(files, manifest) {
  const core = [];
  const high = [];
  const normal = [];
  for (const f of files) {
    const entry = manifest.files?.[f];
    if (entry?.risk_level === "core") core.push(f);
    else if (entry?.risk_level === "high_conflict") high.push(f);
    else normal.push(f);
  }
  return { core, high, normal };
}

function main() {
  const args = parseArgs();
  const refA = args.refA || "main";
  const refB = args.refB || "HEAD";
  const taskId = args.taskId || null;

  const stat = getDiffStat(refA, refB);
  const summary = getDiffSummary(refA, refB);

  let manifest = { files: {} };
  try {
    manifest = loadManifest();
  } catch (_) {}

  const { core, high, normal } = classifyFiles(stat.files, manifest);

  const diffSummary = {
    ref_a: refA,
    ref_b: refB,
    task_id: taskId,
    generated_at: new Date().toISOString(),
    file_count: stat.files.length,
    insertions: stat.insertions,
    deletions: stat.deletions,
    risk_breakdown: {
      core_count: core.length,
      high_conflict_count: high.length,
      normal_count: normal.length,
    },
    core_files: core.slice(0, 10),
    high_conflict_files: high.slice(0, 10),
    human_readable: `版本 ${refA} → ${refB}

- 改动文件数: ${stat.files.length}
- 新增行: ${stat.insertions}, 删除行: ${stat.deletions}
- 核心文件: ${core.length} 个
- 高冲突文件: ${high.length} 个

主要改动:
${summary}`,
  };

  const safeA = refA.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeB = refB.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outputPath = path.join(ROOT, "agent-coordination", "reports", `diff-summary-${safeA}-${safeB}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(diffSummary, null, 2) + "\n");

  const output = { ok: true, path: outputPath, diff_summary: diffSummary };
  console.log(JSON.stringify(output, null, 2));
}

main();
