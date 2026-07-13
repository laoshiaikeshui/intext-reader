(function attachIllustrationMarkerHelpers(root) {
  function numberImageAnchors(anchors) {
    return (Array.isArray(anchors) ? anchors : [])
      .map((anchor, sourceIndex) => ({
        ...anchor,
        textOffset: Math.max(0, Number(anchor?.textOffset) || 0),
        sourceIndex
      }))
      .sort((left, right) => left.textOffset - right.textOffset || left.sourceIndex - right.sourceIndex)
      .map(({ sourceIndex, ...anchor }, index) => ({
        ...anchor,
        illustrationNumber: index + 1
      }));
  }

  function formatIllustrationMarker(count, language = "zh") {
    const value = Math.max(1, Number.parseInt(count, 10) || 1);
    if (language === "en") {
      return value === 1 ? "[1 image]" : `[${value} images]`;
    }
    return `[图片${value}]`;
  }

  function selectIllustrationsInRange(values = {}) {
    const rangeStart = Math.max(0, Number(values.rangeStart) || 0);
    const rangeLength = Math.max(0, Number(values.rangeLength) || 0);
    if (rangeLength <= 0) return [];
    const rangeEnd = rangeStart + rangeLength;
    const novelLength = Math.max(rangeEnd, Number(values.novelLength) || 0);
    const includeFinalAnchor = rangeEnd === novelLength;
    return numberImageAnchors(values.anchors).filter((anchor) => {
      return anchor.textOffset >= rangeStart && (
        anchor.textOffset < rangeEnd ||
        (includeFinalAnchor && anchor.textOffset === rangeEnd)
      );
    });
  }

  function shouldRerenderIllustrationDisplay(changes = {}) {
    return Boolean(changes.showEpubIllustrations || changes.uiLanguage);
  }

  function decorateIllustrationRange(values = {}) {
    const text = String(values.text || "");
    if (!values.enabled) {
      return { text, images: [], sourceLength: text.length };
    }

    const rangeStart = Math.max(0, Number(values.rangeStart) || 0);
    const images = selectIllustrationsInRange({
      anchors: values.anchors,
      rangeStart,
      rangeLength: text.length,
      novelLength: values.novelLength
    });

    let decorated = "";
    let cursor = 0;
    for (let index = 0; index < images.length;) {
      const relativeOffset = Math.min(text.length, Math.max(0, images[index].textOffset - rangeStart));
      let nextIndex = index + 1;
      while (nextIndex < images.length && images[nextIndex].textOffset === images[index].textOffset) {
        nextIndex += 1;
      }
      decorated += text.slice(cursor, relativeOffset);
      decorated += formatIllustrationMarker(nextIndex - index, values.language);
      cursor = relativeOffset;
      index = nextIndex;
    }
    decorated += text.slice(cursor);

    return { text: decorated, images, sourceLength: text.length };
  }

  const api = {
    decorateIllustrationRange,
    formatIllustrationMarker,
    numberImageAnchors,
    selectIllustrationsInRange,
    shouldRerenderIllustrationDisplay
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderIllustrationMarkers = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
