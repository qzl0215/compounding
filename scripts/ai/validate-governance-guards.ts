const fs = require("node:fs");
const path = require("node:path");
const {
  OPERATING_BLUEPRINT_PATH,
  readGovernanceGuardMatrix,
} = require("./lib/governance-guard-contract.ts");

const root = process.cwd();
const EXPECTED_ASSERTIONS = ["A4", "A6", "A7", "A9"];
const SELF_GUARDED_ASSERTIONS = Object.freeze({
  A9: "pnpm ai:validate-governance-guards",
});

function readPackageScripts() {
  const packagePath = path.join(root, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {};
  }
  const payload = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return payload.scripts || {};
}

function parseGuardScript(command) {
  const match = String(command || "").trim().match(/^pnpm\s+([A-Za-z0-9:_-]+)$/);
  return match ? match[1] : "";
}

function main() {
  const records = readGovernanceGuardMatrix(root);
  const scripts = readPackageScripts();
  const validateStatic = String(scripts["validate:static"] || "");
  const counts = new Map();
  const errors = [];
  const warnings = [];
  const missingAssertions = [];
  const duplicateAssertions = [];
  const unresolvedGuards = [];
  const staticGateDrift = [];

  for (const record of records) {
    counts.set(record.assertionId, (counts.get(record.assertionId) || 0) + 1);
  }

  for (const assertionId of EXPECTED_ASSERTIONS) {
    if (!counts.has(assertionId)) {
      missingAssertions.push(assertionId);
      errors.push(`治理守护矩阵缺少 ${assertionId}。`);
    }
  }

  for (const [assertionId, count] of counts.entries()) {
    if (!EXPECTED_ASSERTIONS.includes(assertionId)) {
      errors.push(`治理守护矩阵包含未纳入 v1 的断言 ${assertionId}。`);
    }
    if (count > 1) {
      duplicateAssertions.push(assertionId);
      errors.push(`治理守护矩阵中的 ${assertionId} 重复出现 ${count} 次。`);
    }
  }

  for (const record of records) {
    const scriptName = parseGuardScript(record.primaryGuard);
    if (!scriptName) {
      unresolvedGuards.push({
        assertion_id: record.assertionId,
        reason: "primary_guard 必须是 pnpm <script> 形式",
        primary_guard: record.primaryGuard,
      });
      errors.push(`${record.assertionId}: primary_guard 必须是 pnpm <script>。`);
      continue;
    }

    if (!scripts[scriptName]) {
      unresolvedGuards.push({
        assertion_id: record.assertionId,
        reason: "package.json 缺少对应 scripts 入口",
        primary_guard: record.primaryGuard,
      });
      errors.push(`${record.assertionId}: package.json 中不存在 ${scriptName}。`);
    }

    if (!record.failureSignal) {
      errors.push(`${record.assertionId}: failure_signal 不能为空。`);
    }

    if (record.coverageStatus !== "active") {
      errors.push(`${record.assertionId}: coverage_status 只允许 active。`);
    }

    if (String(record.probeRule || "").includes("validate:static") && !validateStatic.includes(record.primaryGuard)) {
      staticGateDrift.push(`${record.assertionId}: validate:static 未包含 ${record.primaryGuard}`);
      errors.push(`${record.assertionId}: validate:static 未接入 ${record.primaryGuard}。`);
    }

    if (
      SELF_GUARDED_ASSERTIONS[record.assertionId] &&
      record.primaryGuard !== SELF_GUARDED_ASSERTIONS[record.assertionId]
    ) {
      unresolvedGuards.push({
        assertion_id: record.assertionId,
        reason: "该断言必须由指定 guard 自守",
        primary_guard: record.primaryGuard,
      });
      errors.push(`${record.assertionId}: 必须由 ${SELF_GUARDED_ASSERTIONS[record.assertionId]} 守护。`);
    }
  }

  const payload = {
    ok: errors.length === 0,
    layer: "governance-guards",
    errors,
    warnings,
    details: {
      source_of_truth: OPERATING_BLUEPRINT_PATH,
      checked_assertions: records.map((record) => record.assertionId),
      missing_assertions: missingAssertions,
      duplicate_assertions: duplicateAssertions,
      unresolved_guards: unresolvedGuards,
      static_gate_drift: staticGateDrift,
    },
  };

  const output = JSON.stringify(payload, null, 2);
  if (payload.ok) {
    console.log(output);
    return;
  }
  process.stdout.write(`${output}\n`);
  process.exitCode = 1;
}

main();
