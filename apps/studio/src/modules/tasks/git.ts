import { execFileSync } from "node:child_process";
import { getWorkspaceRoot } from "@/lib/workspace";
import type { TaskBranchCleanupView } from "../../../../../shared/branch-cleanup";
import type { TaskGitInfo, TaskStatus } from "./types";

type GitResult = {
  ok: boolean;
  output: string;
};

function runGit(args: string[]): GitResult {
  try {
    return {
      ok: true,
      output: execFileSync("git", args, {
        cwd: getWorkspaceRoot(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      output: error instanceof Error ? error.message : "",
    };
  }
}

function getCurrentBranch() {
  const result = runGit(["branch", "--show-current"]);
  return result.ok ? result.output : "";
}

function hasDirtyWorktree() {
  const result = runGit(["status", "--short"]);
  return Boolean(result.ok && result.output.trim());
}

function branchExists(branch: string) {
  return runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).ok;
}

function getBranchHead(branch: string) {
  const result = runGit(["rev-parse", branch]);
  return result.ok ? result.output : "";
}

function commitExists(commit: string) {
  return Boolean(commit) && runGit(["cat-file", "-e", `${commit}^{commit}`]).ok;
}

function shortSha(ref: string) {
  const result = runGit(["rev-parse", "--short", ref]);
  return result.ok ? result.output : ref;
}

function isCommitMergedIntoMain(commit: string) {
  return Boolean(commit) && runGit(["merge-base", "--is-ancestor", commit, "main"]).ok;
}

function isLegacyMainBranch(branch: string) {
  return branch === "main" || branch.startsWith("main ");
}

function cleanValue(value: string) {
  return value.replace(/`/g, "").trim();
}

function isPendingCommit(value: string) {
  const normalized = cleanValue(value).toLowerCase();
  return !normalized || normalized === "pending" || normalized === "auto" || normalized.startsWith("auto:");
}

function isHistoricalMergedBranch(status: TaskStatus, branch: string, currentBranch: string, localBranchExists: boolean, effectiveCommit: string) {
  return status === "done" && Boolean(branch) && !isLegacyMainBranch(branch) && !localBranchExists && branch !== currentBranch && !effectiveCommit;
}

function isManagedCleanupState(cleanup: TaskBranchCleanupView | null | undefined) {
  return cleanup?.overallState === "scheduled" || cleanup?.overallState === "deleted" || cleanup?.overallState === "failed";
}

export function resolveTaskGitInfo(
  status: TaskStatus,
  branchValue: string,
  recentCommitValue: string,
  branchCleanup: TaskBranchCleanupView | null = null,
): TaskGitInfo {
  const branch = cleanValue(branchValue);
  const storedCommit = isPendingCommit(recentCommitValue) ? "" : cleanValue(recentCommitValue);
  const cleanupCommit = cleanValue(branchCleanup?.sourceCommit || "");
  const currentBranch = getCurrentBranch();
  const dirtyWorktree = hasDirtyWorktree();
  const localBranchExists = branch && !isLegacyMainBranch(branch) ? branchExists(branch) : false;
  const branchHead = localBranchExists ? getBranchHead(branch) : "";
  const effectiveCommit = branchHead || (commitExists(cleanupCommit) ? cleanupCommit : commitExists(storedCommit) ? storedCommit : "");
  const recentCommit = effectiveCommit ? shortSha(effectiveCommit) : cleanValue(recentCommitValue) || "auto: branch HEAD";
  const mergedToMain = isLegacyMainBranch(branch) || (branch !== currentBranch && isCommitMergedIntoMain(effectiveCommit));
  const historicalMerged = isHistoricalMergedBranch(status, branch, currentBranch, localBranchExists, effectiveCommit);
  const cleanupManaged = isManagedCleanupState(branchCleanup);

  if (status === "done") {
    if (mergedToMain || historicalMerged || cleanupManaged) {
      return {
        branch,
        recentCommit,
        mergedToMain: true,
        state: "merged",
        detail: isLegacyMainBranch(branch)
          ? "历史直发结果已在 main"
          : branchCleanup?.overallState === "deleted"
            ? "任务分支已按回收策略删除"
            : branchCleanup?.overallState === "scheduled"
              ? branchCleanup.summary
              : branchCleanup?.overallState === "failed"
                ? branchCleanup.summary
          : historicalMerged
            ? "历史任务分支已回收，按已并入 main 处理"
            : "最近提交已并入 main",
      };
    }
    return {
      branch,
      recentCommit,
      mergedToMain: false,
      state: "drift",
      detail: effectiveCommit ? "任务标记已完成，但提交尚未并入 main" : "任务标记已完成，但缺少可验证提交",
    };
  }

  if (!branch) {
    return {
      branch,
      recentCommit,
      mergedToMain: false,
      state: "missing_branch",
      detail: "缺少分支绑定",
    };
  }

  if (mergedToMain) {
    return {
      branch,
      recentCommit,
      mergedToMain: true,
      state: "drift",
      detail: "分支提交已并入 main，但任务状态仍未完成",
    };
  }

  if (currentBranch === branch) {
    return {
      branch,
      recentCommit,
      mergedToMain: false,
      state: "developing",
      detail: dirtyWorktree ? "当前分支存在未提交改动" : "当前正在该分支开发",
    };
  }

  if (effectiveCommit) {
    return {
      branch,
      recentCommit,
      mergedToMain: false,
      state: "committed",
      detail: "分支已有提交，尚未并入 main",
    };
  }

  if (status === "todo") {
    return {
      branch,
      recentCommit,
      mergedToMain: false,
      state: "missing_branch",
      detail: "建议分支尚未创建，可在正式启动任务时创建",
    };
  }

  return {
    branch,
    recentCommit,
    mergedToMain: false,
    state: "drift",
    detail: "已记录分支，但无法读取最近提交",
  };
}
