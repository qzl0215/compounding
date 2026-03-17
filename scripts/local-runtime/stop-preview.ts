process.env.AI_OS_RUNTIME_PROFILE = "dev";
process.env.AI_OS_LOCAL_PORT = process.env.AI_OS_LOCAL_PORT || "3001";
process.env.AI_OS_LOCAL_LINK_NAME = "preview-current";
process.env.AI_OS_LOCAL_STATE_PREFIX = "local-dev";

require("./stop-prod.ts");
