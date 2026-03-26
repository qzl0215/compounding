const fs = require("node:fs");
const path = require("node:path");
const {
  buildRetroCandidates,
  loadIterationDigests,
  renderRetroCandidatesMarkdown,
} = require("./lib/retro-candidates.ts");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "output", "ai", "retro-candidates");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "latest.json");
const OUTPUT_MD = path.join(OUTPUT_DIR, "latest.md");

function buildPayload() {
  const digests = loadIterationDigests(ROOT);
  const candidates = buildRetroCandidates({ digests });
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    source_of_truth: "agent-coordination/tasks/*.json artifacts.iteration_digest",
    source_script: "scripts/ai/retro-candidates.ts",
    candidate_count: candidates.length,
    candidates,
  };
}

function main() {
  const payload = buildPayload();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
  fs.writeFileSync(OUTPUT_MD, renderRetroCandidatesMarkdown(payload), "utf8");
  console.log(JSON.stringify({ ok: true, candidate_count: payload.candidate_count, json_path: OUTPUT_JSON, md_path: OUTPUT_MD }, null, 2));
}

main();
