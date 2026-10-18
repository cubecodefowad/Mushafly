import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const dir = "C:/Users/huawe/Downloads/Logos - Mushafly";
const browser = await chromium.launch();
const page = await browser.newPage();

for (const file of ["Dark.png", "Light.png"]) {
  const dataUrl =
    "data:image/png;base64," + fs.readFileSync(path.join(dir, file)).toString("base64");
  const info = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, width_, height_);
    return null;
  }, dataUrl);
  void info;
  console.log(file, "ok");
}

await browser.close();
