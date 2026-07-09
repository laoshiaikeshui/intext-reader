const assert = require("node:assert/strict");
const {
  DEFAULT_SHORTCUTS,
  buildProgressSummary,
  buildReplacementSettings,
  buildClearedSettings,
  getSaveErrorMessage,
  normalizeSettings
} = require("../src/popupState.js");

const baseDefaults = {
  embedLineCount: 1,
  keyboardShortcuts: DEFAULT_SHORTCUTS
};

assert.deepEqual(
  normalizeSettings({
    novelText: "abcdef",
    pageSize: "2",
    separator: "  ",
    offset: "4",
    readMode: "plain",
    embedWidthMode: "fixed",
    slotWidth: "260",
    embedLineCount: "3",
    verticalOffset: "0.12",
    keyboardShortcuts: { hide: { ctrlKey: true, key: "q" } }
  }),
  {
    novelText: "abcdef",
    pageSize: 2,
    separator: "  ",
    offset: 4,
    readMode: "plain",
    embedWidthMode: "fixed",
    stableWidthEnabled: false,
    slotWidth: 260,
    embedLineCount: 3,
    verticalOffset: 0.12,
    autoFitSlotEnabled: false,
    keyboardShortcuts: {
      ...DEFAULT_SHORTCUTS,
      hide: { altKey: false, ctrlKey: true, shiftKey: false, key: "q" }
    }
  }
);

assert.deepEqual(
  normalizeSettings({ stableWidthEnabled: false }),
  {
    novelText: "",
    pageSize: 49,
    separator: " ",
    offset: 0,
    readMode: "plain",
    embedWidthMode: "auto",
    stableWidthEnabled: false,
    slotWidth: 420,
    verticalOffset: -0.05,
    autoFitSlotEnabled: true,
    ...baseDefaults
  },
  "old plain setting migrates to readMode"
);

assert.deepEqual(
  normalizeSettings({ stableWidthEnabled: true, autoFitSlotEnabled: false }),
  {
    novelText: "",
    pageSize: 49,
    separator: " ",
    offset: 0,
    readMode: "embedded",
    embedWidthMode: "fixed",
    stableWidthEnabled: true,
    slotWidth: 420,
    verticalOffset: -0.05,
    autoFitSlotEnabled: false,
    ...baseDefaults
  },
  "old fixed slot setting migrates to embedWidthMode"
);

assert.deepEqual(
  normalizeSettings({ verticalOffset: "9", embedLineCount: "9" }),
  {
    novelText: "",
    pageSize: 49,
    separator: " ",
    offset: 0,
    readMode: "embedded",
    embedWidthMode: "auto",
    stableWidthEnabled: true,
    slotWidth: 420,
    embedLineCount: 3,
    verticalOffset: 0.4,
    autoFitSlotEnabled: true,
    keyboardShortcuts: DEFAULT_SHORTCUTS
  },
  "vertical correction and line count are clamped"
);

assert.equal(
  buildProgressSummary({ novelText: "abcdefghij", offset: 5 }),
  "总字数：10 | 当前位置：5 | 进度：50.0%"
);

assert.equal(
  buildProgressSummary({ novelText: "", offset: 0 }),
  "总字数：0 | 当前位置：0 | 进度：0.0%"
);

assert.equal(
  getSaveErrorMessage(new Error("QUOTA_BYTES quota exceeded")),
  "保存失败：文本太大或浏览器存储空间不足"
);

assert.equal(
  getSaveErrorMessage(new Error("other failure")),
  "保存失败：other failure"
);

assert.deepEqual(
  buildReplacementSettings("new text", {
    pageSize: 88,
    separator: "；",
    offset: 999,
    readMode: "embedded",
    embedWidthMode: "fixed",
    slotWidth: 360,
    embedLineCount: 2,
    verticalOffset: -0.08
  }),
  {
    novelText: "new text",
    pageSize: 88,
    separator: "；",
    offset: 0,
    readMode: "embedded",
    embedWidthMode: "fixed",
    stableWidthEnabled: true,
    slotWidth: 360,
    embedLineCount: 2,
    verticalOffset: -0.08,
    autoFitSlotEnabled: false,
    keyboardShortcuts: DEFAULT_SHORTCUTS
  }
);

assert.deepEqual(
  buildClearedSettings({
    novelText: "old text",
    pageSize: 66,
    separator: "  ",
    offset: 10,
    readMode: "plain",
    embedWidthMode: "auto",
    slotWidth: 240,
    verticalOffset: 0.06
  }),
  {
    novelText: "",
    pageSize: 66,
    separator: "  ",
    offset: 0,
    readMode: "plain",
    embedWidthMode: "auto",
    stableWidthEnabled: false,
    slotWidth: 240,
    embedLineCount: 1,
    verticalOffset: 0.06,
    autoFitSlotEnabled: true,
    keyboardShortcuts: DEFAULT_SHORTCUTS
  }
);

