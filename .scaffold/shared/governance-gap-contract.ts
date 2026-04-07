import fs from "node:fs";
import path from "node:path";

export type GovernanceGapRecord = {
  gapId: string;
  title: string;
  fromAssertion: string;
  status: string;
  linkedTasks: string[];
};

export const GOVERNANCE_GAPS_PATH = "memory/project/governance-gaps.md";

export function governanceGapsPath(root = process.cwd()) {
  return path.join(root, GOVERNANCE_GAPS_PATH);
}

export function governanceGapsExists(root = process.cwd()) {
  return fs.existsSync(governanceGapsPath(root));
}

export function readGovernanceGapRecords(root = process.cwd()) {
  if (!governanceGapsExists(root)) {
    return [];
  }
  const content = fs.readFileSync(governanceGapsPath(root), "utf8");
  return parseGovernanceGapRecords(content);
}

export function findGovernanceGapRecord(gapId: string, root = process.cwd()) {
  return readGovernanceGapRecords(root).find((item) => item.gapId === String(gapId || "").trim()) || null;
}

export function appendLinkedTaskToGovernanceGap(gapId: string, taskId: string, root = process.cwd()) {
  const normalizedGapId = String(gapId || "").trim();
  const normalizedTaskId = String(taskId || "").trim();
  if (!normalizedGapId || !normalizedTaskId || !governanceGapsExists(root)) {
    return false;
  }

  const filePath = governanceGapsPath(root);
  const content = fs.readFileSync(filePath, "utf8");
  const updated = upsertGovernanceGapLinkedTask(content, normalizedGapId, normalizedTaskId);
  if (updated === content) {
    return false;
  }
  fs.writeFileSync(filePath, updated);
  return true;
}

export function parseGovernanceGapRecords(content: string): GovernanceGapRecord[] {
  const records: GovernanceGapRecord[] = [];
  const sections = splitGapSections(content);

  for (const section of sections) {
    const heading = section.heading.match(/^##\s+(GOV-GAP-[A-Z0-9-]+)\s+(.+)$/);
    if (!heading) {
      continue;
    }

    records.push({
      gapId: heading[1].trim(),
      title: heading[2].trim(),
      fromAssertion: extractScalar(section.body, "from_assertion"),
      status: extractScalar(section.body, "status"),
      linkedTasks: extractList(section.body, "linked_tasks"),
    });
  }

  return records;
}

export function upsertGovernanceGapLinkedTask(content: string, gapId: string, taskId: string) {
  const normalizedGapId = String(gapId || "").trim();
  const normalizedTaskId = String(taskId || "").trim();
  if (!normalizedGapId || !normalizedTaskId) {
    return content;
  }

  const sections = splitGapSections(content);
  const target = sections.find((section) => section.gapId === normalizedGapId);
  if (!target) {
    return content;
  }

  const lines = target.body.split(/\r?\n/);
  const listStart = lines.findIndex((line) => /^\s*-\s*linked_tasks:\s*(.*)$/.test(line));
  if (listStart === -1) {
    return content;
  }

  const currentTasks = extractList(target.body, "linked_tasks");
  if (currentTasks.includes(normalizedTaskId)) {
    return content;
  }

  const lineMatch = lines[listStart].match(/^\s*-\s*linked_tasks:\s*(.*)$/);
  const remainder = normalizeValue(lineMatch?.[1] || "");

  if (!remainder || remainder === "[]") {
    lines[listStart] = "- linked_tasks:";
    lines.splice(listStart + 1, 0, `  - \`${normalizedTaskId}\``);
  } else {
    let insertAt = listStart + 1;
    while (insertAt < lines.length && /^\s{2,}-\s+/.test(lines[insertAt])) {
      insertAt += 1;
    }
    lines.splice(insertAt, 0, `  - \`${normalizedTaskId}\``);
  }

  const updatedBody = lines.join("\n");
  return `${content.slice(0, target.bodyStart)}${updatedBody}${content.slice(target.bodyEnd)}`;
}

function splitGapSections(content: string) {
  const sections: Array<{ gapId: string; heading: string; body: string; bodyStart: number; bodyEnd: number }> = [];
  const headingRegex = /^##\s+(.+)$/gm;
  const matches = Array.from(content.matchAll(headingRegex));

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = match[0];
    const headingBody = match[1] || "";
    const gapIdMatch = heading.match(/^##\s+(GOV-GAP-[A-Z0-9-]+)\s+/);
    if (!gapIdMatch) {
      continue;
    }

    const sectionStart = match.index ?? 0;
    const bodyStart = sectionStart + heading.length + 1;
    const sectionEnd = index + 1 < matches.length ? matches[index + 1].index ?? content.length : content.length;
    sections.push({
      gapId: gapIdMatch[1].trim(),
      heading,
      body: content.slice(bodyStart, sectionEnd),
      bodyStart,
      bodyEnd: sectionEnd,
    });
  }

  return sections;
}

function extractScalar(block: string, key: string) {
  const lines = String(block || "").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(new RegExp(`^\\s*-\\s*${escapeRegex(key)}:\\s*(.+)$`));
    if (match) {
      return normalizeValue(match[1]);
    }
  }
  return "";
}

function extractList(block: string, key: string) {
  const lines = String(block || "").split(/\r?\n/);
  const listStart = lines.findIndex((line) => new RegExp(`^\\s*-\\s*${escapeRegex(key)}:\\s*(.*)$`).test(line));
  if (listStart === -1) {
    return [];
  }

  const match = lines[listStart].match(new RegExp(`^\\s*-\\s*${escapeRegex(key)}:\\s*(.*)$`));
  const remainder = normalizeValue(match?.[1] || "");
  if (remainder) {
    if (remainder === "[]") {
      return [];
    }
    return remainder
      .split(",")
      .map((item) => normalizeValue(item))
      .filter(Boolean);
  }

  const values: string[] = [];
  for (let index = listStart + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*##\s+/.test(line)) {
      break;
    }
    if (/^\s*-\s+[A-Za-z0-9_-]+:\s*/.test(line)) {
      break;
    }
    const bullet = line.match(/^\s{2,}-\s+(.+)$/);
    if (!bullet) {
      if (values.length > 0 && line.trim()) {
        break;
      }
      continue;
    }
    values.push(normalizeValue(bullet[1]));
  }
  return values.filter(Boolean);
}

function normalizeValue(value: string) {
  return String(value || "").replace(/`/g, "").trim();
}

function escapeRegex(value: string) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
