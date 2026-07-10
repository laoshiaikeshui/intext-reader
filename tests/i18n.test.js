const assert = require("node:assert/strict");
const {
  DEFAULT_LANGUAGE_PREFERENCE,
  getMissingTranslationKeys,
  normalizeLanguagePreference,
  resolveLanguage,
  translate
} = require("../src/i18n.js");

assert.equal(DEFAULT_LANGUAGE_PREFERENCE, "auto");
assert.equal(normalizeLanguagePreference("zh"), "zh");
assert.equal(normalizeLanguagePreference("en"), "en");
assert.equal(normalizeLanguagePreference("unknown"), "auto");
assert.equal(resolveLanguage("auto", "zh-CN"), "zh");
assert.equal(resolveLanguage("auto", "en-US"), "en");
assert.equal(resolveLanguage("zh", "en-US"), "zh");
assert.deepEqual(getMissingTranslationKeys(), []);

assert.equal(translate("maxDisplayWidth", "zh"), "最大显示宽度（px）");
assert.equal(translate("maxDisplayWidth", "en"), "Maximum display width (px)");
assert.equal(translate("chooseTxt", "zh"), "选择 TXT");
assert.equal(translate("chooseTxt", "en"), "Choose TXT");
assert.equal(translate("noFileSelected", "zh"), "未选择文件");
assert.equal(translate("noFileSelected", "en"), "No file selected");
assert.equal(translate("versionLabel", "zh", { version: "1.1.0" }), "版本：v1.1.0");
assert.equal(translate("versionLabel", "en", { version: "1.1.0" }), "Version: v1.1.0");
assert.equal(
  translate("disclaimer", "zh"),
  "仅供本地个人阅读使用，请遵守网站规则及适用法律。"
);
assert.equal(
  translate("disclaimer", "en"),
  "Personal local use only. Follow site rules and applicable laws."
);
assert.equal(
  translate("progressSummary", "en", { total: 100, offset: 25, percent: "25.0" }),
  "Total: 100 | Position: 25 | Progress: 25.0%"
);
assert.equal(translate("missingKey", "en"), "missingKey");
