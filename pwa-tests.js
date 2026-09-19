const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
assert.match(html, /First time\?/);
assert.ok(html.indexOf('id="createAccountButton"') < html.indexOf('id="signInButton"'), "Create account should be the first action for a new user");

const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.match(worker, /app\.webmanifest/);
assert.match(worker, /cloud-sync\.js/);
assert.match(worker, /addEventListener\("fetch"/);

const pwa = fs.readFileSync(path.join(root, "pwa.js"), "utf8");
assert.match(pwa, /window\.location\.protocol === "file:"/);
assert.match(pwa, /schoonmaker-austin\.github\.io\/andrews-financial-tracker\//);
let redirectedTo = "";
vm.runInNewContext(pwa, {
  window: {
    location: {
      protocol: "file:",
      replace(url) { redirectedTo = url; }
    }
  }
});
assert.equal(redirectedTo, "https://schoonmaker-austin.github.io/andrews-financial-tracker/");

console.log("PWA structure passed: manifest, app icons, install metadata, offline worker, and sync scripts are present.");
