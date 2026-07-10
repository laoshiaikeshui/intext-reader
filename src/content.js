const STORAGE_DEFAULTS = {
  novelText: "",
  pageSize: 49,
  separator: " ",
  offset: 0,
  readMode: "embedded",
  embedWidthMode: "auto",
  stableWidthEnabled: true,
  slotWidth: 500,
  embedLineCount: 1,
  verticalOffset: -0.43,
  autoFitSlotEnabled: true,
  keyboardShortcuts: globalThis.IntextReaderShortcuts.DEFAULT_SHORTCUTS,
  uiLanguage: "auto"
};

const INSERTED_ATTR = "data-intext-reader-insert";
const MIN_WIDTH_CONTAINER = 120;
const { formatInsertedText, renderSeparator } = globalThis.IntextReaderText;
const { canRunPageAction } = globalThis.IntextReaderPageControl;
const {
  getInsertedDisplayStyle,
  normalizeDisplaySettings
} = globalThis.IntextReaderDisplayMode;
const {
  fitTextAcrossLines,
  normalizeFitSettings,
  resolveAutoFirstLineWidth,
  resolvePageStep,
  resolveRenderedSlotWidth,
  resolveEffectiveSlotWidth
} = globalThis.IntextReaderTextFitting;
const {
  DEFAULT_SHORTCUTS,
  eventToShortcut,
  getActionForShortcut,
  normalizeShortcutMap
} = globalThis.IntextReaderShortcuts;
const {
  buildWheelScrollSteps,
  calculateHideScrollDelta,
  hasScrollPositionChanged,
  isPageScrollElement,
  isRectVisibleInViewport,
  shouldRestoreAfterScroll,
  shouldShowToastForAction
} = globalThis.IntextReaderInteractionPolicy;
const { resolveLanguage, translate } = globalThis.IntextReaderI18n;

let insertedNode = null;
let pageEnabled = true;
let scrollCheckQueued = false;
let scrollRestoreContainer = null;
let toastTimer = null;
let lastAction = { name: "", time: 0 };
let offsetHistory = [];
let lastReadingStatus = { inserted: false };
let activeShortcuts = normalizeShortcutMap(DEFAULT_SHORTCUTS);
let activeLanguage = resolveLanguage("auto", navigator.language);

function tr(key, params) {
  return translate(key, activeLanguage, params);
}

function storageGet() {
  return chrome.storage.local.get(STORAGE_DEFAULTS);
}

function storageSet(values) {
  return chrome.storage.local.set(values);
}

function clampOffset(offset, textLength) {
  if (!Number.isFinite(offset)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(offset), Math.max(0, textLength)));
}

function normalizedPageSize(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : STORAGE_DEFAULTS.pageSize;
}

function normalizedEmbedLineCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(10, Math.max(1, parsed));
}

function getMode(settings) {
  return normalizeFitSettings(settings);
}

function isEmbeddedMode(settings) {
  return getMode(settings).readMode === "embedded";
}

function isAutoEmbedMode(settings) {
  const mode = getMode(settings);
  return mode.readMode === "embedded" && mode.embedWidthMode === "auto";
}

function getExcerpt(settings) {
  const novelText = String(settings.novelText || "");
  const pageSize = normalizedPageSize(settings.pageSize);
  const offset = clampOffset(Number(settings.offset || 0), novelText.length);
  const text = isEmbeddedMode(settings)
    ? novelText.slice(offset)
    : novelText.slice(offset, offset + pageSize);

  return {
    text,
    pageSize,
    offset,
    novelText
  };
}

function buildReadingStatus(values = {}) {
  return {
    inserted: Boolean(values.inserted),
    readMode: values.readMode || "plain",
    embedWidthMode: values.embedWidthMode || "auto",
    displayedChars: values.displayedChars || 0,
    lineCount: values.lineCount || 1,
    effectiveSlotWidth: values.effectiveSlotWidth || 0,
    maxSlotWidth: values.maxSlotWidth || 0,
    widthTooSmall: Boolean(values.widthTooSmall),
    offset: values.offset || 0
  };
}

function setNoReadingStatus() {
  lastReadingStatus = { inserted: false };
}

