import { chromium } from "playwright";

// ── Configuration ─────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || "https://dimetime.netlify.app";
const EMAIL = process.env.TEST_EMAIL || `test-${Date.now()}@example.com`;
const PASSWORD = process.env.TEST_PASSWORD || "Testpass123!";
const NAME = process.env.TEST_NAME || "Automation Test";
const HEADLESS = process.env.HEADLESS !== "false";

// Track API responses for definitive success/failure
const apiLog = [];

function log(step, msg) {
  console.log(`\n[${new Date().toLocaleTimeString()}] ==> ${step}\n    ${msg}`);
}

async function fillVisible(page, selector, value) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 20000 });
  await el.fill(value);
}

function lastApi(method, pathSubstr) {
  for (let i = apiLog.length - 1; i >= 0; i--) {
    const entry = apiLog[i];
    if (entry.method === method && entry.url.includes(pathSubstr)) return entry;
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────
const browser = await chromium.launch({
  headless: HEADLESS,
  args: ["--ignore-certificate-errors"],
});

let pass = true;

try {
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("response", async (r) => {
    if (r.url().includes("/api/")) {
      const status = r.status();
      let body = "";
      try { body = JSON.stringify(await r.json()); } catch { body = ""; }
      apiLog.push({ method: r.request().method(), url: r.url(), status, body });
      console.log(`    [api] ${status} ${r.request().method()} ${r.url()} ${body}`);
    }
  });

  /* ── STEP 1: Register a brand-new account ─────────────────── */
  log("1. Register new account", `${NAME} / ${EMAIL}`);
  await page.goto(BASE_URL + "/register", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  await fillVisible(page, 'input[type="text"]', NAME);
  await fillVisible(page, 'input[type="email"]', EMAIL);
  const passInputs = page.locator('input[type="password"]');
  await passInputs.nth(0).waitFor({ state: "visible", timeout: 10000 });
  await passInputs.nth(0).fill(PASSWORD);
  await passInputs.nth(1).waitFor({ state: "visible", timeout: 10000 });
  await passInputs.nth(1).fill(PASSWORD);

  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(7000);

  const regApi = lastApi("POST", "/auth/register");
  const regUrl = page.url();
  console.log("    After register URL:", regUrl);

  if (regApi && regApi.status === 201) {
    log("REGISTER SUCCESS", "Got 201 from /api/auth/register");
  } else {
    log("REGISTER FAILED", regApi ? `status ${regApi.status} → ${regApi.body}` : "no API call captured");
    pass = false;
  }

  /* ── STEP 2: Login with the SAME credentials ──────────────── */
  // Clear storage, go to login, submit
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE_URL + "/login", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  log("2. Login with same credentials", `${EMAIL} / ${PASSWORD}`);
  await fillVisible(page, 'input[type="email"]', EMAIL);
  await fillVisible(page, 'input[type="password"]', PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(7000);

  const loginApi = lastApi("POST", "/auth/login");
  const loginUrl = page.url();
  console.log("    After login URL:", loginUrl);

  if (loginApi && loginApi.status === 200) {
    log("LOGIN SUCCESS (bcrypt fix verified)", "Got 200 from /api/auth/login");
  } else {
    log("LOGIN FAILED", loginApi ? `status ${loginApi.status} → ${loginApi.body}` : "no API call captured");
    pass = false;
  }

  await page.screenshot({ path: "login-result.png", fullPage: true });
  log("Screenshot saved", "login-result.png");
} catch (err) {
  console.error("\n[X] Automation error:", err.message);
  pass = false;
} finally {
  await browser.close();
}

console.log(pass
  ? "\n✅ PASS — register (201) and login (200) both succeed."
  : "\n❌ FAIL — the deployed backend is still broken.");
process.exit(pass ? 0 : 1);
