const assert = require("node:assert/strict");
const {
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
} = require("../src/textFitting.js");

assert.deepEqual(
  normalizeFitSettings({}),
  { readMode: "embedded", embedWidthMode: "auto" },
  "embedded auto mode is the compatibility default"
);

assert.deepEqual(
  normalizeFitSettings({ stableWidthEnabled: false }),
  { readMode: "plain", embedWidthMode: "auto" },
  "old disabled stable-width setting maps to plain mode"
);

assert.deepEqual(
  normalizeFitSettings({ stableWidthEnabled: true, autoFitSlotEnabled: false }),
  { readMode: "embedded", embedWidthMode: "fixed" },
  "old fixed slot setting maps to embedded fixed mode"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "fixed",
    slotWidth: 420,
    remainingLineWidth: 260
  }),
  420,
  "fixed width keeps the user slot width"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 420,
    remainingLineWidth: 260
  }),
  260,
  "auto fit shrinks to the current line remaining width"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 420,
    remainingLineWidth: 80
  }),
  80,
  "auto fit uses narrow remaining space without an arbitrary minimum"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 40,
    remainingLineWidth: 260
  }),
  40,
  "auto fit never expands beyond the user width"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 500,
    remainingLineWidth: 1
  }),
  1,
  "auto fit accepts a one-pixel remaining width"
);

assert.equal(
  resolveAutoFirstLineWidth({ effectiveSlotWidth: 16, maxSlotWidth: 500, firstCharacterFits: true }),
  16,
  "a narrow first line is kept when it can display a complete character"
);

assert.equal(
  resolveAutoFirstLineWidth({ effectiveSlotWidth: 3, maxSlotWidth: 500, firstCharacterFits: false }),
  500,
  "a first line that cannot display one character uses the full width and wraps"
);

assert.equal(
  resolveAutoFirstLineWidth({ effectiveSlotWidth: 1, maxSlotWidth: 1, firstCharacterFits: false }),
  1,
  "an explicitly tiny maximum width is preserved for validation"
);

assert.equal(resolveRenderedSlotWidth(319.6), 320, "status reports the rounded rendered width");
assert.equal(resolveRenderedSlotWidth(0), 0, "an invisible slot reports zero width");

assert.equal(
  shouldShowWidthWarning({ inserted: true, readMode: "embedded", widthTooSmall: true }),
  true,
  "the popup warns when embedded text cannot display one character"
);
assert.equal(
  shouldShowWidthWarning({ inserted: true, readMode: "plain", widthTooSmall: true }),
  false,
  "plain insertion never shows the embedded-width warning"
);

assert.equal(
  findFittingLength("abcdefghijklmnopqrstuvwxyz", 50, (candidate) => candidate.length <= 8),
  8,
  "fit length chooses the longest text that fits"
);

assert.equal(
  findFittingLengthByGrowth("abcdefghijklmnopqrstuvwxyz", (candidate) => candidate.length <= 8),
  8,
  "growth fit length avoids needing a fixed max character count"
);

assert.equal(
  findFittingLength("abcdef", 50, () => false),
  0,
  "fit length does not consume a character that cannot be displayed"
);

assert.equal(
  findFittingLengthByGrowth("abcdef", () => false),
  0,
  "growth fitting does not consume a character that cannot be displayed"
);

assert.equal(
  buildReadingStatusText({ inserted: false }),
  "本页显示：未插入"
);

assert.equal(
  buildReadingStatusText({
    inserted: true,
    readMode: "plain",
    displayedChars: 50
  }),
  "本页显示：50字"
);

assert.equal(
  buildReadingStatusText({
    inserted: true,
    readMode: "embedded",
    embedWidthMode: "fixed",
    displayedChars: 38,
    effectiveSlotWidth: 420,
    maxSlotWidth: 420
  }),
  "本页显示：38字，显示宽度420px"
);

assert.equal(
  buildReadingStatusText({
    inserted: true,
    readMode: "embedded",
    embedWidthMode: "auto",
    displayedChars: 28,
    effectiveSlotWidth: 260,
    maxSlotWidth: 420
  }),
  "本页显示：28字，实际宽度260px，上限420px"
);

const lines = fitTextAcrossLines("abcdefghijkl", [3, 4, 2], (lineText, width) => lineText.length <= width);
assert.deepEqual(
  lines,
  {
    lines: [
      { text: "abc", width: 3 },
      { text: "defg", width: 4 },
      { text: "hi", width: 2 }
    ],
    displayedChars: 9
  },
  "embedded multiline fitting consumes text line by line"
);

assert.deepEqual(
  fitTextAcrossLines("abcdef", [1], () => false),
  { lines: [], displayedChars: 0 },
  "a width that cannot fit one character leaves the reading position unchanged"
);

assert.equal(
  resolvePageStep({
    readMode: "embedded",
    pageSize: 49,
    offset: 100,
    readingStatus: { inserted: true, offset: 100, displayedChars: 0 }
  }),
  0,
  "embedded next-page navigation does not skip text when nothing was displayed"
);

assert.equal(
  resolvePageStep({
    readMode: "embedded",
    pageSize: 49,
    offset: 100,
    readingStatus: { inserted: true, offset: 100, displayedChars: 38 }
  }),
  38,
  "embedded next-page navigation advances by the rendered character count"
);

assert.equal(
  resolvePageStep({
    readMode: "plain",
    pageSize: 49,
    offset: 100,
    readingStatus: { inserted: true, offset: 100, displayedChars: 38 }
  }),
  49,
  "plain insertion keeps its configured page size"
);

assert.equal(
  buildReadingStatusText({
    inserted: true,
    readMode: "embedded",
    embedWidthMode: "auto",
    displayedChars: 86,
    lineCount: 3,
    effectiveSlotWidth: 260,
    maxSlotWidth: 420
  }),
  "本页显示：86字，3行，实际宽度260px，上限420px"
);
assert.equal(
  buildReadingStatusText({
    inserted: true,
    readMode: "embedded",
    embedWidthMode: "auto",
    displayedChars: 28,
    effectiveSlotWidth: 260,
    maxSlotWidth: 420
  }, "en"),
  "Displayed: 28 chars, actual width 260px, limit 420px"
);
const indexedLines = fitTextAcrossLines("abcdef", [3, 3, 3], (lineText, width, index) => {
  return width === 3 && lineText.length <= index + 1;
});
assert.deepEqual(
  indexedLines,
  {
    lines: [
      { text: "a", width: 3 },
      { text: "bc", width: 3 },
      { text: "def", width: 3 }
    ],
    displayedChars: 6
  },
  "embedded multiline fitting exposes the real line index even when widths match"
);


