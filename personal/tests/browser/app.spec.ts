import { test, expect, type Page } from "@playwright/test";
async function menu(page: Page) {
  await page
    .locator(".topbar")
    .getByRole("button", { name: "Menu", exact: true })
    .click();
}
async function settings(page: Page) {
  await menu(page);
  await page
    .locator(".menu-grid")
    .getByRole("button", { name: "Cài đặt", exact: true })
    .click();
}
async function library(page: Page) {
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Không gian", exact: true })
    .click();
}
async function saveTitle(page: Page, title: string) {
  await page.locator("dialog input").first().fill(title);
  await page
    .locator("dialog")
    .getByRole("button", { name: "Lưu lại", exact: true })
    .click();
  await expect(page.locator("dialog")).toHaveCount(0);
}
test("create, edit, reload and delete an inventory item", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  await library(page);
  await page
    .locator(".module-grid")
    .getByRole("button", { name: /Đồ đâu rồi/ })
    .click();
  await page
    .getByRole("button", { name: "Thêm mới", exact: true })
    .first()
    .click();
  await page.locator("dialog input").first().fill("Hộ chiếu cá nhân");
  await page.getByLabel("Nơi chốn / nơi cất").fill("Tủ trắng, ngăn 2");
  await page
    .locator("dialog")
    .getByRole("button", { name: "Lưu lại", exact: true })
    .click();
  await expect(page.locator(".entry")).toContainText("Tủ trắng, ngăn 2");
  await page.reload();
  await library(page);
  await page
    .locator(".module-grid")
    .getByRole("button", { name: /Đồ đâu rồi/ })
    .click();
  await expect(page.locator(".entry")).toContainText("Hộ chiếu cá nhân");
  await page
    .locator(".entry")
    .getByRole("button", { name: "Chỉnh sửa", exact: true })
    .click();
  await page.getByLabel("Nơi chốn / nơi cất").fill("Ngăn 3");
  await page
    .locator("dialog")
    .getByRole("button", { name: "Lưu lại", exact: true })
    .click();
  await expect(page.locator(".entry")).toContainText("Ngăn 3");
  await page
    .locator(".entry")
    .getByRole("button", { name: "Xóa", exact: true })
    .click();
  await page
    .locator("dialog")
    .getByRole("button", { name: "Xóa", exact: true })
    .click();
  await expect(page.locator(".entry")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("all 24 themes apply and persist, 4 locales switch consistently", async ({
  page,
}) => {
  await page.goto("/");
  await settings(page);
  const tiles = page.locator(".theme-tile");
  await expect(tiles).toHaveCount(24);
  for (let i = 0; i < 24; i++) {
    await tiles.nth(i).click();
    await expect(tiles.nth(i)).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "Neon Night", exact: true }).click();
  await page.reload();
  await settings(page);
  await expect(
    page.getByRole("button", { name: "Neon Night", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const [label, language, heading] of [
    ["English", "en", "Settings"],
    ["Français", "fr", "Réglages"],
    ["简体中文", "zh", "设置"],
    ["Tiếng Việt", "vi", "Cài đặt"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Français", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".topbar")).toContainText("Aujourd’hui");
});
test("mobile menu closes on Escape and navigation", async ({ page }) => {
  await page.goto("/");
  await menu(page);
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  await menu(page);
  await page
    .locator(".menu-grid")
    .getByRole("button", { name: "Lịch", exact: true })
    .click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator(".calendar-grid")).toBeVisible();
});
test("every module opens, searchable library finds records", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await library(page);
  const names = await page.locator(".module-tile h2").allTextContents();
  expect(names).toHaveLength(31);
  for (const name of names) {
    await page
      .locator(".module-grid")
      .getByRole("button", {
        name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      .click();
    await expect(page.locator("h1")).toContainText(name);
    await library(page);
  }
  await page
    .getByRole("textbox", { name: "Tìm trong không gian của bạn…" })
    .fill("Đồ đâu");
  await expect(page.locator(".module-tile")).toHaveCount(1);
});
test("notes, habits and screenshot checklists work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ghi nhanh", exact: true }).click();
  await saveTitle(page, "Ghi chép đầu tiên");
  await library(page);
  await page
    .locator(".module-grid")
    .getByRole("button", { name: /Thói quen/ })
    .click();
  await page
    .getByRole("button", { name: "Thêm mới", exact: true })
    .first()
    .click();
  await saveTitle(page, "Đọc sách");
  await page
    .getByRole("button", { name: "Đánh dấu hôm nay", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Hôm nay đã làm", exact: true }),
  ).toBeVisible();
  await library(page);
  await page
    .locator(".module-grid")
    .getByRole("button", { name: /Ảnh thành checklist/ })
    .click();
  await page
    .getByRole("button", { name: "Thêm mới", exact: true })
    .first()
    .click();
  await page.locator("dialog input").first().fill("Yêu cầu");
  await page
    .getByLabel("Mỗi dòng là một việc")
    .fill("Làm giao diện\nKiểm tra điện thoại");
  await page
    .locator("dialog")
    .getByRole("button", { name: "Lưu lại", exact: true })
    .click();
  await page.locator(".checklist button").first().click();
  await expect(
    page.locator(".checklist button").first().locator("svg"),
  ).toHaveCount(1);
});
test("tools handle JSON errors, date intervals, UUID and regex", async ({
  page,
}) => {
  await page.goto("/");
  await library(page);
  await page
    .locator(".module-grid")
    .getByRole("button", { name: /Hộp công cụ/ })
    .click();
  await page.getByLabel("Đầu vào").fill('{"hello":"xin chào"}');
  await page.getByRole("button", { name: "Thực hiện", exact: true }).click();
  await expect(page.locator("pre")).toContainText("xin chào");
  await page.getByLabel("Đầu vào").fill("bad json");
  await page.getByRole("button", { name: "Thực hiện", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Tạo UUID", exact: true }).click();
  await page.getByRole("button", { name: "Thực hiện", exact: true }).click();
  await expect(page.locator("pre")).toContainText(/[a-f0-9]{8}-/);
  await page
    .getByRole("button", { name: "Tìm theo biểu thức", exact: true })
    .click();
  await page.getByLabel("Đầu vào").fill("abc 123 def 456");
  await page.getByLabel("Biểu thức", { exact: true }).fill("\\d+");
  await page.getByRole("button", { name: "Thực hiện", exact: true }).click();
  await expect(page.locator("pre")).toContainText("456");
});
test("backup exports real data and rejects malformed restore without losing it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ghi nhanh", exact: true }).click();
  await saveTitle(page, "Keep this note");
  await settings(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Sao lưu dữ liệu", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/moc-backup/);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"entries":[]}'),
  });
  await expect(page.getByRole("status")).toContainText("không hợp lệ");
  await library(page);
  await page
    .locator(".module-grid")
    .getByRole("button", { name: /^Ghi chép/ })
    .click();
  await expect(page.locator(".entry")).toContainText("Keep this note");
});
test("layouts do not overflow at phone, tablet and desktop widths", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    if (width <= 760) await expect(page.locator(".bottom-nav")).toBeVisible();
    else await expect(page.locator(".sidebar")).toBeVisible();
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await settings(page);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator("main")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
