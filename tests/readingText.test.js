const assert = require("node:assert/strict");
const { formatInsertedText } = require("../src/readingText.js");

assert.equal(
  formatInsertedText("  ", "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx"),
  "\u00a0\u00a0abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx\u00a0\u00a0",
  "wraps a 50-character excerpt with visible spacing on both sides"
);

assert.equal(
  formatInsertedText("  ", "正文"),
  "\u00a0\u00a0正文\u00a0\u00a0",
  "renders multiple plain spaces as non-collapsing spaces on both sides"
);

assert.equal(
  formatInsertedText("", "hello"),
  "hello",
  "empty separator does not change the excerpt"
);

assert.equal(
  formatInsertedText("；", "正文"),
  "；正文；",
  "uses the same non-space separator before and after the excerpt"
);

