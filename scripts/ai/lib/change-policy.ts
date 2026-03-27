const childProcess = require("node:child_process");
const { parseGitChangedFiles } = require("../../../shared/git-changed-files.ts");

const GIT_STATUS_REF = "git status --short";
const HEAD_PARENT_DIFF_REF = "HEAD^..HEAD";
const IGNORED_PREFIXES = Object.freeze(["output/"]);

// Observation mode contract:
// - worktree: only trusts the current repo-tracked worktree state from `git status --short`.
//   It is for pre-mutation decisions like preflight and scope guard, and it must not inspect
//   the latest committed diff.
// - recent: trusts the freshest repo-tracked mutation candidate. It prefers the current
//   worktree when dirty, otherwise falls back to the latest committed diff (`HEAD^..HEAD`).
//   It is for post-change validators, and it must not decide whether the next mutation may start.

function git(args, root = process.cwd()) {
  return childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8" }).trimEnd();
}

function normalizeObservationMode(mode) {
  return mode === "worktree" ? "worktree" : "recent";
}

function listWorktreeChangedFiles(root = process.cwd()) {
  const status = git(["status", "--short"], root);
  return parseGitChangedFiles(status, { mode: "status", ignoredPrefixes: [...IGNORED_PREFIXES] });
}

function listRecentCommitChangedFiles(root = process.cwd()) {
  try {
    const previous = git(["rev-parse", "HEAD^"], root);
    return parseGitChangedFiles(git(["diff", "--name-only", `${previous}..HEAD`], root), {
      mode: "name_only",
      ignoredPrefixes: [...IGNORED_PREFIXES],
    });
  } catch {
    return [];
  }
}

function observeChangedFiles(root = process.cwd(), options = {}) {
  const observationMode = normalizeObservationMode(options.mode);
  const worktreeFiles = listWorktreeChangedFiles(root);
  if (observationMode === "worktree") {
    return {
      changed_files: worktreeFiles,
      change_source: worktreeFiles.length > 0 ? "worktree" : "none",
      observation_mode: observationMode,
      observation_basis: {
        sources_checked: ["git_status"],
        selected_source: worktreeFiles.length > 0 ? "worktree" : "none",
        selected_ref: worktreeFiles.length > 0 ? GIT_STATUS_REF : null,
        ignored_prefixes: [...IGNORED_PREFIXES],
      },
    };
  }

  if (worktreeFiles.length > 0) {
    return {
      changed_files: worktreeFiles,
      change_source: "worktree",
      observation_mode: observationMode,
      observation_basis: {
        sources_checked: ["git_status"],
        selected_source: "worktree",
        selected_ref: GIT_STATUS_REF,
        ignored_prefixes: [...IGNORED_PREFIXES],
      },
    };
  }

  const recentFiles = listRecentCommitChangedFiles(root);
  return {
    changed_files: recentFiles,
    change_source: recentFiles.length > 0 ? "recent_commit" : "none",
    observation_mode: observationMode,
    observation_basis: {
      sources_checked: ["git_status", "head_parent_diff"],
      selected_source: recentFiles.length > 0 ? "recent_commit" : "none",
      selected_ref: recentFiles.length > 0 ? HEAD_PARENT_DIFF_REF : null,
      ignored_prefixes: [...IGNORED_PREFIXES],
    },
  };
}

function listChangedFiles(root = process.cwd(), options = {}) {
  return observeChangedFiles(root, options).changed_files;
}

function isReleaseFile(filePath) {
  return (
    filePath.startsWith("scripts/release/") ||
    filePath.startsWith("scripts/local-runtime/") ||
    filePath.startsWith("apps/studio/src/modules/releases/")
  );
}

function isLightFile(filePath) {
  return (
    /^docs\/.+\.md$/.test(filePath) ||
    /^memory\/.+\.md$/.test(filePath) ||
    filePath.startsWith("code_index/") ||
    /^tasks\/queue\/.+\.md$/.test(filePath)
  );
}

function classifyChangedFiles(changedFiles) {
  if (!changedFiles || changedFiles.length === 0) {
    return "light";
  }
  if (changedFiles.some((file) => isReleaseFile(file))) {
    return "release";
  }
  if (changedFiles.every((file) => isLightFile(file))) {
    return "light";
  }
  return "structural";
}

