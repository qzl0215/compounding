import fs from "node:fs/promises";
import path from "node:path";
import type {
  AssetPresence,
  BootstrapReportPayload,
  KernelManifestPayload,
  KernelShellArtifacts,
  ProjectBriefPayload,
  ProposalPayload,
} from "./types";
import { parseSimpleYaml } from "./yaml";

const BRIEF_PATH = "bootstrap/project_brief.yaml";
const REPORT_PATH = "output/bootstrap/bootstrap_report.yaml";
const MANIFEST_PATH = "kernel/kernel_manifest.yaml";
const PROPOSAL_GLOB_PATH = "output/proposals/*/proposal.yaml";

export async function loadKernelShellArtifacts(workspaceRoot: string): Promise<KernelShellArtifacts> {
  const [brief, report, manifest, proposalRecord] = await Promise.all([
    readYamlIfExists<ProjectBriefPayload>(workspaceRoot, BRIEF_PATH),
    readYamlIfExists<BootstrapReportPayload>(workspaceRoot, REPORT_PATH),
    readYamlIfExists<KernelManifestPayload>(workspaceRoot, MANIFEST_PATH),
    readLatestProposal(workspaceRoot),
  ]);

  const proposalPath = proposalRecord?.relativePath || PROPOSAL_GLOB_PATH;
  const managedSource = pickFirstNonEmpty(
    toStringArray(report?.detected?.managed_assets),
    extractManifestPaths(manifest?.managed_assets),
  );
  const shellSource = pickFirstNonEmpty(
    toStringArray(report?.detected?.shell_assets),
    extractManifestPaths(manifest?.shell_assets),
  );
  const protectedSource = pickFirstNonEmpty(
    toStringArray(report?.detected?.protected_assets),
    extractManifestPaths(manifest?.protected_assets),
  );
  const generatedSource = pickFirstNonEmpty(
    extractManifestPaths(manifest?.generated_assets),
    [BRIEF_PATH, REPORT_PATH, proposalPath],
  );

  const [managed, shell, protectedAssets, generated] = await Promise.all([
    collectPresence(workspaceRoot, managedSource),
    collectPresence(workspaceRoot, shellSource),
    collectPresence(workspaceRoot, protectedSource),
    collectPresence(workspaceRoot, generatedSource),
  ]);

  return {
    paths: {
      brief: BRIEF_PATH,
      report: REPORT_PATH,
      proposal: proposalPath,
      manifest: MANIFEST_PATH,
    },
    brief,
    report,
    proposal: proposalRecord?.payload || null,
    manifest,
    governancePresence: {
      managed,
      shell,
      protected: protectedAssets,
      generated,
    },
  };
}

async function readYamlIfExists<T>(workspaceRoot: string, relativePath: string): Promise<T | null> {
  const absolutePath = path.join(workspaceRoot, relativePath);
  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    const payload = parseSimpleYaml(raw);
    return isRecord(payload) ? (payload as T) : null;
  } catch {
    return null;
  }
}

async function readLatestProposal(workspaceRoot: string) {
  const proposalsRoot = path.join(workspaceRoot, "output", "proposals");
  try {
    const entries = await fs.readdir(proposalsRoot, { withFileTypes: true });
    const roots = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => right.localeCompare(left));

    for (const rootName of roots) {
      const relativePath = path.posix.join("output", "proposals", rootName, "proposal.yaml");
      const payload = await readYamlIfExists<ProposalPayload>(workspaceRoot, relativePath);
      if (payload) {
        return {
          relativePath,
          payload,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function collectPresence(workspaceRoot: string, assetPaths: string[]): Promise<AssetPresence[]> {
  const uniquePaths = [...new Set(assetPaths.map((item) => normalizeAssetPath(item)).filter(Boolean))];
  const presence = await Promise.all(
    uniquePaths.map(async (assetPath) => ({
      path: assetPath,
      exists: await patternExists(workspaceRoot, assetPath),
    })),
  );
  return presence;
}

function extractManifestPaths(items: unknown[] | undefined) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (isRecord(item) && typeof item.path === "string") {
        return item.path;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function pickFirstNonEmpty(...values: string[][]) {
  return values.find((items) => items.length > 0) || [];
}

function normalizeAssetPath(value: string) {
  return value
    .replace(/\s+\(.+\)$/, "")
    .replace(/\\/g, "/")
    .trim();
}

async function patternExists(workspaceRoot: string, pattern: string): Promise<boolean> {
  const normalized = pattern.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!normalized) {
    return false;
  }
  const segments = normalized.split("/").filter(Boolean);
  return matchSegments(workspaceRoot, segments, 0);
}

async function matchSegments(currentPath: string, segments: string[], index: number): Promise<boolean> {
  if (index >= segments.length) {
    return exists(currentPath);
  }

  const segment = segments[index];
  if (segment === "**") {
    if (await matchSegments(currentPath, segments, index + 1)) {
      return true;
    }
    const entries = await readEntries(currentPath);
    for (const entry of entries) {
      if (entry.isDirectory() && (await matchSegments(path.join(currentPath, entry.name), segments, index))) {
        return true;
      }
    }
    return false;
  }

  if (segment.includes("*")) {
    const entries = await readEntries(currentPath);
    const matcher = wildcardToRegExp(segment);
    for (const entry of entries) {
      if (!matcher.test(entry.name)) {
        continue;
      }
      const nextPath = path.join(currentPath, entry.name);
      if (index === segments.length - 1) {
        return true;
      }
      if (entry.isDirectory() && (await matchSegments(nextPath, segments, index + 1))) {
        return true;
      }
    }
    return false;
  }

  const nextPath = path.join(currentPath, segment);
  if (!(await exists(nextPath))) {
    return false;
  }
  return matchSegments(nextPath, segments, index + 1);
}

async function readEntries(targetPath: string) {
  try {
    return await fs.readdir(targetPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function exists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function wildcardToRegExp(segment: string) {
  const escaped = segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
