const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dist = path.join(root, "dist");

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

fs.copyFileSync(
  path.join(root, "manifest.json"),
  path.join(dist, "manifest.json")
);

const iconsSrc = path.join(root, "public", "icons");
const iconsDest = path.join(dist, "icons");

if (fs.existsSync(iconsSrc)) {
  fs.cpSync(iconsSrc, iconsDest, { recursive: true });
}

console.log("Extension assets copied.");