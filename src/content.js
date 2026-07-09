const STORAGE_DEFAULTS = {
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
  keyboardShortcuts: globalThis.IntextReaderShortcuts.DEFAULT_SHORTCUTS
};

const INSERTED_ATTR = "data-intext-reader-insert";
const { formatInsertedText, renderSeparator } = globalThis.IntextReaderText;
const { canRunPageAction } = globalThis.IntextReaderPageControl;
const {
  getInsertedDisplayStyle,
  normalizeDisplaySettings
} = globalThis.IntextReaderDisplayMode;
const {
  DEFAULT_MIN_SLOT_WIDTH,
  fitTextAcrossLines,
  normalizeFitSettings,
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
  shouldShowToastForAction
} = globalThis.IntextReaderInteractionPolicy;

let insertedNode = null;
let pageEnabled = true;
let scrollCheckQueued = false;
let toastTimer = null;
let lastAction = { name: "", time: 0 };
let offsetHistory = [];
let lastReadingStatus = { inserted: false };
let activeShortcuts = normalizeShortcutMap(DEFAULT_SHORTCUTS);

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

  return Math.min(3, Math.max(1, parsed));
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
    offset: values.offset || 0
  };
}

function setNoReadingStatus() {
  lastReadingStatus = { inserted: false };
}

function restoreInsertedNode() {
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
    if (rect.width > DEFAULT_MIN_SLOT_WIDTH && !display.startsWith("inline")) {
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
    remainingLineWidth,
    minSlotWidth: DEFAULT_MIN_SLOT_WIDTH
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
  const fit = fitTextAcrossLines(excerpt.text, widths, (candidate, width, index) => {
    const line = lineNodes[index];
    const prefix = index === 0 ? separator : "";
    return lineFitsText(line, candidate, prefix, "");
  });

  insertedNode.textContent = "";
  fit.lines.forEach((lineData, index) => {
    if (index > 0) {
      insertedNode.appendChild(document.createElement("br"));
    }

    const line = createLineNode(settings, lineData.width);
    const prefix = index === 0 ? separator : "";
    const suffix = index === fit.lines.length - 1 ? separator : "";
    line.textContent = `${prefix}${lineData.text}${suffix}`;
    insertedNode.appendChild(line);
  });

  lastReadingStatus = buildReadingStatus({
    inserted: true,
    readMode: mode.readMode,
    embedWidthMode: mode.embedWidthMode,
    displayedChars: fit.displayedChars,
    lineCount: Math.max(1, fit.lines.length),
    effectiveSlotWidth: firstSlot.effectiveSlotWidth,
    maxSlotWidth: firstSlot.maxSlotWidth,
    offset: excerpt.offset
  });
}

function applyExcerptToInsertedNode(settings) {
  if (!insertedNode?.isConnected) {
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
  if (status.readMode === "embedded") {
    const widthText = status.effectiveSlotWidth ? `，槽宽${status.effectiveSlotWidth}px` : "";
    const lineText = status.lineCount > 1 ? `，${status.lineCount}行` : "";
    return `${prefix} ${status.displayedChars} 字${lineText}${widthText}`;
  }

  return `${prefix} ${status.displayedChars} 字`;
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
    showToast("先在插件弹窗中保存小说文本");
    return;
  }

  if (!excerpt.text) {
    showToast("已经到达文本末尾");
    return;
  }

  const range = getSelectionInsertionRange();
  if (!range) {
    showToast("先选中网页中的一段文字");
    return;
  }

  restoreInsertedNode();
  insertedNode = buildInsertedNode();

  try {
    range.insertNode(insertedNode);
    applyExcerptToInsertedNode(settings);
    showToast(buildInsertToast(lastReadingStatus, "已插入"));
  } catch (error) {
    insertedNode = null;
    setNoReadingStatus();
    showToast("当前页面不支持在此处插入");
  }
}

function getForwardStep(settings, excerpt) {
  if (
    isEmbeddedMode(settings) &&
    lastReadingStatus.inserted &&
    lastReadingStatus.offset === excerpt.offset &&
    lastReadingStatus.displayedChars > 0
  ) {
    return lastReadingStatus.displayedChars;
  }

  return excerpt.pageSize;
}

async function movePage(direction) {
  const settings = await storageGet();
  const excerpt = getExcerpt(settings);

  if (!excerpt.novelText) {
    showToast("先在插件弹窗中保存小说文本");
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
      showToast(buildInsertToast(lastReadingStatus, direction > 0 ? "下一页" : "上一页"));
    }
  } else if (shouldShowToastForAction(action)) {
    showToast(`位置已保存：${nextOffset}`);
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
    if (isScrollableElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function getScrollTargetForNode(node) {
  const container = findScrollContainer(node);
  if (!container) {
    return {
      element: null,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      rect: node.getBoundingClientRect()
    };
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
  if (target.element) {
    target.element.scrollTop += delta;
  } else {
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
  }
}

function hasVisibleClientRect(node, target = getScrollTargetForNode(node)) {
  const rects = Array.from(node.getClientRects());
  if (rects.length === 0) {
    return false;
  }

  const viewport = target.element
    ? target.element.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
  return rects.some((rect) => {
    return (
      rect.bottom >= viewport.top &&
      rect.top <= viewport.bottom &&
      rect.right >= viewport.left &&
      rect.left <= viewport.right
    );
  });
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
    showToast("当前没有插入内容");
    return;
  }

  const target = getScrollTargetForNode(insertedNode);
  const delta = calculateHideScrollDelta({
    rect: target.rect,
    viewportHeight: target.viewportHeight,
    scrollY: target.scrollY,
    scrollHeight: target.scrollHeight,
    margin: 80
  });
  if (!delta) {
    restoreInsertedNode();
    return;
  }

  runQuickHideScrollSteps(target, buildWheelScrollSteps(delta, { stepCount: 8 }));
}

function runQuickHideScrollSteps(target, steps, index = 0) {
  if (!insertedNode?.isConnected) {
    return;
  }

  if (index >= steps.length) {
    restoreInsertedNode();
    return;
  }

  scrollTargetBy(target, steps[index]);
  if (!hasVisibleClientRect(insertedNode, target)) {
    restoreInsertedNode();
    return;
  }

  window.setTimeout(() => runQuickHideScrollSteps(target, steps, index + 1), 18);
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
    showToast("已恢复");
  } else if (action === "hide") {
    quickHideInsertedNode();
  }
}

function updateShortcutCache(settings) {
  activeShortcuts = normalizeShortcutMap(settings.keyboardShortcuts);
}

storageGet().then(updateShortcutCache);
if (chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.keyboardShortcuts) {
      activeShortcuts = normalizeShortcutMap(changes.keyboardShortcuts.newValue);
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








