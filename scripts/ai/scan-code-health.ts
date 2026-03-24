const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const softLimit = 250;
const hardLimit = 400;
const strict = process.argv.includes("--strict");
const suspiciousNames = new Set(["utils", "helpers", "common", "misc", "temp", "final", "new", "v2"]);
const legacyPaths = [
  "apps/studio/src/app/bootstrap-wizard",
  "apps/studio/src/app/initialize",
  "apps/studio/src/app/reviews",
  "apps/studio/src/app/rewrite-proposals",
  "apps/studio/src/app/goals-priorities",
  "apps/studio/src/app/org-model",
  "apps/studio/src/app/sop-templates",
  "apps/studio/src/app/version-history",
  "apps/studio/src/app/api/bootstrap",
  "apps/studio/src/app/api/proposals",
  "apps/studio/src/app/api/tasks/brief",
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".git" || entry.name === "__pycache__") continue;
    const full = path.join(dir, entry.name);
    if (full.includes(`${path.sep}output${path.sep}`)) continue;
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const files = walk(root);
const largeFiles = [];
const todos = [];
const missingModuleDocs = [];
const suspicious = [];

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).length;
  if (/\.(ts|tsx|py)$/.test(rel) && lines > softLimit) {
    largeFiles.push({ file: rel, lines, overHardLimit: lines > hardLimit });
  }
  if (/\.(ts|tsx|py)$/.test(rel) && /(?:\/\/|#|\/\*)\s*(TODO|FIXME)\b/.test(text)) {
    todos.push(rel);
  }
  const base = path.basename(rel, path.extname(rel));
  if (suspiciousNames.has(base)) {
    suspicious.push(rel);
  }
}

const moduleRoots = ["apps/studio/src/modules", "scripts/compounding_bootstrap"];
for (const relRoot of moduleRoots) {
  const absRoot = path.join(root, relRoot);
  if (!fs.existsSync(absRoot)) continue;
  for (const entry of fs.readdirSync(absRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "__pycache__") continue;
    const moduleDoc = path.join(absRoot, entry.name, "module.md");
    if (!fs.existsSync(moduleDoc)) {
      missingModuleDocs.push(path.relative(root, moduleDoc).replace(/\\/g, "/"));
    }
  }
}

const legacyExisting = legacyPaths.filter((rel) => fs.existsSync(path.join(root, rel)));
const output = {
  generatedAt: new Date().toISOString(),
  summary: {
    largeFiles: largeFiles.length,
    todos: todos.length,
    missingModuleDocs: missingModuleDocs.length,
    suspiciousNames: suspicious.length,
    legacyExisting: legacyExisting.length,
  },
  largeFiles,
  todos,
  missingModuleDocs,
  suspiciousNames: suspicious,
  legacyExisting,
};

const outputPath = path.join(root, "output", "ai", "code-health.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));

if (strict && (largeFiles.length || todos.length || missingModuleDocs.length || suspicious.length || legacyExisting.length)) {
  process.exit(1);
}
