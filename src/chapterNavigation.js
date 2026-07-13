(function attachChapterNavigation(root) {
  const model = root.IntextReaderEpubModel || (typeof require === "function" ? require("./epubModel.js") : null);

  function buildChapterOptions(chapters) {
    return (chapters || []).map((chapter, index) => ({
      value: String(index),
      label: `${index + 1}. ${chapter.title}`,
      title: String(chapter.title || "")
    }));
  }

  function buildChapterJump(chapters, selectedIndex) {
    const index = Number.parseInt(selectedIndex, 10);
    const chapter = Number.isInteger(index) ? chapters?.[index] : null;
    return chapter ? { offset: chapter.startOffset, chapterIndex: index, clearHistory: true } : null;
  }

  function getSelectedChapterIndex(chapters, offset) {
    return model.findChapterIndex(chapters, offset);
  }

  const api = { buildChapterJump, buildChapterOptions, getSelectedChapterIndex };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderChapterNavigation = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
