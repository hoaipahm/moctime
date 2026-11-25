import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const output = path.resolve(process.argv[2] ?? "qa/release");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:4317");
await page.getByRole("heading", { name: "Hôm nay", exact: true }).waitFor();
await page
  .locator(".sidebar-languages")
  .getByRole("button", { name: "EN", exact: true })
  .click();
await page.getByRole("heading", { name: "Today", exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: path.join(output, "personal-desktop.png"),
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: path.join(output, "personal-mobile.png") });
await page.locator(".topbar .menu-button").click();
await page.screenshot({ path: path.join(output, "personal-menu.png") });
await page.keyboard.press("Escape");
await page
  .locator(".bottom-nav")
  .getByRole("button", { name: "Spaces", exact: true })
  .click();
await page.screenshot({ path: path.join(output, "personal-spaces.png") });
await page.locator(".topbar .menu-button").click();
await page
  .locator(".menu-grid")
  .getByRole("button", { name: "Settings", exact: true })
  .click();
await page.screenshot({
  path: path.join(output, "personal-themes.png"),
  fullPage: true,
});
await page.getByRole("button", { name: "Neon Night", exact: true }).click();
await page
  .locator(".bottom-nav")
  .getByRole("button", { name: "Calendar", exact: true })
  .click();
await page.screenshot({
  path: path.join(output, "personal-calendar.png"),
  fullPage: true,
});
await browser.close();
console.log("Release screenshots saved:", output);
