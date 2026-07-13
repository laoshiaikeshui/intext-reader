const assert = require("node:assert/strict");
const {
  decorateIllustrationRange,
  formatIllustrationMarker,
  numberImageAnchors,
  selectIllustrationsInRange,
  shouldRerenderIllustrationDisplay
} = require("../src/illustrationMarkers.js");

const anchors = [
  { id: "later", textOffset: 4 },
  { id: "same-a", textOffset: 2 },
  { id: "same-b", textOffset: 2 },
  { id: "final", textOffset: 5 }
];
const snapshot = JSON.stringify(anchors);
const numbered = numberImageAnchors(anchors);

assert.deepEqual(
  numbered.map(({ id, illustrationNumber }) => ({ id, illustrationNumber })),
  [
    { id: "same-a", illustrationNumber: 1 },
    { id: "same-b", illustrationNumber: 2 },
    { id: "later", illustrationNumber: 3 },
    { id: "final", illustrationNumber: 4 }
  ]
);
assert.equal(JSON.stringify(anchors), snapshot, "numbering must not mutate stored anchors");
assert.equal(formatIllustrationMarker(3, "zh"), "[图片3]");
assert.equal(formatIllustrationMarker(1, "en"), "[1 image]");
assert.equal(formatIllustrationMarker(3, "en"), "[3 images]");
assert.equal(shouldRerenderIllustrationDisplay({ showEpubIllustrations: {} }), true);
assert.equal(shouldRerenderIllustrationDisplay({ uiLanguage: {} }), true);
assert.equal(shouldRerenderIllustrationDisplay({ offset: {} }), false);
assert.deepEqual(
  selectIllustrationsInRange({ anchors, rangeStart: 0, rangeLength: 4, novelLength: 5 }).map((image) => image.id),
  ["same-a", "same-b"],
  "an anchor at the range end belongs to the next range"
);
assert.deepEqual(
  selectIllustrationsInRange({ anchors, rangeStart: 4, rangeLength: 1, novelLength: 5 }).map((image) => image.id),
  ["later", "final"],
  "the final non-empty range includes an end-of-book anchor"
);

const firstRange = decorateIllustrationRange({
  text: "abcd",
  rangeStart: 0,
  novelLength: 5,
  anchors,
  language: "zh",
  enabled: true
});
assert.equal(firstRange.text, "ab[图片2]cd");
assert.deepEqual(firstRange.images.map((image) => image.id), ["same-a", "same-b"]);
assert.equal(firstRange.sourceLength, 4);

const finalRange = decorateIllustrationRange({
  text: "e",
  rangeStart: 4,
  novelLength: 5,
  anchors,
  language: "en",
  enabled: true
});
assert.equal(finalRange.text, "[1 image]e[1 image]");
assert.deepEqual(finalRange.images.map((image) => image.id), ["later", "final"]);
assert.equal(finalRange.sourceLength, 1, "markers do not count as novel characters");

const sevenAtStart = decorateIllustrationRange({
  text: "Chapter 1",
  rangeStart: 0,
  novelLength: 9,
  anchors: Array.from({ length: 7 }, (_, index) => ({ id: `front-${index + 1}`, textOffset: 0 })),
  language: "zh",
  enabled: true
});
assert.equal(sevenAtStart.text, "[图片7]Chapter 1");
assert.equal(sevenAtStart.images.length, 7);

assert.deepEqual(
  decorateIllustrationRange({
    text: "abcde",
    rangeStart: 0,
    novelLength: 5,
    anchors,
    language: "zh",
    enabled: false
  }),
  { text: "abcde", images: [], sourceLength: 5 }
);

console.log("illustrationMarkers tests passed");
