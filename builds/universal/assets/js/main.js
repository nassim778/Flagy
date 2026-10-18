/**
 * main.js
 * Application entry point for Flag Finder: World Tour.
 * Bootstraps modules, binds Poki event guards & page-jump preventions,
 * and initializes map and game controllers.
 */

import { NoopWrapper as PokiWrapper } from './sdk/NoopWrapper.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { StorageEngine } from './storage/StorageEngine.js';
import { I18nEngine } from './i18n/I18nEngine.js';
import { MapManager } from './map/MapManager.js';
import { PlaneFX } from './ui/PlaneFX.js';
import { UIManager } from './ui/UIManager.js';
import { GameController } from './game/GameController.js';
import { PassportModal } from './ui/PassportModal.js';
import { ModeSelectModal } from './ui/ModeSelectModal.js';

async function bootstrap() {
  // 1. Initialize Poki SDK wrapper
  const poki = new PokiWrapper();
  await poki.init();

  // 2. Storage, I18n, Audio
  const storage = new StorageEngine();
  const i18n = new I18nEngine(storage);
  await i18n.loadLocale();

  const audio = new AudioEngine();
  audio.setMuted(!storage.getSettings().sound);

  // Hook Poki ad events to mute audio & suspend inputs
  poki.onAdStart = () => {
    audio.setAdMuted(true);
  };
  poki.onAdEnd = () => {
    audio.setAdMuted(false);
  };

  // 3. UI Elements
  const uiElements = {
    scoreText: document.getElementById('hud-score'),
    highScoreText: document.getElementById('hud-high-score'),
    roundText: document.getElementById('hud-round'),
    modeTitle: document.getElementById('hud-mode-title'),
    livesContainer: document.getElementById('hud-lives'),
    streakBadge: document.getElementById('hud-streak-badge'),
    flagImg: document.getElementById('quiz-flag-img'),
    feedbackBanner: document.getElementById('feedback-banner'),
    tutorialHand: document.getElementById('tutorial-hand'),
    pauseModal: document.getElementById('pause-modal'),
    btnResume: document.getElementById('btn-resume'),
    btnRestart: document.getElementById('btn-restart'),
    btnSound: document.getElementById('btn-sound-toggle'),
    gameOverModal: document.getElementById('game-over-modal'),
    finalScoreText: document.getElementById('final-score-val'),
    finalHighBadge: document.getElementById('final-high-badge'),
    finalStampsText: document.getElementById('final-stamps-val'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnExtraLife: document.getElementById('btn-extra-life')
  };

  const uiManager = new UIManager(uiElements);

  // Storage warning listener for private browsing
  window.addEventListener('flagfinder:storage-warning', (e) => {
    uiManager.showStorageAlert(e.detail.message);
  });

  // 4. Load bundled offline data
  let worldGeoJson;
  let countriesData;
  try {
    const [worldRes, countriesRes] = await Promise.all([
      fetch('assets/data/world.json'),
      fetch('assets/data/countries.json')
    ]);
    worldGeoJson = await worldRes.json();
    countriesData = await countriesRes.json();
  } catch (err) {
    console.error('Failed to load map data:', err);
    return;
  }

  // 5. Initialize Leaflet World Map
  const mapManager = new MapManager('map-container');
  mapManager.init(worldGeoJson, countriesData);

  // Playable countries: sovereign states with land polygons on the map
  const playableCountries = countriesData.filter((c) => mapManager.countryPolygons.has(c.code));

  // 6. Initialize Plane & Stamp Canvas FX
  const fxCanvas = document.getElementById('fx-canvas');
  const planeFX = new PlaneFX(fxCanvas);

  // 7. Initialize Game Controller
  const gameController = new GameController({
    poki,
    audio,
    storage,
    i18n,
    mapManager,
    uiManager,
    planeFX,
    countries: playableCountries
  });

  // 8. Initialize Passport & Mode Modals
  const passportModal = new PassportModal(
    storage,
    playableCountries,
    (code, name) => gameController.getCountryDisplayName(code, name)
  );

  const modeModal = new ModeSelectModal({
    storage,
    onSelectMode: async (mode, region) => {
      // Commercial break on starting new mode run
      await poki.commercialBreak();
      gameController.startNewGame(mode, region);
    }
  });

  // Bind HUD buttons for Passport & Mode
  const passportBtn = document.getElementById('btn-hud-passport');
  if (passportBtn) {
    passportBtn.addEventListener('click', () => {
      audio.playClick();
      poki.gameplayStop();
      passportModal.show();
    });
  }

  const closePassportBtn = document.getElementById('btn-close-passport');
  if (closePassportBtn) {
    closePassportBtn.addEventListener('click', () => {
      if (!gameController.isGameOver && !gameController.isPaused) {
        poki.gameplayStart();
      }
    });
  }

  const modeBtn = document.getElementById('btn-hud-mode');
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      audio.playClick();
      poki.gameplayStop();
      modeModal.show();
    });
  }

  const closeModeBtn = document.getElementById('btn-close-mode');
  if (closeModeBtn) {
    closeModeBtn.addEventListener('click', () => {
      if (!gameController.isGameOver && !gameController.isPaused) {
        poki.gameplayStart();
      }
    });
  }

  // Bind Language Selector in Pause Menu
  const langButtons = document.querySelectorAll('.btn-lang');
  const updateLangBtnStates = () => {
    langButtons.forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === i18n.currentLocale);
    });
  };
  updateLangBtnStates();

  langButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetLang = btn.dataset.lang;
      audio.playClick();
      await i18n.loadLocale(targetLang);
      updateLangBtnStates();
      gameController.updateHUD();
      if (passportModal.modalEl.classList.contains('visible')) {
        passportModal.renderGrid();
      }
    });
  });

  // 9. Bind Page Jump & Leaflet Keyboard / Wheel Prevention
  bindInputControls(gameController, mapManager);

  // 9. Hide loading screen & notify Poki
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 400);
  }
  poki.gameLoadingFinished();

  // 10. Start Endless World Tour directly for first-time player
  gameController.startNewGame('endless');

  // Expose controller for menu integration
  window.__gameController = gameController;
}

