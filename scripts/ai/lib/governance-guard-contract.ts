const fs = require("node:fs");
const path = require("node:path");
const { extractSection } = require("./markdown-sections.ts");

const GOVERNANCE_BLUEPRINT_PATH = "memory/project/goals.md";
const GOVERNANCE_GUARD_SECTION = "治理守护矩阵 v1";

function governanceGuardSourcePath(root = process.cwd()) {
  return path.join(root, GOVERNANCE_BLUEPRINT_PATH);
}

function readGovernanceGuardMatrix(root = process.cwd()) {
  const sourcePath = governanceGuardSourcePath(root);
  if (!fs.existsSync(sourcePath)) {
    return [];
  }
  const content = fs.readFileSync(sourcePath, "utf8");
  return parseGovernanceGuardMatrix(content, root);
}

function parseGovernanceGuardMatrix(markdown, root = process.cwd()) {
  const section = extractSection(markdown, GOVERNANCE_GUARD_SECTION, root);
  if (!section) {
    return [];
  }

  const lines = String(section || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const tableLines = lines.filter((line) => line.startsWith("|"));
  if (tableLines.length < 3) {
    return [];
  }

  const headers = parseTableRow(tableLines[0]).map((item) => normalizeKey(item));
  const records = [];

  for (const line of tableLines.slice(2)) {
    const cells = parseTableRow(line);
    if (cells.length !== headers.length) {
      continue;
    }
    const row = Object.fromEntries(headers.map((header, index) => [header, normalizeValue(cells[index])]));
    if (!row.assertion_id) {
      continue;
    }
    records.push({
      assertionId: row.assertion_id,
      assertion: row.assertion,
      primaryGuard: row.primary_guard,
      probeRule: row.probe_rule,
      failureSignal: row.failure_signal,
      coverageStatus: row.coverage_status,
    });
  }

  return records;
}

function parseTableRow(line) {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((item) => item.trim());
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeValue(value) {
  return String(value || "").replace(/`/g, "").trim();
}

module.exports = {
  GOVERNANCE_GUARD_SECTION,
  GOVERNANCE_BLUEPRINT_PATH,
  governanceGuardSourcePath,
  parseGovernanceGuardMatrix,
  readGovernanceGuardMatrix,
};
