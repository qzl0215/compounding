#!/usr/bin/env node
/**
 * auto-ship.ts - 一条龙发布脚本
 *
 * 用法: pnpm auto-ship -- --taskId=t-xxx [--message=<commit message>]
 *
 * 执行流程:
 * 1. 验证 preflight
 * 2. Rebase onto main
 * 3. Commit (如果需要)
 * 4. Merge to main
 * 5. Push to remote
 * 6. 触发生产部署
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    taskId: { type: "string" },
    message: { type: "string", default: "" },
    "skip-preflight": { type: "boolean", default: false },
    "skip-deploy": { type: "boolean", default: false },
  },
});

const TASK_ID = values.taskId;
const COMMIT_MSG = values.message || `chore: ship ${TASK_ID}`;
const SKIP_PREFLIGHT = values["skip-preflight"];
const SKIP_DEPLOY = values["skip-deploy"];

function log(msg: string) {
  console.log(`[auto-ship] ${msg}`);
}

function run(cmd: string, args: string[], opts?: { cwd?: string; input?: string }) {
  log(`Running: ${cmd} ${args.join(" ")}`);
  try {
    const output = execFileSync(cmd, args, {
      cwd: opts?.cwd || process.cwd(),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (error) {
    const err = error as Error & { status?: number; stdout?: string; stderr?: string };
    return {
      ok: false,
      output: err.stdout || err.message,
      error: err.stderr || err.message,
      status: err.status,
    };
  }
}

function getCurrentBranch() {
  const result = run("git", ["branch", "--show-current"]);
  return result.ok ? result.output.trim() : "";
}

function main() {
  log("Starting auto-ship pipeline");

  // Step 0: Check if on a feature branch
  const branch = getCurrentBranch();
  if (!branch || branch === "main") {
    log(`ERROR: Must be on a feature branch, currently on: ${branch || "detached"}`);
    process.exit(1);
  }
  log(`Current branch: ${branch}`);

  // Step 1: Preflight validation
  if (!SKIP_PREFLIGHT) {
    log("Running preflight validation...");
    const preflightResult = run("pnpm", ["preflight", "--", `--taskId=${TASK_ID}`].filter(Boolean), { cwd: process.cwd() });
    if (!preflightResult.ok) {
      log(`Preflight failed: ${preflightResult.output}`);
      log("Fix issues and retry, or run with --skip-preflight to bypass");
      process.exit(1);
    }
    const preflightJson = JSON.parse(preflightResult.output);
    if (!preflightJson.ok && preflightJson.blockers?.length > 0) {
      const scopeBlockers = preflightJson.blockers.filter((b: any) => b.step === "scope_guard");
      if (scopeBlockers.length > 0) {
        log(`Scope guard blockers: ${JSON.stringify(scopeBlockers)}`);
        log("Fix scope issues and retry");
        process.exit(1);
      }
    }
    log("Preflight passed");
  }

  // Step 2: Fetch and rebase onto main
  log("Rebasing onto main...");
  run("git", ["fetch", "origin", "main"]);
  const rebaseResult = run("git", ["rebase", "origin/main"]);
  if (!rebaseResult.ok) {
    log(`Rebase failed: ${rebaseResult.error}`);
    log("Resolve conflicts manually, then run 'git rebase --continue'");
    process.exit(1);
  }
  log("Rebase completed");

  // Step 3: Check if there are changes to commit
  const statusResult = run("git", ["status", "--porcelain"]);
  const hasChanges = statusResult.output.trim().length > 0;

  if (hasChanges) {
    log("Committing changes...");
    run("git", ["add", "-A"]);
    const commitResult = run("git", ["commit", "-m", COMMIT_MSG]);
    if (!commitResult.ok) {
      log(`Commit failed: ${commitResult.error}`);
      process.exit(1);
    }
    log(`Committed: ${COMMIT_MSG}`);
  } else {
    log("No changes to commit");
  }

  // Step 4: Merge to main
  log("Merging to main...");
  run("git", ["checkout", "main"]);
  run("git", ["pull", "origin", "main"]);
  const mergeResult = run("git", ["merge", branch, "--no-ff", "-m", `Merge ${branch} into main`]);
  if (!mergeResult.ok) {
    log(`Merge failed: ${mergeResult.error}`);
    process.exit(1);
  }
  log("Merge completed");

  // Step 5: Push to remote
  log("Pushing to remote...");
  const pushResult = run("git", ["push", "origin", "main"]);
  if (!pushResult.ok) {
    log(`Push failed: ${pushResult.error}`);
    process.exit(1);
  }
  log("Push completed");

  // Step 6: Trigger production deploy
  if (!SKIP_DEPLOY) {
    log("Triggering production deploy...");
    // Find the release that was just merged
    const releaseResult = run("pnpm", ["coord:release:prepare", "--", `--taskId=${TASK_ID}`]);
    if (releaseResult.ok) {
      try {
        const releaseData = JSON.parse(releaseResult.output);
        if (releaseData.release_id) {
          log(`Release prepared: ${releaseData.release_id}`);
          run("pnpm", ["coord:release:switch", "--", `--release=${releaseData.release_id}`]);
          log(`Production switch initiated for ${releaseData.release_id}`);
        }
      } catch {
        log("Could not parse release output, skipping deploy switch");
      }
    } else {
      log("Release prepare failed, skipping deploy");
    }
  }

  // Return to feature branch
  run("git", ["checkout", branch]);

  log("=== Auto-ship pipeline completed ===");
  log(`Branch ${branch} is ready for next task`);
}

main();
