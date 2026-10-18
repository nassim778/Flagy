/**
 * GameController.js
 * Core game loop managing Endless World Tour, Daily Flight, and Regions modes.
 * Implements forgiving learning curve, tiered difficulty, scoring, lives,
 * paper airplane route animations, and Poki SDK coordination.
 */

export class GameController {
  constructor({
    poki,
    audio,
    storage,
    i18n,
    mapManager,
    uiManager,
    planeFX,
    countries
  }) {
    this.poki = poki;
    this.audio = audio;
    this.storage = storage;
    this.i18n = i18n;
    this.map = mapManager;
    this.ui = uiManager;
    this.fx = planeFX;
    this.countries = countries;

    // Game state
    this.mode = 'endless'; // 'endless' | 'daily' | 'regions'
    this.selectedRegion = null;
    this.round = 1;
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.streak = 1;
    this.isPaused = false;
    this.isAnswering = false;
    this.isGameOver = false;
    this.hasInputStarted = false;

    // Current & previous question
    this.currentCountry = null;
    this.previousCountry = null;
    this.usedCountryCodes = new Set();
    this.dailyQuestions = [];
    this.dailyIndex = 0;

    // Forgiving rounds threshold
    this.forgivingRounds = 3;

    // Bind map events
    this.map.onCountryClick = (country, latlng) => this.handleGuess(country, latlng);
  }

  /**
   * Starts a new game session.
   */
  startNewGame(mode = 'endless', region = null) {
    this.mode = mode;
    this.selectedRegion = region;
    this.round = 1;
    this.score = 0;
    this.lives = this.maxLives;
    this.streak = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.isAnswering = false;
    this.usedCountryCodes.clear();
    this.previousCountry = null;

    if (this.mode === 'daily') {
      this.initDailyQuestions();
    }

    this.updateHUD();
    this.nextRound();
  }

