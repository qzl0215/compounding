const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { HARNESS_PARITY_MANIFEST } = require("./parity-manifest.ts");

const root = process.cwd();

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

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function ensureUnique(values, label, errors) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${label}: duplicate value ${value}`);
      continue;
    }
    seen.add(value);
  }
}

function collectSelectedScenarios(manifest, args, errors) {
  const requested = String(args.scenario || "")
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (requested.length === 0) {
    return manifest.scenarios;
  }
  const scenarios = requested
    .map((scenarioId) => manifest.scenarios.find((item) => item.scenario_id === scenarioId) || null)
    .filter(Boolean);
  if (scenarios.length !== requested.length) {
    for (const scenarioId of requested) {
      if (!manifest.scenarios.find((item) => item.scenario_id === scenarioId)) {
        errors.push(`unknown scenario: ${scenarioId}`);
      }
    }
  }
  return scenarios;
}

function validateRef(ref, label, scenarioId, errors) {
  if (!exists(ref.path)) {
    errors.push(`${scenarioId}: ${label} file missing: ${ref.path}`);
    return;
  }
  const content = read(ref.path);
  if (!content.includes(ref.pattern)) {
    errors.push(`${scenarioId}: ${label} missing required text in ${ref.path}: ${ref.pattern}`);
  }
}

function validateManifest(manifest, selectedScenarios) {
  const errors = [];
  const scenarioIds = manifest.scenarios.map((scenario) => scenario.scenario_id);
  ensureUnique(scenarioIds, "scenario ids", errors);
  ensureUnique(Object.keys(manifest.verification_commands), "verification command ids", errors);

  for (const scenario of selectedScenarios) {
    if (!Array.isArray(scenario.refs) || scenario.refs.length === 0) {
      errors.push(`${scenario.scenario_id}: missing doc/spec refs`);
    }
    if (!Array.isArray(scenario.verifications) || scenario.verifications.length === 0) {
      errors.push(`${scenario.scenario_id}: missing verification refs`);
    }
    for (const ref of scenario.refs || []) {
      validateRef(ref, "reference", scenario.scenario_id, errors);
    }
    for (const verification of scenario.verifications || []) {
      if (!manifest.verification_commands[verification.command_id]) {
        errors.push(`${scenario.scenario_id}: unknown verification command ${verification.command_id}`);
        continue;
      }
      validateRef(verification, "verification", scenario.scenario_id, errors);
    }
  }

  return errors;
}

function runVerificationCommand(commandId, spec) {
  const result = childProcess.spawnSync(spec.command, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    command_id: commandId,
    label: spec.label,
    command: spec.command,
    ok: result.status === 0,
    exit_code: result.status || 0,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const manifest = HARNESS_PARITY_MANIFEST;
  const selectionErrors = [];
  const selectedScenarios = collectSelectedScenarios(manifest, args, selectionErrors);
  const errors = [...selectionErrors, ...validateManifest(manifest, selectedScenarios)];
  const selectedCommandIds = [...new Set(selectedScenarios.flatMap((scenario) => scenario.verifications.map((item) => item.command_id)))];

  const commandResults = [];
  if (args.run && errors.length === 0) {
    for (const commandId of selectedCommandIds) {
      const result = runVerificationCommand(commandId, manifest.verification_commands[commandId]);
      commandResults.push(result);
      if (!result.ok) {
        errors.push(`verification command failed: ${commandId} (exit ${result.exit_code})`);
      }
    }
  }

  const payload = {
    ok: errors.length === 0,
    mode: args.diff ? "diff" : args.run ? "run" : "check",
    root,
    schema_version: manifest.schema_version,
    scenario_count: selectedScenarios.length,
    verification_command_count: selectedCommandIds.length,
    selected_scenarios: selectedScenarios.map((scenario) => scenario.scenario_id),
    scenarios: selectedScenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      label: scenario.label,
      refs: scenario.refs.map((ref) => ({ path: ref.path, pattern: ref.pattern })),
      verifications: scenario.verifications.map((verification) => ({
        command_id: verification.command_id,
        path: verification.path,
        pattern: verification.pattern,
      })),
    })),
    coverage: {
      reference_paths: [...new Set(selectedScenarios.flatMap((scenario) => scenario.refs.map((ref) => ref.path)))],
      verification_paths: [...new Set(selectedScenarios.flatMap((scenario) => scenario.verifications.map((item) => item.path)))],
      verification_commands: selectedCommandIds.map((commandId) => ({
        command_id: commandId,
        label: manifest.verification_commands[commandId].label,
        command: manifest.verification_commands[commandId].command,
      })),
    },
    command_results: commandResults,
    errors,
  };

  console.log(JSON.stringify(payload, null, 2));
  process.exit(payload.ok ? 0 : 1);
}

main();