function restoreInsertedNode() {
  detachScrollRestoreContainer();
  if (insertedNode?.isConnected) {
    insertedNode.remove();
  }

  insertedNode = null;
  offsetHistory = [];
  setNoReadingStatus();
}

function applyBaseInlineStyle(node) {
  node.style.font = "inherit";
  node.style.color = "inherit";
  node.style.lineHeight = "inherit";
  node.style.letterSpacing = "inherit";
  node.style.textDecoration = "inherit";
  node.style.background = "transparent";
  node.style.border = "0";
  node.style.padding = "0";
  node.style.margin = "0";
}

function applySlotStyle(node, settings, effectiveSlotWidth) {
  const displayStyle = getInsertedDisplayStyle({
    ...settings,
    effectiveSlotWidth
  });
  node.style.display = displayStyle.display;
  node.style.width = displayStyle.width;
  node.style.maxWidth = displayStyle.maxWidth;
  node.style.overflow = displayStyle.overflow;
  node.style.whiteSpace = displayStyle.whiteSpace;
  node.style.verticalAlign = displayStyle.verticalAlign;
  node.style.textAlign = displayStyle.textAlign;
  node.style.lineHeight = displayStyle.lineHeight;
  node.style.height = displayStyle.height;
}

function buildInsertedNode() {
  const span = document.createElement("span");
  span.setAttribute(INSERTED_ATTR, "true");
  applyBaseInlineStyle(span);
  span.style.display = "inline";
  return span;
}

function createLineNode(settings, width) {
  const line = document.createElement("span");
  applyBaseInlineStyle(line);
  applySlotStyle(line, settings, width);
  return line;
}

function getVisibleSlotWidth(node) {
  return node.clientWidth || node.getBoundingClientRect().width || 0;
}

function findWidthContainer(node) {
  let current = node.parentElement;
  while (current && current !== document.documentElement) {
    const rect = current.getBoundingClientRect();
    const display = window.getComputedStyle(current).display;
    if (rect.width > MIN_WIDTH_CONTAINER && !display.startsWith("inline")) {
      return current;
    }

    current = current.parentElement;
  }

  return document.documentElement;
}

function measureRemainingLineWidth(node, fallbackWidth) {
  if (!node?.isConnected) {
    return fallbackWidth;
  }

  const previousText = node.textContent;
  const previousDisplay = node.style.display;
  const previousWidth = node.style.width;
  const previousMaxWidth = node.style.maxWidth;
  node.textContent = "";
  node.style.display = "inline-block";
  node.style.width = "0px";
  node.style.maxWidth = "none";

  const nodeRect = node.getBoundingClientRect();
  const containerRect = findWidthContainer(node).getBoundingClientRect();
  const rightEdge = Math.min(containerRect.right || window.innerWidth, window.innerWidth);
  const remaining = Math.floor(rightEdge - nodeRect.left);

  node.textContent = previousText;
  node.style.display = previousDisplay;
  node.style.width = previousWidth;
  node.style.maxWidth = previousMaxWidth;

  return Number.isFinite(remaining) && remaining > 0 ? remaining : fallbackWidth;
}

function getContainerWidth(node, fallbackWidth) {
  if (!node?.isConnected) {
    return fallbackWidth;
  }

  const containerRect = findWidthContainer(node).getBoundingClientRect();
  const width = Math.floor(Math.min(containerRect.width || fallbackWidth, window.innerWidth));
  return Number.isFinite(width) && width > 0 ? width : fallbackWidth;
}

function resolveFirstSlotWidth(settings) {
  const displaySettings = normalizeDisplaySettings(settings);
  if (displaySettings.readMode === "plain") {
    return { effectiveSlotWidth: 0, maxSlotWidth: 0, remainingLineWidth: 0 };
  }

  const remainingLineWidth = isAutoEmbedMode(settings)
    ? measureRemainingLineWidth(insertedNode, displaySettings.slotWidth)
    : displaySettings.slotWidth;
  const effectiveSlotWidth = resolveEffectiveSlotWidth({
    readMode: displaySettings.readMode,
    embedWidthMode: displaySettings.embedWidthMode,
    slotWidth: displaySettings.slotWidth,
    remainingLineWidth
  });

  return {
    effectiveSlotWidth,
    maxSlotWidth: displaySettings.slotWidth,
    remainingLineWidth
  };
}

