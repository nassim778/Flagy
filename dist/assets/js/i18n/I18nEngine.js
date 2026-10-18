/**
 * I18nEngine.js
 * Multi-language localization manager supporting EN, FR, ES, PT, and AR (RTL).
 * Uses Intl.DisplayNames for dynamic, native country names with English fallback.
 */

export class I18nEngine {
  constructor(storageEngine) {
    this.storage = storageEngine;
    this.currentLocale = 'en';
    this.strings = {};
    this.displayNames = null;
    this.supportedLocales = ['en', 'fr', 'es', 'pt', 'ar'];

    this.detectInitialLocale();
  }

  detectInitialLocale() {
    // 1. Saved preference
    const saved = this.storage.getSettings().locale;
    if (saved && this.supportedLocales.includes(saved)) {
      this.currentLocale = saved;
      return;
    }

    // 2. Browser language
    const navLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (this.supportedLocales.includes(navLang)) {
      this.currentLocale = navLang;
    } else {
      this.currentLocale = 'en';
    }
  }

  async loadLocale(locale = this.currentLocale) {
    if (!this.supportedLocales.includes(locale)) {
      locale = 'en';
    }
    this.currentLocale = locale;

    try {
      const res = await fetch(`assets/locales/${locale}.json`);
      this.strings = await res.json();
    } catch (e) {
      // Fallback
      if (locale !== 'en') {
        const fallbackRes = await fetch('assets/locales/en.json');
        this.strings = await fallbackRes.json();
      }
    }

    // Update document direction & lang attribute
    const isRtl = this.strings.dir === 'rtl' || locale === 'ar';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);

    // Initialize Intl.DisplayNames for this locale
    try {
      if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
        this.displayNames = new Intl.DisplayNames([locale], { type: 'region' });
      }
    } catch (err) {
      this.displayNames = null;
    }

    // Save preference
    this.storage.updateSettings({ locale });

    // Apply translations to DOM elements with data-i18n
    this.applyDOMTranslations();

    return this.strings;
  }

  /**
   * Translates key with optional placeholder replacements: {dist}, {name}, {count}, etc.
   */
  t(key, params = {}) {
    let str = this.strings[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  /**
   * Resolves country name via Intl.DisplayNames with fallback.
   */
  getCountryName(iso2, fallbackName) {
    if (this.displayNames) {
      try {
        const name = this.displayNames.of(iso2);
        if (name) return name;
      } catch (e) {
        // Suppress
      }
    }
    return fallbackName;
  }

  /**
   * Scans DOM for [data-i18n] attributes and updates their textContent.
   */
  applyDOMTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (this.strings[key]) {
        el.textContent = this.strings[key];
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (this.strings[key]) {
        el.setAttribute('placeholder', this.strings[key]);
      }
    });
  }
}
