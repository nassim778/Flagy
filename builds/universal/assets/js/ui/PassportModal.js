/**
 * PassportModal.js
 * Visual Travel Passport & Stamp Collection Book.
 * Progression only (no shop, no second currency).
 * Groups the 193 UN member sovereign states by continent.
 */

export class PassportModal {
  constructor(storageEngine, countriesData, getCountryDisplayName) {
    this.storage = storageEngine;
    this.countries = countriesData;
    this.getName = getCountryDisplayName;
    this.activeContinent = 'all';

    this.modalEl = document.getElementById('passport-modal');
    this.listEl = document.getElementById('passport-grid');
    this.tabContainer = document.getElementById('passport-tabs');
    this.summaryEl = document.getElementById('passport-summary');
    this.closeBtn = document.getElementById('btn-close-passport');

    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    if (this.tabContainer) {
      this.tabContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.passport-tab');
        if (tab && tab.dataset.continent) {
          this.setActiveTab(tab.dataset.continent);
        }
      });
    }
  }

  setActiveTab(continent) {
    this.activeContinent = continent;
    const tabs = this.tabContainer.querySelectorAll('.passport-tab');
    tabs.forEach((t) => {
      t.classList.toggle('active', t.dataset.continent === continent);
    });
    this.renderGrid();
  }

  show() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('visible');
    this.renderHeader();
    this.renderGrid();
  }

  hide() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('visible');
  }

  renderHeader() {
    const stamps = this.storage.getStamps();
    const collectedCount = Object.keys(stamps).length;
    const totalCount = this.countries.length; // 193
    const percent = Math.round((collectedCount / totalCount) * 100);

    if (this.summaryEl) {
      this.summaryEl.innerHTML = `
        <div class="passport-progress-info">
          <span class="passport-count">${collectedCount} / ${totalCount} Countries Stamped</span>
          <span class="passport-pct">${percent}% Explored</span>
        </div>
        <div class="passport-progress-bar">
          <div class="passport-progress-fill" style="width: ${percent}%;"></div>
        </div>
      `;
    }
  }

  renderGrid() {
    if (!this.listEl) return;

    const stamps = this.storage.getStamps();
    let filtered = this.countries;

    if (this.activeContinent !== 'all') {
      filtered = this.countries.filter((c) => c.continent === this.activeContinent);
    }

    // Sort by name
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    let html = '';
    for (const country of sorted) {
      const stamp = stamps[country.code];
      const isStamped = Boolean(stamp);
      const displayName = this.getName(country.code, country.name);
      const codeLower = country.code.toLowerCase();

      html += `
        <div class="passport-item ${isStamped ? 'stamped' : 'locked'}">
          <div class="passport-stamp-seal">
            ${isStamped ? '<span class="stamp-ink">PASSED</span>' : '<span class="stamp-lock"><svg class="svg-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>'}
          </div>
          <div class="passport-flag-box">
            <img class="passport-flag-thumb" src="assets/flags/${codeLower}.svg" alt="${country.name}" loading="lazy">
          </div>
          <div class="passport-item-info">
            <span class="passport-country-name">${displayName}</span>
            <span class="passport-meta">${isStamped ? `Visited ${stamp.count}x` : 'Not visited yet'}</span>
          </div>
        </div>
      `;
    }

    this.listEl.innerHTML = html;
  }
}
