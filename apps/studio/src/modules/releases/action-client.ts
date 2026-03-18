import { resolveReleaseActionRedirect, type ReleaseActionKind, type ReleaseActionResponse } from "./actions";

export type { ReleaseActionKind } from "./actions";

export type ReleaseActionRequest = {
  kind: ReleaseActionKind;
  url: string;
  payload: Record<string, unknown>;
  previewUrl: string;
  productionUrl: string;
};

export type ReleaseActionResult = {
  ok: boolean;
  message: string;
  redirectTarget: string | null;
  response: ReleaseActionResponse;
};

export async function executeReleaseAction(args: ReleaseActionRequest): Promise<ReleaseActionResult> {
  const response = await fetch(args.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args.payload),
  });

  const data = (await response.json().catch(() => ({}))) as ReleaseActionResponse;
  const message = data.message ?? (response.ok ? "已完成。" : "执行失败。");
  return {
    ok: response.ok && Boolean(data.ok ?? response.ok),
    message,
    redirectTarget: response.ok ? resolveReleaseActionRedirect(args.kind, data, args.previewUrl, args.productionUrl) : null,
    response: data,
  };
}
