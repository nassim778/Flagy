import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('Launching Chrome to capture Poki screenshots...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 2
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Wait for loading screen to complete and game to start
  await page.waitForSelector('#loading-screen', { hidden: true });
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 1: Core Gameplay (World map + Flag + HUD)
  console.log('Capturing Screenshot 1: Gameplay...');
  const screen1Path = path.join(outDir, '1-gameplay.png');
  await page.screenshot({ path: screen1Path });

  // Screenshot 2: Official Travel Passport Stamp Book
  console.log('Capturing Screenshot 2: Passport Stamp Book...');
  await page.click('#btn-hud-passport');
  await page.waitForSelector('#passport-modal.visible');
  await new Promise((r) => setTimeout(r, 600));
  const screen2Path = path.join(outDir, '2-passport.png');
  await page.screenshot({ path: screen2Path });

  // Close passport modal
  await page.click('#btn-close-passport');
  await new Promise((r) => setTimeout(r, 400));

  // Screenshot 3: Game Modes (Endless, Daily Flight, Continent Expeditions)
  console.log('Capturing Screenshot 3: Game Modes...');
  await page.click('#btn-hud-mode');
  await page.waitForSelector('#mode-modal.visible');
  await new Promise((r) => setTimeout(r, 600));
  const screen3Path = path.join(outDir, '3-game-modes.png');
  await page.screenshot({ path: screen3Path });

  // Close mode modal
  await page.click('#btn-close-mode');
  await new Promise((r) => setTimeout(r, 400));

  // Screenshot 4: Correct guess with Paper Plane route & Warmer/Colder feedback banner
  console.log('Capturing Screenshot 4: Answer Flight Action...');
  await page.evaluate(() => {
    const ctrl = window.__gameController;
    if (ctrl && ctrl.currentCountry) {
      // Trigger correct guess on current target country
      ctrl.handleGuess(ctrl.currentCountry, { lat: ctrl.currentCountry.lat, lng: ctrl.currentCountry.lng });
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const screen4Path = path.join(outDir, '4-flight-action.png');
  await page.screenshot({ path: screen4Path });

  await browser.close();
  console.log('Screenshots captured successfully into:', outDir);
}

main().catch((err) => {
  console.error('Failed to take screenshots:', err);
  process.exit(1);
});
