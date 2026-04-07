import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import type { SkillInfo, SkillTableRow, SkillStatus } from "./types";

const COMPOUNDING_ROOT = "/Users/apple/Documents/GitHub/Compounding";
const SKILLS_INDEX_PATH = resolve(COMPOUNDING_ROOT, "resources/skills/skill-index.json");
const SUBSCRIPTIONS_PATH = resolve(COMPOUNDING_ROOT, "memory/skills/subscriptions.json");

interface SkillIndexEntry {
  id: string;
  name: string;
  description: string;
  origin: string;
  file: string;
  invoke_mode: string;
  capability_zh?: string;
  use_case_zh?: string;
  invocation_phrase?: string;
}

interface SkillIndexData {
  index: SkillIndexEntry[];
}

interface SubscriptionsData {
  skills: Record<string, {
    status: SkillStatus;
    invoke_mode: string;
    reason?: string;
  }>;
}

export async function listSkills(): Promise<SkillTableRow[]> {
  const [indexData, subscriptionsData] = await Promise.all([
    readFile(SKILLS_INDEX_PATH, "utf-8"),
    readFile(SUBSCRIPTIONS_PATH, "utf-8"),
  ]);

  const index: SkillIndexData = JSON.parse(indexData);
  const subscriptions: SubscriptionsData = JSON.parse(subscriptionsData);

  return index.index.map((skill) => {
    const sub = subscriptions.skills[skill.id] || { status: "paused" as SkillStatus };
    return {
      id: skill.id,
      name: skill.name,
      capability_zh: skill.capability_zh || skill.description,
      use_case_zh: skill.use_case_zh || "-",
      invocation_phrase: skill.invocation_phrase || "-",
      status: sub.status,
    };
  });
}

export async function getSkill(id: string): Promise<SkillInfo | null> {
  const [indexData, subscriptionsData] = await Promise.all([
    readFile(SKILLS_INDEX_PATH, "utf-8"),
    readFile(SUBSCRIPTIONS_PATH, "utf-8"),
  ]);

  const index: SkillIndexData = JSON.parse(indexData);
  const subscriptions: SubscriptionsData = JSON.parse(subscriptionsData);

  const skill = index.index.find((s) => s.id === id);
  if (!skill) return null;

  const sub = subscriptions.skills[skill.id] || { status: "paused" as SkillStatus };

  return {
    ...skill,
    status: sub.status,
  };
}

export async function updateSkillStatus(id: string, newStatus: SkillStatus): Promise<void> {
  const subscriptionsData = await readFile(SUBSCRIPTIONS_PATH, "utf-8");
  const subscriptions: SubscriptionsData = JSON.parse(subscriptionsData);

  if (!subscriptions.skills[id]) {
    throw new Error(`Skill ${id} not found`);
  }

  subscriptions.skills[id].status = newStatus;

  await writeFile(SUBSCRIPTIONS_PATH, JSON.stringify(subscriptions, null, 2), "utf-8");
}

export function cycleSkillStatus(current: SkillStatus): SkillStatus {
  const order: SkillStatus[] = ["subscribed", "paused", "unsubscribed"];
  const currentIndex = order.indexOf(current);
  return order[(currentIndex + 1) % order.length];
}
