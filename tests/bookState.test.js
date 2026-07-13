const assert = require("node:assert/strict");
const {
  buildClearedBook,
  buildEpubBook,
  buildTxtBook,
  getBookSummary,
  getCurrentChapter
} = require("../src/bookState.js");

const current = {
  novelText: "old",
  offset: 2,
  separator: " ",
  pageSize: 50,
  readMode: "embedded",
  keyboardShortcuts: { next: { altKey: true, key: "k" } },
  sourceType: "epub",
  bookId: "old-book",
  chapters: [{ title: "Old", startOffset: 0, endOffset: 3 }],
  imageAnchors: [{ id: "old-image", textOffset: 1 }]
};

const txt = buildTxtBook("new text", current);
assert.equal(txt.sourceType, "txt");
assert.equal(txt.novelText, "new text");
assert.equal(txt.offset, 0);
assert.equal(txt.bookId, "");
assert.deepEqual(txt.chapters, []);
assert.equal(txt.separator, " ");

const parsed = {
  metadata: { title: "Book", author: "Writer", language: "ja" },
  novelText: "Chapter\n\nBody",
  chapters: [{ id: "chapter-1", index: 0, title: "Chapter", startOffset: 0, endOffset: 13 }],
  imageAnchors: [{ id: "image-1", textOffset: 10 }],
  warnings: [{ code: "EPUB_IMAGE_SVG_SKIPPED" }]
};
const epub = buildEpubBook(parsed, current, "book-2");
assert.equal(epub.sourceType, "epub");
assert.equal(epub.bookId, "book-2");
assert.equal(epub.bookTitle, "Book");
assert.equal(epub.bookAuthor, "Writer");
assert.equal(epub.offset, 0);
assert.equal(epub.showEpubIllustrations, false);
assert.deepEqual(epub.imageAnchors, parsed.imageAnchors);

assert.equal(getCurrentChapter(epub.chapters, 4).title, "Chapter");
assert.equal(getCurrentChapter([], 4), null);
assert.deepEqual(getBookSummary({ ...epub, offset: 7 }), {
  sourceType: "epub",
  title: "Book",
  author: "Writer",
  total: 13,
  offset: 7,
  percent: 53.8,
  chapterIndex: 0,
  chapterTitle: "Chapter",
  imageCount: 1
});

const cleared = buildClearedBook(epub);
assert.equal(cleared.novelText, "");
assert.equal(cleared.offset, 0);
assert.equal(cleared.sourceType, "txt");
assert.equal(cleared.bookId, "");
assert.equal(cleared.separator, " ");

console.log("bookState tests passed");
