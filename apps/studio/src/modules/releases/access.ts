import type { ManagementAccessState } from "./types";

type HeaderBag = Headers | { get(name: string): string | null } | Record<string, string | undefined>;

export function getManagementAccessState(headersLike: HeaderBag): ManagementAccessState {
  const host = normalizeHost(readHeader(headersLike, "host"));
  const forwarded = splitHeaderValues(readHeader(headersLike, "x-forwarded-for"));
  const realIp = splitHeaderValues(readHeader(headersLike, "x-real-ip"));
  const candidates = [host, ...forwarded, ...realIp].filter(Boolean);

  if (candidates.some((value) => isLocalOrPrivate(value))) {
    return { allowed: true, reason: "ok" };
  }

  return {
    allowed: false,
    reason: "发布管理页和发布接口仅允许本机或内网访问。"
  };
}

function readHeader(headersLike: HeaderBag, name: string) {
  if ("get" in headersLike && typeof headersLike.get === "function") {
    return headersLike.get(name);
  }
  const headersObject = headersLike as Record<string, string | undefined>;
  return headersObject[name] ?? headersObject[name.toLowerCase()];
}

function splitHeaderValues(value: string | null | undefined) {
  return (value || "")
    .split(",")
    .map((item) => normalizeHost(item))
    .filter(Boolean);
}

function normalizeHost(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("[")) {
    const closing = trimmed.indexOf("]");
    return closing === -1 ? trimmed : trimmed.slice(1, closing);
  }
  if (!trimmed.includes("::") && /:\d+$/.test(trimmed)) {
    return trimmed.replace(/:\d+$/, "");
  }
  const colonCount = (trimmed.match(/:/g) || []).length;
  if (colonCount === 1 && trimmed.includes(".")) {
    return trimmed.split(":")[0];
  }
  return trimmed;
}

function isLocalOrPrivate(value: string) {
  if (!value) {
    return false;
  }
  if (value === "localhost" || value === "::1" || value === "127.0.0.1") {
    return true;
  }
  if (/^127\./.test(value) || /^10\./.test(value) || /^192\.168\./.test(value)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) {
    return true;
  }
  return /^(fc|fd)[0-9a-f]{0,2}:/i.test(value);
}