function resolveLineWidths(settings, firstSlot) {
  const lineCount = normalizedEmbedLineCount(settings.embedLineCount);
  const displaySettings = normalizeDisplaySettings(settings);
  const widths = [firstSlot.effectiveSlotWidth];
  if (lineCount <= 1) {
    return widths;
  }

  const followingWidth = displaySettings.embedWidthMode === "auto"
    ? Math.min(displaySettings.slotWidth, getContainerWidth(insertedNode, displaySettings.slotWidth))
    : displaySettings.slotWidth;
  while (widths.length < lineCount) {
    widths.push(followingWidth);
  }

  return widths;
}

function lineFitsText(line, text, prefix, suffix) {
  line.textContent = `${prefix}${text}${suffix}`;
  const visibleWidth = getVisibleSlotWidth(line);
  if (visibleWidth <= 0) {
    return true;
  }

  return line.scrollWidth <= Math.ceil(visibleWidth);
}

function renderPlainExcerpt(settings, excerpt) {
  insertedNode.textContent = formatInsertedText(settings.separator, excerpt.text);
  lastReadingStatus = buildReadingStatus({
    inserted: true,
    readMode: "plain",
    displayedChars: excerpt.text.length,
    offset: excerpt.offset
  });
}

function renderEmbeddedExcerpt(settings, excerpt) {
  const mode = getMode(settings);
  const firstSlot = resolveFirstSlotWidth(settings);
  const widths = resolveLineWidths(settings, firstSlot);
  insertedNode.textContent = "";
  const lineNodes = widths.map((width) => {
    const line = createLineNode(settings, width);
    insertedNode.appendChild(line);
    return line;
  });

  const separator = renderSeparator(settings.separator);
  if (isAutoEmbedMode(settings) && excerpt.text) {
    const firstCharacterFits = lineFitsText(lineNodes[0], excerpt.text.slice(0, 1), separator, "");
    const resolvedWidth = resolveAutoFirstLineWidth({
      effectiveSlotWidth: widths[0],
      maxSlotWidth: firstSlot.maxSlotWidth,
      firstCharacterFits
    });
    if (resolvedWidth !== widths[0]) {
      widths[0] = resolvedWidth;
      applySlotStyle(lineNodes[0], settings, resolvedWidth);
    }
  }

  const fit = fitTextAcrossLines(excerpt.text, widths, (candidate, width, index) => {
    const line = lineNodes[index];
    const prefix = index === 0 ? separator : "";
    return lineFitsText(line, candidate, prefix, "");
  });

  insertedNode.textContent = "";
  let firstRenderedLine = null;
  fit.lines.forEach((lineData, index) => {
    if (index > 0) {
      insertedNode.appendChild(document.createElement("br"));
    }

    const line = createLineNode(settings, lineData.width);
    const prefix = index === 0 ? separator : "";
    const suffix = index === fit.lines.length - 1 ? separator : "";
    line.textContent = `${prefix}${lineData.text}${suffix}`;
    insertedNode.appendChild(line);
    firstRenderedLine ||= line;
  });

  const widthTooSmall = Boolean(excerpt.text) && fit.displayedChars === 0;

  lastReadingStatus = buildReadingStatus({
    inserted: true,
    readMode: mode.readMode,
    embedWidthMode: mode.embedWidthMode,
    displayedChars: fit.displayedChars,
    lineCount: Math.max(1, fit.lines.length),
    effectiveSlotWidth: resolveRenderedSlotWidth(
      firstRenderedLine ? getVisibleSlotWidth(firstRenderedLine) : 0
    ),
    maxSlotWidth: firstSlot.maxSlotWidth,
    widthTooSmall,
    offset: excerpt.offset
  });
}

function applyExcerptToInsertedNode(settings) {
  if (!insertedNode?.isConnected) {
    detachScrollRestoreContainer();
    insertedNode = null;
    setNoReadingStatus();
    return false;
  }

  const excerpt = getExcerpt(settings);
  if (isEmbeddedMode(settings)) {
    renderEmbeddedExcerpt(settings, excerpt);
  } else {
    renderPlainExcerpt(settings, excerpt);
  }

  return true;
}

