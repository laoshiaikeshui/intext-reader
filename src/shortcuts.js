(function attachShortcutHelpers(root) {
  const { translate } = root.IntextReaderI18n || require("./i18n.js");
  const DEFAULT_SHORTCUTS = {
    insert: { altKey: true, ctrlKey: false, shiftKey: false, key: "i" },
    previous: { altKey: true, ctrlKey: false, shiftKey: false, key: "j" },
    next: { altKey: true, ctrlKey: false, shiftKey: false, key: "k" },
    restore: { altKey: true, ctrlKey: false, shiftKey: false, key: "r" },
    hide: { altKey: true, ctrlKey: false, shiftKey: false, key: "h" }
  };

  const ACTION_LABELS = {
    insert: "插入",
    previous: "上一页",
    next: "下一页",
    restore: "恢复/移除",
    hide: "一键隐藏"
  };

  function getActionLabel(action, language = "zh") {
    const key = {
      insert: "actionInsert",
      previous: "actionPrevious",
      next: "actionNext",
      restore: "actionRestore",
      hide: "actionHide"
    }[action];
    return key ? translate(key, language) : action;
  }

  function normalizeKey(key) {
    const value = String(key || "").trim();
    if (!value) {
      return "";
    }

    if (value.length === 1) {
      return value.toLowerCase();
    }

    return value.toLowerCase().replace(/^arrow/, "arrow");
  }

  function normalizeShortcut(value) {
    const shortcut = {
      altKey: Boolean(value?.altKey),
      ctrlKey: Boolean(value?.ctrlKey),
      shiftKey: Boolean(value?.shiftKey),
      key: normalizeKey(value?.key)
    };

    if (!shortcut.key || (!shortcut.altKey && !shortcut.ctrlKey && !shortcut.shiftKey)) {
      return null;
    }

    return shortcut;
  }

  function normalizeShortcutMap(values = {}) {
    return Object.fromEntries(
      Object.entries(DEFAULT_SHORTCUTS).map(([action, fallback]) => {
        return [action, normalizeShortcut(values[action]) || fallback];
      })
    );
  }

  function eventToShortcut(event) {
    if (event?.metaKey) {
      return null;
    }

    return normalizeShortcut({
      altKey: event?.altKey,
      ctrlKey: event?.ctrlKey,
      shiftKey: event?.shiftKey,
      key: event?.key
    });
  }

  function sameShortcut(left, right) {
    return Boolean(
      left &&
      right &&
      left.altKey === right.altKey &&
      left.ctrlKey === right.ctrlKey &&
      left.shiftKey === right.shiftKey &&
      left.key === right.key
    );
  }

  function getActionForShortcut(shortcut, shortcutMap) {
    const normalizedShortcut = normalizeShortcut(shortcut);
    const shortcuts = normalizeShortcutMap(shortcutMap);
    if (!normalizedShortcut) {
      return null;
    }

    for (const [action, candidate] of Object.entries(shortcuts)) {
      if (sameShortcut(normalizedShortcut, candidate)) {
        return action;
      }
    }

    return null;
  }


  function getShortcutConflict(shortcutMap) {
    const shortcuts = normalizeShortcutMap(shortcutMap);
    const seen = [];
    for (const [action, shortcut] of Object.entries(shortcuts)) {
      const existing = seen.find((item) => sameShortcut(item.shortcut, shortcut));
      if (existing) {
        return {
          firstAction: existing.action,
          secondAction: action,
          shortcutText: shortcutToText(shortcut)
        };
      }

      seen.push({ action, shortcut });
    }

    return null;
  }
  function shortcutToText(shortcut) {
    const normalized = normalizeShortcut(shortcut);
    if (!normalized) {
      return "";
    }

    const parts = [];
    if (normalized.ctrlKey) parts.push("Ctrl");
    if (normalized.altKey) parts.push("Alt");
    if (normalized.shiftKey) parts.push("Shift");
    parts.push(normalized.key.length === 1 ? normalized.key.toUpperCase() : normalized.key);
    return parts.join("+");
  }

  const api = {
    ACTION_LABELS,
    DEFAULT_SHORTCUTS,
    eventToShortcut,
    getActionLabel,
    getActionForShortcut,
    getShortcutConflict,
    normalizeShortcut,
    normalizeShortcutMap,
    shortcutToText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderShortcuts = api;
})(typeof globalThis !== "undefined" ? globalThis : window);


