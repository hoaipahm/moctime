import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE", e.message));
page.on("console", (e) => {
  if (e.type() === "error") console.log("CONSOLE", e.text());
});
page.on("requestfailed", (r) =>
  console.log("REQUEST FAILED", r.url(), r.failure()),
);
await page.goto("http://127.0.0.1:4318");
console.log("ONLINE", await page.locator("body").innerText());
await page.evaluate(() => navigator.serviceWorker.ready);
console.log(
  "SW",
  await page.evaluate(async () => ({
    controller: !!navigator.serviceWorker.controller,
    caches: await caches.keys(),
    files: await Promise.all(
      (await caches.keys()).map(async (key) =>
        (await (await caches.open(key)).keys()).map((r) => r.url),
      ),
    ),
  })),
);
await context.setOffline(true);
await page.reload();
console.log("OFFLINE", await page.locator("body").innerText());
await page.screenshot({ path: "qa/offline-debug.png" });
await browser.close();