function buildInsertToast(status, prefix) {
  const lineText = status.lineCount > 1 ? tr("lineCount", { count: status.lineCount }) : "";
  if (status.readMode === "embedded") {
    const widthText = status.effectiveSlotWidth
      ? tr(status.embedWidthMode === "auto" ? "widthAuto" : "widthFixed", {
          width: status.effectiveSlotWidth,
          max: status.maxSlotWidth
        })
      : "";
    return tr("insertSummary", {
      prefix,
      chars: status.displayedChars,
      lines: lineText,
      width: widthText
    });
  }

  return tr("insertSummary", { prefix, chars: status.displayedChars, lines: "", width: "" });
}

function getSelectionInsertionRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const selectedText = selection.toString();
  if (!selectedText.trim()) {
    return null;
  }

  const range = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
  range.collapse(false);
  return range;
}

async function insertCurrentPage() {
  const settings = await storageGet();
  const excerpt = getExcerpt(settings);

  if (!excerpt.novelText) {
    showToast(tr("saveNovelFirst"));
    return;
  }

  if (!excerpt.text) {
    showToast(tr("reachedTextEnd"));
    return;
  }

  const range = getSelectionInsertionRange();
  if (!range) {
    showToast(tr("selectPageText"));
    return;
  }

  restoreInsertedNode();
  insertedNode = buildInsertedNode();

  try {
    range.insertNode(insertedNode);
    applyExcerptToInsertedNode(settings);
    attachScrollRestoreContainer();
    if (!lastReadingStatus.widthTooSmall) {
      showToast(buildInsertToast(lastReadingStatus, tr("inserted")));
    }
  } catch (error) {
    insertedNode = null;
    setNoReadingStatus();
    showToast(tr("insertionUnsupported"));
  }
}

function getForwardStep(settings, excerpt) {
  return resolvePageStep({
    readMode: getMode(settings).readMode,
    pageSize: excerpt.pageSize,
    offset: excerpt.offset,
    readingStatus: lastReadingStatus
  });
}

async function movePage(direction) {
  const settings = await storageGet();
  const excerpt = getExcerpt(settings);

  if (!excerpt.novelText) {
    showToast(tr("saveNovelFirst"));
    return;
  }

  let nextOffset;
  if (direction > 0) {
    const step = getForwardStep(settings, excerpt);
    nextOffset = clampOffset(excerpt.offset + step, excerpt.novelText.length);
    if (nextOffset !== excerpt.offset) {
      offsetHistory.push(excerpt.offset);
    }
  } else if (offsetHistory.length > 0) {
    nextOffset = offsetHistory.pop();
  } else {
    nextOffset = clampOffset(excerpt.offset - excerpt.pageSize, excerpt.novelText.length);
  }

  const nextSettings = { ...settings, offset: nextOffset };
  await storageSet({ offset: nextOffset });

  const action = direction > 0 ? "next" : "previous";
  if (applyExcerptToInsertedNode(nextSettings)) {
    if (shouldShowToastForAction(action)) {
      showToast(buildInsertToast(lastReadingStatus, tr(direction > 0 ? "nextPage" : "previousPage")));
    }
  } else if (shouldShowToastForAction(action)) {
    showToast(tr("positionSaved", { offset: nextOffset }));
  }
}

function isScrollableElement(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY);
  return canScrollY && element.scrollHeight > element.clientHeight + 1;
}

