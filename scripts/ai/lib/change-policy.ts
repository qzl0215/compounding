const childProcess = require("node:child_process");

function git(args, root = process.cwd()) {
  return childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8" }).trimEnd();
}

function listChangedFiles(root = process.cwd()) {
  const status = git(["status", "--short"], root);
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
      .filter(Boolean)
      .filter((file) => !file.startsWith("output/"));
  }

  try {
    const previous = git(["rev-parse", "HEAD^"], root);
    return git(["diff", "--name-only", `${previous}..HEAD`], root)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((file) => !file.startsWith("output/"));
  } catch {
    return [];
  }
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

function getChangePolicy(root = process.cwd()) {
  const changedFiles = listChangedFiles(root);
  const changeClass = classifyChangedFiles(changedFiles);
  return {
    changed_files: changedFiles,
    change_class: changeClass,
    policy: policyForChangeClass(changeClass),
  };
}

module.exports = {
  classifyChangedFiles,
  getChangePolicy,
  isLightFile,
  isReleaseFile,
  listChangedFiles,
  policyForChangeClass,
};
