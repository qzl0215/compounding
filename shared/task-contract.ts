import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const { deriveShortId, matchesTaskReference, normalizeTaskReference, taskIdFromPath } = require("./task-identity.ts");
const { normalizeTaskDeliveryTrack } = require("./task-state-machine.ts");

export type TaskUpdateTrace = {
  memory: string;
  index: string;
  roadmap: string;
  docs: string;
};

export type ParsedTaskContract = {
  id: string;
  path: string;
  shortId: string;
  title: string;
  parentPlan: string;
  summary: string;
  whyNow: string;
  boundary: string;
  doneWhen: string;
  linkedGap: string;
  fromAssertion: string;
  writebackTargets: string[];
  inScope: string;
  outOfScope: string;
  constraints: string;
  risk: string;
  testStrategy: string;
  status: string;
  acceptanceResult: string;
  deliveryResult: string;
  retro: string;
};

export type ParsedTaskMachineFacts = {
  deliveryTrack: string;
  branch: string;
  recentCommit: string;
  relatedModules: string[];
  primaryRelease: string;
  linkedReleases: string[];
  updateTrace: TaskUpdateTrace;
};

type TaskContractFingerprintSource = Pick<
  ParsedTaskContract,
  | "shortId"
  | "parentPlan"
  | "summary"
  | "whyNow"
  | "boundary"
  | "doneWhen"
  | "linkedGap"
  | "fromAssertion"
  | "writebackTargets"
  | "inScope"
  | "outOfScope"
  | "constraints"
  | "risk"
  | "testStrategy"
  | "status"
  | "acceptanceResult"
  | "deliveryResult"
  | "retro"
>;

export function parseTaskContract(path: string, content: string): ParsedTaskContract {
  const id = taskIdFromPath(path);
  const rawTitle = extractFirstHeading(content) ?? "";
  const summarySection = extractLevelSection(content, ["任务摘要"], 2) ?? "";
  const governanceSection = extractLevelSection(content, ["治理绑定"], 2) ?? "";
  const executionSection = extractLevelSection(content, ["执行合同"], 2) ?? "";
  const resultSection = extractLevelSection(content, ["交付结果"], 2) ?? "";

  const summaryLabels = parseLabeledBlock(summarySection);
  const governanceLabels = parseLabeledBlock(governanceSection);
  const resultLabels = parseLabeledBlock(resultSection);

  const shortId =
    pickLabel(summaryLabels, ["短编号"]) ||
    inline(extractLegacyField(content, ["短编号"])) ||
    deriveShortId(id);

  const parentPlan = pickLabel(summaryLabels, ["父计划"]) || inline(extractLegacyField(content, ["父计划"])) || "";
  const summary =
    pickLabel(summaryLabels, ["任务摘要"]) ||
    paragraph(extractLegacyField(content, ["任务摘要", "目标"])) ||
    `待补充：${rawTitle || normalizeTaskReference(id)}`;
  const whyNow =
    pickLabel(summaryLabels, ["为什么现在"]) ||
    paragraph(extractLegacyField(content, ["为什么现在", "为什么", "原因"])) ||
    "待补充：说明为什么现在要做。";
  const boundary =
    pickLabel(summaryLabels, ["承接边界"]) ||
    paragraph(extractLegacyField(content, ["承接边界", "计划快照"])) ||
    "待补充：说明本 task 从 plan 承接的边界。";
  const doneWhen =
    pickLabel(summaryLabels, ["完成定义"]) ||
    paragraph(extractLegacyField(content, ["完成定义", "验收标准", "Acceptance Criteria"])) ||
    "待补充：说明体验级交付结果。";
  const linkedGap =
    normalizeOptionalLabel(pickLabel(governanceLabels, ["主治理差距", "关联差距", "linked_gap"])) ||
    normalizeOptionalLabel(inline(extractLegacyField(content, ["主治理差距", "关联差距", "linked_gap"])));
  const fromAssertion =
    normalizeOptionalLabel(pickLabel(governanceLabels, ["来源断言", "from_assertion"])) ||
    normalizeOptionalLabel(inline(extractLegacyField(content, ["来源断言", "from_assertion"])));
  const writebackTargets = parseValueList(
    pickRawLabel(governanceLabels, ["回写目标", "writeback_targets"]) || extractLegacyField(content, ["回写目标", "writeback_targets"])
  );

  const inScope =
    sectionText(extractLevelSection(executionSection, ["要做"], 3) ?? "") ||
    sectionText(extractLegacyField(content, ["要做", "范围"])) ||
    "";
  const outOfScope =
    sectionText(extractLevelSection(executionSection, ["不做"], 3) ?? "") ||
    sectionText(extractLegacyField(content, ["不做", "范围外", "不在范围内"])) ||
    "";
  const constraints =
    sectionText(extractLevelSection(executionSection, ["约束"], 3) ?? "") ||
    sectionText(extractLegacyField(content, ["约束"])) ||
    "";
  const risk =
    sectionText(extractLevelSection(executionSection, ["关键风险"], 3) ?? "") ||
    sectionText(extractLegacyField(content, ["关键风险", "交付风险", "风险"])) ||
    "";
  const testStrategy =
    sectionText(extractLevelSection(executionSection, ["测试策略"], 3) ?? "") ||
    sectionText(extractLegacyField(content, ["测试策略"])) ||
    "";

  const status = pickLabel(resultLabels, ["状态"]) || inline(extractLegacyField(content, ["状态"])) || "todo";
  const acceptanceResult =
    pickLabel(resultLabels, ["体验验收结果"]) ||
    paragraph(extractLegacyField(content, ["体验验收结果"])) ||
    "待验收";
  const deliveryResult =
    pickLabel(resultLabels, ["交付结果"]) ||
    paragraph(extractLegacyField(content, ["交付结果", "交付收益", "目标"])) ||
    "未交付";
  const retro =
    pickLabel(resultLabels, ["复盘"]) ||
    paragraph(extractLegacyField(content, ["复盘", "一句复盘"])) ||
    "未复盘";
  const title = resolveTaskTitle(rawTitle, summary, id, shortId);

  return {
    id,
    path,
    shortId,
    title,
    parentPlan,
    summary,
    whyNow,
    boundary,
    doneWhen,
    linkedGap,
    fromAssertion,
    writebackTargets,
    inScope,
    outOfScope,
    constraints,
    risk,
    testStrategy,
    status,
    acceptanceResult,
    deliveryResult,
    retro,
  };
}

