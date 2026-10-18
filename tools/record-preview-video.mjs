import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'videos');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function recordPreview(isPortrait) {
  const modeName = isPortrait ? 'portrait' : 'landscape';
  const outPath = path.join(outDir, `preview-${modeName}.mp4`);
  console.log(`Starting ${modeName} recording to ${outPath}...`);

  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: {
      width,
      height,
      deviceScaleFactor: 1
    },
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  // Spawn FFmpeg to encode streaming MJPEG frames to standard H.264 MP4
  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '24',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-movflags', '+faststart',
    outPath
  ]);

  ffmpeg.stderr.on('data', (d) => {
    // Suppress verbose ffmpeg logs unless error
  });

  let isRecording = false;

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    if (isRecording) {
      try {
        const buffer = Buffer.from(data, 'base64');
        ffmpeg.stdin.write(buffer);
      } catch (err) {}
    }
    try {
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (err) {}
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#loading-screen', { hidden: true });
  await new Promise((r) => setTimeout(r, 1000));

  // Start Screencast
  console.log(`Recording gameplay action for ${modeName}...`);
  isRecording = true;
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 85,
    everyNthFrame: 1
  });

  // Action 1: Show initial map and flag (1.5s)
  await new Promise((r) => setTimeout(r, 1500));

  // Action 2: Trigger first correct answer (Paper plane flies + Stamp animates)
  await page.evaluate(() => {
    const ctrl = window.__gameController;
    if (ctrl && ctrl.currentCountry) {
      ctrl.handleGuess(ctrl.currentCountry, { lat: ctrl.currentCountry.lat, lng: ctrl.currentCountry.lng });
    }
  });
  await new Promise((r) => setTimeout(r, 2200));

  // Action 3: Trigger second correct answer (Streak multiplier activates)
  await page.evaluate(() => {
    const ctrl = window.__gameController;
    if (ctrl && ctrl.currentCountry) {
      ctrl.handleGuess(ctrl.currentCountry, { lat: ctrl.currentCountry.lat, lng: ctrl.currentCountry.lng });
    }
  });
  await new Promise((r) => setTimeout(r, 2200));

  // Action 4: Open Travel Passport to show collected stamps
  await page.click('#btn-hud-passport');
  await new Promise((r) => setTimeout(r, 2000));

  // Stop recording
  isRecording = false;
  await client.send('Page.stopScreencast');
  await browser.close();

  ffmpeg.stdin.end();

  await new Promise((resolve) => {
    ffmpeg.on('close', resolve);
  });

  console.log(`Successfully generated ${outPath}`);
}

async function main() {
  await recordPreview(false); // Landscape (1280x720)
  await recordPreview(true);  // Portrait (720x1280)
  console.log('Both preview videos generated successfully in:', outDir);
}

main().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
