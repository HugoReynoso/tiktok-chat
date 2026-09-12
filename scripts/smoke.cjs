const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "msedge",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:5173");
  await page.getByRole("heading", { name: "Il tuo studio live." }).waitFor();
  await page.screenshot({ path: "docs/desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Connetti alla LIVE" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Inserisci uno username" })
    .waitFor();
  await page.goto("http://localhost:5173/settings");
  await page.getByLabel("Parole da non leggere").fill("spam\nblocked");
  await page.getByLabel(/^Lingua/).selectOption("en");
  await page.reload();
  assert.equal(
    await page.getByLabel("Words not to read").inputValue(),
    "spam\nblocked",
  );
  await page.goto("http://localhost:5173/alerts");
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("checkbox", { name: "Rule enabled" }).waitFor();
  await page.reload();
  assert.equal(
    await page.getByRole("checkbox", { name: "Rule enabled" }).count(),
    1,
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  for (const route of [
    "voice",
    "rankings",
    "history",
    "statistics",
    "rules",
    "chat",
  ]) {
    await page.goto(`http://localhost:5173/${route}`);
    await page.locator("h1").waitFor();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/settings");
  await page.getByLabel(/^Language/).selectOption("it");
  await page.goto("http://localhost:5173/live");
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  for (const route of [
    "live",
    "chat",
    "rankings",
    "voice",
    "alerts",
    "rules",
    "settings",
    "history",
    "statistics",
  ]) {
    await page.goto(`http://localhost:5173/${route}`);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Horizontal overflow: ${route}`,
    );
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "UI smoke passed: routes, persistence, rules, mobile overflow, no runtime errors.",
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
