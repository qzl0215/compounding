import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildDirectionSummary, buildHomeSurfaceSnapshot, buildOverviewSummary, buildRuntimeFacts } from "../builders";
import { getProjectOverview, loadKernelShellArtifacts } from "../service";

const cleanupTargets: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupTargets.splice(0).map(async (target) => {
      await fs.rm(target, { recursive: true, force: true });
    }),
  );
});

describe("project overview", () => {
  it("surfaces a kernel/project dual-tab snapshot from markdown sources and kernel-shell artifacts", async () => {
    const overview = await getProjectOverview();

    expect(overview.header.title).toBe("Kernel / Project");
    expect(overview.defaultTab).toBe("project");
    expect(overview.project.identity.name).toContain("Compounding");
    expect(overview.project.execution.metrics).toHaveLength(3);
    expect(overview.project.kernelStatus.steps.map((step) => step.id)).toEqual(["attach", "audit", "proposal"]);
    expect(overview.project.execution.runtimeSignals).toHaveLength(2);
    expect(overview.kernel.entryPoints).toHaveLength(4);
    expect(overview.kernel.upgradeFlow).toHaveLength(4);
    expect(overview.kernel.governance).toHaveLength(4);
    expect(overview.kernel.governance.find((bucket) => bucket.id === "managed")?.count).toBeGreaterThan(0);
  }, 15000);

  it("falls back cleanly when kernel-shell yaml artifacts are missing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "portal-kernel-shell-"));
    cleanupTargets.push(tempRoot);

    const kernelArtifacts = await loadKernelShellArtifacts(tempRoot);
    const snapshot = buildHomeSurfaceSnapshot({
      workspaceLabel: "tmp-repo",
      workspacePath: tempRoot,
      overview: buildOverviewSummary("临时仓库概览", "规划中", "暂无里程碑", "先收口首页"),
      direction: buildDirectionSummary("先完成首页拆分"),
      runtimeFacts: buildRuntimeFacts("当前无待验收版本", null, [], [], [], []),
      kernelArtifacts,
      drilldowns: [],
    });

    expect(kernelArtifacts.brief).toBeNull();
    expect(kernelArtifacts.report).toBeNull();
    expect(kernelArtifacts.proposal).toBeNull();
    expect(snapshot.project.identity.name).toBe("当前项目名称尚未写入 project_brief");
    expect(snapshot.project.kernelStatus.steps.find((step) => step.id === "attach")?.state).toBe("missing");
    expect(snapshot.kernel.governance.find((bucket) => bucket.id === "managed")?.status).toBe("missing");
  });

  it("marks reported kernel assets as missing when the report lists paths that do not exist", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "portal-kernel-missing-"));
    cleanupTargets.push(tempRoot);

    await fs.mkdir(path.join(tempRoot, "bootstrap"), { recursive: true });
    await fs.mkdir(path.join(tempRoot, "output", "bootstrap"), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, "bootstrap", "project_brief.yaml"),
      [
        "project_identity:",
        "  name: Fixture Repo",
        "  one_liner: Fixture",
        "kernel:",
        "  version: 0.1.0",
        "  adoption_mode: attach",
      ].join("\n"),
      "utf8",
    );
    await fs.writeFile(
      path.join(tempRoot, "output", "bootstrap", "bootstrap_report.yaml"),
      [
        "project:",
        "  name: Fixture Repo",
        "kernel:",
        "  version: 0.1.0",
        "status:",
        "  attached: true",
        "detected:",
        "  managed_assets:",
        "    - kernel/kernel_manifest.yaml",
        "    - templates/project_brief.template.yaml",
      ].join("\n"),
      "utf8",
    );

    const kernelArtifacts = await loadKernelShellArtifacts(tempRoot);
    const snapshot = buildHomeSurfaceSnapshot({
      workspaceLabel: "fixture",
      workspacePath: tempRoot,
      overview: buildOverviewSummary("fixture", "阶段", "里程碑", "优先级"),
      direction: buildDirectionSummary("方向"),
      runtimeFacts: buildRuntimeFacts("当前无待验收版本", null, [], [], [], []),
      kernelArtifacts,
      drilldowns: [],
    });

    const managedBucket = snapshot.kernel.governance.find((bucket) => bucket.id === "managed");
    expect(managedBucket?.status).toBe("partial");
    expect(managedBucket?.missingCount).toBe(2);
  });
});
