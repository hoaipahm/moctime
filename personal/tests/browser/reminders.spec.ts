import { test, expect, type Page } from "@playwright/test";
async function spaces(page: Page) {
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Không gian", exact: true })
    .click();
}
async function module(page: Page, name: RegExp) {
  await spaces(page);
  await page.locator(".module-grid").getByRole("button", { name }).click();
}
test("schedule periods persist across screens and reload with date separation", async ({
  page,
}) => {
  await page.goto("/");
  await module(page, /Tìm thời gian rảnh/);
  await page.getByLabel("Ngày", { exact: true }).fill("2030-01-01");
  await page
    .getByRole("button", { name: "Thêm khoảng bận", exact: true })
    .click();
  await expect(page.locator(".schedule-busy")).toHaveCount(1);
  await spaces(page);
  await page.reload();
  await module(page, /Tìm thời gian rảnh/);
  await page.getByLabel("Ngày", { exact: true }).fill("2030-01-01");
  await expect(page.locator(".schedule-busy")).toHaveCount(1);
  await page.getByLabel("Ngày", { exact: true }).fill("2030-01-02");
  await expect(page.locator(".schedule-busy")).toHaveCount(0);
});
test("Android back closes editors before navigating through history", async ({
  page,
}) => {
  await page.goto("/");
  await module(page, /Hạn chót bỏ túi/);
  await page
    .getByRole("button", { name: "Thêm mới", exact: true })
    .first()
    .click();
  await page.evaluate(() => window.dispatchEvent(new Event("moc-back")));
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator("h1")).toContainText("Hạn chót bỏ túi");
  await page.evaluate(() => window.dispatchEvent(new Event("moc-back")));
  await expect(page.locator("h1")).toContainText("Không gian cá nhân");
  await page.evaluate(() => window.dispatchEvent(new Event("moc-back")));
  await expect(page.locator("h1")).toHaveText("Hôm nay");
});
test("dated records save reminders while web explains Android requirement", async ({
  page,
}) => {
  await page.goto("/");
  await module(page, /Hạn chót bỏ túi/);
  await page
    .getByRole("button", { name: "Thêm mới", exact: true })
    .first()
    .click();
  await page.locator("dialog input").first().fill("Bảo hành máy ảnh");
  await page.getByLabel("Ngày", { exact: true }).fill("2030-01-01");
  await page
    .getByLabel("Nhắc vào lúc", { exact: true })
    .fill("2030-01-01T09:30");
  await page
    .locator("dialog")
    .getByRole("button", { name: "Lưu lại", exact: true })
    .click();
  await expect(page.locator(".entry")).toContainText("Nhắc vào lúc");
  await page.reload();
  await module(page, /Hạn chót bỏ túi/);
  await page
    .locator(".entry")
    .getByRole("button", { name: "Chỉnh sửa", exact: true })
    .click();
  await expect(page.getByLabel("Nhắc vào lúc", { exact: true })).toHaveValue(
    "2030-01-01T09:30",
  );
  await page.keyboard.press("Escape");
  await page
    .locator(".topbar")
    .getByRole("button", { name: "Menu", exact: true })
    .click();
  await page
    .locator(".menu-grid")
    .getByRole("button", { name: "Cài đặt", exact: true })
    .click();
  await expect(page.getByText(/Nhắc nền cần APK Android/)).toBeVisible();
});
