import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

async function deepAudit() {
  console.log("👁️ Gemini Audit: Initializing...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Capture Console Logs
  page.on('console', msg => console.log(`[Browser Console]: ${msg.text()}`));

  try {
    console.log("  -> Visiting localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000)); // Wait for 3D to stabilize
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_galaxy.png') });

    console.log("  -> Checking for Canvas and Stars...");
    const hasCanvas = await page.$('canvas');
    console.log(`  ✅ Canvas detected: ${!!hasCanvas}`);

    // Try to trigger a warp
    console.log("  -> Triggering Warp to Identity...");
    await page.click('aside section div'); // Click first identity
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_after_warp.png') });

    // Check Data State via HUD
    console.log("  -> Capturing System Cortex...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_debug_hud.png') });

    console.log("✨ Audit Complete. Screenshots saved to tests/screenshots/");

  } catch (e) {
    console.error("❌ Audit Failed:", e.message);
  } finally {
    await browser.close();
  }
}

deepAudit();
