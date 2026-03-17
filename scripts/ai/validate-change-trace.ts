const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { extractSection } = require("./lib/markdown-sections.ts");

const root = process.cwd();

function git(args) {
  return childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function currentBranch() {
  return git(["branch", "--show-current"]);
}

function listChangedFiles() {
  const status = git(["status", "--short"]);
  if (status) {
    return status
      .split("\n")
      .map((line) => {
        const match = line.match(/^.. (.+)$/);
        if (!match) {
          return "";
        }
        const value = match[1].trim();
        return value.includes(" -> ") ? value.split(" -> ").at(-1)?.trim() ?? "" : value;
      })
      .filter(Boolean);
  }

  try {
    const previous = git(["rev-parse", "HEAD^"]);
    return git(["diff", "--name-only", `${previous}..HEAD`])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function parseTrace(content) {
  const trace = extractSection(content, "update_trace", root);
  if (!trace) {
    return null;
  }

  return {
    memory: extractTraceValue(trace, "记忆"),
    index: extractTraceValue(trace, "索引"),
    roadmap: extractTraceValue(trace, "路线图"),
    docs: extractTraceValue(trace, "文档"),
  };
}

function extractTraceValue(trace, label) {
  const line = trace.split(/\r?\n/).find((item) => {
    const normalized = item.trim().replace(/^-\s*/, "");
    return normalized.startsWith(`${label}：`) || normalized.startsWith(`${label}:`);
  });
  if (!line) {
    return "";
  }
  return line
    .trim()
    .replace(/^-\s*/, "")
    .split(/[:：]/)
    .slice(1)
    .join(":")
    .replace(/`/g, "")
    .trim();
}

function isNoChange(value) {
  return value.replace(/`/g, "").toLowerCase().startsWith("no change:");
}

function parseReferencedPaths(value) {
  return value
    .replace(/`/g, "")
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateTask(taskPath, changedFiles, errors) {
  const content = read(taskPath);
  const trace = parseTrace(content);
  if (!trace) {
    errors.push(`${taskPath}: 缺少“更新痕迹”区块。`);
    return;
  }

  const requiredSections = [
    ["当前模式", extractSection(content, "current_mode", root)],
    ["分支", extractSection(content, "branch", root)],
    ["最近提交", extractSection(content, "recent_commit", root)],
    ["状态", extractSection(content, "status", root)],
  ];
  for (const [label, value] of requiredSections) {
    if (!String(value || "").trim()) {
      errors.push(`${taskPath}: 缺少必填字段“${label}”。`);
    }
  }

  for (const [label, value] of Object.entries(trace)) {
    if (!value) {
      errors.push(`${taskPath}: ${label} 未填写。`);
      continue;
    }
    if (isNoChange(value)) {
      continue;
    }
    const referenced = parseReferencedPaths(value);
    if (referenced.length === 0) {
      errors.push(`${taskPath}: ${label} 没有给出有效路径。`);
      continue;
    }
    const matched = referenced.some((relPath) => changedFiles.includes(relPath));
    if (!matched) {
      errors.push(`${taskPath}: ${label} 指向的路径未出现在本次改动中。`);
    }
  }
}

function main() {
  const changedFiles = listChangedFiles().filter((file) => !file.startsWith("output/"));
  if (changedFiles.length === 0) {
    console.log(JSON.stringify({ ok: true, message: "No repo-tracked changes to validate.", changed_files: [] }, null, 2));
    return;
  }

  const changedTaskFiles = changedFiles.filter((file) => file.startsWith("tasks/queue/") && file.endsWith(".md"));
  const errors = [];
  const activeBranch = currentBranch();

  if (changedTaskFiles.length === 0) {
    errors.push("存在 repo-tracked 改动，但没有任何 tasks/queue/*.md 变更。");
  }

  changedTaskFiles.forEach((taskPath) => validateTask(taskPath, changedFiles, errors));

  if (activeBranch.startsWith("codex/") && changedTaskFiles.length > 0) {
    const matchingBranchTask = changedTaskFiles.some((taskPath) => {
      const content = read(taskPath);
      const branch = String(extractSection(content, "branch", root) || "").replace(/`/g, "").trim();
      return branch === activeBranch;
    });
    if (!matchingBranchTask) {
      errors.push(`当前分支 ${activeBranch} 有代码改动，但本次变更的 task 中没有任何一个绑定到该分支。`);
    }
  }

  const ok = errors.length === 0;
  const payload = {
    ok,
    changed_files: changedFiles,
    changed_tasks: changedTaskFiles,
    errors,
  };

  console.log(JSON.stringify(payload, null, 2));
  if (!ok) {
    process.exit(1);
  }
}

main();
