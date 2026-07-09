const {
  DEFAULTS,
  DEFAULT_SHORTCUTS,
  buildClearedSettings,
  buildProgressSummary,
  buildReplacementSettings,
  getSaveErrorMessage,
  normalizeSettings,
  normalizeShortcutMap
} = globalThis.IntextReaderPopupState;
const {
  ACTION_LABELS,
  eventToShortcut,
  getShortcutConflict,
  shortcutToText
} = globalThis.IntextReaderShortcuts;
const {
  getPageStatusText,
  getPageToggleText
} = globalThis.IntextReaderPageControl;
const { buildReadingStatusText } = globalThis.IntextReaderTextFitting;

const novelTextInput = document.getElementById("novelText");
const pageSizeField = document.getElementById("pageSizeField");
const pageSizeInput = document.getElementById("pageSize");
const separatorInput = document.getElementById("separator");
const offsetInput = document.getElementById("offset");
const readModeInputs = Array.from(document.querySelectorAll("input[name='readMode']"));
const embedWidthModeInputs = Array.from(document.querySelectorAll("input[name='embedWidthMode']"));
const embedSettings = document.getElementById("embedSettings");
const slotWidthLabel = document.getElementById("slotWidthLabel");
const slotWidthInput = document.getElementById("slotWidth");
const embedLineCountInput = document.getElementById("embedLineCount");
const verticalOffsetInput = document.getElementById("verticalOffset");
const verticalOffsetValue = document.getElementById("verticalOffsetValue");
const shortcutInputs = Array.from(document.querySelectorAll(".shortcut-input"));
const resetShortcutsButton = document.getElementById("resetShortcutsButton");
const txtFileInput = document.getElementById("txtFile");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const statusEl = document.getElementById("status");
const progressSummaryEl = document.getElementById("progressSummary");
const fitSummaryEl = document.getElementById("fitSummary");
const pageStatusEl = document.getElementById("pageStatus");
const togglePageButton = document.getElementById("togglePageButton");

let activeTabId = null;
let pageAvailable = false;
let pageEnabled = true;
let statusClearTimer = null;
let shortcutMap = normalizeShortcutMap(DEFAULTS.keyboardShortcuts);

function showStatus(message, type = "success") {
  window.clearTimeout(statusClearTimer);
  statusEl.textContent = message;
  statusEl.classList.toggle("error", type === "error");
  statusClearTimer = window.setTimeout(() => {
    if (statusEl.textContent === message) {
      statusEl.textContent = "";
      statusEl.classList.remove("error");
    }
  }, 1800);
}

function showPreviewStatus() {
  window.clearTimeout(statusClearTimer);
  statusEl.textContent = "预览中，保存后固定";
  statusEl.classList.remove("error");
}

function getRadioValue(inputs, fallback) {
  return inputs.find((input) => input.checked)?.value || fallback;
}

function setRadioValue(inputs, value) {
  const selected = inputs.find((input) => input.value === value) || inputs[0];
  selected.checked = true;
}

function renderShortcutInputs() {
  shortcutInputs.forEach((input) => {
    input.value = shortcutToText(shortcutMap[input.dataset.shortcutAction]);
  });
}

function getFormSettings() {
  return normalizeSettings({
    novelText: novelTextInput.value,
    pageSize: pageSizeInput.value,
    separator: separatorInput.value,
    offset: offsetInput.value,
    readMode: getRadioValue(readModeInputs, DEFAULTS.readMode),
    embedWidthMode: getRadioValue(embedWidthModeInputs, DEFAULTS.embedWidthMode),
    slotWidth: slotWidthInput.value,
    embedLineCount: embedLineCountInput.value,
    verticalOffset: verticalOffsetInput.value,
    keyboardShortcuts: shortcutMap
  });
}

function applySettingsToForm(settings) {
  novelTextInput.value = settings.novelText || "";
  pageSizeInput.value = settings.pageSize;
  separatorInput.value = settings.separator ?? DEFAULTS.separator;
  offsetInput.value = settings.offset;
  setRadioValue(readModeInputs, settings.readMode);
  setRadioValue(embedWidthModeInputs, settings.embedWidthMode);
  slotWidthInput.value = settings.slotWidth;
  embedLineCountInput.value = settings.embedLineCount;
  verticalOffsetInput.value = settings.verticalOffset;
  verticalOffsetValue.textContent = `${Number(settings.verticalOffset).toFixed(2)}em`;
  shortcutMap = normalizeShortcutMap(settings.keyboardShortcuts);
  renderShortcutInputs();
  updateProgressSummary();
  updateDisplaySettingsUi();
}

function updateProgressSummary() {
  progressSummaryEl.textContent = buildProgressSummary(getFormSettings());
}

function updateFitSummary(readingStatus) {
  fitSummaryEl.textContent = buildReadingStatusText(readingStatus);
}

function updateDisplaySettingsUi() {
  const settings = getFormSettings();
  const embedded = settings.readMode === "embedded";
  pageSizeField.classList.toggle("is-hidden", embedded);
  embedSettings.classList.toggle("is-hidden", !embedded);
  slotWidthLabel.textContent = settings.embedWidthMode === "auto" ? "最大槽宽 px" : "槽宽 px";
}

