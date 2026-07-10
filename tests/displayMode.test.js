const assert = require("node:assert/strict");
const {
  DEFAULT_DISPLAY_SETTINGS,
  getInsertedDisplayStyle,
  normalizeDisplaySettings
} = require("../src/displayMode.js");

assert.deepEqual(
  normalizeDisplaySettings({}),
  DEFAULT_DISPLAY_SETTINGS,
  "embedded auto mode is enabled by default for compatibility"
);

assert.deepEqual(
  normalizeDisplaySettings({
    stableWidthEnabled: false,
    slotWidth: "bad",
    verticalOffset: "bad"
  }),
  {
    readMode: "plain",
    embedWidthMode: "auto",
    stableWidthEnabled: false,
    slotWidth: 500,
    verticalOffset: -0.43,
    autoFitSlotEnabled: true
  },
  "old disabled stable-width setting maps to plain mode"
);

assert.deepEqual(
  normalizeDisplaySettings({ stableWidthEnabled: true, autoFitSlotEnabled: false }),
  {
    readMode: "embedded",
    embedWidthMode: "fixed",
    stableWidthEnabled: true,
    slotWidth: 500,
    verticalOffset: -0.43,
    autoFitSlotEnabled: false
  },
  "old fixed width setting maps to embedded fixed mode"
);

assert.deepEqual(
  normalizeDisplaySettings({ verticalOffset: "9" }),
  {
    readMode: "embedded",
    embedWidthMode: "auto",
    stableWidthEnabled: true,
    slotWidth: 500,
    verticalOffset: 0.4,
    autoFitSlotEnabled: true
  },
  "vertical correction upper range is wide enough for manual adjustment"
);

assert.deepEqual(
  normalizeDisplaySettings({ verticalOffset: "-9" }),
  {
    readMode: "embedded",
    embedWidthMode: "auto",
    stableWidthEnabled: true,
    slotWidth: 500,
    verticalOffset: -0.8,
    autoFitSlotEnabled: true
  },
  "vertical correction lower range is wide enough for manual adjustment"
);

assert.equal(
  normalizeDisplaySettings({ slotWidth: "0" }).slotWidth,
  1,
  "zero width is clamped to the one-pixel minimum"
);

assert.deepEqual(
  getInsertedDisplayStyle({
    readMode: "embedded",
    embedWidthMode: "auto",
    slotWidth: 480,
    effectiveSlotWidth: 260,
    verticalOffset: -0.35
  }),
  {
    display: "inline-block",
    width: "260px",
    maxWidth: "80vw",
    overflow: "hidden",
    whiteSpace: "nowrap",
    verticalAlign: "-0.35em",
    textAlign: "left",
    lineHeight: "inherit",
    height: ""
  },
  "embedded mode can use an effective width smaller than the max slot width"
);

assert.deepEqual(
  getInsertedDisplayStyle({
    readMode: "plain",
    slotWidth: 480,
    verticalOffset: -0.08
  }),
  {
    display: "inline",
    width: "",
    maxWidth: "",
    overflow: "",
    whiteSpace: "inherit",
    verticalAlign: "",
    textAlign: "",
    lineHeight: "inherit",
    height: ""
  },
  "plain mode keeps the existing flowing behavior"
);

