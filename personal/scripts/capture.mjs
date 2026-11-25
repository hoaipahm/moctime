import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
await mkdir("qa", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:4317");
await page.getByRole("heading", { name: "Hôm nay", exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "qa/desktop-today.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "qa/mobile-today.png", fullPage: true });
await page
  .locator(".topbar")
  .getByRole("button", { name: "Menu", exact: true })
  .click();
await page.screenshot({ path: "qa/mobile-menu.png" });
await page.keyboard.press("Escape");
await page
  .locator(".bottom-nav")
  .getByRole("button", { name: "Không gian", exact: true })
  .click();
await page.screenshot({ path: "qa/mobile-library.png", fullPage: true });
await page
  .locator(".topbar")
  .getByRole("button", { name: "Menu", exact: true })
  .click();
await page
  .locator(".menu-grid")
  .getByRole("button", { name: "Cài đặt", exact: true })
  .click();
await page.screenshot({ path: "qa/mobile-settings.png", fullPage: true });
await page.getByRole("button", { name: "Neon Night", exact: true }).click();
await page
  .locator(".bottom-nav")
  .getByRole("button", { name: "Lịch", exact: true })
  .click();
await page.screenshot({ path: "qa/mobile-neon-calendar.png", fullPage: true });
const svg = await readFile("public/icon.svg", "utf8");
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>body{margin:0}svg{width:100vw;height:100vh}</style>${svg}`,
  );
  await page.screenshot({ path: `public/icon-${size}.png` });
}
await browser.close();
console.log(
  "Captured desktop, mobile, menu, library, settings, calendar; generated app icons.",
);