/**
 * Poki-mandated page jump prevention:
 * - Intercepts ArrowUp, ArrowDown, Space to prevent outer iframe scroll
 * - Non-passive wheel event listener with preventDefault
 * - Coexists with Leaflet arrow pan and scroll zoom
 * - Binds Space & Escape to pause/resume
 */
function bindInputControls(game, mapMgr) {
  // 1. Prevent default wheel scrolling on the window/parent page while allowing internal scrolling
  window.addEventListener(
    'wheel',
    (e) => {
      // Horizontal scrolling for passport tabs if hovering over them
      const tabsNav = e.target.closest('#passport-tabs, .passport-tabs-nav');
      if (tabsNav) {
        tabsNav.scrollLeft += (e.deltaX || e.deltaY);
        e.preventDefault();
        return;
      }

      // Vertical scrolling inside the passport modal or stamp grid
      const passportGrid = document.getElementById('passport-grid');
      const isOverPassport = e.target.closest('#passport-modal, .modal-passport');
      if (isOverPassport && passportGrid) {
        passportGrid.scrollTop += e.deltaY;
        e.preventDefault();
        return;
      }

      // Vertical scrolling for any other modal dialogs (mode selection, game over)
      const scrollable = e.target.closest('.modal-card, [data-scrollable]');
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
        scrollable.scrollTop += e.deltaY;
        e.preventDefault();
        return;
      }

      // Block parent iframe / window page scrolling
      e.preventDefault();
    },
    { passive: false }
  );

  // 2. Prevent page jumps from ArrowUp, ArrowDown, Space, and handle pause
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'Space' || e.code === 'Escape') {
      game.togglePause();
      return;
    }

    // Keyboard navigation for map: +/- zoom
    if (e.key === '+' || e.key === '=') {
      if (mapMgr.map) mapMgr.map.zoomIn();
    } else if (e.key === '-' || e.key === '_') {
      if (mapMgr.map) mapMgr.map.zoomOut();
    }
  });

  // Pause button in HUD
  const pauseBtn = document.getElementById('btn-hud-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      game.togglePause();
    });
  }

  // Keyboard hint toggle: desktop only
  const kbdHints = document.getElementById('desktop-kbd-hints');
  if (kbdHints) {
    const isTouchOnly = 'ontouchstart' in window && !window.matchMedia('(hover: hover)').matches;
    if (isTouchOnly) {
      kbdHints.style.display = 'none';
    }
  }
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
