const fs = require("node:fs");
const path = require("node:path");
const { getDerivedAssetObservationIgnoredPrefixes } = require(path.join(process.cwd(), "shared", "derived-asset-contract.ts"));

const DERIVED_OBSERVATION_PREFIXES = getDerivedAssetObservationIgnoredPrefixes(process.cwd());

function normalizePath(value) {
  return String(value || "")
    .trim()
    .replace(/^\.?\//, "")
    .replace(/\\/g, "/");
}

function ownerCluster(relPath) {
  const normalized = normalizePath(relPath);
  if (!normalized) {
    return "";
  }
  if (normalized === "AGENTS.md" || normalized === "README.md") {
    return normalized;
  }
  if (normalized.startsWith("apps/studio/src/modules/")) {
    return normalized.split("/").slice(0, 4).join("/");
  }
  if (normalized.startsWith("scripts/")) {
    return normalized.split("/").slice(0, 2).join("/");
  }
  if (normalized.startsWith("memory/project/")) {
    return "memory/project";
  }
  if (normalized.startsWith("memory/")) {
    return normalized.split("/").slice(0, 2).join("/");
  }
  if (normalized.startsWith("docs/")) {
    return normalized.split("/").slice(0, 2).join("/");
  }
  if (normalized.startsWith("tasks/queue/")) {
    return "tasks/queue";
  }
  return normalized.includes("/") ? normalized.split("/").slice(0, 2).join("/") : normalized;
}

function detectExecutionMode(paths) {
  return paths.some((item) => /\.(ts|tsx|py|js|jsx|mjs|cjs)$/.test(item)) ? "structural" : "light";
}

function isRuntimeSensitive(paths, text = "") {
  const lower = String(text || "").toLowerCase();
  const pathSensitive = paths.some((item) => {
    const normalized = normalizePath(item);
    return (
      normalized.startsWith("scripts/local-runtime/") ||
      normalized.startsWith("scripts/release/") ||
      normalized.startsWith("deploy/") ||
      DERIVED_OBSERVATION_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    );
  });
  return pathSensitive || /(runtime|release|rollback|systemd|reverse proxy|prod\b|preview\b|remote)/.test(lower);
}

function createCandidate(category, title, paths, whyNow, evidence, score = 0) {
  const uniquePaths = Array.from(new Set(paths.map(normalizePath).filter(Boolean)));
  return {
    id: `${category}:${uniquePaths.join("|") || title}`,
    category,
    title,
    owner_cluster: uniquePaths.length > 0 ? ownerCluster(uniquePaths[0]) : "",
    paths: uniquePaths,
    why_now: whyNow,
    evidence,
    execution_mode: detectExecutionMode(uniquePaths),
    score,
  };
}

function mergeCandidate(map, candidate) {
  const existing = map.get(candidate.id);
  if (!existing) {
    map.set(candidate.id, candidate);
    return;
  }
  existing.score = Math.max(existing.score, candidate.score);
  existing.evidence = Array.from(new Set([...(existing.evidence || []), ...(candidate.evidence || [])]));
  if (!existing.why_now && candidate.why_now) {
    existing.why_now = candidate.why_now;
  }
}

function parseTechDebtItems(markdown) {
  return String(markdown || "")
    .split(/\r?\n/)
    .map((line) => line.match(/^\d+\.\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function extractBacktickPaths(text) {
  return Array.from(text.matchAll(/`([^`]+)`/g))
    .map((match) => normalizePath(match[1]))
    .filter(Boolean);
}

function filterEligibleCandidates(candidates) {
  return candidates
    .filter((candidate) => candidate.paths.length > 0)
    .filter((candidate) => {
      const clusters = Array.from(new Set(candidate.paths.map(ownerCluster).filter(Boolean)));
      return clusters.length <= 1;
    })
    .filter((candidate) => !isRuntimeSensitive(candidate.paths, `${candidate.title} ${candidate.why_now} ${(candidate.evidence || []).join(" ")}`))
    .map((candidate) => ({
      ...candidate,
      owner_cluster: ownerCluster(candidate.paths[0]),
      paths: Array.from(new Set(candidate.paths)),
    }))
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

function buildCleanupCandidates(inputs) {
  const map = new Map();
  const codeHealth = inputs.codeHealth || {};
  const knowledgeHealth = inputs.knowledgeHealth || { details: { stale_files: [] } };
  const codeVolume = inputs.codeVolume || { top_files: [] };
  const techDebtMarkdown = inputs.techDebtMarkdown || "";

  for (const stale of knowledgeHealth.details?.stale_files || []) {
    mergeCandidate(
      map,
      createCandidate(
        "stale-doc",
        `刷新 ${stale.file} 的主源时效`,
        [stale.file],
        `${stale.file} 已超出 ${stale.freshness_window_days} 天 freshness window（当前 ${stale.days_since_review} 天）。`,
        [`knowledge freshness`, `asset:${stale.asset_id}`],
        90
      )
    );
  }

  for (const item of codeHealth.largeFiles || []) {
    mergeCandidate(
      map,
      createCandidate(
        "large-file",
        `收口超软上限文件 ${item.file}`,
        [item.file],
        `${item.file} 目前 ${item.lines} 行，已高于 250 行软上限。`,
        [`code health`, item.overHardLimit ? "over hard limit" : "over soft limit"],
        item.overHardLimit ? 85 : 70
      )
    );
  }

  for (const item of codeHealth.missingModuleDocs || []) {
    mergeCandidate(
      map,
      createCandidate(
        "missing-module-doc",
        `补齐 ${ownerCluster(item)} 的 module.md`,
        [item],
        `${ownerCluster(item)} 仍缺少 module.md，会削弱导航与上下文构建质量。`,
        ["code health", "missing module doc"],
        72
      )
    );
  }

  for (const item of codeHealth.todos || []) {
    mergeCandidate(
      map,
      createCandidate(
        "todo-cleanup",
        `清理 ${item} 中遗留的 TODO/FIXME`,
        [item],
        `${item} 仍包含 TODO/FIXME 标记，适合收成一次小型熵减。`,
        ["code health", "todo marker"],
        55
      )
    );
  }

  for (const item of codeHealth.suspiciousNames || []) {
    mergeCandidate(
      map,
      createCandidate(
        "naming-cleanup",
        `收口命名含混文件 ${item}`,
        [item],
        `${item} 命名仍属于可疑通用名，后续上下文和 ownership 容易继续漂移。`,
        ["code health", "suspicious name"],
        48
      )
    );
  }

  for (const item of codeVolume.top_files || []) {
    if (item.kind !== "docs" || item.lines < 220 || !/\.md$/.test(item.path)) {
      continue;
    }
    mergeCandidate(
      map,
      createCandidate(
        "oversized-doc",
        `拆分或瘦身超大文档 ${item.path}`,
        [item.path],
        `${item.path} 目前 ${item.lines} 行，已经进入仓库 top files，适合评估是否继续瘦身或拆分。`,
        ["code volume", `top file:${item.lines}`],
        60
      )
    );
  }

  for (const item of parseTechDebtItems(techDebtMarkdown)) {
    const paths = extractBacktickPaths(item);
    if (paths.length === 0) {
      continue;
    }
    const clusters = Array.from(new Set(paths.map(ownerCluster).filter(Boolean)));
    if (clusters.length !== 1) {
      continue;
    }
    mergeCandidate(
      map,
      createCandidate(
        "tech-debt",
        `消化技术债里已点名的 ${clusters[0]} 收口项`,
        paths,
        `当前技术债已明确点名 ${paths.join("、")}，且仍落在单一模块簇内，适合转成一次小型收口。`,
        ["tech debt"],
        58
      )
    );
  }

  return filterEligibleCandidates(Array.from(map.values())).map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
  }));
}

function renderCleanupCandidatesMarkdown(payload) {
  const lines = [
    "# Cleanup Candidates",
    "",
    `- Generated at: ${payload.generated_at}`,
    `- Candidate count: ${payload.candidate_count}`,
    `- Source signals: ${payload.sources.join("、")}`,
    "",
  ];

  if (payload.candidate_count === 0) {
    lines.push("当前没有符合“单模块或单文档簇、无 runtime topology 变更、可在一个 task 内闭环”的 cleanup 候选。", "");
    return lines.join("\n");
  }

  for (const candidate of payload.candidates) {
    lines.push(`## ${candidate.rank}. ${candidate.title}`, "");
    lines.push(`- 类别：\`${candidate.category}\``);
    lines.push(`- 所属簇：\`${candidate.owner_cluster}\``);
    lines.push(`- 建议执行级别：\`${candidate.execution_mode}\``);
    lines.push(`- 路径：${candidate.paths.map((item) => `\`${item}\``).join("、")}`);
    lines.push(`- Why now：${candidate.why_now}`);
    lines.push(`- 证据：${candidate.evidence.map((item) => `\`${item}\``).join("、")}`);
    lines.push("");
  }

  return lines.join("\n");
}

module.exports = {
  buildCleanupCandidates,
  renderCleanupCandidatesMarkdown,
};
