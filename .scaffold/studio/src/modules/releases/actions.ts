export type ReleaseActionKind = "create-dev" | "accept-dev" | "reject-dev" | "rollback-prod";

export type ReleaseActionResponse = {
  ok?: boolean;
  message?: string;
  links?: {
    dev?: string;
    production?: string;
  };
};

export function resolveReleaseActionRedirect(
  kind: ReleaseActionKind,
  response: ReleaseActionResponse,
  previewUrl: string,
  productionUrl: string,
) {
  if (kind === "create-dev") {
    return `${response.links?.dev || previewUrl}/releases`;
  }

  if (kind === "accept-dev" || kind === "reject-dev" || kind === "rollback-prod") {
    return `${response.links?.production || productionUrl}/releases`;
  }

  return null;
}
