const assert = require("node:assert/strict");
const { DOMParser } = require("@xmldom/xmldom");
const { parseEpubFiles } = require("../src/epubParser.js");
const epub3Files = require("./fixtures/epub3-files.js");
const epub2Files = require("./fixtures/epub2-files.js");

(async () => {
  const epub3 = await parseEpubFiles(epub3Files, { DOMParserClass: DOMParser });
  assert.equal(epub3.metadata.title, "多语言测试");
  assert.equal(epub3.metadata.author, "Author");
  assert.equal(epub3.metadata.language, "zh");
  assert.deepEqual(epub3.chapters.map((chapter) => chapter.title), ["第一章 开始", "第二章 続き", "第三章 End"]);
  assert(epub3.novelText.includes("第三章 End"));
  assert.equal((epub3.novelText.match(/第一章 开始/g) || []).length, 1);
  assert(epub3.novelText.includes("中文 English 日本語 한국어."));
  assert(!epub3.novelText.includes("に"));
  assert(epub3.chapters[1].startOffset > epub3.chapters[0].endOffset);
  assert.equal(epub3.imageAnchors.length, 3);
  assert.equal(epub3.cover.mediaType, "image/jpeg");
  assert.deepEqual(Array.from(epub3.cover.bytes), [0xff, 0xd8, 0xff, 0xd9]);
  assert.equal(epub3.imageAnchors[0].sourcePath, "EPUB/Images/cover.jpg");
  assert.equal(epub3.imageAnchors[1].textOffset, epub3.imageAnchors[2].textOffset);
  assert.deepEqual(epub3.images.map((image) => image.mediaType), ["image/jpeg", "image/jpeg", "image/png"]);
  assert(epub3.warnings.some((warning) => warning.code === "EPUB_IMAGE_SVG_SKIPPED"));

  const epub2 = await parseEpubFiles(epub2Files, { DOMParserClass: DOMParser });
  assert.equal(epub2.metadata.title, "EPUB Two");
  assert.equal(epub2.chapters[0].title, "Named from NCX");
  assert(epub2.novelText.startsWith("Named from NCX\n\nOnly body text."));

  const imageOnlyPages = { ...epub2Files };
  imageOnlyPages["OPS/content.opf"] = new TextEncoder().encode(
    new TextDecoder().decode(imageOnlyPages["OPS/content.opf"])
      .replace(
        '<item id="one" href="one.xhtml" media-type="application/xhtml+xml"/>',
        '<item id="front" href="front.xhtml" media-type="application/xhtml+xml"/>' +
        '<item id="back" href="back.xhtml" media-type="application/xhtml+xml"/>' +
        '<item id="front-image" href="front.jpg" media-type="image/jpeg"/>' +
        '<item id="back-image" href="back.jpg" media-type="image/jpeg"/>' +
        '<item id="one" href="one.xhtml" media-type="application/xhtml+xml"/>'
      )
      .replace(
        '<spine toc="ncx"><itemref idref="one"/></spine>',
        '<spine toc="ncx"><itemref idref="front"/><itemref idref="one"/><itemref idref="back"/></spine>'
      )
  );
  imageOnlyPages["OPS/front.xhtml"] = new TextEncoder().encode(
    '<html><body><img src="front.jpg"/></body></html>'
  );
  imageOnlyPages["OPS/back.xhtml"] = new TextEncoder().encode(
    '<html><body><img src="back.jpg"/></body></html>'
  );
  imageOnlyPages["OPS/front.jpg"] = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  imageOnlyPages["OPS/back.jpg"] = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const imageOnlyBook = await parseEpubFiles(imageOnlyPages, { DOMParserClass: DOMParser });
  assert.equal(imageOnlyBook.chapters.length, 1, "image-only pages do not create fake chapters");
  assert.deepEqual(imageOnlyBook.imageAnchors.map((image) => image.textOffset), [0, imageOnlyBook.novelText.length]);
  assert.deepEqual(imageOnlyBook.imageAnchors.map((image) => image.sourcePath), ["OPS/front.jpg", "OPS/back.jpg"]);

  const repeatedImageFiles = { ...epub3Files };
  repeatedImageFiles["EPUB/Text/ch2.xhtml"] = new TextEncoder().encode(
    new TextDecoder().decode(repeatedImageFiles["EPUB/Text/ch2.xhtml"])
      .replace("Final text.", '<img src="../Images/pic.jpg"/>Final text.')
  );
  const repeatedImageBook = await parseEpubFiles(repeatedImageFiles, { DOMParserClass: DOMParser });
  const repeatedAnchors = repeatedImageBook.imageAnchors.filter((image) => image.sourcePath === "EPUB/Images/pic.jpg");
  assert.equal(repeatedAnchors.length, 2);
  assert.equal(new Set(repeatedAnchors.map((image) => image.id)).size, 1);
  assert.equal(repeatedImageBook.images.length, 3);

  const trailingImageFiles = { ...epub2Files };
  trailingImageFiles["OPS/content.opf"] = new TextEncoder().encode(
    new TextDecoder().decode(trailingImageFiles["OPS/content.opf"])
      .replace("</manifest>", '<item id="tail" href="tail.jpg" media-type="image/jpeg"/></manifest>')
  );
  trailingImageFiles["OPS/one.xhtml"] = new TextEncoder().encode(
    '<html><body><p>Only body text. <img src="tail.jpg"/></p></body></html>'
  );
  trailingImageFiles["OPS/tail.jpg"] = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const trailingImageBook = await parseEpubFiles(trailingImageFiles, { DOMParserClass: DOMParser });
  assert.equal(trailingImageBook.imageAnchors.length, 1);
  assert.equal(trailingImageBook.imageAnchors[0].textOffset, trailingImageBook.novelText.length);

  const encodedPackage = { ...epub2Files };
  encodedPackage["META-INF/container.xml"] = new TextEncoder().encode(`<container><rootfiles><rootfile full-path="OPS/content%20file.opf"/></rootfiles></container>`);
  encodedPackage["OPS/content file.opf"] = encodedPackage["OPS/content.opf"];
  delete encodedPackage["OPS/content.opf"];
  const encoded = await parseEpubFiles(encodedPackage, { DOMParserClass: DOMParser });
  assert.equal(encoded.metadata.title, "EPUB Two");

  const utf16Files = { ...epub2Files };
  const utf16Text = `<html><body><p>UTF sixteen text.</p></body></html>`;
  const utf16Buffer = Buffer.from(utf16Text, "utf16le");
  utf16Files["OPS/one.xhtml"] = new Uint8Array(Buffer.concat([Buffer.from([0xff, 0xfe]), utf16Buffer]));
  const utf16 = await parseEpubFiles(utf16Files, { DOMParserClass: DOMParser });
  assert(utf16.novelText.includes("UTF sixteen text."));

  const remoteResourceFiles = { ...epub2Files };
  const remotePackage = new TextDecoder().decode(remoteResourceFiles["OPS/content.opf"])
    .replace("</manifest>", `<item id="remote" href="https://example.com/optional.jpg" media-type="image/jpeg"/></manifest>`);
  remoteResourceFiles["OPS/content.opf"] = new TextEncoder().encode(remotePackage);
  const remoteResource = await parseEpubFiles(remoteResourceFiles, { DOMParserClass: DOMParser });
  assert(remoteResource.novelText.includes("Only body text."));

  await assert.rejects(
    parseEpubFiles({}, { DOMParserClass: DOMParser }),
    (error) => error.code === "EPUB_CONTAINER_MISSING"
  );
  await assert.rejects(
    parseEpubFiles({ ...epub2Files, "META-INF/rights.xml": new TextEncoder().encode("<rights/>") }, { DOMParserClass: DOMParser }),
    (error) => error.code === "EPUB_DRM_UNSUPPORTED"
  );
  const encryptedFiles = {
    ...epub2Files,
    "META-INF/encryption.xml": new TextEncoder().encode(`
      <encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        xmlns:enc="http://www.w3.org/2001/04/xmlenc#">
        <enc:EncryptedData>
          <enc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
          <enc:CipherData><enc:CipherReference URI="../OPS/one.xhtml"/></enc:CipherData>
        </enc:EncryptedData>
      </encryption>`)
  };
  await assert.rejects(
    parseEpubFiles(encryptedFiles, { DOMParserClass: DOMParser }),
    (error) => error.code === "EPUB_DRM_UNSUPPORTED"
  );

  const fixedSpineFiles = { ...epub2Files };
  fixedSpineFiles["OPS/content.opf"] = new TextEncoder().encode(
    new TextDecoder().decode(fixedSpineFiles["OPS/content.opf"])
      .replace('<itemref idref="one"/>', '<itemref idref="one" properties="rendition:layout-pre-paginated"/>')
  );
  await assert.rejects(
    parseEpubFiles(fixedSpineFiles, { DOMParserClass: DOMParser }),
    (error) => error.code === "EPUB_FIXED_LAYOUT_UNSUPPORTED"
  );

  console.log("epubParser tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
