const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1040 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    const sockets = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("socket.io")) sockets.push(request.url());
    });
    await page.goto("http://127.0.0.1:4173/utility-tiktok-chat/");
    await page.getByRole("button", { name: "Avvia demo" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    fs.mkdirSync("frontend/public/preview", { recursive: true });
    await page.screenshot({
      path: "frontend/public/preview/tiktok-chat-preview.png",
    });
    const before = await page.locator(".chat-message").count();
    await page.getByRole("button", { name: "Avvia demo" }).click();
    await page.waitForFunction(
      (count) => document.querySelectorAll(".chat-message").length > count,
      before,
    );
    await page.getByRole("button", { name: "Pausa demo" }).click();
    for (const route of [
      "chat",
      "rankings",
      "voice",
      "alerts",
      "settings",
      "history",
    ]) {
      await page.goto(`http://127.0.0.1:4173/utility-tiktok-chat/#/${route}`);
      await page.locator("h1").waitFor();
      await page.reload();
      await page.locator("h1").waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://127.0.0.1:4173/utility-tiktok-chat/#/live");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(sockets, []);
    console.log(
      "Demo passed: simulation, hash routes/reloads, mobile layout, no Socket.IO requests. Preview PNG captured (1440x1040).",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
