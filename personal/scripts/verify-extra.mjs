import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ["microphone"],
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const result = {};
await page.goto("http://127.0.0.1:4317");
await page.getByRole("heading", { name: "Hôm nay", exact: true }).waitFor();
const menu = async () =>
  page
    .locator(".topbar")
    .getByRole("button", { name: "Menu", exact: true })
    .click();
const library = async () =>
  page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Không gian", exact: true })
    .click();
const settings = async () => {
  await menu();
  await page
    .locator(".menu-grid")
    .getByRole("button", { name: "Cài đặt", exact: true })
    .click();
};
await library();
await page
  .locator(".module-grid")
  .getByRole("button", { name: /Bưu thiếp âm thanh/ })
  .click();
await page
  .getByRole("button", { name: "Thêm mới", exact: true })
  .first()
  .click();
await page.locator("dialog input").first().fill("Ảnh và âm thanh kiểm thử");
await page
  .locator("dialog input[type=file]")
  .setInputFiles("public/icon-192.png");
await page.locator(".media-preview img").waitFor();
await page
  .locator("dialog")
  .getByRole("button", { name: "Ghi âm", exact: true })
  .click();
await page
  .locator("dialog")
  .getByRole("button", { name: "Dừng", exact: true })
  .waitFor();
await page.waitForFunction(() =>
  document.querySelector("dialog .record-indicator"),
);
await page
  .locator("dialog")
  .getByRole("button", { name: "Dừng", exact: true })
  .click();
await page.locator("dialog audio").waitFor();
await page
  .locator("dialog")
  .getByRole("button", { name: "Lưu lại", exact: true })
  .click();
await page.locator(".entry audio").waitFor();
result.media =
  "photo and synthetic microphone recording persisted (not physical Android media)";
await settings();
const downloadPromise = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Sao lưu dữ liệu", exact: true })
  .click();
const download = await downloadPromise;
const file = await download.path();
const backup = JSON.parse(await readFile(file, "utf8"));
if (!backup.entries[0].photo || !backup.entries[0].audio)
  throw new Error("Backup missing media");
await page.locator("input[type=file]").setInputFiles({
  name: "restore.json",
  mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify(backup)),
});
await page
  .locator("dialog")
  .getByRole("button", { name: "Khôi phục từ bản sao lưu", exact: true })
  .click();
await page.locator("dialog").waitFor({ state: "detached" });
result.backup = "valid backup restored including media";
for (const [label, lang] of [
  ["English", "en"],
  ["Français", "fr"],
  ["简体中文", "zh"],
]) {
  await page
    .locator(".language-options")
    .getByRole("button", { name: label, exact: true })
    .click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `qa/mobile-settings-${lang}.png`,
    fullPage: true,
  });
  await page.locator(".topbar .menu-button").click();
  await page.screenshot({ path: `qa/mobile-menu-${lang}.png` });
  await page.keyboard.press("Escape");
  await page.locator(".bottom-nav .bottom-add").click();
  await page.screenshot({ path: `qa/mobile-form-${lang}.png` });
  const overflows = await page
    .locator("dialog")
    .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  if (overflows) throw new Error("Form overflow " + lang);
  await page.keyboard.press("Escape");
}
result.languages =
  "EN/FR/ZH settings, menu and full note form captured at 390px";
await page
  .locator(".language-options")
  .getByRole("button", { name: "Tiếng Việt", exact: true })
  .click();
await page.getByRole("button", { name: "Neon Night", exact: true }).click();
await page
  .locator(".bottom-nav")
  .getByRole("button", { name: "Lịch", exact: true })
  .click();
await page.screenshot({
  path: "qa/mobile-neon-calendar-final.png",
  fullPage: true,
});
result.calendar = "localized numeric lunar cells and enlarged controls";
result.errors = errors;
if (errors.length) throw new Error(errors.join("\n"));
await context.close();
const offline = await browser.newContext();
const op = await offline.newPage();
await op.goto("http://127.0.0.1:4318");
await op.getByRole("heading", { name: "Hôm nay", exact: true }).waitFor();
await op.evaluate(async () => {
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller)
    await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener("controllerchange", resolve, {
        once: true,
      }),
    );
});
await offline.setOffline(true);
await op.reload();
await op.getByRole("heading", { name: "Hôm nay", exact: true }).waitFor();
result.offline = "production shell reloads successfully with network disabled";
await offline.close();
await browser.close();
await writeFile("qa/extra-results.json", JSON.stringify(result, null, 2));
console.log(result);
