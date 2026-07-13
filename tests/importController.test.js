const assert = require("node:assert/strict");
const { createImportController, resolveImportErrorTranslationKey } = require("../src/importController.js");

assert.equal(resolveImportErrorTranslationKey("EPUB_XML_INVALID"), "error_EPUB_ARCHIVE_INVALID");
assert.equal(resolveImportErrorTranslationKey("EPUB_ARCHIVE_DUPLICATE_PATH"), "error_EPUB_ARCHIVE_PATH_UNSAFE");
assert.equal(resolveImportErrorTranslationKey("EPUB_PATH_INVALID"), "error_EPUB_ARCHIVE_PATH_UNSAFE");
assert.equal(resolveImportErrorTranslationKey("UNKNOWN"), "epubImportFailed");

function createHarness(overrides = {}) {
  const calls = [];
  const current = { sourceType: "epub", bookId: "old", novelText: "old text", offset: 4 };
  const parsed = {
    metadata: { title: "New Book", author: "Author", language: "en" },
    novelText: "new body",
    chapters: [],
    imageAnchors: [],
    images: [{ id: "image-1", mediaType: "image/png", bytes: new Uint8Array([1]) }],
    warnings: []
  };
  const dependencies = {
    extractArchive: async () => ({ files: { one: new Uint8Array([1]) }, entryCount: 1, expandedBytes: 1 }),
    parseEpubFiles: async () => parsed,
    repository: {
      saveBook: async (bookId) => calls.push(["save-images", bookId]),
      deleteBook: async (bookId) => calls.push(["delete-images", bookId])
    },
    storage: {
      get: async () => current,
      set: async (values) => calls.push(["set-storage", values])
    },
    buildEpubBook: (value, settings, bookId) => ({ ...settings, sourceType: "epub", bookId, novelText: value.novelText, offset: 0 }),
    generateId: () => "new-id",
    restoreActivePage: async () => calls.push(["restore"]),
    ...overrides
  };
  return { controller: createImportController(dependencies), calls, parsed, current };
}

(async () => {
  const success = createHarness();
  const preview = await success.controller.parseFile({ arrayBuffer: async () => new ArrayBuffer(2) });
  assert.equal(preview.state, "ready");
  assert.equal(preview.parsed.metadata.title, "New Book");
  const committed = await success.controller.commit(preview.parsed);
  assert.equal(committed.state, "success");
  assert.deepEqual(success.calls.map((call) => call[0]), ["save-images", "set-storage", "delete-images", "restore"]);
  assert.equal(success.calls[1][1].bookId, "new-id");

  const parseFailure = createHarness({ parseEpubFiles: async () => { throw Object.assign(new Error("bad"), { code: "EPUB_TEXT_EMPTY" }); } });
  await assert.rejects(parseFailure.controller.parseFile({ arrayBuffer: async () => new ArrayBuffer(1) }), (error) => error.code === "EPUB_TEXT_EMPTY");
  assert.equal(parseFailure.controller.getState().state, "error");

  const tooLarge = createHarness({ maxFileBytes: 1 });
  await assert.rejects(
    tooLarge.controller.parseFile({ size: 2, arrayBuffer: async () => new ArrayBuffer(2) }),
    (error) => error.code === "EPUB_FILE_TOO_LARGE"
  );

  const storageFailure = createHarness({
    storage: {
      get: async () => ({ sourceType: "epub", bookId: "old", novelText: "old" }),
      set: async () => { throw new Error("quota"); }
    }
  });
  const parsedForFailure = (await storageFailure.controller.parseFile({ arrayBuffer: async () => new ArrayBuffer(1) })).parsed;
  await assert.rejects(storageFailure.controller.commit(parsedForFailure), /quota/);
  assert.deepEqual(storageFailure.calls, [
    ["save-images", "new-id"],
    ["delete-images", "new-id"]
  ]);

  const oldCleanupFailure = createHarness({
    repository: {
      saveBook: async (bookId) => oldCleanupFailure.calls.push(["save-images", bookId]),
      deleteBook: async (bookId) => {
        oldCleanupFailure.calls.push(["delete-images", bookId]);
        if (bookId === "old") throw new Error("old cleanup failed");
      }
    }
  });
  const cleanupParsed = (await oldCleanupFailure.controller.parseFile({ arrayBuffer: async () => new ArrayBuffer(1) })).parsed;
  const cleanupResult = await oldCleanupFailure.controller.commit(cleanupParsed);
  assert.equal(cleanupResult.state, "success");
  assert.equal(oldCleanupFailure.calls.filter((call) => call[0] === "set-storage").length, 2);
  assert.deepEqual(
    oldCleanupFailure.calls.filter((call) => call[0] === "set-storage")[1][1],
    { pendingImageCleanupIds: ["old"] }
  );
  assert.equal(oldCleanupFailure.calls.filter((call) => call[1] === "new-id" && call[0] === "delete-images").length, 0);

  const cleanupRetry = createHarness({
    storage: {
      get: async () => ({
        sourceType: "epub",
        bookId: "current",
        novelText: "old",
        pendingImageCleanupIds: ["stale"]
      }),
      set: async (values) => cleanupRetry.calls.push(["set-storage", values])
    }
  });
  const retryParsed = (await cleanupRetry.controller.parseFile({ arrayBuffer: async () => new ArrayBuffer(1) })).parsed;
  await cleanupRetry.controller.commit(retryParsed);
  assert.deepEqual(
    cleanupRetry.calls.filter((call) => call[0] === "delete-images").map((call) => call[1]),
    ["stale", "current"]
  );
  assert.deepEqual(cleanupRetry.calls.filter((call) => call[0] === "set-storage").at(-1)[1], {
    pendingImageCleanupIds: []
  });

  console.log("importController tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
