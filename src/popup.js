const {
  DEFAULT_LANGUAGE_PREFERENCE,
  applyTranslations,
  normalizeLanguagePreference,
  resolveLanguage,
  translate
} = globalThis.IntextReaderI18n;
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
  eventToShortcut,
  getActionLabel,
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
const chooseTxtButton = document.getElementById("chooseTxtButton");
const selectedFileNameEl = document.getElementById("selectedFileName");
const txtFileInput = document.getElementById("txtFile");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const statusEl = document.getElementById("status");
const progressSummaryEl = document.getElementById("progressSummary");
const fitSummaryEl = document.getElementById("fitSummary");
const pageStatusEl = document.getElementById("pageStatus");
const togglePageButton = document.getElementById("togglePageButton");
const languageButtons = Array.from(document.querySelectorAll(".language-button"));
const versionInfoEl = document.getElementById("versionInfo");
const extensionVersion = chrome.runtime.getManifest().version;

let activeTabId = null;
let pageAvailable = false;
let pageEnabled = true;
let pageStatusLoaded = false;
let statusClearTimer = null;
let shortcutMap = normalizeShortcutMap(DEFAULTS.keyboardShortcuts);
let languagePreference = DEFAULT_LANGUAGE_PREFERENCE;
let activeLanguage = resolveLanguage(languagePreference, navigator.language);
let lastReadingStatus = { inserted: false };

function tr(key, params) {
  return translate(key, activeLanguage, params);
}

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
  statusEl.textContent = tr("previewPending");
  statusEl.classList.remove("error");
}

function applyLanguagePreference(preference) {
  languagePreference = normalizeLanguagePreference(preference);
  activeLanguage = resolveLanguage(languagePreference, navigator.language);
  applyTranslations(document, activeLanguage);
  languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === activeLanguage));
  });
  versionInfoEl.textContent = tr("versionLabel", { version: extensionVersion });
  updateProgressSummary();
  updateFitSummary(lastReadingStatus);
  updateDisplaySettingsUi();
  updatePageStatusUi();
}

async function selectLanguage(language) {
  applyLanguagePreference(language);
  try {
    await chrome.storage.local.set({ uiLanguage: languagePreference });
    showStatus(tr("languageSaved"));
  } catch (error) {
    showStatus(getSaveErrorMessage(error, activeLanguage), "error");
  }
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
  progressSummaryEl.textContent = buildProgressSummary(getFormSettings(), activeLanguage);
}

function updateFitSummary(readingStatus) {
  lastReadingStatus = readingStatus || { inserted: false };
  fitSummaryEl.textContent = buildReadingStatusText(lastReadingStatus, activeLanguage);
}

function updateDisplaySettingsUi() {
  const settings = getFormSettings();
  const embedded = settings.readMode === "embedded";
  pageSizeField.classList.toggle("is-hidden", embedded);
  embedSettings.classList.toggle("is-hidden", !embedded);
  slotWidthLabel.textContent = tr(settings.embedWidthMode === "auto" ? "maxDisplayWidth" : "displayWidth");
}

function updatePageStatusUi() {
  if (!pageStatusLoaded) {
    pageStatusEl.textContent = tr("pageStatusDetecting");
    togglePageButton.textContent = tr("detecting");
    togglePageButton.disabled = true;
    return;
  }

  pageStatusEl.textContent = getPageStatusText(pageAvailable, pageEnabled, activeLanguage);
  togglePageButton.textContent = getPageToggleText(pageAvailable, pageEnabled, activeLanguage);
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
  pageStatusLoaded = true;
  updatePageStatusUi();
  updateFitSummary(response?.readingStatus);
}

async function loadSettings() {
  const storedValues = await chrome.storage.local.get({
    ...DEFAULTS,
    uiLanguage: DEFAULT_LANGUAGE_PREFERENCE
  });
  applyLanguagePreference(storedValues.uiLanguage);
  const settings = normalizeSettings(storedValues);
  applySettingsToForm(settings);
}

async function persistSettings(settings, successMessage = null) {
  try {
    await chrome.storage.local.set(settings);
    applySettingsToForm(settings);
    showStatus(successMessage || tr("saved"));
    return true;
  } catch (error) {
    showStatus(getSaveErrorMessage(error, activeLanguage), "error");
    return false;
  }
}

async function saveSettings() {
  const settings = getFormSettings();
  const conflict = getShortcutConflict(settings.keyboardShortcuts);
  if (conflict) {
    showStatus(tr("shortcutConflict", {
      first: getActionLabel(conflict.firstAction, activeLanguage),
      second: getActionLabel(conflict.secondAction, activeLanguage),
      shortcut: conflict.shortcutText
    }), "error");
    return;
  }

  await persistSettings(settings);
}

async function clearText() {
  const settings = getFormSettings();
  if (settings.novelText && !window.confirm(tr("clearConfirm"))) {
    return;
  }

  const clearedSettings = buildClearedSettings(settings);
  const saved = await persistSettings(clearedSettings, tr("textCleared"));
  if (saved) {
    const response = await sendPageMessage({ action: "restore" });
    updateFitSummary(response?.readingStatus);
  }
}

async function importTextFile(file) {
  const currentSettings = getFormSettings();
  if (
    currentSettings.novelText &&
    !window.confirm(tr("importConfirm"))
  ) {
    return;
  }

  const text = await file.text();
  const nextSettings = buildReplacementSettings(text, currentSettings);
  const saved = await persistSettings(nextSettings, tr("importedReset"));
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
    showStatus(tr("shortcutModifierRequired"), "error");
    return;
  }

  shortcutMap = normalizeShortcutMap({
    ...shortcutMap,
    [input.dataset.shortcutAction]: shortcut
  });
  renderShortcutInputs();
  showStatus(tr("shortcutSaved"));
}

txtFileInput.addEventListener("change", async () => {
  const [file] = txtFileInput.files;
  if (!file) {
    return;
  }

  selectedFileNameEl.textContent = file.name;
  try {
    await importTextFile(file);
  } finally {
    txtFileInput.value = "";
    selectedFileNameEl.textContent = tr("noFileSelected");
  }
});
chooseTxtButton.addEventListener("click", () => txtFileInput.click());

saveButton.addEventListener("click", saveSettings);
clearButton.addEventListener("click", clearText);
resetShortcutsButton.addEventListener("click", () => {
  shortcutMap = normalizeShortcutMap(DEFAULT_SHORTCUTS);
  renderShortcutInputs();
  showStatus(tr("shortcutsReset"));
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
    showStatus(tr(pageEnabled ? "pageEnabled" : "pagePaused"));
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
languageButtons.forEach((button) => {
  button.addEventListener("click", () => selectLanguage(button.dataset.language));
});

applyLanguagePreference(DEFAULT_LANGUAGE_PREFERENCE);
loadSettings();
loadPageStatus();



