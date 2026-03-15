const fs = require("node:fs");
const path = require("node:path");
const {
  changeSummary,
  currentActiveRelease,
  ensureLayout,
  git,
  layoutPaths,
  releaseIdFor,
  resolveCommit,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");

function parseArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] || fallback;
}

const ref = parseArg("--ref", "main");

function main() {
  const layout = ensureLayout();
  let record;

  try {
    record = withReleaseLock(() => {
      const commitSha = resolveCommit(ref);
      const releaseId = releaseIdFor(commitSha);
      const releasePath = path.join(layout.releasesDir, releaseId);
      const current = currentActiveRelease();
      const summary = changeSummary(current?.commit_sha || null, commitSha);
      const notes = [];

      git(["worktree", "add", "--detach", releasePath, commitSha]);
      try {
        git(["clean", "-fdx"], releasePath);
        require("node:child_process").execFileSync("pnpm", ["install", "--frozen-lockfile=false"], {
          cwd: releasePath,
          stdio: ["ignore", "pipe", "pipe"],
        });
        require("node:child_process").execFileSync("pnpm", ["build"], {
          cwd: releasePath,
          stdio: ["ignore", "pipe", "pipe"],
        });

        const buildIdPath = path.join(releasePath, "apps", "studio", ".next", "BUILD_ID");
        const smokePassed = fs.existsSync(buildIdPath);
        if (!smokePassed) {
          notes.push("BUILD_ID missing after build.");
        }

        return {
          release_id: releaseId,
          commit_sha: commitSha,
          tag: null,
          source_ref: ref,
          created_at: new Date().toISOString(),
          status: "prepared",
          build_result: "passed",
          smoke_result: smokePassed ? "passed" : "failed",
          cutover_at: null,
          rollback_from: null,
          release_path: releasePath,
          change_summary: summary,
          notes,
        };
      } catch (error) {
        return {
          release_id: releaseId,
          commit_sha,
          tag: null,
          source_ref: ref,
          created_at: new Date().toISOString(),
          status: "failed",
          build_result: "failed",
          smoke_result: "failed",
          cutover_at: null,
          rollback_from: null,
          release_path: releasePath,
          change_summary: summary,
          notes: [error instanceof Error ? error.message : "release build failed"],
        };
      }
    });
  } catch (error) {
    record = {
      release_id: "unresolved",
      commit_sha: "unresolved",
      tag: null,
      source_ref: ref,
      created_at: new Date().toISOString(),
      status: "failed",
      build_result: "failed",
      smoke_result: "failed",
      cutover_at: null,
      rollback_from: null,
      release_path: "",
      change_summary: [],
      notes: [error instanceof Error ? error.message : "failed to prepare release"],
    };
  }

  upsertRelease(record);
  const ok = record.build_result === "passed" && record.smoke_result === "passed";
  const message = ok
    ? `Release ${record.release_id} is prepared and ready for cutover.`
    : `Release ${record.release_id} failed before cutover.`;

  console.log(JSON.stringify({ ok, message, release: record, registry: require("./lib.ts").readRegistry() }));
}

main();
