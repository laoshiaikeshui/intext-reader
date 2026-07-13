const assert = require("node:assert/strict");
const { buildReadingRangeStatus } = require("../src/readingRange.js");

const settings = {
  sourceType: "epub",
  bookId: "book",
  novelText: "x".repeat(100),
  chapters: [
    { index: 0, title: "One", startOffset: 0, endOffset: 50 },
    { index: 1, title: "Two", startOffset: 52, endOffset: 100 }
  ],
  imageAnchors: [
    { id: "a", textOffset: 10 },
    { id: "b", textOffset: 37 },
    { id: "c", textOffset: 38 },
    { id: "d", textOffset: 53 },
    { id: "final", textOffset: 100 }
  ]
};

assert.deepEqual(
  buildReadingRangeStatus(settings, { inserted: true, offset: 8, displayedChars: 30 }),
  {
    active: true,
    sourceType: "epub",
    bookId: "book",
    startOffset: 8,
    endOffset: 38,
    chapterIndex: 0,
    images: [
      { ...settings.imageAnchors[0], illustrationNumber: 1 },
      { ...settings.imageAnchors[1], illustrationNumber: 2 }
    ]
  }
);
assert.deepEqual(
  buildReadingRangeStatus(settings, { inserted: true, offset: 38, displayedChars: 1 }).images.map((image) => image.id),
  ["c"],
  "a boundary illustration appears only on the following page"
);
assert.deepEqual(
  buildReadingRangeStatus(settings, { inserted: true, offset: 90, displayedChars: 10 }).images.map((image) => image.id),
  ["final"],
  "the final page includes an end-of-book illustration"
);
assert.equal(buildReadingRangeStatus(settings, { inserted: true, offset: 52, displayedChars: 2 }).chapterIndex, 1);
assert.deepEqual(buildReadingRangeStatus(settings, { inserted: true, offset: 38, displayedChars: 0 }).images, []);
assert.equal(buildReadingRangeStatus(settings, { inserted: false }).active, false);
assert.equal(buildReadingRangeStatus({ sourceType: "txt" }, { inserted: true, offset: 0, displayedChars: 10 }).sourceType, "txt");

console.log("readingRange tests passed");
