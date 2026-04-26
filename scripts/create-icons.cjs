const fs = require("fs");
const { createCanvas } = require("canvas");

const sizes = [16, 48, 128];

if (!fs.existsSync("public/icons")) {
  fs.mkdirSync("public/icons", { recursive: true });
}

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#090711";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.beginPath();
  ctx.roundRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76, size * 0.16);
  ctx.stroke();

  ctx.fillStyle = "#a78bfa";
  ctx.font = `bold ${size * 0.42}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(">_", size * 0.52, size * 0.52);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`public/icons/icon${size}.png`, buffer);
}