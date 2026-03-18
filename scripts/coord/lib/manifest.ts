/**
 * Manifest read/write utilities for agent-coordination
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const MANIFEST_DIR = path.join(ROOT, "agent-coordination", "manifest");
const MANIFEST_PATH = path.join(MANIFEST_DIR, "manifest.json");
const OVERRIDES_PATH = path.join(MANIFEST_DIR, "overrides.json");
const RISK_RULES_PATH = path.join(MANIFEST_DIR, "risk-rules.json");

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

function saveManifest(manifest) {
  fs.mkdirSync(MANIFEST_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) return { overrides: {} };
  const raw = fs.readFileSync(OVERRIDES_PATH, "utf8");
  return JSON.parse(raw);
}

function loadRiskRules() {
  const raw = fs.readFileSync(RISK_RULES_PATH, "utf8");
  return JSON.parse(raw);
}

function globMatch(pattern, relPath) {
  if (pattern === relPath) return true;
  if (!pattern.includes("*")) return false;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$").test(relPath);
}

function matchesHardRule(relPath, patterns) {
  for (const p of patterns) {
    if (globMatch(p, relPath)) return true;
  }
  return false;
}

function inferModule(relPath) {
  const parts = relPath.split("/");
  if (parts[0] === "apps" && parts[1] === "studio") return "apps/studio";
  if (parts[0] === "scripts") return parts[1] ? `scripts/${parts[1]}` : "scripts";
  if (parts[0] === "bootstrap") return "bootstrap";
  if (parts[0] === "docs") return "docs";
  if (parts[0] === "memory") return "memory";
  if (parts[0] === "tasks") return "tasks";
  if (parts[0] === "agent-coordination") return "agent-coordination";
  if (parts[0] === ".github") return ".github";
  return parts[0] || "root";
}

module.exports = {
  loadManifest,
  saveManifest,
  loadOverrides,
  loadRiskRules,
  matchesHardRule,
  inferModule,
};
