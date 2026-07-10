const assert = require("node:assert/strict");
const {
  buildReadingStatusText,
  findFittingLength,
  findFittingLengthByGrowth,
  fitTextAcrossLines,
  normalizeFitSettings,
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
    remainingLineWidth: 260,
    minSlotWidth: 120
  }),
  420,
  "fixed width keeps the user slot width"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 420,
    remainingLineWidth: 260,
    minSlotWidth: 120
  }),
  260,
  "auto fit shrinks to the current line remaining width"
);

assert.equal(
  resolveEffectiveSlotWidth({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 420,
    remainingLineWidth: 80,
    minSlotWidth: 120
  }),
  420,
  "too-small current line falls back to max slot width"
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
  1,
  "fit length keeps at least one visible character"
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


