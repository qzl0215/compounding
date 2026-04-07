const fs = require("node:fs");
const path = require("node:path");
const { recordContextPacketEvent } = require("./lib/command-gain.ts");
const {
  buildExpandedContextExcerpts,
  buildFeatureContextPacket,
  estimateContextPacketSourceBytes,
  renderFeatureContextMarkdown,
} = require("./lib/feature-context.ts");

const args = process.argv.slice(2);
const taskPath = args.find((arg) => !arg.startsWith("--"));
if (!taskPath) {
  console.error(
    "Usage: node --experimental-strip-types scripts/ai/build-context.ts <task-path> [--expanded] [--include-workflow] [--include-ai-model] [--include-project-memory]"
  );
  process.exit(1);
}

const includeWorkflow = args.includes("--include-workflow");
const includeAiModel = args.includes("--include-ai-model");
const includeProjectMemory = args.includes("--include-project-memory");
const expanded = args.includes("--expanded") || includeWorkflow || includeAiModel || includeProjectMemory;

const root = process.cwd();
const relTask = taskPath.replace(/^\/+/, "");
const taskId = path.basename(relTask, path.extname(relTask));

function readIfExists(relPath) {
  const absolute = path.join(root, relPath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function renderExpandedSections(packet) {
  const optionalDocs = unique([
    includeWorkflow ? "docs/DEV_WORKFLOW.md" : "",
    includeAiModel ? "docs/AI_OPERATING_MODEL.md" : "",
    includeProjectMemory ? "memory/project/roadmap.md" : "",
    includeProjectMemory ? "memory/project/operating-blueprint.md" : "",
  ]);
  const fileExcerpts = buildExpandedContextExcerpts(root, packet, {
    includeReadOnDemand: includeProjectMemory,
    maxItems: 5,
  });
  const docExcerpts = optionalDocs
    .map((relPath) => {
      const text = readIfExists(relPath);
      if (!text) return null;
      return { path: relPath, excerpt: text.slice(0, 1200) };
    })
    .filter(Boolean);

  const sections = [...fileExcerpts, ...docExcerpts];
  if (!sections.length) return "";

  const lines = ["## Expanded Excerpts", ""];
  for (const item of sections) {
    lines.push(`### ${item.path}`);
    lines.push("");
    lines.push("```text");
    lines.push(item.excerpt.trimEnd());
    lines.push("```");
    lines.push("");
  }
  return lines.join("\n");
}

const packet = buildFeatureContextPacket(root, {
  taskPath: relTask,
});
const baseMarkdown = renderFeatureContextMarkdown(packet);
const expandedSections = expanded ? renderExpandedSections(packet) : "";
const output = expandedSections ? `${baseMarkdown}\n\n${expandedSections}\n` : `${baseMarkdown}\n`;
const outputPath = path.join(root, "output", "ai", "context", `${taskId}.md`);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

recordContextPacketEvent(root, {
  profileId: expanded ? "build_context_expanded" : "build_context_balanced",
  profileVersion: "1",
  taskId: packet.task_overlay?.shortId || packet.task_overlay?.taskId || null,
  originalCmd: `pnpm ai:build-context ${relTask}${expanded ? " --expanded" : ""}`,
  rawBytes: estimateContextPacketSourceBytes(root, packet, { includeReadOnDemand: expanded }),
  compactBytes: Buffer.byteLength(output, "utf8"),
  outputText: output,
  agentSurface: "repo_cli",
});

console.log(outputPath);
