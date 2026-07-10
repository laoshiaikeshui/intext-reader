const assert = require("node:assert/strict");
const { canRunPageAction, getPageStatusText, getPageToggleText } = require("../src/pageControl.js");

assert.equal(canRunPageAction(true, "insert"), true);
assert.equal(canRunPageAction(true, "previous"), true);
assert.equal(canRunPageAction(true, "next"), true);
assert.equal(canRunPageAction(true, "restore"), true);
assert.equal(canRunPageAction(true, "hide"), true);
assert.equal(canRunPageAction(false, "hide"), false);
assert.equal(canRunPageAction(false, "insert"), false);
assert.equal(canRunPageAction(false, "get-status"), true);
assert.equal(canRunPageAction(false, "set-enabled"), true);
assert.equal(canRunPageAction(true, "unknown"), false);

assert.equal(getPageStatusText(false, true), "当前页面：不可用");
assert.equal(getPageStatusText(true, true), "当前页面：已启用");
assert.equal(getPageStatusText(true, false), "当前页面：已暂停");
assert.equal(getPageToggleText(false, true), "当前页面不可用");
assert.equal(getPageToggleText(true, true), "暂停当前页面");
assert.equal(getPageToggleText(true, false), "启用当前页面");
assert.equal(getPageStatusText(true, true, "en"), "Current page: Enabled");
assert.equal(getPageToggleText(true, false, "en"), "Enable on this page");

