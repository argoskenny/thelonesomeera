/**
 * Explicit choices take precedence over the browser's preferred language.
 * @param {string | null} requested
 * @param {string | null} saved
 * @param {readonly string[]} languages
 * @param {string} language
 * @returns {'en' | 'zh-Hant'}
 */
export function resolveLocale(requested, saved, languages = [], language = '') {
  if (requested === 'en') return 'en';
  if (requested === 'zh' || requested === 'zh-Hant') return 'zh-Hant';
  if (saved === 'en' || saved === 'zh-Hant') return saved;
  const preferred = languages[0] || language;
  return /^zh(?:[-_]|$)/i.test(preferred) ? 'zh-Hant' : 'en';
}