function updatePageStatusUi() {
  pageStatusEl.textContent = getPageStatusText(pageAvailable, pageEnabled);
  togglePageButton.textContent = getPageToggleText(pageAvailable, pageEnabled);
  togglePageButton.disabled = !pageAvailable;
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function sendPageMessage(message) {
  if (!activeTabId) {
    return { ok: false, reason: "no-active-tab" };
  }

  try {
    return await chrome.tabs.sendMessage(activeTabId, {
      type: "intext-reader-command",
      ...message
    });
  } catch (error) {
    return { ok: false, reason: "send-failed", message: error?.message || String(error) };
  }
}

async function loadPageStatus() {
  activeTabId = await getActiveTabId();
  const response = await sendPageMessage({ action: "get-status" });
  pageAvailable = Boolean(response?.ok);
  pageEnabled = response?.pageEnabled !== false;
  updatePageStatusUi();
  updateFitSummary(response?.readingStatus);
}

async function loadSettings() {
  const settings = normalizeSettings(await chrome.storage.local.get(DEFAULTS));
  applySettingsToForm(settings);
}

async function persistSettings(settings, successMessage = "已保存") {
  try {
    await chrome.storage.local.set(settings);
    applySettingsToForm(settings);
    showStatus(successMessage);
    return true;
  } catch (error) {
    showStatus(getSaveErrorMessage(error), "error");
    return false;
  }
}

async function saveSettings() {
  const settings = getFormSettings();
  const conflict = getShortcutConflict(settings.keyboardShortcuts);
  if (conflict) {
    showStatus(`快捷键冲突：${ACTION_LABELS[conflict.firstAction]} 和 ${ACTION_LABELS[conflict.secondAction]} 都是 ${conflict.shortcutText}`, "error");
    return;
  }

  await persistSettings(settings);
}

async function clearText() {
  const settings = getFormSettings();
  if (settings.novelText && !window.confirm("清除后会删除当前文本并将阅读位置重置为 0，是否继续？")) {
    return;
  }

  const clearedSettings = buildClearedSettings(settings);
  const saved = await persistSettings(clearedSettings, "已清除文本");
  if (saved) {
    const response = await sendPageMessage({ action: "restore" });
    updateFitSummary(response?.readingStatus);
  }
}

async function importTextFile(file) {
  const currentSettings = getFormSettings();
  if (
    currentSettings.novelText &&
    !window.confirm("导入新文本会覆盖当前文本并将阅读位置重置为 0，是否继续？")
  ) {
    txtFileInput.value = "";
    return;
  }

  const text = await file.text();
  const nextSettings = buildReplacementSettings(text, currentSettings);
  const saved = await persistSettings(nextSettings, "已导入并重置进度");
  if (saved) {
    const response = await sendPageMessage({ action: "restore" });
    updateFitSummary(response?.readingStatus);
    updateProgressSummary();
  }
}

async function previewVerticalOffset() {
  verticalOffsetValue.textContent = `${Number(verticalOffsetInput.value).toFixed(2)}em`;
  const response = await sendPageMessage({
    action: "preview-vertical-offset",
    verticalOffset: verticalOffsetInput.value
  });

  if (response?.readingStatus) {
    updateFitSummary(response.readingStatus);
  }

  if (response?.ok && response.previewed) {
    showPreviewStatus();
  }
}

async function previewDisplayMode() {
  updateProgressSummary();
  updateDisplaySettingsUi();
  const settings = getFormSettings();
  const response = await sendPageMessage({
    action: "preview-display-mode",
    readMode: settings.readMode,
    embedWidthMode: settings.embedWidthMode,
    slotWidth: settings.slotWidth,
    embedLineCount: settings.embedLineCount,
    verticalOffset: settings.verticalOffset
  });

  if (response?.readingStatus) {
    updateFitSummary(response.readingStatus);
  }

  if (response?.ok && response.previewed) {
    showPreviewStatus();
  }
}

function captureShortcut(input, event) {
  event.preventDefault();
  event.stopPropagation();
  const shortcut = eventToShortcut(event);
  if (!shortcut) {
    showStatus("快捷键需要包含 Alt、Ctrl 或 Shift", "error");
    return;
  }

  shortcutMap = normalizeShortcutMap({
    ...shortcutMap,
    [input.dataset.shortcutAction]: shortcut
  });
  renderShortcutInputs();
  showStatus("快捷键已设置，保存后生效");
}

txtFileInput.addEventListener("change", async () => {
  const [file] = txtFileInput.files;
  if (!file) {
    return;
  }

  await importTextFile(file);
  txtFileInput.value = "";
});

saveButton.addEventListener("click", saveSettings);
clearButton.addEventListener("click", clearText);
resetShortcutsButton.addEventListener("click", () => {
  shortcutMap = normalizeShortcutMap(DEFAULT_SHORTCUTS);
  renderShortcutInputs();
  showStatus("已恢复默认快捷键，保存后生效");
});
shortcutInputs.forEach((input) => {
  input.addEventListener("keydown", (event) => captureShortcut(input, event));
  input.addEventListener("focus", () => input.select());
});
togglePageButton.addEventListener("click", async () => {
  const nextEnabled = !pageEnabled;
  const response = await sendPageMessage({ action: "set-enabled", enabled: nextEnabled });
  if (!response?.ok) {
    pageAvailable = false;
  } else {
    pageAvailable = true;
    pageEnabled = response.pageEnabled !== false;
    updateFitSummary(response.readingStatus);
    showStatus(pageEnabled ? "当前页面已启用" : "当前页面已暂停");
  }

  updatePageStatusUi();
});
novelTextInput.addEventListener("input", updateProgressSummary);
pageSizeInput.addEventListener("input", updateProgressSummary);
offsetInput.addEventListener("input", updateProgressSummary);
readModeInputs.forEach((input) => input.addEventListener("change", previewDisplayMode));
embedWidthModeInputs.forEach((input) => input.addEventListener("change", previewDisplayMode));
slotWidthInput.addEventListener("input", previewDisplayMode);
embedLineCountInput.addEventListener("input", previewDisplayMode);
verticalOffsetInput.addEventListener("input", previewVerticalOffset);

loadSettings();
loadPageStatus();



