const assert = require("node:assert/strict");
const {
  DEFAULT_SHORTCUTS,
  eventToShortcut,
  getActionForShortcut,
  getShortcutConflict,
  normalizeShortcutMap,
  shortcutToText
} = require("../src/shortcuts.js");

assert.deepEqual(
  normalizeShortcutMap({}),
  DEFAULT_SHORTCUTS,
  "missing shortcut settings fall back to defaults"
);

assert.deepEqual(
  normalizeShortcutMap({ insert: { altKey: true, key: "x" }, next: { key: "k" } }),
  {
    ...DEFAULT_SHORTCUTS,
    insert: { altKey: true, ctrlKey: false, shiftKey: false, key: "x" },
    next: DEFAULT_SHORTCUTS.next
  },
  "custom shortcuts require at least one modifier and normalize keys"
);

assert.deepEqual(
  eventToShortcut({ altKey: true, ctrlKey: false, shiftKey: true, metaKey: false, key: "H" }),
  { altKey: true, ctrlKey: false, shiftKey: true, key: "h" }
);

assert.equal(
  getActionForShortcut(
    { altKey: true, ctrlKey: false, shiftKey: false, key: "h" },
    DEFAULT_SHORTCUTS
  ),
  "hide",
  "default Alt+H triggers one-key hide"
);

assert.equal(shortcutToText(DEFAULT_SHORTCUTS.hide), "Alt+H");
assert.equal(shortcutToText({ ctrlKey: true, shiftKey: true, key: "x" }), "Ctrl+Shift+X");

assert.deepEqual(
  getShortcutConflict({
    ...DEFAULT_SHORTCUTS,
    hide: DEFAULT_SHORTCUTS.insert
  }),
  { firstAction: "insert", secondAction: "hide", shortcutText: "Alt+I" },
  "duplicate shortcut settings report the conflicting actions"
);

assert.equal(getShortcutConflict(DEFAULT_SHORTCUTS), null, "default shortcuts have no conflicts");


