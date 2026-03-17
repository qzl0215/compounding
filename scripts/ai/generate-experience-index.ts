/**
 * 从 memory/experience/exp-*.md 提取结构化字段，生成 experience-index.json。
 * 真相源：experience 文件；产物：可比较资产索引。
 */
const fs = require("node:fs");
const path = require("node:path");
const { extractSection, stripMarkdown } = require("./lib/markdown-sections.ts");

const root = process.cwd();
const experienceDir = path.join(root, "memory", "experience");
const outputPath = path.join(root, "memory", "experience", "experience-index.json");

function firstLine(value) {
  return String(value || "")
    .split(/\r?\n/)[0]
    .trim()
    .slice(0, 200);
}

function parseRelatedDocs(content) {
  const match = content.match(/related_docs:\s*\n([\s\S]*?)(?=\n\w|$)/);
  if (!match) return [];
  return match[1]
    .split(/\n/)
    .map((line) => line.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);
}

function scanExperiences() {
  if (!fs.existsSync(experienceDir)) return [];
  const files = fs.readdirSync(experienceDir).filter((f) => f.startsWith("exp-") && f.endsWith(".md"));
  const results = [];

  for (const file of files.sort()) {
    const absPath = path.join(experienceDir, file);
    const content = fs.readFileSync(absPath, "utf8");
    const relPath = `memory/experience/${file}`;
    const id = file.replace(/\.md$/, "");
    const title = firstLine(content.match(/^#\s+(.+)$/m)?.[1] || id);
    const decision = firstLine(stripMarkdown(extractSection(content, "decision", root) || ""));
    const reuse = firstLine(stripMarkdown(extractSection(content, "reuse", root) || ""));
    const relatedDocs = parseRelatedDocs(content);

    results.push({
      id,
      title,
      decision,
      reuse,
      related_docs: relatedDocs.join(", "),
      path: relPath,
    });
  }

  return results;
}

function main() {
  const items = scanExperiences();
  const payload = {
    generated_at: new Date().toISOString(),
    source_of_truth: "memory/experience/exp-*.md",
    source_script: "scripts/ai/generate-experience-index.ts",
    items,
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(JSON.stringify({ ok: true, count: items.length, path: outputPath }, null, 2));
}

main();
