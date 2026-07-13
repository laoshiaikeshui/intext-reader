const assert = require("node:assert/strict");
const { DOMParser } = require("@xmldom/xmldom");
const { unzipSync, zipSync } = require("fflate");
const { extractEpubArchive } = require("../src/epubArchive.js");
const { parseEpubFiles } = require("../src/epubParser.js");
const { createImageRepository, handleImageMessage } = require("../src/imageStore.js");
const { normalizeImageResponse } = require("../src/illustrationOverlay.js");
const { decorateIllustrationRange } = require("../src/illustrationMarkers.js");
const sourceFiles = require("./fixtures/epub3-files.js");

(async () => {
  const archiveBytes = zipSync(sourceFiles);
  const archive = await extractEpubArchive(archiveBytes.buffer, {
    unzip(bytes, callback) {
      try {
        callback(null, unzipSync(bytes));
      } catch (error) {
        callback(error);
      }
    }
  });
  const book = await parseEpubFiles(archive.files, { DOMParserClass: DOMParser });
  assert.equal(book.metadata.title, "多语言测试");
  assert.equal(book.chapters.length, 3);
  assert.equal(book.imageAnchors.length, 3);
  assert.equal(book.cover.mediaType, "image/jpeg");

  const records = new Map();
  const repository = createImageRepository({
    async putMany(items) {
      items.forEach((item) => records.set(`${item.bookId}/${item.imageId}`, item));
    },
    async get(bookId, imageId) {
      return records.get(`${bookId}/${imageId}`) || null;
    },
    async deleteBook() {}
  });
  await repository.saveBook("fixture-book", book.images);
  const response = await handleImageMessage({
    action: "image-get",
    bookId: "fixture-book",
    imageId: book.images[1].id
  }, repository);
  assert.deepEqual(Array.from(normalizeImageResponse(response).bytes), [1, 2, 3]);

  const markerOffset = book.imageAnchors[1].textOffset;
  const decorated = decorateIllustrationRange({
    text: book.novelText.slice(markerOffset, markerOffset + 1),
    rangeStart: markerOffset,
    novelLength: book.novelText.length,
    anchors: book.imageAnchors,
    language: "zh",
    enabled: true
  });
  assert(decorated.text.startsWith("[图片2]"));
  assert.deepEqual(decorated.images.map((image) => image.id), book.images.slice(1).map((image) => image.id));
  console.log("epubIntegration tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
