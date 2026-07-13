const assert = require("node:assert/strict");
const {
  buildChapterJump,
  buildChapterOptions,
  getSelectedChapterIndex
} = require("../src/chapterNavigation.js");

const chapters = [
  { id: "chapter-1", index: 0, title: "A very long first chapter title", startOffset: 0, endOffset: 20 },
  { id: "chapter-2", index: 1, title: "第二章", startOffset: 22, endOffset: 40 }
];

assert.deepEqual(buildChapterOptions(chapters), [
  { value: "0", label: "1. A very long first chapter title", title: "A very long first chapter title" },
  { value: "1", label: "2. 第二章", title: "第二章" }
]);
assert.deepEqual(buildChapterJump(chapters, 1), { offset: 22, chapterIndex: 1, clearHistory: true });
assert.equal(buildChapterJump(chapters, 3), null);
assert.equal(getSelectedChapterIndex(chapters, 0), 0);
assert.equal(getSelectedChapterIndex(chapters, 21), 0);
assert.equal(getSelectedChapterIndex(chapters, 22), 1);
assert.equal(getSelectedChapterIndex([], 10), -1);

console.log("chapterNavigation tests passed");
