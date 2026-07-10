(function attachDisplayModeHelpers(root) {
  const DEFAULT_DISPLAY_SETTINGS = {
    readMode: "embedded",
    embedWidthMode: "auto",
    stableWidthEnabled: true,
    slotWidth: 500,
    verticalOffset: -0.43,
    autoFitSlotEnabled: true
  };

  const MIN_VERTICAL_OFFSET = -0.8;
  const MAX_VERTICAL_OFFSET = 0.4;
  const READ_MODES = new Set(["plain", "embedded"]);
  const EMBED_WIDTH_MODES = new Set(["fixed", "auto"]);

  function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function parseIntegerAtLeast(value, fallback, min) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(min, parsed) : fallback;
  }

  function parseNumberInRange(value, fallback, min, max) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  function resolveReadMode(values = {}) {
    if (READ_MODES.has(values.readMode)) {
      return values.readMode;
    }

    return values.stableWidthEnabled === false ? "plain" : DEFAULT_DISPLAY_SETTINGS.readMode;
  }

  function resolveEmbedWidthMode(values = {}) {
    if (EMBED_WIDTH_MODES.has(values.embedWidthMode)) {
      return values.embedWidthMode;
    }

    return values.autoFitSlotEnabled === false ? "fixed" : DEFAULT_DISPLAY_SETTINGS.embedWidthMode;
  }

  function normalizeDisplaySettings(values = {}) {
    const readMode = resolveReadMode(values);
    const embedWidthMode = resolveEmbedWidthMode(values);
    return {
      readMode,
      embedWidthMode,
      stableWidthEnabled: readMode === "embedded",
      slotWidth: parseIntegerAtLeast(values.slotWidth, DEFAULT_DISPLAY_SETTINGS.slotWidth, 1),
      verticalOffset: parseNumberInRange(
        values.verticalOffset,
        DEFAULT_DISPLAY_SETTINGS.verticalOffset,
        MIN_VERTICAL_OFFSET,
        MAX_VERTICAL_OFFSET
      ),
      autoFitSlotEnabled: embedWidthMode === "auto"
    };
  }

  function getInsertedDisplayStyle(values = {}) {
    const settings = normalizeDisplaySettings(values);

    if (settings.readMode === "plain") {
      return {
        display: "inline",
        width: "",
        maxWidth: "",
        overflow: "",
        whiteSpace: "inherit",
        verticalAlign: "",
        textAlign: "",
        lineHeight: "inherit",
        height: ""
      };
    }

    const effectiveSlotWidth = parsePositiveInteger(values.effectiveSlotWidth, settings.slotWidth);
    return {
      display: "inline-block",
      width: `${effectiveSlotWidth}px`,
      maxWidth: "80vw",
      overflow: "hidden",
      whiteSpace: "nowrap",
      verticalAlign: `${settings.verticalOffset}em`,
      textAlign: "left",
      lineHeight: "inherit",
      height: ""
    };
  }

  const api = {
    DEFAULT_DISPLAY_SETTINGS,
    MAX_VERTICAL_OFFSET,
    MIN_VERTICAL_OFFSET,
    getInsertedDisplayStyle,
    normalizeDisplaySettings
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderDisplayMode = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

