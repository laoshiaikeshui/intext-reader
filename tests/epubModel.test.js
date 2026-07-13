const assert = require("node:assert/strict");
const {
  buildChapterRanges,
  classifyImage,
  findChapterIndex,
  findImagesInRange,
  getImageDimensions,
  normalizeArchivePath,
  resolveChapterTitle
} = require("../src/epubModel.js");

assert.equal(normalizeArchivePath("OPS/package.opf", "Text/ch%201.xhtml#top"), "OPS/Text/ch 1.xhtml");
assert.equal(normalizeArchivePath("OPS/Text/ch1.xhtml", "../Images/pic.jpg"), "OPS/Images/pic.jpg");
assert.throws(() => normalizeArchivePath("OPS/package.opf", "../../../secret.txt"), /EPUB_PATH_UNSAFE/);
assert.throws(() => normalizeArchivePath("OPS/package.opf", "https://example.com/a.jpg"), /EPUB_PATH_EXTERNAL/);
assert.throws(() => normalizeArchivePath("OPS/package.opf", "C:\\secret.txt"), /EPUB_PATH_UNSAFE/);

assert.equal(resolveChapterTitle({ navigationTitle: "  第一章  ", heading: "One", index: 0 }, "zh"), "第一章");
assert.equal(resolveChapterTitle({ heading: "  Chapter One ", index: 0 }, "en"), "Chapter One");
assert.equal(resolveChapterTitle({ index: 2 }, "zh"), "第 3 章");
assert.equal(resolveChapterTitle({ index: 2 }, "en"), "Chapter 3");

const chapters = buildChapterRanges([
  { title: "One", text: "abc" },
  { title: "Two", text: "defg" },
  { title: "Three", text: "hi" }
]);
assert.deepEqual(chapters, [
  { id: "chapter-1", index: 0, title: "One", startOffset: 0, endOffset: 3 },
  { id: "chapter-2", index: 1, title: "Two", startOffset: 5, endOffset: 9 },
  { id: "chapter-3", index: 2, title: "Three", startOffset: 11, endOffset: 13 }
]);
assert.equal(findChapterIndex(chapters, 0), 0);
assert.equal(findChapterIndex(chapters, 5), 1);
assert.equal(findChapterIndex(chapters, 10), 1);
assert.equal(findChapterIndex(chapters, 99), 2);

const anchors = [
  { id: "a", textOffset: 4 },
  { id: "b", textOffset: 8 },
  { id: "c", textOffset: 8 },
  { id: "d", textOffset: 12 }
];
assert.deepEqual(findImagesInRange(anchors, 4, 8).map((item) => item.id), ["a"]);
assert.deepEqual(findImagesInRange(anchors, 8, 12).map((item) => item.id), ["b", "c"]);
assert.deepEqual(findImagesInRange(anchors, 12, 12), []);

assert.equal(classifyImage({ width: 8, height: 8, alt: "", occurrences: 6 }), "decorative");
assert.equal(classifyImage({ width: 600, height: 2, alt: "", occurrences: 1 }), "divider");
assert.equal(classifyImage({ width: 24, height: 24, alt: "Warning", occurrences: 1 }), "text");
assert.equal(classifyImage({ width: 24, height: 24, inFigure: true, occurrences: 1 }), "illustration");
assert.equal(classifyImage({ width: 80, height: 100, caption: "Map", occurrences: 1 }), "illustration");
assert.equal(classifyImage({ width: 48, height: 48, alt: "", occurrences: 1 }), "illustration");

const png = new Uint8Array(24);
png.set([0x89, 0x50, 0x4e, 0x47], 0);
new DataView(png.buffer).setUint32(16, 600);
new DataView(png.buffer).setUint32(20, 2);
assert.deepEqual(getImageDimensions(png, "image/png"), { width: 600, height: 2 });

const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x20, 0x03, 0x58, 0x02]);
assert.deepEqual(getImageDimensions(gif, "image/gif"), { width: 800, height: 600 });

console.log("epubModel tests passed");
