const path = require('path');

class I18n {
  constructor(defaultLang = 'ID') {
    this.defaultLang = defaultLang;
    this.cache = {};
  }

  getLocale(lang) {
    lang = lang || process.env.LANGUAGE || this.defaultLang;
    if (this.cache[lang]) return this.cache[lang];
    try {
      const langFile = require(path.join(__dirname, 'locales', lang));
      this.cache[lang] = langFile;
      return langFile;
    } catch (e) {
      console.warn(`Language file for ${lang} not found, fallback to ${this.defaultLang}.`);
      if (this.cache[this.defaultLang]) return this.cache[this.defaultLang];
      const fallback = require(path.join(__dirname, 'locales', this.defaultLang));
      this.cache[this.defaultLang] = fallback;
      return fallback;
    }
  }
}

module.exports = new I18n(); 