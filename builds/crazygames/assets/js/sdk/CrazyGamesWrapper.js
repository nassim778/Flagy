/**
 * CrazyGamesWrapper.js
 * CrazyGames HTML5 SDK v3 Integration.
 * Controls gameplayStart/gameplayStop, midgame ad breaks, and rewarded video ads.
 */

export class CrazyGamesWrapper {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.isGameplayRunning = false;
    this.isAdRunning = false;
    this.onAdStart = null;
    this.onAdEnd = null;
  }

  async init() {
    if (this.isInitialized) return true;

    try {
      if (window.CrazyGames && window.CrazyGames.SDK) {
        this.sdk = window.CrazyGames.SDK;
        await this.sdk.init();
        this.isInitialized = true;
      }
    } catch (err) {
      this.isInitialized = false;
    }

    return this.isInitialized;
  }

  gameLoadingFinished() {
    try {
      if (this.sdk?.game?.loadingStop) {
        this.sdk.game.loadingStop();
      }
    } catch (err) {}
  }

  gameplayStart() {
    if (this.isAdRunning || this.isGameplayRunning) return;
    this.isGameplayRunning = true;

    try {
      if (this.sdk?.game?.gameplayStart) {
        this.sdk.game.gameplayStart();
      }
    } catch (err) {}
  }

  gameplayStop() {
    if (!this.isGameplayRunning) return;
    this.isGameplayRunning = false;

    try {
      if (this.sdk?.game?.gameplayStop) {
        this.sdk.game.gameplayStop();
      }
    } catch (err) {}
  }

  async commercialBreak() {
    if (this.isAdRunning) return;
    this.isAdRunning = true;

    if (this.isGameplayRunning) {
      this.gameplayStop();
    }

    if (typeof this.onAdStart === 'function') {
      this.onAdStart();
    }

    if (this.sdk?.ad?.requestAd) {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          finish();
        }, 8000);

        const finish = () => {
          clearTimeout(timeout);
          resolve();
        };

        try {
          this.sdk.ad.requestAd('midgame', {
            adStarted: () => {},
            adFinished: () => finish(),
            adError: () => finish()
          });
        } catch (e) {
          finish();
        }
      });
    }

    this.isAdRunning = false;
    if (typeof this.onAdEnd === 'function') {
      this.onAdEnd();
    }
    this.gameplayStart();
  }

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

    if (this.sdk?.ad?.requestAd) {
      success = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          finish(false);
        }, 12000);

        const finish = (val) => {
          clearTimeout(timeout);
          resolve(val);
        };

        try {
          this.sdk.ad.requestAd('rewarded', {
            adStarted: () => {},
            adFinished: () => finish(true),
            adError: () => finish(false)
          });
        } catch (e) {
          finish(false);
        }
      });
    } else {
      success = true; // Fallback in local testing
    }

    this.isAdRunning = false;
    if (typeof this.onAdEnd === 'function') {
      this.onAdEnd();
    }
    this.gameplayStart();

    return success;
  }

  happyTime() {
    try {
      if (this.sdk?.game?.happytime) {
        this.sdk.game.happytime();
      }
    } catch (e) {}
  }
}