export function parseTaskMachineFacts(content: string): ParsedTaskMachineFacts {
  return {
    deliveryTrack: normalizeTaskDeliveryTrack(inline(extractLegacyField(content, ["交付轨道"]))),
    branch: inline(extractLegacyField(content, ["分支"])),
    recentCommit: inline(extractLegacyField(content, ["最近提交"])),
    relatedModules: parseRelatedModules(content),
    primaryRelease: inline(extractLegacyField(content, ["主发布版本"])),
    linkedReleases: parseLinkedReleases(content),
    updateTrace: parseUpdateTrace(content),
  };
}

export function taskContractFingerprint(contract: TaskContractFingerprintSource) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        shortId: contract.shortId,
        parentPlan: contract.parentPlan,
        summary: contract.summary,
        whyNow: contract.whyNow,
        boundary: contract.boundary,
        doneWhen: contract.doneWhen,
        linkedGap: contract.linkedGap,
        fromAssertion: contract.fromAssertion,
        writebackTargets: contract.writebackTargets,
        inScope: contract.inScope,
        outOfScope: contract.outOfScope,
        constraints: contract.constraints,
        risk: contract.risk,
        testStrategy: contract.testStrategy,
        status: contract.status,
        acceptanceResult: contract.acceptanceResult,
        deliveryResult: contract.deliveryResult,
        retro: contract.retro,
      })
    )
    .digest("hex");
}

