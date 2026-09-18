const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "app.webmanifest"), "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.ok(manifest.icons.some(icon => icon.sizes === "192x192"));
assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && icon.purpose === "maskable"));
for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), `${icon.src} should exist`);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(html, /rel="manifest" href="app\.webmanifest"/);
assert.match(html, /viewport-fit=cover/);
assert.match(html, /apple-touch-icon/);
assert.match(html, /cloud-sync\.js/);
assert.match(html, /pwa\.js/);

const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.match(worker, /app\.webmanifest/);
assert.match(worker, /cloud-sync\.js/);
assert.match(worker, /addEventListener\("fetch"/);

console.log("PWA structure passed: manifest, app icons, install metadata, offline worker, and sync scripts are present.");