function explainChangePolicy(changedFiles, changeClass, observation) {
  const releaseFiles = changedFiles.filter((file) => isReleaseFile(file));
  const lightFiles = changedFiles.filter((file) => isLightFile(file));
  const otherFiles = changedFiles.filter((file) => !isReleaseFile(file) && !isLightFile(file));

  if (changedFiles.length === 0) {
    return {
      change_reason:
        observation.observation_mode === "worktree"
          ? "worktree mode 只看当前 `git status`；当前没有 repo-tracked 改动，因此按 light 处理。"
          : "recent mode 没有观察到 worktree 或最近提交的 repo-tracked 改动，因此按 light 处理。",
      change_evidence: {
        observation_basis: observation.observation_basis,
        classification_rule: "no_observed_changes",
        matched_files: [],
        release_files: [],
        light_files: [],
        other_files: [],
      },
    };
  }

  if (changeClass === "release") {
    return {
      change_reason: "观察到 release/runtime 相关路径，因此按 release 处理。",
      change_evidence: {
        observation_basis: observation.observation_basis,
        classification_rule: "has_release_files",
        matched_files: releaseFiles,
        release_files: releaseFiles,
        light_files: lightFiles,
        other_files: otherFiles,
      },
    };
  }

  if (changeClass === "light") {
    return {
      change_reason: "观察到的文件全部落在 docs / memory / code_index / tasks/queue 轻量范围内，因此按 light 处理。",
      change_evidence: {
        observation_basis: observation.observation_basis,
        classification_rule: "all_light_files",
        matched_files: lightFiles,
        release_files: releaseFiles,
        light_files: lightFiles,
        other_files: otherFiles,
      },
    };
  }

  return {
    change_reason: "观察到不属于 light 或 release 范围的路径，因此按 structural 处理。",
    change_evidence: {
      observation_basis: observation.observation_basis,
      classification_rule: "has_non_light_non_release_files",
      matched_files: otherFiles,
      release_files: releaseFiles,
      light_files: lightFiles,
      other_files: otherFiles,
    },
  };
}

function policyForChangeClass(changeClass) {
  if (changeClass === "release") {
    return {
      requires_task: true,
      requires_pre_task: true,
      requires_release_handoff: true,
      strict_task_binding: true,
    };
  }

  if (changeClass === "structural") {
    return {
      requires_task: true,
      requires_pre_task: true,
      requires_release_handoff: false,
      strict_task_binding: true,
    };
  }

  return {
    requires_task: false,
    requires_pre_task: false,
    requires_release_handoff: false,
    strict_task_binding: false,
  };
}

function buildChangePacket(root = process.cwd(), options = {}) {
  const observation = observeChangedFiles(root, options);
  const changeClass = classifyChangedFiles(observation.changed_files);
  const explanation = explainChangePolicy(observation.changed_files, changeClass, observation);
  return {
    observation_mode: observation.observation_mode,
    change_source: observation.change_source,
    changed_files: observation.changed_files,
    change_class: changeClass,
    policy: policyForChangeClass(changeClass),
    change_reason: explanation.change_reason,
    change_evidence: explanation.change_evidence,
  };
}

function getChangePolicy(root = process.cwd(), options = {}) {
  return buildChangePacket(root, options);
}

function attachChangePacketAliases(payload, changePacket) {
  return {
    ...payload,
    change_packet: changePacket,
    observation_mode: changePacket.observation_mode,
    change_source: changePacket.change_source,
    changed_files: changePacket.changed_files,
    change_class: changePacket.change_class,
    change_reason: changePacket.change_reason,
    change_evidence: changePacket.change_evidence,
    policy: changePacket.policy,
  };
}

module.exports = {
  attachChangePacketAliases,
  buildChangePacket,
  classifyChangedFiles,
  explainChangePolicy,
  getChangePolicy,
  isLightFile,
  isReleaseFile,
  listChangedFiles,
  listRecentCommitChangedFiles,
  listWorktreeChangedFiles,
  normalizeObservationMode,
  observeChangedFiles,
  policyForChangeClass,
};
