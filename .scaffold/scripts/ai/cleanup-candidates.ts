const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { collectKnowledgeAssetHealth } = require("./lib/knowledge-asset-health.ts");
const { buildCleanupCandidates, renderCleanupCandidatesMarkdown } = require("./lib/cleanup-candidates.ts");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "output", "ai", "cleanup-candidates");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "latest.json");
const OUTPUT_MD = path.join(OUTPUT_DIR, "latest.md");

function runJsonScript(relScript) {
  const stdout = childProcess.execFileSync("node", ["--experimental-strip-types", path.join(ROOT, relScript)], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return JSON.parse(stdout);
}

function readIfExists(relPath) {
  const absPath = path.join(ROOT, relPath);
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf8") : "";
}

function main() {
  const codeHealth = runJsonScript("scripts/ai/scan-code-health.ts");
  const codeVolumeMeta = runJsonScript("scripts/ai/generate-code-volume.ts");
  const codeVolumePath = codeVolumeMeta.path || path.join(ROOT, "output", "pipeline", "state", "code-volume", "latest.json");
  const codeVolume = JSON.parse(fs.readFileSync(codeVolumePath, "utf8"));
  const knowledgeHealth = collectKnowledgeAssetHealth(ROOT, { strict: false });
  const techDebtMarkdown = readIfExists("memory/project/tech-debt.md");

  const candidates = buildCleanupCandidates({
    codeHealth,
    codeVolume,
    knowledgeHealth,
    techDebtMarkdown,
  });

  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    source_of_truth: "workspace filesystem + transient CLI scans",
    source_script: "scripts/ai/cleanup-candidates.ts",
    sources: ["scan-code-health", "generate-code-volume", "knowledge freshness", "memory/project/tech-debt.md"],
    candidate_count: candidates.length,
    candidates,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
  fs.writeFileSync(OUTPUT_MD, renderCleanupCandidatesMarkdown(payload), "utf8");
  console.log(JSON.stringify({ ok: true, candidate_count: candidates.length, json_path: OUTPUT_JSON, md_path: OUTPUT_MD }, null, 2));
}

main();
