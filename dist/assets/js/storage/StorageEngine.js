/**
 * StorageEngine.js
 * Safe localStorage wrapper with in-memory fallback for Incognito & restricted environments.
 * Manages game progression, passport stamps, daily flight streaks, and settings.
 */

const STORAGE_KEY = 'flag_finder_save_data_v1';

export class StorageEngine {
  constructor() {
    this.isLocalStorageAvailable = false;
    this.hasWarnedUnsaved = false;
    this.memoryData = this.getDefaultState();
    this.checkStorageSupport();
    this.load();
  }

  getDefaultState() {
    return {
      highScore: 0,
      dailyLastDate: null,
      dailyBestScore: 0,
      dailyStreak: 0,
      passportStamps: {}, // { "FR": { date: 123456789, count: 1 } }
      settings: {
        sound: true,
        locale: 'en'
      }
    };
  }

  checkStorageSupport() {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch (e) {
      this.isLocalStorageAvailable = false;
    }
  }

  load() {
    if (!this.isLocalStorageAvailable) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.memoryData = {
          ...this.getDefaultState(),
          ...parsed,
          settings: { ...this.getDefaultState().settings, ...(parsed.settings || {}) },
          passportStamps: parsed.passportStamps || {}
        };
      }
    } catch (e) {
      // Storage corrupted or blocked
    }
  }

  save() {
    if (!this.isLocalStorageAvailable) {
      if (!this.hasWarnedUnsaved) {
        this.hasWarnedUnsaved = true;
        // Broadcast single warning event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('flagfinder:storage-warning', {
            detail: { message: 'Private browsing detected. Progress is saved for this session only.' }
          }));
        }
      }
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryData));
    } catch (e) {
      // Quota exceeded or permission changed
    }
  }

  // --- High Score ---
  getHighScore() {
    return this.memoryData.highScore || 0;
  }

  setHighScore(score) {
    if (score > (this.memoryData.highScore || 0)) {
      this.memoryData.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  // --- Passport Stamps ---
  hasStamp(code) {
    return Boolean(this.memoryData.passportStamps && this.memoryData.passportStamps[code]);
  }

  addStamp(code) {
    if (!this.memoryData.passportStamps) {
      this.memoryData.passportStamps = {};
    }
    const existing = this.memoryData.passportStamps[code];
    const isNew = !existing;
    this.memoryData.passportStamps[code] = {
      date: Date.now(),
      count: (existing ? existing.count : 0) + 1
    };
    this.save();
    return isNew;
  }

  getStamps() {
    return this.memoryData.passportStamps || {};
  }

  getStampCount() {
    return Object.keys(this.memoryData.passportStamps || {}).length;
  }

  // --- Daily Flight ---
  getDailyState(todayDateStr) {
    const isToday = this.memoryData.dailyLastDate === todayDateStr;
    return {
      todayDateStr,
      alreadyPlayed: isToday && this.memoryData.dailyCompleted,
      bestScore: isToday ? this.memoryData.dailyBestScore : 0,
      streak: this.memoryData.dailyStreak || 0
    };
  }

  recordDailyCompletion(todayDateStr, yesterdayDateStr, score) {
    const lastDate = this.memoryData.dailyLastDate;
    let streak = this.memoryData.dailyStreak || 0;

    if (lastDate === yesterdayDateStr) {
      streak += 1;
    } else if (lastDate !== todayDateStr) {
      streak = 1;
    }

    this.memoryData.dailyLastDate = todayDateStr;
    this.memoryData.dailyCompleted = true;
    this.memoryData.dailyStreak = streak;
    if (score > (this.memoryData.dailyBestScore || 0)) {
      this.memoryData.dailyBestScore = score;
    }

    this.save();
    return { streak, bestScore: this.memoryData.dailyBestScore };
  }

  // --- Settings ---
  getSettings() {
    return this.memoryData.settings;
  }

  updateSettings(partial) {
    this.memoryData.settings = {
      ...this.memoryData.settings,
      ...partial
    };
    this.save();
  }
}
