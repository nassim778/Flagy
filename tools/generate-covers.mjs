import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'covers');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function getFlagBase64(code) {
  const filePath = path.join(rootDir, 'dist', 'assets', 'flags', `${code}.svg`);
  const svg = fs.readFileSync(filePath, 'utf8');
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const flags = {
  br: getFlagBase64('br'),
  ca: getFlagBase64('ca'),
  no: getFlagBase64('no'),
  jp: getFlagBase64('jp'),
  fr: getFlagBase64('fr')
};

function getCoverHTML(format) {
  const isLandscape = format === 'landscape';
  const isPortrait = format === 'portrait';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at 50% 45%, #1e3a8a 0%, #0f172a 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .bg-grid {
      position: absolute;
      inset: 0;
      opacity: 0.12;
      background-image: radial-gradient(#fbbf24 1.5px, transparent 1.5px);
      background-size: 32px 32px;
    }

    .compass-circle {
      position: absolute;
      width: ${isPortrait ? '700px' : isLandscape ? '1100px' : '750px'};
      height: ${isPortrait ? '700px' : isLandscape ? '1100px' : '750px'};
      border: 2px dashed rgba(251, 191, 36, 0.25);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .hero-content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 30px;
      width: 100%;
    }

    .badge-top {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(217, 119, 6, 0.25);
      border: 1.5px solid #fbbf24;
      color: #fbbf24;
      padding: ${isPortrait ? '10px 24px' : '14px 32px'};
      border-radius: 40px;
      font-size: ${isPortrait ? '20px' : isLandscape ? '28px' : '22px'};
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: ${isPortrait ? '28px' : '36px'};
      box-shadow: 0 4px 20px rgba(217, 119, 6, 0.35);
    }

    .main-title {
      font-size: ${isLandscape ? '110px' : isPortrait ? '76px' : '74px'};
      font-weight: 900;
      color: #ffffff;
      line-height: 1.0;
      text-transform: uppercase;
      letter-spacing: -2px;
      text-shadow: 0 6px 30px rgba(0, 0, 0, 0.7);
      margin-bottom: 12px;
    }

    .title-highlight {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: ${isLandscape ? '36px' : isPortrait ? '26px' : '26px'};
      color: #cbd5e1;
      font-weight: 700;
      letter-spacing: 8px;
      text-transform: uppercase;
      margin-bottom: ${isPortrait ? '40px' : '50px'};
    }

    .flags-row {
      display: flex;
      gap: ${isPortrait ? '20px' : '28px'};
      align-items: center;
      justify-content: center;
      margin-bottom: ${isPortrait ? '40px' : '50px'};
    }

    .flag-card {
      background: #ffffff;
      padding: 10px;
      border-radius: 16px;
      box-shadow: 0 16px 35px rgba(0, 0, 0, 0.5);
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .flag-card:nth-child(1) { transform: rotate(-8deg) translateY(-12px); }
    .flag-card:nth-child(2) { transform: rotate(5deg) translateY(10px); }
    .flag-card:nth-child(3) { transform: scale(1.22) rotate(-2deg); border-color: #fbbf24; box-shadow: 0 20px 45px rgba(217, 119, 6, 0.5); }
    .flag-card:nth-child(4) { transform: rotate(7deg) translateY(8px); }
    .flag-card:nth-child(5) { transform: rotate(-6deg) translateY(-10px); }

    .flag-img {
      width: ${isLandscape ? '170px' : isPortrait ? '110px' : '110px'};
      height: ${isLandscape ? '128px' : isPortrait ? '82px' : '82px'};
      object-fit: cover;
      border-radius: 10px;
      display: block;
    }

    .plane-banner {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      padding: ${isLandscape ? '16px 40px' : '12px 28px'};
      border-radius: 40px;
      font-size: ${isLandscape ? '28px' : isPortrait ? '20px' : '20px'};
      font-weight: 800;
      box-shadow: 0 8px 30px rgba(37, 99, 235, 0.5);
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="compass-circle"></div>

  <div class="hero-content">
    <div class="badge-top">
      ✈️ Geography Quiz & Exploration
    </div>

    <h1 class="main-title">
      FLAG <span class="title-highlight">FINDER</span>
    </h1>
    <div class="subtitle">WORLD TOUR</div>

    <div class="flags-row">
      <div class="flag-card">
        <img class="flag-img" src="${flags.br}">
      </div>
      <div class="flag-card">
        <img class="flag-img" src="${flags.ca}">
      </div>
      <div class="flag-card">
        <img class="flag-img" src="${flags.no}">
      </div>
      <div class="flag-card">
        <img class="flag-img" src="${flags.jp}">
      </div>
      <div class="flag-card">
        <img class="flag-img" src="${flags.fr}">
      </div>
    </div>

    <div class="plane-banner">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"/></svg>
      <span>Collect Stamps • Master World Flags</span>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('Generating high-res CrazyGames cover graphics...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Landscape 16:9 (1920x1080)
  console.log('Rendering 1920x1080 Landscape Cover...');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(getCoverHTML('landscape'), { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(outDir, 'cover-landscape-1920x1080.png') });

  // 2. Portrait 2:3 (800x1200)
  console.log('Rendering 800x1200 Portrait Cover...');
  await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
  await page.setContent(getCoverHTML('portrait'), { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(outDir, 'cover-portrait-800x1200.png') });

  // 3. Square 1:1 (800x800)
  console.log('Rendering 800x800 Square Cover...');
  await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 1 });
  await page.setContent(getCoverHTML('square'), { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(outDir, 'cover-square-800x800.png') });

  await browser.close();
  console.log('All 3 covers successfully created in:', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
