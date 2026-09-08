import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale } from '../src/locale.mjs';

test('Chinese browser variants use Traditional Chinese', () => {
  for (const language of ['zh', 'zh-TW', 'zh-CN', 'zh-HK', 'zh-SG', 'zh-Hans', 'zh-Hant', 'ZH-cn', 'zh_CN']) {
    assert.equal(resolveLocale(null, null, [language]), 'zh-Hant', language);
  }
});

test('non-Chinese and unavailable browser languages default to English', () => {
  for (const language of ['en-US', 'ja-JP', 'ko-KR', 'fr-FR', '']) {
    assert.equal(resolveLocale(null, null, [language]), 'en', language);
  }
  assert.equal(resolveLocale(null, null), 'en');
});

test('uses the preferred language, with navigator.language when the list is empty', () => {
  assert.equal(resolveLocale(null, null, ['en-US', 'zh-TW']), 'en');
  assert.equal(resolveLocale(null, null, ['zh-CN', 'en-US']), 'zh-Hant');
  assert.equal(resolveLocale(null, null, [], 'zh-HK'), 'zh-Hant');
});

test('URL choices override saved choices, which override system detection', () => {
  assert.equal(resolveLocale('en', 'zh-Hant', ['zh-TW']), 'en');
  for (const requested of ['zh', 'zh-Hant']) {
    assert.equal(resolveLocale(requested, 'en', ['en-US']), 'zh-Hant');
  }
  assert.equal(resolveLocale(null, 'en', ['zh-TW']), 'en');
  assert.equal(resolveLocale(null, 'zh-Hant', ['en-US']), 'zh-Hant');
  assert.equal(resolveLocale('invalid', 'invalid', ['zh-CN']), 'zh-Hant');
  assert.equal(resolveLocale('invalid', 'invalid', ['ja-JP']), 'en');
});
