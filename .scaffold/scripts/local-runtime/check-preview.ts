process.env.AI_OS_RUNTIME_PROFILE = "dev";
process.env.AI_OS_LOCAL_PORT = process.env.AI_OS_LOCAL_PORT || "3011";
process.env.AI_OS_LOCAL_LINK_NAME = "preview-current";
process.env.AI_OS_LOCAL_STATE_PREFIX = "local-dev";
process.env.COMPOUNDING_SUMMARY_SHORTCUT_ID = process.env.COMPOUNDING_SUMMARY_SHORTCUT_ID || "preview_summary";
process.env.COMPOUNDING_SUMMARY_ORIGINAL_CMD = process.env.COMPOUNDING_SUMMARY_ORIGINAL_CMD || "pnpm preview:check";

require("./check-prod.ts");
