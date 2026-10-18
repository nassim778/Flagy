/**
 * ModeSelectModal.js
 * Mode Selector for Endless World Tour, Daily Flight (10 flags), and Continent Regions.
 */

export class ModeSelectModal {
  constructor({ storage, onSelectMode }) {
    this.storage = storage;
    this.onSelectMode = onSelectMode;
    this.modalEl = document.getElementById('mode-modal');
    this.closeBtn = document.getElementById('btn-close-mode');

    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    const modeButtons = document.querySelectorAll('[data-game-mode]');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.gameMode;
        const region = btn.dataset.region || null;
        this.hide();
        if (this.onSelectMode) {
          this.onSelectMode(mode, region);
        }
      });
    });
  }

  show() {
    if (!this.modalEl) return;
    this.renderDailyStats();
    this.modalEl.classList.add('visible');
  }

  hide() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('visible');
  }

  renderDailyStats() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const daily = this.storage.getDailyState(todayStr);

    const streakEl = document.getElementById('daily-streak-badge');
    const bestEl = document.getElementById('daily-best-score');

    if (streakEl) {
      streakEl.textContent = `🔥 ${daily.streak} Day Streak`;
    }
    if (bestEl) {
      bestEl.textContent = daily.bestScore > 0 ? `Best: ${daily.bestScore}` : 'Not completed today';
    }
  }
}
