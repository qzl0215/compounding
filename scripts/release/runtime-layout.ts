const fs = require("node:fs");
const path = require("node:path");

function workspaceRoot() {
  return process.cwd();
}

function runtimeRoot() {
  return process.env.AI_OS_RELEASE_ROOT || path.resolve(workspaceRoot(), "..", ".compounding-runtime");
}

function layoutPaths() {
  const root = runtimeRoot();
  return {
    root,
    releasesDir: path.join(root, "releases"),
    sharedDir: path.join(root, "shared"),
    currentLink: path.join(root, "current"),
    previewCurrentLink: path.join(root, "preview-current"),
    registryPath: path.join(root, "registry.json"),
    sharedEnvPath: path.join(root, "shared", "portal.env"),
    lockPath: path.join(root, "release.lock"),
  };
}

function bootstrapSharedEnv(sharedEnvPath) {
  if (fs.existsSync(sharedEnvPath)) {
    return;
  }
  for (const candidate of [".env.local", ".env"]) {
    const source = path.join(workspaceRoot(), candidate);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, sharedEnvPath);
      return;
    }
  }
}

function ensureLayout() {
  const layout = layoutPaths();
  fs.mkdirSync(layout.releasesDir, { recursive: true });
  fs.mkdirSync(layout.sharedDir, { recursive: true });
  bootstrapSharedEnv(layout.sharedEnvPath);
  return layout;
}

function previewBaseUrl() {
  const host = process.env.AI_OS_LOCAL_PREVIEW_HOST || "127.0.0.1";
  const port = process.env.AI_OS_LOCAL_PREVIEW_PORT || "3011";
  return `http://${host}:${port}`;
}

function productionBaseUrl() {
  const host = process.env.AI_OS_LOCAL_PROD_HOST || process.env.AI_OS_LOCAL_HOST || "127.0.0.1";
  const port = process.env.AI_OS_LOCAL_PROD_PORT || process.env.AI_OS_LOCAL_PORT || "3010";
  return `http://${host}:${port}`;
}

module.exports = {
  bootstrapSharedEnv,
  ensureLayout,
  layoutPaths,
  previewBaseUrl,
  productionBaseUrl,
  runtimeRoot,
  workspaceRoot,
};
