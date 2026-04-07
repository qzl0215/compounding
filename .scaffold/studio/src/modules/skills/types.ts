export type SkillInvokeMode = "inline" | "mandatory" | "advisory" | "manual";
export type SkillStatus = "subscribed" | "paused" | "unsubscribed";

export type SkillInfo = {
  id: string;
  name: string;
  description: string;
  origin: string;
  file: string;
  invoke_mode: SkillInvokeMode;
  status: SkillStatus;
  capability_zh?: string;
  use_case_zh?: string;
  invocation_phrase?: string;
};

export type SkillTableRow = {
  id: string;
  name: string;
  capability_zh: string;
  use_case_zh: string;
  invocation_phrase: string;
  status: SkillStatus;
};
