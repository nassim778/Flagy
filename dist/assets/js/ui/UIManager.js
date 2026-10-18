import { ICONS } from './Icons.js';

export class UIManager {
  constructor(elements = {}) {
    this.el = elements;
    this.isDesktop = !('ontouchstart' in window || navigator.maxTouchPoints > 0);
    this.initPokiPillPadding();
  }

  initPokiPillPadding() {
    // Detect screen width to ensure safe clearance for Poki mobile pill:
    // Narrow screens: 46x62px, Wide screens: 92x64px in top-left
    const updateSafeArea = () => {
      const isNarrow = window.innerWidth < 768;
      document.documentElement.style.setProperty(
        '--poki-pill-width',
        isNarrow ? '50px' : '96px'
      );
      document.documentElement.style.setProperty(
        '--poki-pill-height',
        isNarrow ? '66px' : '68px'
      );
    };
    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
  }

  /**
   * Updates HUD with score, lives, streak, and round count.
   */
  updateHUD({ score, lives, maxLives, streak, round, highScore, modeTitle }) {
    if (this.el.scoreText) {
      this.el.scoreText.textContent = score.toLocaleString();
    }
    if (this.el.highScoreText) {
      this.el.highScoreText.textContent = highScore.toLocaleString();
    }
    if (this.el.roundText) {
      this.el.roundText.textContent = `Round ${round}`;
    }
    if (this.el.modeTitle) {
      this.el.modeTitle.textContent = modeTitle || 'World Tour';
    }

    // Render lives (custom SVG hearts)
    if (this.el.livesContainer) {
      let heartsHtml = '';
      for (let i = 0; i < maxLives; i++) {
        const isFilled = i < lives;
        heartsHtml += isFilled ? ICONS.heartFilled : ICONS.heartEmpty;
      }
      this.el.livesContainer.innerHTML = heartsHtml;
    }

    // Streak multiplier pill
    if (this.el.streakBadge) {
      if (streak > 1) {
        this.el.streakBadge.textContent = `${streak}x STREAK!`;
        this.el.streakBadge.classList.add('visible');
      } else {
        this.el.streakBadge.classList.remove('visible');
      }
    }
  }

  /**
   * Sets the active quiz flag image.
   */
  setFlag(countryCode, altName = 'Flag') {
    if (!this.el.flagImg) return;
    const code = countryCode.toLowerCase();
    this.el.flagImg.src = `assets/flags/${code}.svg`;
    this.el.flagImg.alt = altName;
  }

  /**
   * Shows visual tutorial hand ("tap the country") for first-time players.
   */
  showTutorialHand() {
    if (this.el.tutorialHand) {
      this.el.tutorialHand.classList.add('active');
    }
  }

  hideTutorialHand() {
    if (this.el.tutorialHand) {
      this.el.tutorialHand.classList.remove('active');
    }
  }