function extractFirstHeading(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function resolveTaskTitle(rawTitle: string, summary: string, taskId: string, shortId: string) {
  const heading = blockText(rawTitle || "");
  const summaryTitle = firstMeaningfulLine(summary);

  if (!heading) {
    return summaryTitle || normalizeTaskReference(taskId);
  }

  if (isGenericTaskHeading(heading, taskId, shortId)) {
    return summaryTitle || heading;
  }

  return heading;
}

function isGenericTaskHeading(heading: string, taskId: string, shortId: string) {
  const normalized = heading.replace(/`/g, "").trim();
  if (!normalized) {
    return false;
  }
  if (matchesTaskReference(taskId, shortId, normalized)) {
    return true;
  }
  const withoutTaskPrefix = normalized.replace(/^任务\s+/, "");
  if (withoutTaskPrefix !== normalized && matchesTaskReference(taskId, shortId, withoutTaskPrefix)) {
    return true;
  }
  return false;
}

function firstMeaningfulLine(value: string) {
  const line = String(value || "")
    .split(/\r?\n/)
    .map((entry) => blockText(entry))
    .find((entry) => entry && !entry.startsWith("待补充："));
  return line || "";
}

function extractLevelSection(markdown: string, headings: string[], level: number): string | null {
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,6})\s+(.+)$/);
    if (!match || match[1].length !== level || !matchesHeading(match[2], headings)) {
      continue;
    }
    const buffer: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].match(/^(#{2,6})\s+(.+)$/);
      if (next && next[1].length <= level) {
        break;
      }
      buffer.push(lines[cursor]);
    }
    return buffer.join("\n").trim();
  }
  return null;
}

function extractLegacyField(markdown: string, headings: string[]): string {
  for (const heading of headings) {
    const section = extractLevelSection(markdown, [heading], 2) ?? extractLevelSection(markdown, [heading], 3);
    if (section) {
      return section;
    }
  }
  return "";
}

function parseLabeledBlock(block: string) {
  const labels = new Map<string, string>();
  if (!block.trim()) {
    return labels;
  }

  const lines = block.split(/\r?\n/);
  let currentLabel = "";
  let buffer: string[] = [];

  const flush = () => {
    if (!currentLabel) {
      return;
    }
    labels.set(currentLabel, blockText(buffer.join("\n")));
    currentLabel = "";
    buffer = [];
  };

  for (const line of lines) {
    if (/^###\s+/.test(line) || /^##\s+/.test(line)) {
      flush();
      continue;
    }

    const bullet = line.match(/^\s*-\s*([^：:]+)[：:]\s*(.*)$/);
    if (bullet) {
      flush();
      currentLabel = normalizeHeading(bullet[1]);
      buffer = bullet[2] ? [bullet[2]] : [];
      continue;
    }

    if (!currentLabel) {
      continue;
    }
    if (!line.trim()) {
      buffer.push("");
      continue;
    }
    buffer.push(line.replace(/^\s+/, ""));
  }

  flush();
  return labels;
}

function pickLabel(values: Map<string, string>, labels: string[]) {
  for (const label of labels) {
    const value = values.get(normalizeHeading(label));
    if (value) {
      return paragraph(value);
    }
  }
  return "";
}

function pickRawLabel(values: Map<string, string>, labels: string[]) {
  for (const label of labels) {
    const value = values.get(normalizeHeading(label));
    if (value) {
      return value;
    }
  }
  return "";
}

function parseRelatedModules(content: string) {
  const raw = extractLegacyField(content, ["关联模块"]);
  const inlineMatches = Array.from(raw.matchAll(/`([^`]+)`/g)).map((match) => match[1].trim());
  const bullets = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean)
    .map((line) => line.replace(/`/g, ""));
  return Array.from(new Set([...inlineMatches, ...bullets]));
}

function parseLinkedReleases(content: string) {
  const raw = extractLegacyField(content, ["关联发布版本"]);
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^-\s*/, "").replace(/`/g, "").trim())
    .filter(Boolean)
    .filter((value) => value !== "无");
}

function parseUpdateTrace(content: string): TaskUpdateTrace {
  const raw = extractLegacyField(content, ["更新痕迹"]);
  return {
    memory: extractTraceValue(raw, "记忆"),
    index: extractTraceValue(raw, "索引"),
    roadmap: extractTraceValue(raw, "路线图"),
    docs: extractTraceValue(raw, "文档"),
  };
}

function parseValueList(raw: string) {
  const normalized = blockText(raw).replace(/\r/g, "").trim();
  if (!normalized || normalized === "[]" || normalized === "未绑定") {
    return [];
  }
  return Array.from(
    new Set(
      normalized
        .split(/\n|,|、/)
        .map((line) => line.replace(/^-\s*/, "").replace(/`/g, "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeOptionalLabel(value: string) {
  const normalized = blockText(value).replace(/`/g, "").trim();
  if (!normalized || normalized === "未绑定" || normalized.toLowerCase() === "none") {
    return "";
  }
  return normalized;
}

function extractTraceValue(raw: string, label: string) {
  const line = raw.split(/\r?\n/).find((item) => {
    const normalized = item.trim().replace(/^-\s*/, "");
    return normalized.startsWith(`${label}：`) || normalized.startsWith(`${label}:`);
  });
  if (!line) {
    return "no change: 未记录";
  }
  return line
    .trim()
    .replace(/^-\s*/, "")
    .split(/[:：]/)
    .slice(1)
    .join(":")
    .replace(/`/g, "")
    .trim();
}

function matchesHeading(candidate: string, headings: string[]) {
  return headings.some((heading) => normalizeHeading(candidate) === normalizeHeading(heading));
}

function normalizeHeading(value: string) {
  return String(value || "").trim().toLowerCase();
}

function inline(value: string) {
  return blockText(value).replace(/\s*\n+\s*/g, " ").trim();
}

function paragraph(value: string) {
  return blockText(value)
    .replace(/\n{2,}/g, "\n")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

function sectionText(value: string) {
  return blockText(value)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blockText(value: string) {
  return String(value || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}
