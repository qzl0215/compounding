const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");
const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");

const REQUIRED_SKILLS = [
  "using-superpowers",
  "brainstorming",
  "writing-plans",
  "subagent-driven-development",
  "verification-before-completion",
  "receiving-code-review",
  "requesting-code-review",
];

const OVERLAY_MARKERS = [
  "AGENTS.md",
  "docs/AI_OPERATING_MODEL.md",
  "docs/superpowers/specs/*",
  "docs/superpowers/plans/*",
  ".worktrees/",
  "pnpm ai:doctor:superpowers",
  "pnpm preflight -- --taskId=t-xxx",
  "verification-before-completion",
];

const REPO_MAPPING_FILES = [
  {
    relPath: "AGENTS.md",
    markers: ["Superpowers", "仓库主源", "docs/superpowers/specs/*", ".worktrees/"],
  },
  {
    relPath: "docs/AI_OPERATING_MODEL.md",
    markers: [
      "## Superpowers 映射",
      "docs/superpowers/specs/*",
      "docs/superpowers/plans/*",
      ".worktrees/",
      "verification-before-completion",
      "pnpm ai:doctor:superpowers",
    ],
  },
];

function resolveString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function tryReadText(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function readMultiAgentFlag(configPath) {
  if (!fs.existsSync(configPath)) {
    return { ok: false, enabled: false, reason: "config_missing" };
  }

  const lines = fs.readFileSync(configPath, "utf8").split(/\r?\n/);
  let currentSection = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    if (currentSection !== "features") continue;
    const flagMatch = line.match(/^multi_agent\s*=\s*(true|false)\s*$/);
    if (flagMatch) {
      return {
        ok: flagMatch[1] === "true",
        enabled: flagMatch[1] === "true",
        reason: flagMatch[1] === "true" ? "enabled" : "disabled",
      };
    }
  }

  return { ok: false, enabled: false, reason: "flag_missing" };
}

function readHeadShaFromGitDir(clonePath) {
  const gitDir = path.join(clonePath, ".git");
  const headPath = path.join(gitDir, "HEAD");
  const headContent = tryReadText(headPath);
  if (!headContent) {
    return { ok: false, sha: null, source: "git_dir", reason: "head_missing" };
  }

  const trimmed = headContent.trim();
  if (/^[0-9a-f]{40}$/i.test(trimmed)) {
    return { ok: true, sha: trimmed, source: "git_dir", reason: "detached_head" };
  }

  const refMatch = trimmed.match(/^ref:\s+(.+)$/);
  if (!refMatch) {
    return { ok: false, sha: null, source: "git_dir", reason: "head_unparseable" };
  }

  const refPath = path.join(gitDir, refMatch[1].trim());
  const refContent = tryReadText(refPath);
  if (!refContent) {
    return { ok: false, sha: null, source: "git_dir", reason: "ref_missing" };
  }

  const sha = refContent.trim();
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    return { ok: false, sha: null, source: "git_dir", reason: "ref_unparseable" };
  }

  return { ok: true, sha, source: "git_dir", reason: "resolved" };
}

