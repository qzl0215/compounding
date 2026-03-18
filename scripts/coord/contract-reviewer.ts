#!/usr/bin/env node
/**
 * Contract reviewer: interface/type/route/schema contract checks.
 * Runs lint when changed files require contract_reviewer per manifest.
 * Usage: node --experimental-strip-types scripts/coord/contract-reviewer.ts [--changedFiles=file1,file2]
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { loadManifest } = require("./lib/manifest.ts");

const ROOT = process.cwd();

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  const changedFilesRaw = args.changedFiles || "";
  const changedFiles = changedFilesRaw ? changedFilesRaw.split(",").map((f) => f.trim()).filter(Boolean) : [];

  if (changedFiles.length === 0) {
    console.log(JSON.stringify({ name: "contract_reviewer", pass: true, summary: "No changed files.", raw: {} }, null, 2));
    return;
  }

  let manifest = { files: {} };
  try {
    manifest = loadManifest();
  } catch (_) {}

  const needsContractCheck = changedFiles.some((f) => {
    const entry = manifest.files[f];
    return entry && (entry.required_checks || []).includes("contract_reviewer");
  });

  if (!needsContractCheck) {
    console.log(
      JSON.stringify(
        { name: "contract_reviewer", pass: true, summary: "No changed files require contract check.", raw: {} },
        null,
        2
      )
    );
    return;
  }

  const result = spawnSync("pnpm", ["lint"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const pass = result.status === 0;
  console.log(
    JSON.stringify(
      {
        name: "contract_reviewer",
        pass,
        summary: pass ? "Lint passed." : "Lint failed.",
        raw: { status: result.status, stderr: result.stderr ? result.stderr.slice(0, 500) : null },
      },
      null,
      2
    )
  );
  if (!pass) process.exit(1);
}

main();
