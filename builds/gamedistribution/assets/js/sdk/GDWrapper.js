/**
 * GDWrapper.js
 * GameDistribution (Azerion) HTML5 SDK Integration.
 */

export class GDWrapper {
  constructor() {
    this.isInitialized = false;
    this.isGameplayRunning = false;
    this.isAdRunning = false;
    this.onAdStart = null;
    this.onAdEnd = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('gd:SDK_GAME_PAUSE', () => {
      this.isAdRunning = true;
      if (typeof this.onAdStart === 'function') {
        this.onAdStart();
      }
    });

    window.addEventListener('gd:SDK_GAME_START', () => {
      this.isAdRunning = false;
      if (typeof this.onAdEnd === 'function') {
        this.onAdEnd();
      }
      this.gameplayStart();
    });
  }

  async init() {
    this.isInitialized = true;
    return true;
  }

  gameLoadingFinished() {
    // GD handles loading automatically
  }

  gameplayStart() {
    if (this.isAdRunning || this.isGameplayRunning) return;
    this.isGameplayRunning = true;
  }

  gameplayStop() {
    this.isGameplayRunning = false;
  }

  async commercialBreak() {
    if (this.isAdRunning) return;

    if (this.isGameplayRunning) {
      this.gameplayStop();
    }

    if (typeof window.gdsdk !== 'undefined' && typeof window.gdsdk.showAd === 'function') {
      try {
        await window.gdsdk.showAd();
      } catch (err) {
        if (typeof this.onAdEnd === 'function') this.onAdEnd();
      }
    } else {
      // Local fallback
      if (typeof this.onAdEnd === 'function') this.onAdEnd();
    }
  }

  async rewardedBreak() {
    if (this.isAdRunning) return false;

    if (this.isGameplayRunning) {
      this.gameplayStop();
    }

    let success = false;

    if (typeof window.gdsdk !== 'undefined' && typeof window.gdsdk.showAd === 'function') {
      const rewardPromise = new Promise((resolve) => {
        const handler = () => {
          success = true;
          window.removeEventListener('gd:SDK_REWARDED_WATCH_COMPLETE', handler);
        };
        window.addEventListener('gd:SDK_REWARDED_WATCH_COMPLETE', handler);

        setTimeout(() => {
          window.removeEventListener('gd:SDK_REWARDED_WATCH_COMPLETE', handler);
          resolve(success);
        }, 15000);
      });

      try {
        await window.gdsdk.showAd('rewarded');
        await rewardPromise;
      } catch (err) {
        success = false;
      }
    } else {
      success = true; // Fallback in local testing
    }

    return success;
  }
}
