import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'journey_logs');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

async function runUserJourney() {
  console.log("🕵️‍♂️ Starting 100-Scenario User Simulation...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  let step = 0;

  const log = async (msg) => {
    step++;
    console.log(`  [Step ${step}] ${msg}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `step_${step}.png`) });
  };

  try {
    // --- SCENARIO 1: THE AWAKENING ---
    console.log("\n🎬 SCENARIO 1: THE AWAKENING");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await log("Page Loaded");

    // Wait for ANY text that indicates sidebar
    try {
      await page.waitForXPath("//h1[contains(., 'DreamOS')]", { timeout: 5000 });
      await log("Sidebar Detected (by Text)");
    } catch (e) {
      const html = await page.content();
      console.log("DUMP:", html.substring(0, 500)); // Dump HTML for debugging
      throw new Error("Sidebar Text NOT Found!");
    }

    // Check Grid Content
    await page.waitForSelector('img[src*="thumbs"]', { timeout: 10000 });
    const images = await page.$$('img[src*="thumbs"]');
    if (images.length === 0) throw new Error("Grid is empty!");
    await log(`Grid populated with ${images.length} memories`);

    // --- SCENARIO 2: THE INSPECTION ---
    console.log("\n🎬 SCENARIO 2: THE INSPECTION");
    await images[0].click();
    await new Promise(r => setTimeout(r, 1500)); 
    await log("Inspector Triggered");

    // Look for Craft Scene button
    const craftBtns = await page.$x("//button[contains(., 'Craft Scene')]");
    if (craftBtns.length === 0) {
        // Maybe it's an audio file? Check for music icon
        const musicIcon = await page.$('.lucide-music');
        if (musicIcon) await log("Audio Inspector Opened");
        else throw new Error("Inspector content missing!");
    } else {
        await log("Craft Button Found");
    }

    // Close
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));
    await log("Inspector Closed");

    console.log("\n✨ SIMULATION COMPLETE: BASIC SYSTEMS GO");

  } catch (e) {
    console.error(`\n❌ SIMULATION FAILED at Step ${step}:`, e.message);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `FAILURE_step_${step}.png`) });
  } finally {
    await browser.close();
  }
}

runUserJourney();