function readUpstreamRevision(clonePath) {
  if (!fs.existsSync(path.join(clonePath, ".git"))) {
    return { ok: false, sha: null, source: "git", reason: "git_dir_missing" };
  }

  try {
    const topLevel = childProcess.execFileSync("git", ["-C", clonePath, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (path.resolve(topLevel) !== path.resolve(clonePath)) {
      return readHeadShaFromGitDir(clonePath);
    }

    const sha = childProcess.execFileSync("git", ["-C", clonePath, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^[0-9a-f]{40}$/i.test(sha)) {
      return { ok: true, sha, source: "git", reason: "resolved" };
    }
  } catch {}

  return readHeadShaFromGitDir(clonePath);
}

function inspectMarkers(filePath, markers) {
  const content = tryReadText(filePath);
  if (content === null) {
    return {
      ok: false,
      path: filePath,
      markers_found: [],
      markers_missing: [...markers],
      reason: "file_missing",
    };
  }

  const markersFound = markers.filter((marker) => content.includes(marker));
  const markersMissing = markers.filter((marker) => !markersFound.includes(marker));
  return {
    ok: markersMissing.length === 0,
    path: filePath,
    markers_found: markersFound,
    markers_missing: markersMissing,
    reason: markersMissing.length === 0 ? "complete" : "markers_missing",
  };
}

function inspectRepoMapping(repoRoot) {
  const files = REPO_MAPPING_FILES.map((entry) => inspectMarkers(path.join(repoRoot, entry.relPath), entry.markers));
  return {
    ok: files.every((entry) => entry.ok),
    repo_root: repoRoot,
    files,
  };
}

function inspectWorktreeStandard(repoRoot) {
  const worktreePath = path.join(repoRoot, ".worktrees");
  const gitDir = path.join(repoRoot, ".git");
  if (!fs.existsSync(gitDir)) {
    return {
      ok: false,
      path: worktreePath,
      exists: fs.existsSync(worktreePath),
      ignored_by_git: false,
      reason: "repo_not_git",
    };
  }

  try {
    childProcess.execFileSync("git", ["check-ignore", "-q", ".worktrees/probe"], {
      cwd: repoRoot,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return {
      ok: true,
      path: worktreePath,
      exists: fs.existsSync(worktreePath),
      ignored_by_git: true,
      reason: "ignored",
    };
  } catch {
    return {
      ok: false,
      path: worktreePath,
      exists: fs.existsSync(worktreePath),
      ignored_by_git: false,
      reason: "not_ignored",
    };
  }
}

function inspectSuperpowers(cli) {
  const codexHome = path.resolve(
    resolveString(
      cli.flags["codex-home"] || cli.flags.codexHome || process.env.CODEX_HOME,
      path.join(os.homedir(), ".codex"),
    ),
  );
  const agentsHome = path.resolve(
    resolveString(
      cli.flags["agents-home"] || cli.flags.agentsHome || process.env.AGENTS_HOME,
      path.join(os.homedir(), ".agents"),
    ),
  );
  const repoRoot = path.resolve(resolveString(cli.flags["repo-root"] || cli.flags.repoRoot || process.env.REPO_ROOT, process.cwd()));
  const clonePath = path.join(codexHome, "superpowers");
  const skillsRoot = path.join(clonePath, "skills");
  const symlinkPath = path.join(agentsHome, "skills", "superpowers");
  const configPath = path.join(codexHome, "config.toml");
  const overlaySkillPath = path.join(codexHome, "skills", "compounding-operating-profile", "SKILL.md");

  const checks = {
    clone_repo: {
      ok: fs.existsSync(path.join(clonePath, ".git")),
      path: clonePath,
    },
    upstream_revision: {
      ok: false,
      path: clonePath,
      sha: null,
      source: null,
      reason: null,
    },
    skills_symlink: {
      ok: false,
      path: symlinkPath,
      is_symlink: false,
      expected_target: skillsRoot,
      actual_target: null,
    },
    multi_agent: {
      ok: false,
      path: configPath,
      enabled: false,
      reason: null,
    },
    core_skills: {
      ok: false,
      path: skillsRoot,
      required: REQUIRED_SKILLS,
      found: [],
      missing: [],
    },
    overlay_skill: {
      ok: false,
      path: overlaySkillPath,
      markers_found: [],
      markers_missing: [...OVERLAY_MARKERS],
      reason: "file_missing",
    },
    repo_mapping: {
      ok: false,
      repo_root: repoRoot,
      files: [],
    },
    worktree_standard: {
      ok: false,
      path: path.join(repoRoot, ".worktrees"),
      exists: false,
      ignored_by_git: false,
      reason: "repo_not_git",
    },
  };

  if (fs.existsSync(symlinkPath)) {
    const stat = fs.lstatSync(symlinkPath);
    checks.skills_symlink.is_symlink = stat.isSymbolicLink();
    if (checks.skills_symlink.is_symlink) {
      checks.skills_symlink.actual_target = fs.realpathSync(symlinkPath);
      checks.skills_symlink.ok =
        fs.existsSync(skillsRoot) && checks.skills_symlink.actual_target === fs.realpathSync(skillsRoot);
    }
  }

  const multiAgent = readMultiAgentFlag(configPath);
  checks.multi_agent.ok = multiAgent.ok;
  checks.multi_agent.enabled = multiAgent.enabled;
  checks.multi_agent.reason = multiAgent.reason;

  const upstreamRevision = readUpstreamRevision(clonePath);
  checks.upstream_revision.ok = upstreamRevision.ok;
  checks.upstream_revision.sha = upstreamRevision.sha;
  checks.upstream_revision.source = upstreamRevision.source;
  checks.upstream_revision.reason = upstreamRevision.reason;

  if (fs.existsSync(skillsRoot)) {
    const found = REQUIRED_SKILLS.filter((skillName) => fs.existsSync(path.join(skillsRoot, skillName)));
    const missing = REQUIRED_SKILLS.filter((skillName) => !found.includes(skillName));
    checks.core_skills.found = found;
    checks.core_skills.missing = missing;
    checks.core_skills.ok = missing.length === 0;
  } else {
    checks.core_skills.missing = [...REQUIRED_SKILLS];
  }

  checks.overlay_skill = inspectMarkers(overlaySkillPath, OVERLAY_MARKERS);
  checks.repo_mapping = inspectRepoMapping(repoRoot);
  checks.worktree_standard = inspectWorktreeStandard(repoRoot);

  const errors = [];
  if (!checks.clone_repo.ok) {
    errors.push("missing clone repo: ~/.codex/superpowers");
  }
  if (!checks.upstream_revision.ok) {
    errors.push("cannot resolve upstream Superpowers SHA");
  }
  if (!checks.skills_symlink.ok) {
    errors.push("skills symlink must point ~/.agents/skills/superpowers to ~/.codex/superpowers/skills");
  }
  if (!checks.multi_agent.ok) {
    errors.push("Codex config must set [features].multi_agent = true");
  }
  if (!checks.core_skills.ok) {
    errors.push(`missing core skills: ${checks.core_skills.missing.join(", ")}`);
  }
  if (!checks.overlay_skill.ok) {
    errors.push("missing or incomplete overlay skill: ~/.codex/skills/compounding-operating-profile/SKILL.md");
  }
  if (!checks.repo_mapping.ok) {
    errors.push("repo Superpowers mapping is incomplete: AGENTS.md / docs/AI_OPERATING_MODEL.md");
  }
  if (!checks.worktree_standard.ok) {
    errors.push("project worktree standard must ignore .worktrees/");
  }

  return {
    ok: errors.length === 0,
    repo_root: repoRoot,
    codex_home: codexHome,
    agents_home: agentsHome,
    clone_path: clonePath,
    symlink_path: symlinkPath,
    config_path: configPath,
    overlay_skill_path: overlaySkillPath,
    upstream_sha: checks.upstream_revision.sha,
    checks,
    errors,
    next_action:
      errors.length === 0
        ? "Restart Codex if skills changed, then start new sessions with `pnpm ai:doctor:superpowers`; structural/release work should still bind a task before `pnpm preflight -- --taskId=t-xxx`."
        : "Repair the failed checks, then rerun `pnpm ai:doctor:superpowers`.",
  };
}

function renderText(payload) {
  const status = payload.ok ? "ok" : "failed";
  const missingSkills = payload.checks?.core_skills?.missing?.length
    ? payload.checks.core_skills.missing.join(", ")
    : "none";
  return [
    `[doctor_superpowers] ${status}`,
    `repo_root: ${payload.repo_root}`,
    `clone_repo: ${payload.checks.clone_repo.ok ? "ok" : "missing"} ${payload.clone_path}`,
    `upstream_sha: ${payload.checks.upstream_revision.sha || payload.checks.upstream_revision.reason}`,
    `skills_symlink: ${payload.checks.skills_symlink.ok ? "ok" : "failed"} ${payload.symlink_path}`,
    `multi_agent: ${payload.checks.multi_agent.ok ? "enabled" : payload.checks.multi_agent.reason}`,
    `missing_core_skills: ${missingSkills}`,
    `overlay_skill: ${payload.checks.overlay_skill.ok ? "ok" : "failed"} ${payload.overlay_skill_path}`,
    `repo_mapping: ${payload.checks.repo_mapping.ok ? "ok" : "failed"} ${payload.repo_root}`,
    `worktree_standard: ${payload.checks.worktree_standard.ok ? "ok" : payload.checks.worktree_standard.reason} ${payload.checks.worktree_standard.path}`,
    `next_action: ${payload.next_action}`,
  ].join("\n");
}

const cli = parseCliArgs(process.argv.slice(2));
const payload = inspectSuperpowers(cli);

emitResult(payload, cli, renderText);

if (!payload.ok) {
  process.exit(1);
}
