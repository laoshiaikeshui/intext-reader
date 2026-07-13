const assert = require("node:assert/strict");
const { createImageRepository, handleImageMessage } = require("../src/imageStore.js");

function createMemoryAdapter() {
  const records = new Map();
  return {
    records,
    async putMany(items) {
      items.forEach((item) => records.set(`${item.bookId}/${item.imageId}`, item));
    },
    async get(bookId, imageId) {
      return records.get(`${bookId}/${imageId}`) || null;
    },
    async deleteBook(bookId) {
      for (const key of Array.from(records.keys())) {
        if (key.startsWith(`${bookId}/`)) records.delete(key);
      }
    }
  };
}

(async () => {
  const adapter = createMemoryAdapter();
  const repository = createImageRepository(adapter);
  await repository.saveBook("old", [{ id: "one", mediaType: "image/png", bytes: new Uint8Array([1]) }]);
  await repository.saveBook("new", [{
    id: "two",
    mediaType: "image/jpeg",
    bytes: new Uint8Array([0, 1, 127, 128, 255])
  }]);
  assert(adapter.records.has("old/one"));
  assert(adapter.records.has("new/two"));

  const response = await handleImageMessage({ action: "image-get", bookId: "new", imageId: "two" }, repository);
  assert.equal(response.ok, true);
  assert.equal(response.mediaType, "image/jpeg");
  assert.equal(response.base64, "AAF/gP8=");
  assert.equal("bytes" in response, false, "runtime messages must not contain ArrayBuffer image data");

  await handleImageMessage({ action: "image-delete-book", bookId: "old" }, repository);
  assert(!adapter.records.has("old/one"));
  assert(adapter.records.has("new/two"));

  const missing = await handleImageMessage({ action: "image-get", bookId: "missing", imageId: "x" }, repository);
  assert.deepEqual(missing, { ok: false, reason: "image-not-found" });
  const invalid = await handleImageMessage({ action: "unknown" }, repository);
  assert.deepEqual(invalid, { ok: false, reason: "unsupported-action" });

  console.log("imageStore tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
