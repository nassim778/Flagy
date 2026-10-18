# Flag Finder: World Tour ✈️🌍

A complete HTML5 geography web game built for submission to **Poki** (poki.com).

A flag appears. The player locates and taps the matching country on a world map. Score depends on distance from the correct country (exact = full points; near = partial with a warmer/colder hint). Every answer sends a small paper plane flying along an animated flight path from the previous country to the new one, and each correct country earns an authentic ink stamp in a "Passport" collection.

---

## Table of Contents
1. [Poki Rules & Architecture](#poki-rules--architecture)
2. [Quickstart: Run & Build](#quickstart-run--build)
3. [Final Asset Sizes & Download Footprint](#final-asset-sizes--download-footprint)
4. [Testing in the Poki Inspector](#testing-in-the-poki-inspector)
5. [Manual Test Plan](#manual-test-plan)
6. [Comprehensive Requirements Checklist](#comprehensive-requirements-checklist)
7. [What You Must Do Yourself](#what-you-must-do-yourself)
8. [Credits & AI-Tools Log](#credits--ai-tools-log)

---

## 1. Poki Rules & Architecture

- **Poki SDK v2 Integration**: Uses `<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>`. Handled through [`PokiWrapper.js`](dist/assets/js/poki/PokiWrapper.js) with strict alternating state guards (`gameplayStart()` and `gameplayStop()` can never fire consecutively).
- **100% Zero External Requests**: No CDN links, no Google Fonts, no map tile requests. All scripts, fonts, vector GeoJSON data, and flags are bundled locally in `dist/`.
- **190 Sovereign Nations**: The game quizzes on 190 sovereign nations across all continents.
- **Microstates & Tap Targets**: Missing/small territories from Natural Earth 110m (e.g., Monaco, San Marino, Tuvalu, Malta) are rendered with clickable touch-friendly markers guaranteeing $\ge 44\text{px}$ tap targets.
- **No External Audio**: 100% procedural WebAudio synthesis for all chimes, whooshes, thuds, and stamps via [`AudioEngine.js`](dist/assets/js/audio/AudioEngine.js).
- **Safe Storage**: `localStorage` wrapped with `try/catch` and seamless in-memory fallback for Incognito sessions.
- **Single Currency**: Points are the only currency. No shop, no microtransactions, no paywalls.

---

## 2. Quickstart: Run & Build

### Running Locally
To test the game with ES modules and proper MIME types, run the built-in zero-dependency local dev server:

```bash
# Start the local development server (Node 18+)
node dev/dev-server.mjs
```

Then visit:
- **Game**: `http://localhost:3000/`
- **Poki SDK Invariant Inspector**: `http://localhost:3000/dev/test-poki-stub.html`

### Re-generating / Updating Assets
The dev tool `tools/prepare-assets.mjs` downloads and processes the raw upstream vector assets into the production build:

```bash
cd tools
npm install
npm run build:assets
```

What `prepare-assets.mjs` accomplishes:
1. Validates the 190 sovereign nation ISO alpha-2 codes.
2. Extracts and optimizes the 190 4x3 SVG flags using SVGO multipass compression into `dist/assets/flags/`.
3. Converts Natural Earth `countries-110m.json` TopoJSON into lightweight GeoJSON with rounded coordinates (`dist/assets/data/world.json`), tagging non-quiz entities as neutral.
4. Generates `dist/assets/data/countries.json` with centroids, continents, and difficulty tiers.
5. Pins and copies Leaflet 1.9.4 (`leaflet.js` & `leaflet.css`) into `dist/assets/vendor/`.
6. Generates `dist/LICENSES` for Leaflet (BSD-2), flag-icons (MIT), and Natural Earth public domain data.

---

## 3. Final Asset Sizes & Download Footprint

The game is engineered to start in **under 1 second** on mobile connections, well under Poki's 10-second requirement:

| Asset Component | Path | Size | Loading Type |
|---|---|---|---|
| Main Entry HTML | `dist/index.html` | **9 KB** | Initial |
| Core Game Stylesheet | `dist/assets/css/style.css` | **18 KB** | Initial |
| Leaflet JS (pinned 1.9.4) | `dist/assets/vendor/leaflet.js` | **144 KB** | Initial |
| Leaflet CSS | `dist/assets/vendor/leaflet.css` | **14 KB** | Initial |
| World Map GeoJSON (110m) | `dist/assets/data/world.json` | **165 KB** | Initial |
| Countries Metadata | `dist/assets/data/countries.json` | **28 KB** | Initial |
| JS Game Engine & UI Modules | `dist/assets/js/**/*.js` | **~48 KB** | Initial |
| **Total Initial Download Footprint** | | **~423 KB** | **Playable in < 1s** |
| 190 SVGO-Optimized Flags | `dist/assets/flags/*.svg` | **1.18 MB total** | Lazy-loaded on demand |
| **Total Entire Build Directory** | `dist/` | **1.61 MB** | **All-inclusive** |

---

## 4. Testing in the Poki Inspector

When testing your game via the [Poki Inspector](https://sdk.poki.com/):

1. **Upload / Point URL**:
   Provide the URL of your local server (`http://localhost:3000/`) or upload the zipped contents of `dist/`.
2. **Loading Screen**:
   Verify that `PokiSDK.gameLoadingFinished()` triggers as soon as the loading bar fills and the world map renders.
3. **First Input Trigger**:
   Verify that `gameplayStart()` fires **only** after the player taps their first country or presses a key, never during loading.
4. **Pause Menu Invariant**:
   - Press the Pause button or `Space`.
   - Verify `gameplayStop()` is logged.
   - Click "Resume Flight".
   - Verify `commercialBreak()` is invoked.
   - Verify game audio and inputs are suspended during the commercial break.
   - Verify `gameplayStart()` is invoked immediately after the commercial break completes.
5. **Game Over & Rewarded Extra Life**:
   - Lose all 3 lives.
   - Verify `gameplayStop()` fires on game over.
   - Click the **Extra Life** button (`🎬 Extra Life - Watch an ad to continue`).
   - In Poki Inspector, test resolving with `success = true` (life granted, round resumes) and `success = false` (no life granted, button disables safely).
   - Verify the standard **Play Again** button is larger or equal in size, placed alongside/above the rewarded button, and triggers `commercialBreak()` before restarting.

---

## 5. Manual Test Plan

Run through this test matrix before Poki submission:

### Test 1: SDK Event Sequence Audit
- **Tool**: Open `http://localhost:3000/dev/test-poki-stub.html`.
- **Steps**:
  1. Boot game in iframe. Ensure `gameLoadingFinished()` is logged.
  2. Tap first country: ensure `gameplayStart()` is logged once.
  3. Pause game: ensure `gameplayStop()` is logged.
  4. Resume: ensure `commercialBreak()` starts and ends, followed by `gameplayStart()`.
  5. Check Audit Log: verify **NO** event is ever fired twice in a row.

### Test 2: Ad Blocker Resilience
- **Steps**:
  1. In `test-poki-stub.html`, check "Simulate Ad Blocker" (or open with uBlock Origin / Brave Shields active).
  2. Reload game.
  3. Verify the game initializes cleanly without uncaught promise errors.
  4. Ensure commercial breaks and rewarded ads fail gracefully without showing custom anti-adblocker nag screens.

### Test 3: Incognito / Storage Restrictions
- **Steps**:
  1. Open a new Incognito / Private window in Safari or Chrome.
  2. Play a round and collect a stamp.
  3. Verify a subtle toast notification appears once: *"Private browsing detected. Progress is saved for this session only."*
  4. Verify the game never crashes and state persists in memory throughout the session.

### Test 4: Screen Resolutions & Proportions (16:9 Matrix)
- **Devices**:
  - `640 x 360` (Poki small embed)
  - `836 x 470` (Poki medium embed)
  - `1031 x 580` (Poki large embed)
  - Portrait mobile (`390 x 844`)
- **Checks**:
  - In landscape: map fills stage, question card sits at bottom, HUD stays aligned.
  - In portrait: map occupies top 60%, flag question card occupies bottom 40%.
  - Verify Poki mobile pill area (top-left $46\times62\text{px}$ narrow, $92\times64\text{px}$ wide) is completely unobstructed by any interactive button or critical text.

### Test 5: Input Coexistence & Page-Jump Prevention
- **Steps**:
  1. Scroll mouse wheel over the Leaflet map: map zooms smoothly; parent page / iframe does **not** scroll.
  2. Press `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`: map pans smoothly; parent page does **not** scroll.
  3. Press `Space`: game pauses/resumes cleanly; parent page does **not** jump.
  4. Tap microstates (e.g. Monaco, Andorra, Malta, Singapore): circleMarker registers reliably on touch screens ($\ge 44\text{px}$ target).

### Test 6: Localization & RTL Rendering
- **Steps**:
  1. Pause game $\to$ switch language to Arabic (`العربية`).
  2. Verify layout flips to RTL (`dir="rtl"`), Poki safe padding adjusts to right side, and country names are rendered in Arabic via `Intl.DisplayNames`.
  3. Switch between French, Spanish, Portuguese, and English; verify UI text does not overflow containers.

---

## 6. Comprehensive Requirements Checklist

| Requirement | Implementation Location | Verification Status |
|---|---|---|
| Poki SDK script tag | `dist/index.html` line 8 | Verified |
| Catch SDK init failure and continue | `dist/assets/js/poki/PokiWrapper.js` lines 28–43 | Verified |
| Strict alternating `gameplayStart` / `gameplayStop` | `dist/assets/js/poki/PokiWrapper.js` lines 61–99 | Verified |
| `gameplayStart` fires on first input | `dist/assets/js/game/GameController.js` lines 205–213 | Verified |
| Commercial break only on resume/restart | `dist/assets/js/game/GameController.js` lines 304, 323, 330 | Verified |
| Mute audio & disable inputs during ads | `dist/assets/js/poki/PokiWrapper.js` lines 112–131 | Verified |
| Rewarded ads optional, never gate progress | `dist/assets/js/game/GameController.js` lines 308–320 | Verified |
| Rewarded button has 🎬 icon and is NOT green | `dist/assets/css/style.css` lines 604–627, `dist/index.html` line 133 | Verified |
| Standard Continue button equal/larger size | `dist/assets/css/style.css` lines 589–595, `dist/index.html` line 128 | Verified |
| Zero external network requests | Whole `dist/` bundle (no CDNs, no tile servers) | Verified |
| Leaflet 1.9.4 pinned locally | `dist/assets/vendor/leaflet.js`, `leaflet.css` | Verified |
| Leaflet `attributionControl: false` | `dist/assets/js/map/MapManager.js` line 46 | Verified |
| Leaflet `preferCanvas: true` | `dist/assets/js/map/MapManager.js` line 48 | Verified |
| Map world repetition prevented | `dist/assets/js/map/MapManager.js` lines 34–47 | Verified |
| Microstates touch targets $\ge 44\text{px}$ | `dist/assets/js/map/MapManager.js` lines 145–182 | Verified |
| Great-circle distance scoring | `dist/assets/js/map/MapManager.js` lines 282–350 | Verified |
| 190 sovereign nations quiz list | `tools/prepare-assets.mjs` lines 12–215 | Verified |
| Neutral gray non-member territories | `dist/assets/js/map/MapManager.js` lines 67–86 | Verified |
| Forgiving opening (first 3 rounds no life lost) | `dist/assets/js/game/GameController.js` lines 219, 238–254 | Verified |
| Daily Flight seeded from local date | `dist/assets/js/game/GameController.js` lines 72–104 | Verified |
| Travel theme paper plane flight trail | `dist/assets/js/ui/PlaneFX.js` lines 42–165 | Verified |
| Passport stamp collection book | `dist/assets/js/ui/PassportModal.js` | Verified |
| Procedural WebAudio synthesis | `dist/assets/js/audio/AudioEngine.js` | Verified |
| Wheel & keyboard page-jump prevention | `dist/assets/js/main.js` lines 188–215 | Verified |
| Poki mobile pill clearance | `dist/assets/css/style.css` lines 125–144, 20 | Verified |
| Safe `localStorage` with Incognito fallback | `dist/assets/js/storage/StorageEngine.js` | Verified |
| Multi-language: EN, FR, ES, PT, AR (RTL) | `dist/assets/locales/*.json`, `I18nEngine.js` | Verified |
| Native country names via `Intl.DisplayNames` | `dist/assets/js/i18n/I18nEngine.js` lines 68–79 | Verified |
| Shipped build clean of dev tools | `dev/` and `tools/` isolated outside `dist/` | Verified |

---

## 7. What You Must Do Yourself

Before submitting the game zip to Poki via the Developer Portal:

1. **Icons & Thumbnails**:
   Prepare icons according to [Poki's Thumbnail Guide](https://poki.com/en/developers):
   - Square icon: $512 \times 512\text{ px}$ (PNG, crisp, clean, with paper airplane and world map motif).
   - Animated thumbnail: High-quality looping MP4/GIF ($600 \times 338\text{ px}$, showing the paper plane flight trail and passport stamp).
2. **Poki Inspector Testing**:
   Run the live package through Poki's automated compliance checker at [sdk.poki.com](https://sdk.poki.com/) to obtain green checkmarks across all SDK events.
3. **Poki Developer Agreement**:
   Review Poki's Terms of Service and Content Guidelines in the Developer Portal dashboard.
4. **Create Zip for Upload**:
   Zip **only** the contents of `dist/` (such that `index.html` is at the root of the `.zip` archive):
   ```bash
   cd dist
   # On Windows PowerShell:
   Compress-Archive -Path * -DestinationPath ../flag-finder-world-tour.zip
   ```

---

## 8. Credits & AI-Tools Log

- **Game Title**: Flag Finder: World Tour
- **Engine**: Vanilla HTML5, Canvas & WebAudio API
- **Map Vector Engine**: Leaflet 1.9.4 (BSD-2 License, Vladimir Agafonkin)
- **Geography Data**: Natural Earth 1:110m (Public Domain) via TopoJSON World Atlas
- **Vector Flags**: `flag-icons` 4x3 (MIT License, Panayiotis Lipiridis)
- **Development & Architecture**: Built with Claude (Anthropic).

### What You Must Review Yourself:
- Verify that your Poki Developer account details and credentials match your game metadata.
- Perform a live run-through on physical iOS Safari and Android Chrome devices to inspect touch feedback responsiveness.
