(function attachReadingRange(root) {
  const model = root.IntextReaderEpubModel || (typeof require === "function" ? require("./epubModel.js") : null);
  const markers = root.IntextReaderIllustrationMarkers ||
    (typeof require === "function" ? require("./illustrationMarkers.js") : null);

  function buildReadingRangeStatus(settings = {}, readingStatus = {}) {
    const sourceType = settings.sourceType === "epub" ? "epub" : "txt";
    const startOffset = Math.max(0, Number(readingStatus.offset) || 0);
    const displayedChars = Math.max(0, Number(readingStatus.displayedChars) || 0);
    const endOffset = startOffset + displayedChars;
    const active = Boolean(readingStatus.inserted);
    return {
      active,
      sourceType,
      bookId: sourceType === "epub" ? String(settings.bookId || "") : "",
      startOffset,
      endOffset,
      chapterIndex: sourceType === "epub" ? model.findChapterIndex(settings.chapters, startOffset) : -1,
      images: active && sourceType === "epub"
        ? markers.selectIllustrationsInRange({
            anchors: settings.imageAnchors,
            rangeStart: startOffset,
            rangeLength: displayedChars,
            novelLength: String(settings.novelText || "").length
          })
        : []
    };
  }

  const api = { buildReadingRangeStatus };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderReadingRange = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
