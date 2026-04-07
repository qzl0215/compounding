const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = process.cwd();

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function listDirs(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    args[key] = value !== undefined ? value : true;
  }
  return args;
}

function ensureContains(relPath, needles, errors, label) {
  if (!exists(relPath)) {
    errors.push(`${label}: missing ${relPath}`);
    return;
  }
  const content = read(relPath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      errors.push(`${label}: ${relPath} is missing required text: ${needle}`);
    }
  }
}

function validateChangePackage(slug, errors) {
  const base = path.posix.join("openspec/changes", slug);
  const requiredFiles = [
    path.posix.join(base, "proposal.md"),
    path.posix.join(base, "design.md"),
    path.posix.join(base, "tasks.md"),
    path.posix.join(base, "specs", "repo-governance", "spec.md"),
  ];
  for (const filePath of requiredFiles) {
    if (!exists(filePath)) {
      errors.push(`missing change package file: ${filePath}`);
    }
  }

  if (!/t-\d+/.test(slug)) {
    errors.push(`change package slug should include a task id: ${slug}`);
  }

  const taskId = slug.match(/t-\d+/)?.[0] || null;
  if (taskId) {
    const taskPath = path.posix.join("tasks/queue", `task-${taskId.slice(2)}.md`);
    if (!exists(taskPath)) {
      errors.push(`task binding missing for change package: ${taskPath}`);
    } else {
      const taskContent = read(taskPath);
      for (const needle of ["OpenSpec", "openspec/", "tasks/queue"]) {
        if (!taskContent.includes(needle)) {
          errors.push(`${taskPath} is missing required OpenSpec linkage text: ${needle}`);
        }
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const errors = [];
  const changeSlug = String(args.change || "t-090-openspec-adoption").trim();

  ensureContains(
    "openspec/project.md",
    ["OpenSpec", "AGENTS.md", "memory/project/operating-blueprint.md", "tasks/queue"],
    errors,
    "project doc",
  );

  for (const specPath of [
    "openspec/specs/repo-governance/spec.md",
    "openspec/specs/orchestration/spec.md",
    "openspec/specs/harness/spec.md",
  ]) {
    if (!exists(specPath)) {
      errors.push(`missing stable spec: ${specPath}`);
    }
  }

  if (!exists("openspec/changes/archive/.gitkeep")) {
    errors.push("missing archive placeholder: openspec/changes/archive/.gitkeep");
  }

  if (changeSlug) {
    validateChangePackage(changeSlug, errors);
  }

  const taskDoc = "tasks/queue/task-090.md";
  if (!exists(taskDoc)) {
    errors.push(`missing task contract: ${taskDoc}`);
  } else {
    ensureContains(taskDoc, ["OpenSpec", "openspec/", "tasks/queue"], errors, "task contract");
  }

  ensureContains(
    "AGENTS.md",
    ["OpenSpec", "openspec/project.md", "openspec/specs", "openspec/changes"],
    errors,
    "AGENTS",
  );
  ensureContains(
    "docs/AI_OPERATING_MODEL.md",
    ["OpenSpec", "openspec/project.md", "openspec/specs", "openspec/changes"],
    errors,
    "AI operating model",
  );

  const payload = {
    ok: errors.length === 0,
    root,
    change_slug: changeSlug,
    stable_specs: listDirs("openspec/specs"),
    change_packages: listDirs("openspec/changes").filter((name) => name !== "archive"),
    errors,
  };

  console.log(JSON.stringify(payload, null, 2));
  process.exit(payload.ok ? 0 : 1);
}

main();
