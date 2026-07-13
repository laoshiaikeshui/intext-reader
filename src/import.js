const { applyTranslations, resolveLanguage, translate } = globalThis.IntextReaderI18n;
const { extractEpubArchive } = globalThis.IntextReaderEpubArchive;
const { parseEpubFiles } = globalThis.IntextReaderEpubParser;
const { buildEpubBook } = globalThis.IntextReaderBookState;
const { createImageRepository, createIndexedDbAdapter } = globalThis.IntextReaderImageStore;
const { createImportController, resolveImportErrorTranslationKey } = globalThis.IntextReaderImportController;

const fileInput = document.getElementById("epubFile");
const chooseEpubFileButton = document.getElementById("chooseEpubFileButton");
const fileName = document.getElementById("fileName");
const progressSection = document.getElementById("progressSection");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const previewSection = document.getElementById("previewSection");
const bookTitle = document.getElementById("bookTitle");
const coverPreview = document.getElementById("coverPreview");
const bookAuthor = document.getElementById("bookAuthor");
const chapterCount = document.getElementById("chapterCount");
const characterCount = document.getElementById("characterCount");
const illustrationCount = document.getElementById("illustrationCount");
const warningText = document.getElementById("warningText");
const importButton = document.getElementById("importButton");
const status = document.getElementById("status");

let language = "en";
let parsedBook = null;
let coverUrl = "";
const sourceTabId = Number(new URLSearchParams(location.search).get("sourceTabId")) || null;
const repository = createImageRepository(createIndexedDbAdapter());

function tr(key, params) {
  return translate(key, language, params);
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function errorText(error) {
  return tr(resolveImportErrorTranslationKey(error?.code), {
    message: error?.message || String(error)
  });
}

async function restoreSourcePage() {
  if (!sourceTabId) return;
  try {
    await chrome.tabs.sendMessage(sourceTabId, { type: "intext-reader-command", action: "restore" });
  } catch (error) {
    // The source tab may have closed; the stored book is still valid.
  }
}

const controller = createImportController({
  extractArchive: extractEpubArchive,
  parseEpubFiles,
  repository,
  storage: {
    get: () => chrome.storage.local.get(null),
    set: (values) => chrome.storage.local.set(values)
  },
  buildEpubBook,
  generateId: () => crypto.randomUUID?.() || `book-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  restoreActivePage: restoreSourcePage
});

chooseEpubFileButton.addEventListener("click", () => fileInput.click());

function renderPreview(parsed) {
  if (coverUrl) URL.revokeObjectURL(coverUrl);
  coverUrl = parsed.cover
    ? URL.createObjectURL(new Blob([parsed.cover.bytes], { type: parsed.cover.mediaType }))
    : "";
  coverPreview.classList.toggle("is-hidden", !coverUrl);
  if (coverUrl) coverPreview.src = coverUrl;
  else coverPreview.removeAttribute("src");
  bookTitle.textContent = parsed.metadata.title || tr("epubUntitled");
  bookAuthor.textContent = parsed.metadata.author || tr("epubUnknownAuthor");
  chapterCount.textContent = parsed.chapters.length.toLocaleString();
  characterCount.textContent = parsed.novelText.length.toLocaleString();
  illustrationCount.textContent = parsed.images.length.toLocaleString();
  warningText.textContent = parsed.warnings.length
    ? tr("epubWarnings", { count: parsed.warnings.length })
    : "";
  warningText.classList.toggle("is-hidden", parsed.warnings.length === 0);
  previewSection.classList.remove("is-hidden");
}

fileInput.addEventListener("change", async () => {
  const [file] = fileInput.files;
  if (!file) return;
  fileName.textContent = file.name;
  previewSection.classList.add("is-hidden");
  progressSection.classList.remove("is-hidden");
  progress.value = 1;
  progressText.textContent = tr("epubParsing");
  setStatus("");
  parsedBook = null;
  try {
    const result = await controller.parseFile(file);
    parsedBook = result.parsed;
    progress.value = 3;
    progressText.textContent = tr("epubReady");
    renderPreview(parsedBook);
  } catch (error) {
    progress.value = 0;
    progressText.textContent = tr("epubParseFailed");
    setStatus(errorText(error), true);
  } finally {
    fileInput.value = "";
  }
});

importButton.addEventListener("click", async () => {
  if (!parsedBook) return;
  const current = await chrome.storage.local.get({ novelText: "" });
  if (current.novelText && !window.confirm(tr("epubReplaceConfirm"))) return;
  importButton.disabled = true;
  let imported = false;
  setStatus(tr("epubSaving"));
  try {
    const result = await controller.commit(parsedBook);
    setStatus(tr("epubImported", {
      title: result.book.bookTitle || tr("epubUntitled"),
      chapters: result.book.chapters.length,
      chars: result.book.novelText.length,
      images: result.book.imageAnchors.length
    }));
    parsedBook = null;
    imported = true;
  } catch (error) {
    setStatus(errorText(error), true);
  } finally {
    importButton.disabled = imported;
  }
});

chrome.storage.local.get({ uiLanguage: "auto" }).then(({ uiLanguage }) => {
  language = resolveLanguage(uiLanguage, navigator.language);
  applyTranslations(document, language);
});

window.addEventListener("pagehide", () => {
  if (coverUrl) URL.revokeObjectURL(coverUrl);
});
