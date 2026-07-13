const assert = require("node:assert/strict");
const { extractEpubArchive } = require("../src/epubArchive.js");

function unzipWith(entries) {
  return (bytes, callback) => callback(null, entries);
}

(async () => {
  const valid = await extractEpubArchive(new Uint8Array([1]).buffer, {
    unzip: unzipWith({
      "META-INF/container.xml": new Uint8Array([1, 2]),
      "OPS/../OPS/chapter.xhtml": new Uint8Array([3]),
      "OPS/a%20b.xhtml": new Uint8Array([4])
    })
  });
  assert.deepEqual(Object.keys(valid.files), ["META-INF/container.xml", "OPS/chapter.xhtml", "OPS/a%20b.xhtml"]);
  assert.equal(valid.entryCount, 3);
  assert.equal(valid.expandedBytes, 4);

  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), { unzip: unzipWith({ "../secret": new Uint8Array(1) }) }),
    (error) => error.code === "EPUB_ARCHIVE_PATH_UNSAFE"
  );
  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), {
      unzip: unzipWith({ "OPS/a/../b": new Uint8Array(1), "OPS/b": new Uint8Array(1) })
    }),
    (error) => error.code === "EPUB_ARCHIVE_DUPLICATE_PATH"
  );
  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), {
      unzip: unzipWith({ a: new Uint8Array(1), b: new Uint8Array(1) }),
      maxEntries: 1
    }),
    (error) => error.code === "EPUB_ARCHIVE_TOO_MANY_ENTRIES"
  );
  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), {
      unzip: unzipWith({ a: new Uint8Array(3) }),
      maxEntryBytes: 2
    }),
    (error) => error.code === "EPUB_ARCHIVE_ENTRY_TOO_LARGE"
  );
  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), {
      unzip: unzipWith({ a: new Uint8Array(2), b: new Uint8Array(2) }),
      maxExpandedBytes: 3
    }),
    (error) => error.code === "EPUB_ARCHIVE_TOO_LARGE"
  );
  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), { unzip: (bytes, callback) => callback(new Error("bad zip")) }),
    (error) => error.code === "EPUB_ARCHIVE_INVALID"
  );

  const defaultPasses = [];
  globalThis.fflate = {
    unzip(bytes, options, callback) {
      const entries = [
        { name: "mimetype", originalSize: 1 },
        { name: "META-INF/container.xml", originalSize: 2 }
      ];
      const selected = entries.filter((entry) => options.filter(entry));
      defaultPasses.push(selected.map((entry) => entry.name));
      callback(null, Object.fromEntries(selected.map((entry) => [entry.name, new Uint8Array(entry.originalSize)])));
    }
  };
  const defaultExtractor = await extractEpubArchive(new ArrayBuffer(1));
  assert.equal(defaultExtractor.entryCount, 2);
  assert.deepEqual(defaultPasses, [[], ["mimetype", "META-INF/container.xml"]]);

  let unsafeExtractionPasses = 0;
  globalThis.fflate.unzip = (bytes, options, callback) => {
    unsafeExtractionPasses += 1;
    options.filter({ name: "huge.bin", originalSize: 65 });
    callback(null, {});
  };
  await assert.rejects(
    extractEpubArchive(new ArrayBuffer(1), { maxEntryBytes: 64 }),
    (error) => error.code === "EPUB_ARCHIVE_ENTRY_TOO_LARGE"
  );
  assert.equal(unsafeExtractionPasses, 1);
  delete globalThis.fflate;

  console.log("epubArchive tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
