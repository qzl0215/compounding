const { loadTaskTemplate, renderTaskTemplate } = require("./task-template.js");

/**
 * @typedef {Object} AiCliOptions
 * @property {string[]} positionals
 * @property {Record<string, string | boolean>} flags
 * @property {boolean} json
 * @property {boolean} quiet
 * @property {boolean} failFast
 */

/**
 * @typedef {Object} AiCliResult
 * @property {boolean} ok
 * @property {string} [message]
 * @property {string} [error]
 * @property {unknown} [details]
 */

function isTruthyFlag(value) {
  if (value === true) return true;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

/**
 * Parse shared CLI flags while preserving all positional arguments.
 *
 * @param {string[]} argv
 * @returns {AiCliOptions}
 */
function parseCliArgs(argv = []) {
  const positionals = [];
  const flags = {};

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const [rawKey, ...rest] = arg.slice(2).split("=");
    if (!rawKey) continue;
    flags[rawKey] = rest.length > 0 ? rest.join("=") : true;
  }

  return {
    positionals,
    flags,
    json: isTruthyFlag(flags.json),
    quiet: isTruthyFlag(flags.quiet),
    failFast: isTruthyFlag(flags["fail-fast"] ?? flags.failFast),
  };
}

function formatDetails(details) {
  if (details === undefined || details === null || details === "") {
    return "";
  }
  if (Array.isArray(details)) {
    return details.join("\n");
  }
  if (typeof details === "string") {
    return details;
  }
  return JSON.stringify(details, null, 2);
}

/**
 * Emit a shared CLI result in text or JSON mode.
 *
 * @param {AiCliResult | Record<string, unknown>} result
 * @param {AiCliOptions} options
 * @param {(result: AiCliResult | Record<string, unknown>) => string} [renderText]
 */
function emitResult(result, options, renderText) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.quiet) {
    return;
  }

  if (typeof renderText === "function") {
    const text = renderText(result);
    if (text) {
      console.log(text);
    }
    return;
  }

  if (typeof result === "string") {
    console.log(result);
    return;
  }

  if (result && typeof result === "object" && typeof result.message === "string") {
    console.log(result.message);
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

/**
 * Exit the current CLI with a shared error payload.
 *
 * @param {string} message
 * @param {AiCliOptions} options
 * @param {unknown} [details]
 * @param {number} [exitCode]
 * @returns {never}
 */
function exitWithError(message, options, details, exitCode = 1) {
  const payload = {
    ok: false,
    error: message,
    details: details ?? null,
  };

  if (options?.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.error(message);
    const formatted = formatDetails(details);
    if (formatted) {
      console.error(formatted);
    }
  }

  process.exit(exitCode);
}

module.exports = {
  emitResult,
  exitWithError,
  loadTaskTemplate,
  parseCliArgs,
  renderTaskTemplate,
};
