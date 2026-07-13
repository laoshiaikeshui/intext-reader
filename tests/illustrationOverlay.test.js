const assert = require("node:assert/strict");
const {
  clampViewerSize,
  decodeImageBytes,
  formatIllustrationCount,
  isImageRequestCurrent,
  isDragGesture,
  normalizeImageResponse,
  placeViewer,
  snapFloatingPosition
} = require("../src/illustrationOverlay.js");

assert.deepEqual(Array.from(decodeImageBytes("AAF/gP8=")), [0, 1, 127, 128, 255]);
assert.throws(() => decodeImageBytes(""), /image payload/i);
assert.throws(() => decodeImageBytes("%%%"), /image payload/i);
assert.equal(formatIllustrationCount(0), "0");
assert.equal(formatIllustrationCount(2), "2");
assert.equal(formatIllustrationCount(99), "99");
assert.equal(formatIllustrationCount(100), "99+");
assert.deepEqual(
  normalizeImageResponse({ ok: true, mediaType: "image/png", base64: "AAF/gP8=" }),
  { mediaType: "image/png", bytes: new Uint8Array([0, 1, 127, 128, 255]) }
);
assert.throws(() => normalizeImageResponse({ ok: false }), /image unavailable/i);
assert.throws(
  () => normalizeImageResponse({ ok: true, mediaType: "text/plain", base64: "AA==" }),
  /image unavailable/i
);

assert.equal(isDragGesture({ x: 10, y: 10 }, { x: 13, y: 13 }, 5), false);
assert.equal(isDragGesture({ x: 10, y: 10 }, { x: 18, y: 10 }, 5), true);
assert.equal(isImageRequestCurrent(
  { token: 2, bookId: "book-b", imageId: "image-1" },
  { token: 2, bookId: "book-b", imageId: "image-1", visible: true }
), true);
assert.equal(isImageRequestCurrent(
  { token: 1, bookId: "book-a", imageId: "image-1" },
  { token: 2, bookId: "book-b", imageId: "image-1", visible: true }
), false);
assert.equal(isImageRequestCurrent(
  { token: 2, bookId: "book-b", imageId: "image-1" },
  { token: 2, bookId: "book-b", imageId: "image-1", visible: false }
), false);

assert.deepEqual(
  snapFloatingPosition({ x: 20, y: 300 }, { width: 1000, height: 700 }, { width: 40, height: 40 }),
  { side: "left", x: 0, y: 300, yRatio: 300 / 660 }
);
assert.deepEqual(
  snapFloatingPosition({ x: 900, y: 800 }, { width: 1000, height: 700 }, { width: 40, height: 40 }),
  { side: "right", x: 960, y: 660, yRatio: 1 }
);

assert.deepEqual(clampViewerSize({ width: 50, height: 900 }, { width: 800, height: 600 }), {
  width: 180,
  height: 540
});
assert.deepEqual(clampViewerSize({ width: 400, height: 300 }, { width: 800, height: 600 }), {
  width: 400,
  height: 300
});

const leftPlacement = placeViewer(
  { left: 950, right: 990, top: 300, bottom: 340 },
  { width: 320, height: 240 },
  { width: 1000, height: 700 }
);
assert.equal(leftPlacement.side, "left");
assert(leftPlacement.left < 950);
assert(leftPlacement.top >= 8);

const rightPlacement = placeViewer(
  { left: 0, right: 40, top: 10, bottom: 50 },
  { width: 320, height: 240 },
  { width: 1000, height: 700 }
);
assert.equal(rightPlacement.side, "right");
assert.equal(rightPlacement.left, 48);
assert.equal(rightPlacement.top, 8);

console.log("illustrationOverlay tests passed");
