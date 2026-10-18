/**
 * PokiWrapper.js
 * Poki HTML5 SDK v2 State Machine & Event Guard.
 * Enforces strict alternating gameplayStart/gameplayStop invariants,
 * manages commercialBreak and rewardedBreak lifecycles, and provides safe stubs.
 */

export class PokiWrapper {
  constructor() {
    this.sdk = typeof window !== 'undefined' ? window.PokiSDK : null;
    this.isInitialized = false;
    this.isLoadingFinished = false;
    this.isGameplayRunning = false;
    this.isAdRunning = false;
    this.firstInputReceived = false;

    // Optional event listeners for audio/input suspension
    this.onAdStart = null;
    this.onAdEnd = null;
  }

  /**
   * Initializes the Poki SDK with robust error catching and fallback.
   */
  async init() {
    if (this.isInitialized) return true;

    if (window.PokiSDK) {
      this.sdk = window.PokiSDK;
      try {
        await this.sdk.init();
        this.isInitialized = true;
      } catch (err) {
        // Continue even if SDK fails to load or ad blocker intervenes
        this.isInitialized = false;
      }
    } else {
      this.isInitialized = false;
    }

    return this.isInitialized;
  }

  /**
   * Notifies Poki that loading is completed and game is ready.
   */
  gameLoadingFinished() {
    if (this.isLoadingFinished) return;
    this.isLoadingFinished = true;
    if (this.sdk && typeof this.sdk.gameLoadingFinished === 'function') {
      try {
        this.sdk.gameLoadingFinished();
      } catch (err) {
        // Suppress
      }
    }
  }

  /**
   * Triggers gameplayStart strictly once until gameplayStop is called.
   * Per Poki guidelines, should fire on player's first input or round resume.
   */
  gameplayStart() {
    if (this.isAdRunning) return;
    if (this.isGameplayRunning) return; // Prevent duplicate gameplayStart

    this.isGameplayRunning = true;
    this.firstInputReceived = true;

    if (this.sdk && typeof this.sdk.gameplayStart === 'function') {
      try {
        this.sdk.gameplayStart();
      } catch (err) {
        // Suppress
      }
    }
  }

  /**
   * Triggers gameplayStop strictly once until gameplayStart is called.
   * Fires on pause, menu open, round/game end, game over, or ad break.
   */
  gameplayStop() {
    if (!this.isGameplayRunning) return; // Prevent duplicate gameplayStop

    this.isGameplayRunning = false;

    if (this.sdk && typeof this.sdk.gameplayStop === 'function') {
      try {
        this.sdk.gameplayStop();
      } catch (err) {
        // Suppress
      }
    }
  }

  /**
   * Commercial break (interstitial ad).
   * Used only on intentional gameplay resume/restart (e.g. closing pause or Play Again).
   * Mutes audio, disables input, pauses game, restores state, then triggers gameplayStart.
   */
  async commercialBreak() {
    if (this.isAdRunning) return;
    this.isAdRunning = true;

    // 1. Stop gameplay state if active
    if (this.isGameplayRunning) {
      this.gameplayStop();
    }

    // 2. Mute audio & pause input
    if (typeof this.onAdStart === 'function') {
      this.onAdStart();
    }

    // 3. Request commercial break from SDK (or fallback immediately)
    if (this.sdk && typeof this.sdk.commercialBreak === 'function') {
      try {
        await this.sdk.commercialBreak();
      } catch (err) {
        // Safe continuation on ad blocker or network issue
      }
    }

    // 4. Restore audio & input
    if (typeof this.onAdEnd === 'function') {
      this.onAdEnd();
    }

    this.isAdRunning = false;

    // 5. Strictly restart gameplay loop
    this.gameplayStart();
  }

  /**
   * Rewarded break (optional user-initiated ad for bonuses like Hint or Extra Life).
   * Resolves to true only if video was watched to completion (success === true).
   * Returns false without error on ad blockers or failure.
   */
  async rewardedBreak() {
    if (this.isAdRunning) return false;
    this.isAdRunning = true;

    if (this.isGameplayRunning) {
      this.gameplayStop();
    }

    if (typeof this.onAdStart === 'function') {
      this.onAdStart();
    }

    let success = false;
    if (this.sdk && typeof this.sdk.rewardedBreak === 'function') {
      try {
        success = await this.sdk.rewardedBreak();
      } catch (err) {
        success = false;
      }
    } else {
      // Stub fallback in dev / ad-block: resolve false cleanly
      success = false;
    }

    if (typeof this.onAdEnd === 'function') {
      this.onAdEnd();
    }

    this.isAdRunning = false;

    // Resume gameplay
    this.gameplayStart();

    return Boolean(success);
  }

  /**
   * External link wrapper via PokiSDK if ever required.
   */
  openExternalLink(url) {
    if (this.sdk && typeof this.sdk.openExternalLink === 'function') {
      this.sdk.openExternalLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
