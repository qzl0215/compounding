import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { BootstrapConfig, ProjectBrief, ProjectBriefSchema } from "./types";
import { getWorkspaceRoot } from "./workspace";

const root = getWorkspaceRoot();
const briefPath = path.join(root, "bootstrap", "project_brief.yaml");
const legacyConfigPath = path.join(root, "bootstrap", "project_bootstrap.yaml");
const schemaPath = path.join(root, "bootstrap", "schemas", "project_brief.schema.json");
const resolvedPath = path.join(root, "output", "bootstrap", "project_bootstrap.resolved.yaml");

export async function readProjectBrief(): Promise<ProjectBrief> {
  const raw = await fs.readFile(briefPath, "utf8");
  return YAML.parse(raw) as ProjectBrief;
}

export async function writeProjectBrief(brief: ProjectBrief) {
  const yaml = YAML.stringify(brief, {
    defaultStringType: "PLAIN"
  });
  await fs.writeFile(briefPath, yaml, "utf8");
}

export async function readProjectBriefSchema(): Promise<ProjectBriefSchema> {
  const raw = await fs.readFile(schemaPath, "utf8");
  return JSON.parse(raw) as ProjectBriefSchema;
}

export async function readBootstrapConfig(): Promise<BootstrapConfig> {
  try {
    const raw = await fs.readFile(resolvedPath, "utf8");
    return YAML.parse(raw) as BootstrapConfig;
  } catch {
    const legacy = await fs.readFile(legacyConfigPath, "utf8");
    return YAML.parse(legacy) as BootstrapConfig;
  }
}

export async function readResolvedBootstrapConfig(): Promise<BootstrapConfig | null> {
  try {
    const raw = await fs.readFile(resolvedPath, "utf8");
    return YAML.parse(raw) as BootstrapConfig;
  } catch {
    return null;
  }
}

export function getBootstrapPaths() {
  return { briefPath, schemaPath, legacyConfigPath, resolvedPath, root };
}
