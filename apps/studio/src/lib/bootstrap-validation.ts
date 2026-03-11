import type { FieldErrors, ProjectBrief, ProjectBriefSchema } from "./types";

export function validateProjectBrief(brief: ProjectBrief, schema: ProjectBriefSchema): FieldErrors {
  const errors: FieldErrors = {};

  for (const required of schema.required ?? []) {
    if (!(required in brief)) {
      errors[required] = "必填项缺失。";
    }
  }

  for (const [key, property] of Object.entries(schema.properties)) {
    const value = brief[key as keyof ProjectBrief];
    if (value === undefined || value === null) {
      continue;
    }

    if (property.enum && !property.enum.includes(String(value))) {
      errors[key] = `必须是以下值之一：${property.enum.join("、")}`;
      continue;
    }

    if (property.type === "string" && (typeof value !== "string" || !value.trim())) {
      errors[key] = "必须是非空字符串。";
      continue;
    }

    if (property.type === "array") {
      if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || !item.trim())) {
        errors[key] = "必须是非空字符串数组。";
      }
    }
  }

  return errors;
}

export const validateBootstrapConfig = validateProjectBrief;
