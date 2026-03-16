const { PROD_BASE_URL } = require("./core.ts");
const { detectLocalProdStatus } = require("./status.ts");

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRoute(route) {
  const response = await fetch(new URL(route, PROD_BASE_URL), { redirect: "follow" });
  const text = await response.text();
  return {
    url: new URL(route, PROD_BASE_URL).toString(),
    status: response.status,
    ok: response.ok,
    text,
  };
}

function extractCssUrls(html) {
  const matches = [];
  for (const match of String(html || "").matchAll(/href="([^"]+\.css[^"]*)"/g)) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches));
}

async function checkLocalProduction() {
  const routes = ["/", "/tasks", "/knowledge-base?path=AGENTS.md", "/releases"];
  const routeResults = [];

  for (const route of routes) {
    try {
      routeResults.push(await fetchRoute(route));
    } catch (error) {
      routeResults.push({
        url: new URL(route, PROD_BASE_URL).toString(),
        status: 0,
        ok: false,
        text: error instanceof Error ? error.message : "request failed",
      });
    }
  }

  const home = routeResults.find((item) => item.url === `${PROD_BASE_URL}/`);
  const cssResults = [];

  if (home?.ok) {
    const cssUrls = extractCssUrls(home.text);
    if (cssUrls.length === 0) {
      cssResults.push({
        url: `${PROD_BASE_URL}/_next/static/css/*`,
        status: 0,
        ok: false,
        text: "No CSS assets were discovered in the home page HTML.",
      });
    } else {
      for (const href of cssUrls) {
        try {
          const url = new URL(href, PROD_BASE_URL).toString();
          const response = await fetch(url, { redirect: "follow" });
          cssResults.push({
            url,
            status: response.status,
            ok: response.ok,
            text: response.ok ? "" : await response.text(),
          });
        } catch (error) {
          cssResults.push({
            url: new URL(href, PROD_BASE_URL).toString(),
            status: 0,
            ok: false,
            text: error instanceof Error ? error.message : "css request failed",
          });
        }
      }
    }
  }

  const ok =
    routeResults.every((item) => item.ok) &&
    cssResults.length > 0 &&
    cssResults.every((item) => item.ok);

  return {
    ok,
    base_url: PROD_BASE_URL,
    routes: routeResults.map((item) => ({
      url: item.url,
      status: item.status,
      ok: item.ok,
      snippet: item.ok ? "" : item.text.slice(0, 240),
    })),
    css_assets: cssResults.map((item) => ({
      url: item.url,
      status: item.status,
      ok: item.ok,
      snippet: item.ok ? "" : item.text.slice(0, 240),
    })),
  };
}

async function waitForHealthyRuntime({ timeoutMs = 45000, intervalMs = 1000 } = {}) {
  const startedAt = Date.now();
  let lastStatus = detectLocalProdStatus();
  let lastCheck = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastStatus = detectLocalProdStatus();
    if (lastStatus.status === "running") {
      lastCheck = await checkLocalProduction();
      if (lastCheck.ok) {
        return { ok: true, status: lastStatus, check: lastCheck };
      }
    }
    await sleep(intervalMs);
  }

  if (!lastCheck) {
    lastCheck = await checkLocalProduction().catch(() => null);
  }
  return { ok: false, status: lastStatus, check: lastCheck };
}

module.exports = {
  checkLocalProduction,
  waitForHealthyRuntime,
};
