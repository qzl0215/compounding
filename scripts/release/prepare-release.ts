const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const {
  changeSummary,
  currentActiveRelease,
  ensureLayout,
  git,
  pendingDevRelease,
  previewBaseUrl,
  productionBaseUrl,
  releaseIdFor,
  resolveCommit,
  setPendingDevRelease,
  updateChannelSymlink,
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

const ref = parseArg("--ref", "HEAD");
const channel = parseArg("--channel", "prod");

function runNodeScript(scriptPath) {
  return JSON.parse(
    childProcess.execFileSync("node", ["--experimental-strip-types", scriptPath], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
  );
}

function ensurePreviewAvailable(releaseId, releasePath) {
  updateChannelSymlink(releasePath, "dev");
  const startScript = path.join(process.cwd(), "scripts", "local-runtime", "start-preview.ts");
  const payload = runNodeScript(startScript);
  return {
    ok: Boolean(payload.ok),
    message: payload.message || `dev 预览 ${releaseId} 已生成。`,
    note: payload.message || "",
  };
}

function main() {
  if (!["dev", "prod"].includes(channel)) {
    console.log(JSON.stringify({ ok: false, message: `Unsupported channel: ${channel}` }));
    process.exit(1);
  }

  const layout = ensureLayout();
  let record;
  let message = "";
  let ok = false;

  try {
    const result = withReleaseLock(() => {
      if (channel === "dev") {
        const existingPending = pendingDevRelease();
        if (existingPending) {
          return {
            ok: false,
            message: "当前已有未验收的 dev 预览，请先验收上一个 dev。",
            release: existingPending,
          };
        }
      }

      const commitSha = resolveCommit(ref);
      const releaseId = releaseIdFor(commitSha, channel);
      const releasePath = path.join(layout.releasesDir, releaseId);
      const current = currentActiveRelease();
      const summary = changeSummary(current?.commit_sha || null, commitSha);
      const notes = [];

      git(["worktree", "add", "--detach", releasePath, commitSha]);
      try {
        git(["clean", "-fdx"], releasePath);
        childProcess.execFileSync("pnpm", ["install", "--frozen-lockfile=false"], {
          cwd: releasePath,
          stdio: ["ignore", "pipe", "pipe"],
        });
        childProcess.execFileSync("pnpm", ["build"], {
          cwd: releasePath,
          stdio: ["ignore", "pipe", "pipe"],
        });

        const buildIdPath = path.join(releasePath, "apps", "studio", ".next", "BUILD_ID");
        const smokePassed = fs.existsSync(buildIdPath);
        if (!smokePassed) {
          notes.push("BUILD_ID missing after build.");
        }

        const prepared = {
          release_id: releaseId,
          commit_sha: commitSha,
          tag: null,
          source_ref: ref,
          channel,
          acceptance_status: channel === "dev" ? "pending" : "accepted",
          preview_url: channel === "dev" ? previewBaseUrl() : null,
          promoted_to_main_at: null,
          promoted_from_dev_release_id: null,
          created_at: new Date().toISOString(),
          status: channel === "dev" ? "preview" : "prepared",
          build_result: "passed",
          smoke_result: smokePassed ? "passed" : "failed",
          cutover_at: null,
          rollback_from: null,
          release_path: releasePath,
          change_summary: summary,
          notes,
        };

        upsertRelease(prepared);
        if (!smokePassed) {
          return { ok: false, message: `Release ${releaseId} failed before cutover.`, release: prepared };
        }

        if (channel === "dev") {
          setPendingDevRelease(releaseId);
          const preview = ensurePreviewAvailable(releaseId, releasePath);
          const release = { ...prepared, notes: [...prepared.notes, preview.note].filter(Boolean) };
          upsertRelease(release);
          return {
            ok: preview.ok,
            message: preview.ok ? `dev 预览 ${releaseId} 已就绪：${previewBaseUrl()}` : preview.message,
            release,
          };
        }

        return {
          ok: true,
          message: `Release ${releaseId} is prepared and ready for cutover.`,
          release: prepared,
        };
      } catch (error) {
        const failed = {
          release_id: releaseId,
          commit_sha,
          tag: null,
          source_ref: ref,
          channel,
          acceptance_status: channel === "dev" ? "rejected" : "accepted",
          preview_url: channel === "dev" ? previewBaseUrl() : null,
          promoted_to_main_at: null,
          promoted_from_dev_release_id: null,
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
        upsertRelease(failed);
        return {
          ok: false,
          message: `Release ${releaseId} failed before cutover.`,
          release: failed,
        };
      }
    });

    record = result.release;
    message = result.message;
    ok = Boolean(result.ok);
  } catch (error) {
    record = {
      release_id: "unresolved",
      commit_sha: "unresolved",
      tag: null,
      source_ref: ref,
      channel,
      acceptance_status: channel === "dev" ? "rejected" : "accepted",
      preview_url: channel === "dev" ? previewBaseUrl() : null,
      promoted_to_main_at: null,
      promoted_from_dev_release_id: null,
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
    message = channel === "dev" ? "dev 预览准备失败。" : "Release prepare failed.";
  }

  console.log(
    JSON.stringify({
      ok,
      message,
      release: record,
      links: {
        dev: previewBaseUrl(),
        production: productionBaseUrl(),
      },
      registry: require("./lib.ts").readRegistry(),
    })
  );
}

main();