function findScrollContainer(node) {
  let current = node?.parentElement;
  while (current && current !== document.documentElement) {
    if (!isPageScrollElement(current, document) && isScrollableElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function getWindowScrollTarget(node) {
  return {
    element: null,
    viewportHeight: window.innerHeight,
    scrollY: window.scrollY,
    scrollHeight: document.scrollingElement?.scrollHeight || document.documentElement.scrollHeight,
    rect: node.getBoundingClientRect()
  };
}

function getScrollTargetForNode(node) {
  const container = findScrollContainer(node);
  if (!container) {
    return getWindowScrollTarget(node);
  }

  const nodeRect = node.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    element: container,
    viewportHeight: container.clientHeight,
    scrollY: container.scrollTop,
    scrollHeight: container.scrollHeight,
    rect: {
      top: nodeRect.top - containerRect.top,
      bottom: nodeRect.bottom - containerRect.top
    }
  };
}

function scrollTargetBy(target, delta) {
  const before = target.element ? target.element.scrollTop : window.scrollY;
  if (target.element) {
    target.element.scrollTop += delta;
  } else {
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
  }

  const after = target.element ? target.element.scrollTop : window.scrollY;
  return hasScrollPositionChanged(before, after);
}

function hasVisibleClientRect(node) {
  const rects = Array.from(node.getClientRects());
  if (rects.length === 0) {
    return false;
  }

  return rects.some((rect) => {
    return isRectVisibleInViewport(rect, {
      width: window.innerWidth,
      height: window.innerHeight,
      margin: 24
    });
  });
}

function detachScrollRestoreContainer() {
  if (scrollRestoreContainer) {
    scrollRestoreContainer.removeEventListener("scroll", queueScrollRestoreCheck);
    scrollRestoreContainer = null;
  }
}

function attachScrollRestoreContainer() {
  detachScrollRestoreContainer();
  if (!insertedNode?.isConnected) {
    return;
  }

  const target = getScrollTargetForNode(insertedNode);
  if (target.element) {
    scrollRestoreContainer = target.element;
    scrollRestoreContainer.addEventListener("scroll", queueScrollRestoreCheck, { passive: true });
  }
}

function queueScrollRestoreCheck() {
  if (!insertedNode?.isConnected || scrollCheckQueued) {
    return;
  }

  scrollCheckQueued = true;
  requestAnimationFrame(() => {
    scrollCheckQueued = false;
    if (insertedNode?.isConnected && !hasVisibleClientRect(insertedNode)) {
      restoreInsertedNode();
    }
  });
}

function quickHideInsertedNode() {
  if (!insertedNode?.isConnected) {
    showToast(tr("noInsertedContent"));
    return;
  }

  startQuickHideScroll(getScrollTargetForNode(insertedNode));
}

function getQuickHideSteps(target) {
  const delta = calculateHideScrollDelta({
    rect: target.rect,
    viewportHeight: target.viewportHeight,
    scrollY: target.scrollY,
    scrollHeight: target.scrollHeight,
    margin: 80
  });

  return buildWheelScrollSteps(delta, { stepCount: 8 });
}

function startQuickHideScroll(target, usedWindowFallback = false) {
  const steps = getQuickHideSteps(target);
  if (steps.length === 0) {
    if (target.element && !usedWindowFallback) {
      startQuickHideScroll(getWindowScrollTarget(insertedNode), true);
    } else {
      restoreInsertedNode();
    }
    return;
  }

  runQuickHideScrollSteps(target, steps, 0, usedWindowFallback);
}

function runQuickHideScrollSteps(target, steps, index = 0, usedWindowFallback = false) {
  if (!insertedNode?.isConnected) {
    return;
  }

  if (index >= steps.length) {
    if (shouldRestoreAfterScroll({
      isVisible: hasVisibleClientRect(insertedNode),
      attemptsExhausted: true
    })) {
      restoreInsertedNode();
    }
    return;
  }

  const moved = scrollTargetBy(target, steps[index]);
  if (!moved) {
    if (target.element && !usedWindowFallback) {
      startQuickHideScroll(getWindowScrollTarget(insertedNode), true);
    } else {
      restoreInsertedNode();
    }
    return;
  }

  if (shouldRestoreAfterScroll({
    isVisible: hasVisibleClientRect(insertedNode),
    attemptsExhausted: false
  })) {
    restoreInsertedNode();
    return;
  }

  window.setTimeout(() => runQuickHideScrollSteps(target, steps, index + 1, usedWindowFallback), 18);
}
function showToast(message) {
  let toast = document.getElementById("intext-reader-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "intext-reader-toast";
    toast.style.position = "fixed";
    toast.style.right = "16px";
    toast.style.bottom = "16px";
    toast.style.zIndex = "2147483647";
    toast.style.maxWidth = "260px";
    toast.style.padding = "8px 10px";
    toast.style.borderRadius = "6px";
    toast.style.background = "rgba(20, 24, 32, 0.88)";
    toast.style.color = "#fff";
    toast.style.font = "12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    toast.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.18)";
    toast.style.pointerEvents = "none";
    document.documentElement.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = "block";

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.style.display = "none";
  }, 1400);
}

function previewVerticalOffset(value) {
  if (!insertedNode?.isConnected) {
    return false;
  }

  const settings = normalizeDisplaySettings({ verticalOffset: value });
  insertedNode.querySelectorAll("span").forEach((line) => {
    line.style.verticalAlign = `${settings.verticalOffset}em`;
  });
  return true;
}

async function previewDisplaySettings(values) {
  if (!insertedNode?.isConnected) {
    return false;
  }

  const settings = await storageGet();
  return applyExcerptToInsertedNode({
    ...settings,
    readMode: values.readMode,
    embedWidthMode: values.embedWidthMode,
    slotWidth: values.slotWidth,
    embedLineCount: values.embedLineCount,
    verticalOffset: values.verticalOffset
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "intext-reader-command") {
    return;
  }

  if (message.action === "get-status") {
    sendResponse({ ok: true, pageEnabled, readingStatus: lastReadingStatus });
    return;
  }

  if (message.action === "set-enabled") {
    pageEnabled = Boolean(message.enabled);
    if (!pageEnabled) {
      restoreInsertedNode();
    }

    sendResponse({ ok: true, pageEnabled, readingStatus: lastReadingStatus });
    return;
  }

  if (message.action === "preview-vertical-offset") {
    if (!pageEnabled) {
      sendResponse({ ok: false, pageEnabled, reason: "page-paused", readingStatus: lastReadingStatus });
      return;
    }

    const previewed = previewVerticalOffset(message.verticalOffset);
    sendResponse({ ok: true, pageEnabled, previewed, readingStatus: lastReadingStatus });
    return;
  }

  if (message.action === "preview-display-mode") {
    if (!pageEnabled) {
      sendResponse({ ok: false, pageEnabled, reason: "page-paused", readingStatus: lastReadingStatus });
      return;
    }

    previewDisplaySettings(message).then((previewed) => {
      sendResponse({ ok: true, pageEnabled, previewed, readingStatus: lastReadingStatus });
    });
    return true;
  }

  if (!canRunPageAction(pageEnabled, message.action)) {
    sendResponse({ ok: false, pageEnabled, reason: "page-paused", readingStatus: lastReadingStatus });
    return;
  }

  runAction(message.action);
  sendResponse({ ok: true, pageEnabled, readingStatus: lastReadingStatus });
});

function isEditableTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"));
}

