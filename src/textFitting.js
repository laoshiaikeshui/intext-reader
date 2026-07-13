(function attachTextFittingHelpers(root) {
  const { translate } = root.IntextReaderI18n || require("./i18n.js");
  const READ_MODES = new Set(["plain", "embedded"]);
  const EMBED_WIDTH_MODES = new Set(["fixed", "auto"]);

  function parsePositiveNumber(value, fallback) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function normalizeFitSettings(values = {}) {
    const readMode = READ_MODES.has(values.readMode)
      ? values.readMode
      : values.stableWidthEnabled === false
        ? "plain"
        : "embedded";
    const embedWidthMode = EMBED_WIDTH_MODES.has(values.embedWidthMode)
      ? values.embedWidthMode
      : values.autoFitSlotEnabled === false
        ? "fixed"
        : "auto";

    return { readMode, embedWidthMode };
  }

  function resolveEffectiveSlotWidth(values = {}) {
    const settings = normalizeFitSettings(values);
    const slotWidth = Math.round(parsePositiveNumber(values.slotWidth, 0));
    if (slotWidth <= 0 || settings.readMode === "plain") {
      return slotWidth;
    }

    if (settings.embedWidthMode === "fixed") {
      return slotWidth;
    }

    const remainingLineWidth = Math.floor(parsePositiveNumber(values.remainingLineWidth, slotWidth));
    return Math.max(1, Math.min(slotWidth, remainingLineWidth));
  }

  function resolveAutoFirstLineWidth(values = {}) {
    const maxSlotWidth = Math.max(1, Math.round(parsePositiveNumber(values.maxSlotWidth, 1)));
    const effectiveSlotWidth = Math.max(
      1,
      Math.min(maxSlotWidth, Math.round(parsePositiveNumber(values.effectiveSlotWidth, maxSlotWidth)))
    );
    if (values.firstCharacterFits || effectiveSlotWidth >= maxSlotWidth) {
      return effectiveSlotWidth;
    }

    return maxSlotWidth;
  }

  function resolveRenderedSlotWidth(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
  }

  function shouldShowWidthWarning(status = {}) {
    return Boolean(status.inserted && status.readMode === "embedded" && status.widthTooSmall);
  }

  function resolvePageStep(values = {}) {
    const pageSize = Math.max(0, Number.parseInt(values.pageSize, 10) || 0);
    const status = values.readingStatus || {};
    if (
      values.readMode === "embedded" &&
      status.inserted &&
      Number(status.offset) === Number(values.offset)
    ) {
      return Math.max(0, Number.parseInt(status.displayedChars, 10) || 0);
    }

    return pageSize;
  }

  function findFittingLength(text, maxLength, fitsText) {
    const source = String(text || "");
    const parsedMax = Number.parseInt(maxLength, 10);
    const limit = Number.isFinite(parsedMax) && parsedMax > 0
      ? Math.min(parsedMax, source.length)
      : source.length;

    if (limit <= 0) {
      return 0;
    }

    if (fitsText(source.slice(0, limit))) {
      return limit;
    }

    let low = 1;
    let high = limit;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = source.slice(0, mid);
      if (fitsText(candidate)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return best;
  }

  function findFittingLengthByGrowth(text, fitsText) {
    const source = String(text || "");
    if (!source) {
      return 0;
    }

    if (!fitsText(source.slice(0, 1))) {
      return 0;
    }

    let low = 1;
    let high = 2;
    while (high < source.length && fitsText(source.slice(0, high))) {
      low = high;
      high *= 2;
    }

    high = Math.min(high, source.length);
    if (fitsText(source.slice(0, high))) {
      return high;
    }

    let best = low;
    let left = low + 1;
    let right = high - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (fitsText(source.slice(0, mid))) {
        best = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return best;
  }

  function fitTextAcrossLines(text, widths, fitsText) {
    const source = String(text || "");
    const lines = [];
    let offset = 0;
    for (let index = 0; index < widths.length; index += 1) {
      const width = widths[index];
      if (offset >= source.length) {
        break;
      }

      const remaining = source.slice(offset);
      const sourceOffset = offset;
      const length = findFittingLengthByGrowth(
        remaining,
        (candidate) => fitsText(candidate, width, index, sourceOffset)
      );
      if (length <= 0) {
        break;
      }

      const lineText = remaining.slice(0, length);
      lines.push({ text: lineText, width, sourceOffset });
      offset += length;
    }

    return { lines, displayedChars: offset };
  }

  function formatWidthStatus(status, language) {
    const effectiveSlotWidth = Number.parseInt(status.effectiveSlotWidth, 10);
    const maxSlotWidth = Number.parseInt(status.maxSlotWidth, 10);
    if (!Number.isFinite(effectiveSlotWidth) || effectiveSlotWidth <= 0) {
      return "";
    }

    if (status.embedWidthMode === "auto" && Number.isFinite(maxSlotWidth) && maxSlotWidth > 0) {
      return translate("widthAuto", language, { width: effectiveSlotWidth, max: maxSlotWidth });
    }

    return translate("widthFixed", language, { width: effectiveSlotWidth });
  }

  function buildReadingStatusText(status, language = "zh") {
    if (!status?.inserted) {
      return translate("fitNotInserted", language);
    }

    const displayedChars = Number.parseInt(status.displayedChars, 10) || 0;
    if (status.readMode === "embedded") {
      const lineCount = Number.parseInt(status.lineCount, 10) || 1;
      const lineText = lineCount > 1 ? translate("lineCount", language, { count: lineCount }) : "";
      return translate("fitEmbedded", language, {
        chars: displayedChars,
        lines: lineText,
        width: formatWidthStatus(status, language)
      });
    }

    return translate("fitPlain", language, { chars: displayedChars });
  }

  const api = {
    buildReadingStatusText,
    findFittingLength,
    findFittingLengthByGrowth,
    fitTextAcrossLines,
    normalizeFitSettings,
    resolveAutoFirstLineWidth,
    resolvePageStep,
    resolveRenderedSlotWidth,
    shouldShowWidthWarning,
    resolveEffectiveSlotWidth
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderTextFitting = api;
})(typeof globalThis !== "undefined" ? globalThis : window);


