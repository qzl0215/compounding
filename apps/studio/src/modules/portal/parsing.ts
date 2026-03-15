import { stripMarkdown } from "@/modules/docs";
import type { OrgRoleCard, OrgRoleGroup } from "./types";

export function parseBulletMap(content: string) {
  const map: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.trim().match(/^-\s*([^：:]+)[：:]\s*(.+)$/);
    if (match) {
      map[match[1].trim()] = stripMarkdown(match[2].trim());
    }
  }
  return map;
}

export function parseBulletList(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^-+\s*/, ""))
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
}

export function splitChineseList(value: string) {
  return value
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeInline(value: string) {
  return stripMarkdown(value).replace(/\s+/g, " ").trim();
}

export function previewSection(content: string, maxItems = 1) {
  const items = parseBulletList(content).slice(0, maxItems);
  if (items.length > 0) {
    return items.join("；");
  }
  return normalizeInline(content).slice(0, 100);
}

export function parseOrgModel(content: string): OrgRoleGroup[] {
  const lines = content.split(/\r?\n/);
  const groups: OrgRoleGroup[] = [];
  let currentGroup: OrgRoleGroup | null = null;
  let currentRole: OrgRoleCard | null = null;
  let currentField: keyof Pick<OrgRoleCard, "responsibilities" | "outputs" | "triggerMoments" | "antiPatterns"> | null = null;

  for (const line of lines) {
    const levelTwo = line.match(/^##\s+(.+)$/);
    if (levelTwo) {
      const title = levelTwo[1].trim();
      if (["决策层", "交付层", "研发层", "保障层"].includes(title)) {
        currentGroup = { title, roles: [] };
        groups.push(currentGroup);
      } else {
        currentGroup = null;
      }
      currentRole = null;
      currentField = null;
      continue;
    }

    const levelThree = line.match(/^###\s+(.+)$/);
    if (levelThree && currentGroup) {
      currentRole = {
        name: levelThree[1].trim(),
        mission: "",
        responsibilities: [],
        outputs: [],
        triggerMoments: [],
        antiPatterns: [],
      };
      currentGroup.roles.push(currentRole);
      currentField = null;
      continue;
    }

    if (!currentRole) {
      continue;
    }

    if (line.startsWith("- 使命：")) {
      currentRole.mission = line.replace("- 使命：", "").trim();
      currentField = null;
      continue;
    }
    if (line.startsWith("- 主要职责：")) {
      currentField = "responsibilities";
      continue;
    }
    if (line.startsWith("- 主要产物：")) {
      currentField = "outputs";
      continue;
    }
    if (line.startsWith("- 何时介入：")) {
      currentField = "triggerMoments";
      continue;
    }
    if (line.startsWith("- 不该做什么：")) {
      currentField = "antiPatterns";
      continue;
    }
    if (currentField && line.trim().startsWith("-")) {
      currentRole[currentField].push(line.replace(/^\s*-\s*/, "").trim());
    }
  }

  return groups;
}
