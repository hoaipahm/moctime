import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("dist");
async function walk(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...(await walk(absolute)));
    else if (item.name !== "sw.js")
      result.push("/" + path.relative(root, absolute).replaceAll("\\", "/"));
  }
  return result;
}
const urls = await walk(root);
const hash = createHash("sha256");
for (const url of urls)
  hash.update(await readFile(path.join(root, url.slice(1))));
const name = "moc-" + hash.digest("hex").slice(0, 12);
await writeFile(
  path.join(root, "sw.js"),
  `const CACHE=${JSON.stringify(name)};const ASSETS=${JSON.stringify(["/", ...urls])};self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('moc-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request,{ignoreVary:true}).then(cached=>cached||fetch(event.request).catch(()=>event.request.mode==='navigate'?caches.match('/'):Response.error())));});`,
);
console.log("Offline cache generated:", urls.length, "files");
