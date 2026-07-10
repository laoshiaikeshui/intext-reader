const assert = require("node:assert/strict");
const {
  buildWheelScrollSteps,
  calculateHideScrollDelta,
  hasScrollPositionChanged,
  isPageScrollElement,
  isRectVisibleInViewport,
  shouldRestoreAfterScroll,
  shouldShowToastForAction
} = require("../src/interactionPolicy.js");

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

assert.equal(shouldShowToastForAction("insert"), true, "insert keeps the startup toast");
assert.equal(shouldShowToastForAction("next"), false, "next page does not show a toast");
assert.equal(shouldShowToastForAction("previous"), false, "previous page does not show a toast");
assert.equal(shouldShowToastForAction("hide"), false, "one-key hide stays quiet when content exists");

const body = {};
const html = {};
const scrollingElement = {};
const documentLike = { body, documentElement: html, scrollingElement };
assert.equal(isPageScrollElement(body, documentLike), true, "body uses page scrolling");
assert.equal(isPageScrollElement(html, documentLike), true, "html uses page scrolling");
assert.equal(isPageScrollElement(scrollingElement, documentLike), true, "the browser scrolling element uses page scrolling");
assert.equal(isPageScrollElement({}, documentLike), false, "a normal ancestor can remain an internal scroll container");
assert.equal(hasScrollPositionChanged(0, 0), false, "unchanged scroll position means scrolling failed");
assert.equal(hasScrollPositionChanged(0, 120), true, "changed scroll position means scrolling succeeded");
assert.equal(
  shouldRestoreAfterScroll({ isVisible: true, attemptsExhausted: false }),
  false,
  "visible text stays while another scroll attempt is available"
);
assert.equal(
  shouldRestoreAfterScroll({ isVisible: false, attemptsExhausted: false }),
  true,
  "text is restored as soon as it leaves the viewport"
);
assert.equal(
  shouldRestoreAfterScroll({ isVisible: true, attemptsExhausted: true }),
  true,
  "direct removal remains the final fallback after scrolling is exhausted"
);

assert.equal(
  calculateHideScrollDelta({
    rect: { top: 120, bottom: 150 },
    viewportHeight: 600,
    scrollY: 400,
    scrollHeight: 2000,
    margin: 80,
    overshoot: 220
  }),
  450,
  "content in the upper half scrolls down with extra distance"
);

assert.equal(
  calculateHideScrollDelta({
    rect: { top: 420, bottom: 450 },
    viewportHeight: 600,
    scrollY: 700,
    scrollHeight: 2000,
    margin: 80,
    overshoot: 220
  }),
  -480,
  "content in the lower half scrolls up with extra distance"
);

assert.equal(
  calculateHideScrollDelta({
    rect: { top: 120, bottom: 150 },
    viewportHeight: 600,
    scrollY: 1400,
    scrollHeight: 2000,
    margin: 80,
    overshoot: 220
  }),
  -780,
  "near the page bottom it scrolls upward even when the content is in the upper half"
);

assert.equal(
  calculateHideScrollDelta({
    rect: { top: 420, bottom: 450 },
    viewportHeight: 600,
    scrollY: 10,
    scrollHeight: 2000,
    margin: 80,
    overshoot: 220
  }),
  750,
  "near the page top it falls back to a large downward scroll"
);

assert.equal(
  calculateHideScrollDelta({
    rect: { top: 240, bottom: 280 },
    viewportHeight: 600,
    scrollY: 0,
    scrollHeight: 600,
    margin: 80,
    overshoot: 220
  }),
  0,
  "when the page cannot scroll, the caller should restore directly"
);

const downSteps = buildWheelScrollSteps(750, { stepCount: 8 });
assert.equal(downSteps.length, 8, "large scroll is split into several wheel-like steps");
assert.equal(sum(downSteps), 750, "downward wheel steps preserve the full distance");
assert(downSteps.every((step) => step > 0), "downward wheel steps keep direction");

const upSteps = buildWheelScrollSteps(-480, { stepCount: 6 });
assert.equal(upSteps.length, 6, "upward scroll is split into several wheel-like steps");
assert.equal(sum(upSteps), -480, "upward wheel steps preserve the full distance");
assert(upSteps.every((step) => step < 0), "upward wheel steps keep direction");



assert.equal(
  isRectVisibleInViewport({ top: 20, bottom: 40, left: 10, right: 80 }, { width: 800, height: 600, margin: 24 }),
  true,
  "a rect inside the browser viewport is visible"
);

assert.equal(
  isRectVisibleInViewport({ top: -10, bottom: 10, left: 10, right: 80 }, { width: 800, height: 600, margin: 24 }),
  true,
  "a rect just past the viewport edge stays visible within tolerance"
);

assert.equal(
  isRectVisibleInViewport({ top: -70, bottom: -30, left: 10, right: 80 }, { width: 800, height: 600, margin: 24 }),
  false,
  "a rect beyond the top tolerance is hidden"
);

assert.equal(
  isRectVisibleInViewport({ top: 630, bottom: 670, left: 10, right: 80 }, { width: 800, height: 600, margin: 24 }),
  false,
  "a rect beyond the bottom tolerance is hidden"
);

