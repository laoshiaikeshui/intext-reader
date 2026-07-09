(function attachReadingTextHelpers(root) {
  function renderSeparator(separator) {
    return String(separator ?? "").replaceAll(" ", "\u00a0");
  }

  function formatInsertedText(separator, excerpt) {
    const wrapper = renderSeparator(separator);
    return `${wrapper}${excerpt}${wrapper}`;
  }

  const api = { formatInsertedText, renderSeparator };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderText = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

