import type { OverviewTone } from "../types";

export function countItems(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

export function pickFirstNonEmpty(...values: string[][]) {
  return values.find((items) => items.length > 0) || [];
}

export function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function toneToAccentClass(tone: OverviewTone) {
  if (tone === "success") {
    return "text-success";
  }
  if (tone === "warning") {
    return "text-amber-200";
  }
  if (tone === "danger") {
    return "text-danger";
  }
  if (tone === "accent") {
    return "text-accent";
  }
  return "text-white";
}
