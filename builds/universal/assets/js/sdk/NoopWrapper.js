/**
 * NoopWrapper.js
 * Clean, zero-ad, standalone SDK stub for Itch.io, self-hosting, and offline play.
 */

export class NoopWrapper {
  constructor() {
    this.isInitialized = true;
    this.onAdStart = null;
    this.onAdEnd = null;
  }

  async init() {
    return true;
  }

  gameLoadingFinished() {}
  gameplayStart() {}
  gameplayStop() {}

  async commercialBreak() {
    // No-op for ad-free experience
  }

  async rewardedBreak() {
    // Grant reward directly without ads
    return true;
  }
}
