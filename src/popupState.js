(function attachPopupStateHelpers(root) {
  const DEFAULT_SHORTCUTS = {
    insert: { altKey: true, ctrlKey: false, shiftKey: false, key: "i" },
    previous: { altKey: true, ctrlKey: false, shiftKey: false, key: "j" },
    next: { altKey: true, ctrlKey: false, shiftKey: false, key: "k" },
    restore: { altKey: true, ctrlKey: false, shiftKey: false, key: "r" },
    hide: { altKey: true, ctrlKey: false, shiftKey: false, key: "h" }
  };

  const DEFAULTS = {
    novelText: "",
    pageSize: 49,
    separator: " ",
    offset: 0,
    readMode: "embedded",
    embedWidthMode: "auto",
    stableWidthEnabled: true,
    slotWidth: 420,
    embedLineCount: 1,
    verticalOffset: -0.05,
    autoFitSlotEnabled: true,
    keyboardShortcuts: DEFAULT_SHORTCUTS
  };

  const MIN_VERTICAL_OFFSET = -0.8;
  const MAX_VERTICAL_OFFSET = 0.4;
  const READ_MODES = new Set(["plain", "embedded"]);
  const EMBED_WIDTH_MODES = new Set(["fixed", "auto"]);

  function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function parseIntegerInRange(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  function parseNonNegativeInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  function parseNumberInRange(value, fallback, min, max) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  function normalizeShortcut(value, fallback) {
    const shortcut = {
      altKey: Boolean(value?.altKey),
      ctrlKey: Boolean(value?.ctrlKey),
      shiftKey: Boolean(value?.shiftKey),
      key: String(value?.key || "").trim().toLowerCase()
    };

    if (!shortcut.key || (!shortcut.altKey && !shortcut.ctrlKey && !shortcut.shiftKey)) {
      return fallback;
    }

    return shortcut;
  }

  function normalizeShortcutMap(values = {}) {
    return Object.fromEntries(
      Object.entries(DEFAULT_SHORTCUTS).map(([action, fallback]) => {
        return [action, normalizeShortcut(values[action], fallback)];
      })
    );
  }

  function resolveReadMode(values = {}) {
    if (READ_MODES.has(values.readMode)) {
      return values.readMode;
    }

    return values.stableWidthEnabled === false ? "plain" : DEFAULTS.readMode;
  }

  function resolveEmbedWidthMode(values = {}) {
    if (EMBED_WIDTH_MODES.has(values.embedWidthMode)) {
      return values.embedWidthMode;
    }

    return values.autoFitSlotEnabled === false ? "fixed" : DEFAULTS.embedWidthMode;
  }

  function normalizeSettings(values = {}) {
    const readMode = resolveReadMode(values);
    const embedWidthMode = resolveEmbedWidthMode(values);
    return {
      novelText: values.novelText || "",
      pageSize: parsePositiveInteger(values.pageSize, DEFAULTS.pageSize),
      separator: values.separator ?? DEFAULTS.separator,
      offset: parseNonNegativeInteger(values.offset, DEFAULTS.offset),
      readMode,
      embedWidthMode,
      stableWidthEnabled: readMode === "embedded",
      slotWidth: parsePositiveInteger(values.slotWidth, DEFAULTS.slotWidth),
      embedLineCount: parseIntegerInRange(values.embedLineCount, DEFAULTS.embedLineCount, 1, 3),
      verticalOffset: parseNumberInRange(
        values.verticalOffset,
        DEFAULTS.verticalOffset,
        MIN_VERTICAL_OFFSET,
        MAX_VERTICAL_OFFSET
      ),
      autoFitSlotEnabled: embedWidthMode === "auto",
      keyboardShortcuts: normalizeShortcutMap(values.keyboardShortcuts)
    };
  }

  function buildProgressSummary(values) {
    const settings = normalizeSettings(values);
    const total = settings.novelText.length;
    const offset = Math.min(settings.offset, total);
    const percent = total > 0 ? (offset / total) * 100 : 0;
    return `总字数：${total} | 当前位置：${offset} | 进度：${percent.toFixed(1)}%`;
  }

  function buildReplacementSettings(novelText, currentValues) {
    const settings = normalizeSettings(currentValues);
    return {
      ...settings,
      novelText,
      offset: 0
    };
  }

  function buildClearedSettings(currentValues) {
    const settings = normalizeSettings(currentValues);
    return {
      ...settings,
      novelText: "",
      offset: 0
    };
  }

  function getSaveErrorMessage(error) {
    const message = error?.message || String(error);
    if (/quota|storage|exceeded/i.test(message)) {
      return "保存失败：文本太大或浏览器存储空间不足";
    }

    return `保存失败：${message}`;
  }

  const api = {
    DEFAULTS,
    DEFAULT_SHORTCUTS,
    MAX_VERTICAL_OFFSET,
    MIN_VERTICAL_OFFSET,
    buildClearedSettings,
    buildProgressSummary,
    buildReplacementSettings,
    getSaveErrorMessage,
    normalizeSettings,
    normalizeShortcutMap,
    parseNonNegativeInteger,
    parsePositiveInteger
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderPopupState = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