  /**
   * Shows post-answer feedback banner with localized name and distance.
   */
  showFeedback({ isCorrect, countryName, distanceKm, points, hint, isForgivingRound }) {
    if (!this.el.feedbackBanner) return;

    let titleText = '';
    let badgeClass = '';

    if (isCorrect) {
      titleText = `✓ Correct! ${countryName}`;
      badgeClass = 'correct';
    } else if (hint === 'very_hot' || hint === 'warm') {
      titleText = `🔥 Close! That was ${distanceKm} km away`;
      badgeClass = 'warm';
    } else {
      titleText = `❄️ Missed! Country was ${countryName}`;
      badgeClass = 'wrong';
    }

    if (isForgivingRound && !isCorrect) {
      titleText += ' (Practice round - no life lost!)';
    }

    this.el.feedbackBanner.className = `feedback-banner ${badgeClass} show`;
    this.el.feedbackBanner.innerHTML = `
      <div class="feedback-title">${titleText}</div>
      <div class="feedback-pts">+${points} pts</div>
    `;

    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.hideFeedback();
    }, 2200);
  }

  showFeedbackRaw({ isCorrect, titleText, points, hint }) {
    if (!this.el.feedbackBanner) return;

    let badgeClass = 'wrong';
    if (isCorrect) {
      badgeClass = 'correct';
    } else if (hint === 'very_hot' || hint === 'warm') {
      badgeClass = 'warm';
    }

    this.el.feedbackBanner.className = `feedback-banner ${badgeClass} show`;
    this.el.feedbackBanner.innerHTML = `
      <div class="feedback-title">${titleText}</div>
      <div class="feedback-pts">+${points} pts</div>
    `;

    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.hideFeedback();
    }, 2200);
  }

  hideFeedback() {
    if (this.el.feedbackBanner) {
      this.el.feedbackBanner.classList.remove('show');
    }
  }

  /**
   * Toggles pause menu.
   */
  showPauseMenu({ onResume, onRestart, isSoundOn, onToggleSound }) {
    if (!this.el.pauseModal) return;
    this.el.pauseModal.classList.add('visible');

    // Bind resume
    if (this.el.btnResume) {
      this.el.btnResume.onclick = () => {
        this.hidePauseMenu();
        if (onResume) onResume();
      };
    }

    // Bind restart
    if (this.el.btnRestart) {
      this.el.btnRestart.onclick = () => {
        this.hidePauseMenu();
        if (onRestart) onRestart();
      };
    }

    // Bind sound toggle
    if (this.el.btnSound) {
      const updateSoundBtn = (isOn) => {
        this.el.btnSound.innerHTML = `${isOn ? ICONS.soundOn : ICONS.soundOff} <span>Sound: ${isOn ? 'ON' : 'OFF'}</span>`;
      };
      updateSoundBtn(isSoundOn);
      this.el.btnSound.onclick = () => {
        const next = onToggleSound();
        updateSoundBtn(next);
      };
    }
  }

  hidePauseMenu() {
    if (this.el.pauseModal) {
      this.el.pauseModal.classList.remove('visible');
    }
  }

  /**
   * Shows Game Over modal with score, stats, Play Again button, and Rewarded Extra Life button.
   * Poki rule compliance:
   * 1. Standard button (Play Again) appears alongside/above rewarded button and is equal or larger in size.
   * 2. Rewarded button has 🎬 icon, is NOT green, and clearly indicates an ad will play.
   */
  showGameOver({ score, highScore, isNewHigh, stampsEarned, onPlayAgain, onExtraLife }) {
    if (!this.el.gameOverModal) return;

    this.el.gameOverModal.classList.add('visible');

    if (this.el.finalScoreText) {
      this.el.finalScoreText.textContent = score.toLocaleString();
    }
    if (this.el.finalHighBadge) {
      this.el.finalHighBadge.innerHTML = `${ICONS.trophy} <span>NEW BEST!</span>`;
      this.el.finalHighBadge.style.display = isNewHigh ? 'inline-flex' : 'none';
    }
    if (this.el.finalStampsText) {
      this.el.finalStampsText.textContent = `${stampsEarned} Stamps Collected`;
    }

    // Standard Play Again button
    if (this.el.btnPlayAgain) {
      this.el.btnPlayAgain.onclick = () => {
        this.hideGameOver();
        if (onPlayAgain) onPlayAgain();
      };
    }

    // Rewarded Extra Life button (optional bonus, never gates progress)
    if (this.el.btnExtraLife) {
      if (onExtraLife) {
        this.el.btnExtraLife.style.display = 'flex';
        this.el.btnExtraLife.onclick = () => {
          this.el.btnExtraLife.disabled = true;
          onExtraLife(() => {
            this.hideGameOver();
          });
        };
      } else {
        this.el.btnExtraLife.style.display = 'none';
      }
    }
  }

  hideGameOver() {
    if (this.el.gameOverModal) {
      this.el.gameOverModal.classList.remove('visible');
    }
  }

  /**
   * Shows storage notification if Incognito prevents persistent saving.
   */
  showStorageAlert(message) {
    if (this.storageAlertShown) return;
    this.storageAlertShown = true;

    const alertBox = document.createElement('div');
    alertBox.className = 'storage-alert-toast';
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.classList.add('fade-out');
      setTimeout(() => alertBox.remove(), 600);
    }, 4500);
  }
}