  /**
   * Prepares the daily 10-country itinerary deterministically seeded by local date.
   */
  initDailyQuestions() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Simple LCG pseudo-random generator seeded from date string
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
    }
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    // Shuffle countries pool
    const pool = [...this.countries];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.dailyQuestions = pool.slice(0, 10);
    this.dailyIndex = 0;
  }

  /**
   * Picks next country based on mode and difficulty tier ramp.
   */
  pickNextCountry() {
    if (this.mode === 'daily') {
      if (this.dailyIndex >= this.dailyQuestions.length) {
        return null; // Daily flight finished
      }
      return this.dailyQuestions[this.dailyIndex++];
    }

    let candidatePool = this.countries;

    // Filter by continent in Regions mode
    if (this.mode === 'regions' && this.selectedRegion) {
      candidatePool = candidatePool.filter((c) => c.continent === this.selectedRegion);
    }

    // Filter out already queried countries in this run
    let available = candidatePool.filter((c) => !this.usedCountryCodes.has(c.code));
    if (available.length === 0) {
      this.usedCountryCodes.clear();
      available = candidatePool;
    }

    // Difficulty tiers:
    // Round 1-5: Tier 1 (major / recognizable)
    // Round 6-12: Tier 1 + 2
    // Round 13+: Tier 1 + 2 + 3 (look-alikes, microstates)
    let maxTier = 1;
    if (this.round > 12) maxTier = 3;
    else if (this.round > 5) maxTier = 2;

    const tierFiltered = available.filter((c) => c.tier <= maxTier);
    const pool = tierFiltered.length > 0 ? tierFiltered : available;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.usedCountryCodes.add(chosen.code);
    return chosen;
  }

  /**
   * Advances to next round.
   */
  nextRound() {
    this.map.clearHighlights();
    this.isAnswering = false;

    const next = this.pickNextCountry();
    if (!next) {
      // Daily mode complete
      this.finishGame();
      return;
    }

    this.currentCountry = next;

    // Update UI flag
    const countryName = this.getCountryDisplayName(next.code, next.name);
    this.ui.setFlag(next.code, countryName);

    // Show tutorial hand for the very first round until player interacts
    if (this.round === 1 && !this.hasInputStarted) {
      this.ui.showTutorialHand();
    }

    this.updateHUD();
  }

  /**
   * Resolves localized country name via Intl.DisplayNames with fallback.
   */
  getCountryDisplayName(code, fallbackName) {
    if (this.i18n && typeof this.i18n.getCountryName === 'function') {
      return this.i18n.getCountryName(code, fallbackName);
    }
    return fallbackName;
  }

  /**
   * Handles player's map click or tap.
   */
  handleGuess(clickedCountry, latlng) {
    if (this.isPaused || this.isAnswering || this.isGameOver) return;
    // Only accept clicks on actual countries or microstate markers (ignore sea/water)
    if (!clickedCountry) return;

    // Trigger gameplayStart on player's first input (Poki requirement)
    if (!this.hasInputStarted) {
      this.hasInputStarted = true;
      this.ui.hideTutorialHand();
      this.poki.gameplayStart();
      this.audio.init();
    }

    this.isAnswering = true;

    // Evaluate proximity & score
    const target = this.currentCountry;
    const result = this.map.evaluateGuess(target, clickedCountry, latlng);
    const isForgiving = this.mode === 'endless' && this.round <= this.forgivingRounds;

    // Highlight map result
    this.map.highlightRoundResult(target, clickedCountry, latlng, result.isExact);

    // Audio cue
    if (result.isExact) {
      this.audio.playCorrect();
    } else if (result.hint === 'very_hot' || result.hint === 'warm') {
      this.audio.playProximity(result.warmth);
    } else {
      this.audio.playWrong();
    }

    // Calculate points and lives
    if (result.isExact) {
      // Full points * streak multiplier
      const earned = result.points * this.streak;
      this.score += earned;
      this.streak += 1;
      if (this.streak >= 3) {
        this.audio.playFanfare();
      }

      // Record passport stamp!
      const isNewStamp = this.storage.addStamp(target.code);
      if (isNewStamp) {
        this.audio.playStamp();
      }
    } else if (result.points > 0) {
      // Partial points for near miss
      this.score += result.points;
      this.streak = 1;
      if (!isForgiving) {
        this.lives -= 1;
      }
    } else {
      // Complete miss
      this.streak = 1;
      if (!isForgiving) {
        this.lives -= 1;
      }
    }

    // Flight route animation: from previous country (or center) to target
    const startCoords = this.previousCountry
      ? { lat: this.previousCountry.lat, lng: this.previousCountry.lng }
      : { lat: 20, lng: 0 };
    const ptStart = this.map.latLngToContainerPoint(startCoords.lat, startCoords.lng);
    const ptEnd = this.map.latLngToContainerPoint(target.lat, target.lng);

    this.audio.playPlaneWhoosh();
    this.fx.flyPlane(ptStart, ptEnd, () => {
      if (result.isExact) {
        this.fx.spawnStampEffect(ptEnd, target.name);
      }
    });

    this.previousCountry = target;

    // Show banner feedback
    const displayName = this.getCountryDisplayName(target.code, target.name);
    let titleMsg = '';
    if (result.isExact) {
      titleMsg = `✓ ${this.i18n ? this.i18n.t('correct') : 'Correct!'} ${displayName}`;
    } else if (result.hint === 'very_hot' || result.hint === 'warm') {
      titleMsg = `🔥 ${this.i18n ? this.i18n.t('hot_close', { dist: result.distanceKm }) : `Close! ${result.distanceKm} km away`}`;
    } else {
      titleMsg = `❄️ ${this.i18n ? this.i18n.t('missed', { name: displayName }) : `Missed! Was ${displayName}`}`;
    }

    if (isForgiving && !result.isExact) {
      titleMsg += ` ${this.i18n ? this.i18n.t('practice_round') : '(Practice round - no life lost!)'}`;
    }

    this.ui.showFeedbackRaw({
      isCorrect: result.isExact,
      titleText: titleMsg,
      points: result.isExact ? result.points * (this.streak - 1) : result.points,
      hint: result.hint
    });

    this.updateHUD();

    // Check game over
    if (this.lives <= 0) {
      setTimeout(() => {
        this.finishGame();
      }, 1600);
      return;
    }

    // Advance round after brief delay
    setTimeout(() => {
      this.round += 1;
      this.nextRound();
    }, 2000);
  }

  /**
   * Finishes game session, stops gameplay, and presents game over / results.
   */
  finishGame() {
    this.isGameOver = true;
    this.poki.gameplayStop();

    // Check high score
    const isNewHigh = this.storage.setHighScore(this.score);
    const totalStamps = this.storage.getStampCount();

    // In daily mode, record streak
    if (this.mode === 'daily') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(Date.now() - 86400000);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      this.storage.recordDailyCompletion(todayStr, yesterdayStr, this.score);
    }

    this.ui.showGameOver({
      score: this.score,
      highScore: this.storage.getHighScore(),
      isNewHigh,
      stampsEarned: totalStamps,
      onPlayAgain: async () => {
        // Commercial break on restart heading back into gameplay (Poki compliant)
        await this.poki.commercialBreak();
        this.startNewGame(this.mode, this.selectedRegion);
      },
      onExtraLife: async (onGranted) => {
        // Rewarded video break for extra life
        const success = await this.poki.rewardedBreak();
        if (success) {
          this.lives = 1;
          this.isGameOver = false;
          this.audio.playCorrect();
          this.updateHUD();
          if (onGranted) onGranted();
          this.nextRound();
        }
      }
    });
  }

  /**
   * Pauses gameplay.
   */
  pause() {
    if (this.isPaused || this.isGameOver) return;
    this.isPaused = true;
    this.poki.gameplayStop();

    this.ui.showPauseMenu({
      onResume: async () => {
        this.isPaused = false;
        // Commercial break on resuming back into gameplay
        await this.poki.commercialBreak();
      },
      onRestart: async () => {
        this.isPaused = false;
        await this.poki.commercialBreak();
        this.startNewGame(this.mode, this.selectedRegion);
      },
      isSoundOn: this.storage.getSettings().sound,
      onToggleSound: () => {
        const current = this.storage.getSettings().sound;
        const next = !current;
        this.storage.updateSettings({ sound: next });
        this.audio.setMuted(!next);
        return next;
      }
    });
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.ui.hidePauseMenu();
    this.poki.commercialBreak();
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  updateHUD() {
    let modeTitle = 'World Tour';
    if (this.mode === 'daily') modeTitle = 'Daily Flight';
    else if (this.mode === 'regions') modeTitle = `Region: ${this.selectedRegion}`;

    this.ui.updateHUD({
      score: this.score,
      lives: this.lives,
      maxLives: this.maxLives,
      streak: this.streak,
      round: this.round,
      highScore: this.storage.getHighScore(),
      modeTitle
    });
  }
}
