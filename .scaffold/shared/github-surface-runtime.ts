import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildGithubSurfaceReadinessReport, type GithubSurfaceReadinessReport } from "./github-surface.ts";

type GithubSurfaceContractSnapshot = {
  enabled: boolean;
  provider: string;
  owner: string;
  repo: string;
  remoteName: string;
  defaultBranch: string;
  requiredChecks: string[];
};

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function stripQuotes(value: string) {
  const text = normalizeString(value);
  if (!text) return "";
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseBoolean(value: string, fallback = false) {
  const text = normalizeString(value).toLowerCase();
  if (text === "true") return true;
  if (text === "false") return false;
  return fallback;
}

function readGithubSurfaceContract(root: string): GithubSurfaceContractSnapshot {
  const contractPath = path.join(root, "bootstrap", "project_operator.yaml");
  if (!fs.existsSync(contractPath)) {
    return {
      enabled: false,
      provider: "github",
      owner: "",
      repo: "",
      remoteName: "origin",
      defaultBranch: "main",
      requiredChecks: [],
    };
  }

  const lines = fs.readFileSync(contractPath, "utf8").split(/\r?\n/);
  const contract: GithubSurfaceContractSnapshot = {
    enabled: false,
    provider: "github",
    owner: "",
    repo: "",
    remoteName: "origin",
    defaultBranch: "main",
    requiredChecks: [],
  };

  let inGithubSurface = false;
  let listKey: string | null = null;

  for (const rawLine of lines) {
    const indent = rawLine.length - rawLine.trimStart().length;
    const text = rawLine.trim();
    if (!inGithubSurface) {
      if (text === "github_surface:") inGithubSurface = true;
      continue;
    }
    if (!text || text.startsWith("#")) continue;
    if (indent === 0) break;

    if (indent === 2 && !text.startsWith("-")) {
      listKey = null;
      const separator = text.indexOf(":");
      if (separator === -1) continue;
      const key = text.slice(0, separator).trim();
      const rawValue = text.slice(separator + 1).trim();
      if (key === "required_checks") {
        contract.requiredChecks = rawValue === "[]" ? [] : contract.requiredChecks;
        listKey = "required_checks";
        continue;
      }
      if (key === "enabled") contract.enabled = parseBoolean(rawValue, contract.enabled);
      if (key === "provider") contract.provider = stripQuotes(rawValue) || contract.provider;
      if (key === "owner") contract.owner = stripQuotes(rawValue);
      if (key === "repo") contract.repo = stripQuotes(rawValue);
      if (key === "remote_name") contract.remoteName = stripQuotes(rawValue) || contract.remoteName;
      if (key === "default_branch") contract.defaultBranch = stripQuotes(rawValue) || contract.defaultBranch;
      continue;
    }

    if (listKey === "required_checks" && indent >= 4 && text.startsWith("-")) {
      const value = stripQuotes(text.slice(1).trim());
      if (value) contract.requiredChecks.push(value);
    }
  }

  return contract;
}

function runGit(root: string, args: string[]) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  return normalizeString(result.stdout);
}

function getBranchUpstream(root: string, branch: string) {
  if (!branch) return null;
  return runGit(root, ["for-each-ref", "--format=%(upstream:short)", `refs/heads/${branch}`]) || null;
}

export function getGithubSurfaceReadiness(root = process.cwd()): GithubSurfaceReadinessReport {
  const contract = readGithubSurfaceContract(root);
  const activeBranch = runGit(root, ["branch", "--show-current"]) || contract.defaultBranch;
  const originUrl = runGit(root, ["remote", "get-url", contract.remoteName]) || null;

  return buildGithubSurfaceReadinessReport({
    enabled: contract.enabled,
    provider: contract.provider,
    owner: contract.owner,
    repo: contract.repo,
    remoteName: contract.remoteName,
    defaultBranch: contract.defaultBranch,
    requiredChecks: contract.requiredChecks,
    activeBranch,
    originUrl,
    defaultBranchUpstream: getBranchUpstream(root, contract.defaultBranch),
    activeBranchUpstream: getBranchUpstream(root, activeBranch),
  });
}

export function formatGithubSurfaceReadiness(report: GithubSurfaceReadinessReport) {
  return [
    `GitHub 接入状态：${report.summary}`,
    `下一步：${report.nextAction}`,
    `当前分支：${report.activeBranch}`,
    `远端：${report.originUrl ? `${report.remoteName} -> ${report.originUrl}` : `${report.remoteName}（未配置）`}`,
    `仓库：${report.repoLabel || "未配置"}`,
    `缺口数：${report.missingCount}`,
    "",
    ...report.steps.map((step) =>
      `${step.done ? "[x]" : "[ ]"} ${step.label}：${step.detail}${step.action ? `；${step.action}` : ""}`
    ),
    "",
  ].join("\n");
}
