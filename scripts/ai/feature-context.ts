const fs = require("node:fs");
const path = require("node:path");
const { emitResult, exitWithError, parseCliArgs } = require("./lib/cli-kernel.js");
const { buildFeatureContextPacket, renderFeatureContextMarkdown } = require("./lib/feature-context.ts");

const cli = parseCliArgs(process.argv.slice(2));
const argv = cli.flags;

const surface = argv.surface;
const moduleId = argv.module;
const route = argv.route;
const taskPath = argv.taskPath || argv.task || argv["task-path"];

if (!surface && !moduleId && !route && !taskPath) {
  exitWithError(
    "Missing feature target.",
    cli,
    [
      "Usage: node --experimental-strip-types scripts/ai/feature-context.ts --surface=home",
      "   or: node --experimental-strip-types scripts/ai/feature-context.ts --module=portal",
      "   or: node --experimental-strip-types scripts/ai/feature-context.ts --route=/releases",
      "Optional: --taskPath=tasks/queue/task-066-feature-context-and-shared-state.md",
    ].join("\n")
  );
}

try {
  const root = process.cwd();
  const packet = buildFeatureContextPacket(root, {
    surface,
    module: moduleId,
    route,
    taskPath,
  });

  if (cli.json) {
    emitResult({ ok: true, ...packet }, cli);
    process.exit(0);
  }

  const slug = String(surface || moduleId || route || packet.task_overlay?.taskId || "feature")
    .replace(/[^\w/-]+/g, "-")
    .replace(/^\/+/, "")
    .replace(/\//g, "_");
  const outputDir = path.join(root, "output", "ai", "feature-context");
  const outputPath = path.join(outputDir, `${slug}.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderFeatureContextMarkdown(packet));
  emitResult(
    {
      ok: true,
      target_surface: packet.target_surface,
      path: outputPath,
    },
    cli,
    (result) => result.path
  );
} catch (error) {
  exitWithError(error instanceof Error ? error.message : "Failed to build feature context.", cli);
}