function runAction(action) {
  if (!canRunPageAction(pageEnabled, action)) {
    return;
  }

  const now = Date.now();
  if (lastAction.name === action && now - lastAction.time < 250) {
    return;
  }

  lastAction = { name: action, time: now };

  if (action === "insert") {
    insertCurrentPage();
  } else if (action === "previous") {
    movePage(-1);
  } else if (action === "next") {
    movePage(1);
  } else if (action === "restore") {
    restoreInsertedNode();
    showToast(tr("restored"));
  } else if (action === "hide") {
    quickHideInsertedNode();
  }
}

function updateCachedSettings(settings) {
  activeShortcuts = normalizeShortcutMap(settings.keyboardShortcuts);
  activeLanguage = resolveLanguage(settings.uiLanguage, navigator.language);
}

storageGet().then(updateCachedSettings);
if (chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.keyboardShortcuts) {
      activeShortcuts = normalizeShortcutMap(changes.keyboardShortcuts.newValue);
    }
    if (areaName === "local" && changes.uiLanguage) {
      activeLanguage = resolveLanguage(changes.uiLanguage.newValue, navigator.language);
    }
  });
}

window.addEventListener(
  "keydown",
  (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const shortcut = eventToShortcut(event);
    const action = getActionForShortcut(shortcut, activeShortcuts);
    if (!action || !canRunPageAction(pageEnabled, action)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    runAction(action);
  },
  true
);

window.addEventListener("scroll", queueScrollRestoreCheck, { passive: true, capture: true });
window.addEventListener("resize", queueScrollRestoreCheck, { passive: true });










