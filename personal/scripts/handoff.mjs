import { readFile, writeFile, copyFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { networkInterfaces, homedir } from "node:os";
import path from "node:path";
const version = JSON.parse(await readFile("package.json", "utf8")).version;
const apk = path.resolve(`artifacts/Moc-Personal-${version}.apk`);
let destination = path.join(
  homedir(),
  "Downloads",
  `Moc-Personal-${version}-20261125.apk`,
);
try {
  await access(destination);
  destination = destination.replace(".apk", "-" + Date.now() + ".apk");
} catch {
  /* A distinct destination does not exist yet. */
}
await copyFile(apk, destination);
const hash = (file) =>
  readFile(file).then((value) =>
    createHash("sha256").update(value).digest("hex"),
  );
if ((await hash(apk)) !== (await hash(destination)))
  throw new Error("Handoff hash mismatch");
const addresses = Object.values(networkInterfaces())
  .flat()
  .filter(
    (address) => address && address.family === "IPv4" && !address.internal,
  )
  .map((address) => address.address);
const report = {
  destination,
  sha256: await hash(destination),
  addresses,
  preview: "http://localhost:4318",
  downloadPage: addresses.map((address) => `http://${address}:4319`),
};
await writeFile("qa/handoff.json", JSON.stringify(report, null, 2));
await writeFile(
  "artifacts/index.html",
  `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cài Mốc</title><style>body{font:17px system-ui;background:#ffeada;color:#242320;max-width:500px;margin:10vh auto;padding:24px}h1{font-size:48px}a{display:block;background:#f5ab22;border:2px solid;border-radius:14px;box-shadow:3px 4px #242320;color:inherit;padding:18px;text-decoration:none;font-weight:bold;margin:28px 0}small{overflow-wrap:anywhere}p{line-height:1.7}</style><h1>Mốc</h1><p>Không gian cá nhân của bạn.<br>24 màu · Việt / Anh / Pháp / Trung · Offline</p><a href="Moc-Personal-${version}.apk" download>Tải APK cho Android</a><p>Tải file, mở và chọn Cài đặt. Dữ liệu được lưu trên thiết bị; xuất sao lưu trước khi gỡ app.</p><small>SHA-256: ${report.sha256}</small></html>`,
);
console.log(report);
