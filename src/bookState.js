(function attachBookState(root) {
  const model = root.IntextReaderEpubModel || (typeof require === "function" ? require("./epubModel.js") : null);
  const BOOK_KEYS = [
    "sourceType", "bookId", "bookTitle", "bookAuthor", "bookLanguage", "chapters", "imageAnchors", "epubWarnings"
  ];

  function clearBookMetadata(values) {
    const result = { ...values };
    for (const key of BOOK_KEYS) delete result[key];
    return result;
  }

  function buildTxtBook(text, currentValues = {}) {
    return {
      ...clearBookMetadata(currentValues),
      sourceType: "txt",
      bookId: "",
      bookTitle: "",
      bookAuthor: "",
      bookLanguage: "",
      novelText: String(text || ""),
      offset: 0,
      chapters: [],
      imageAnchors: [],
      epubWarnings: [],
      showEpubIllustrations: false
    };
  }

  function buildEpubBook(parsed, currentValues = {}, bookId) {
    return {
      ...clearBookMetadata(currentValues),
      sourceType: "epub",
      bookId: String(bookId || ""),
      bookTitle: String(parsed?.metadata?.title || ""),
      bookAuthor: String(parsed?.metadata?.author || ""),
      bookLanguage: String(parsed?.metadata?.language || ""),
      novelText: String(parsed?.novelText || ""),
      offset: 0,
      chapters: Array.isArray(parsed?.chapters) ? parsed.chapters : [],
      imageAnchors: Array.isArray(parsed?.imageAnchors) ? parsed.imageAnchors : [],
      epubWarnings: Array.isArray(parsed?.warnings) ? parsed.warnings : [],
      showEpubIllustrations: false
    };
  }

  function buildClearedBook(currentValues = {}) {
    return buildTxtBook("", currentValues);
  }

  function getCurrentChapter(chapters, offset) {
    const index = model.findChapterIndex(chapters, offset);
    return index >= 0 ? chapters[index] : null;
  }

  function getBookSummary(values = {}) {
    const text = String(values.novelText || "");
    const total = text.length;
    const offset = Math.min(total, Math.max(0, Number(values.offset) || 0));
    const chapter = getCurrentChapter(values.chapters, offset);
    return {
      sourceType: values.sourceType === "epub" ? "epub" : "txt",
      title: String(values.bookTitle || ""),
      author: String(values.bookAuthor || ""),
      total,
      offset,
      percent: total > 0 ? Number(((offset / total) * 100).toFixed(1)) : 0,
      chapterIndex: chapter?.index ?? -1,
      chapterTitle: chapter?.title || "",
      imageCount: Array.isArray(values.imageAnchors) ? values.imageAnchors.length : 0
    };
  }

  const api = { buildClearedBook, buildEpubBook, buildTxtBook, getBookSummary, getCurrentChapter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderBookState = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
