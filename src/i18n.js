(function attachI18n(root) {
  const DEFAULT_LANGUAGE_PREFERENCE = "auto";
  const SUPPORTED_LANGUAGES = new Set(["zh", "en"]);

  const MESSAGES = {
    zh: {
      headerDescription: "保存文本后，在网页中选中文字并使用快捷键插入。",
      pageStatusDetecting: "当前页面：检测中",
      detecting: "检测中",
      novelText: "小说文本",
      novelPlaceholder: "在这里粘贴 txt 文本",
      importTxt: "导入 txt",
      chooseTxt: "选择 TXT",
      noFileSelected: "未选择文件",
      importEpub: "导入 EPUB",
      chooseEpub: "打开 EPUB 导入页",
      epubImportTitle: "导入 EPUB",
      epubImportDescription: "在本地解析书籍，并继续使用现有嵌入阅读方式。",
      chooseEpubFile: "选择 EPUB 文件",
      epubAuthor: "作者",
      epubChapterCount: "章节",
      epubCharacterCount: "字符",
      epubIllustrationCount: "插图",
      importAndReplace: "导入并替换当前文本",
      epubLocalOnly: "文件仅在本机浏览器内解析和保存，不会上传。",
      epubUntitled: "未命名书籍",
      epubUnknownAuthor: "未知作者",
      epubWarnings: "解析完成，但跳过或修正了 {count} 项不兼容内容。",
      epubParsing: "正在解析 EPUB…",
      epubReady: "解析完成，可以导入",
      epubParseFailed: "解析失败",
      epubReplaceConfirm: "导入 EPUB 会替换当前文本并将阅读位置重置为 0，是否继续？",
      epubSaving: "正在保存书籍和插图…",
      epubImported: "已导入《{title}》：{chapters}章，{chars}字，{images}张插图；进度已重置。",
      epubImportFailed: "EPUB 导入失败：{message}",
      currentChapter: "当前章节",
      chapterUnknown: "未知章节",
      epubBookInfo: "《{title}》 · {author}",
      epubProgressSummary: "《{title}》 | {chapter} | {progress}",
      chapterJumped: "已跳转到：{chapter}",
      showEpubIllustrations: "显示 EPUB 插图悬浮球",
      epubIllustrationsEnabled: "已显示 EPUB 插图悬浮球",
      epubIllustrationsDisabled: "已隐藏 EPUB 插图悬浮球",
      epubRangeImages: " | 本段插图：{count}",
      illustrationLoading: "正在加载插图…",
      illustrationLoadFailed: "无法读取插图",
      error_EPUB_CONTAINER_MISSING: "无效 EPUB：缺少 container.xml。",
      error_EPUB_PACKAGE_MISSING: "无效 EPUB：找不到书籍清单。",
      error_EPUB_SPINE_EMPTY: "EPUB 没有可读取的正文顺序。",
      error_EPUB_TEXT_EMPTY: "EPUB 中没有可提取的正文。",
      error_EPUB_FIXED_LAYOUT_UNSUPPORTED: "暂不支持仅固定版式的 EPUB。",
      error_EPUB_DRM_UNSUPPORTED: "不支持带 DRM 的 EPUB。",
      error_EPUB_ARCHIVE_INVALID: "文件不是有效的 EPUB/ZIP。",
      error_EPUB_ARCHIVE_PATH_UNSAFE: "EPUB 包含不安全的文件路径。",
      error_EPUB_ARCHIVE_TOO_MANY_ENTRIES: "EPUB 内文件数量异常，已停止解析。",
      error_EPUB_ARCHIVE_ENTRY_TOO_LARGE: "EPUB 内单个文件过大，已停止解析。",
      error_EPUB_ARCHIVE_TOO_LARGE: "EPUB 解压后体积过大，已停止解析。",
      error_EPUB_FILE_TOO_LARGE: "EPUB 文件超过 256 MB，已停止解析。",
      charsPerPage: "每页字数",
      separator: "分隔符",
      currentPosition: "当前位置",
      displaySettings: "显示设置",
      readingMode: "阅读模式",
      plainInsertion: "普通插入",
      embeddedReading: "嵌入阅读",
      embedMethod: "嵌入方式",
      fixedWidth: "固定宽度",
      autoFit: "自动贴合",
      maxDisplayWidth: "最大显示宽度（px）",
      displayWidth: "显示宽度（px）",
      displayLines: "显示行数",
      textVerticalPosition: "文字上下位置",
      shortcutSettings: "快捷键设置",
      shortcuts: "快捷键",
      actionInsert: "插入",
      actionPrevious: "上一页",
      actionNext: "下一页",
      actionRestore: "恢复/移除",
      actionHide: "一键隐藏",
      resetShortcuts: "恢复默认快捷键",
      saveSettings: "保存设置",
      clearText: "清除文本",
      previewPending: "预览中，保存后固定",
      pageUnavailable: "当前页面：不可用",
      pageEnabled: "当前页面：已启用",
      pagePaused: "当前页面：已暂停",
      pageToggleUnavailable: "当前页面不可用",
      pagePause: "暂停当前页面",
      pageEnable: "启用当前页面",
      saved: "已保存",
      saveQuotaError: "保存失败：文本太大或浏览器存储空间不足",
      saveError: "保存失败：{message}",
      shortcutConflict: "快捷键冲突：{first} 和 {second} 都是 {shortcut}",
      clearConfirm: "清除后会删除当前文本并将阅读位置重置为 0，是否继续？",
      textCleared: "已清除文本",
      importConfirm: "导入新文本会覆盖当前文本并将阅读位置重置为 0，是否继续？",
      importedReset: "已导入并重置进度",
      shortcutModifierRequired: "快捷键需要包含 Alt、Ctrl 或 Shift",
      shortcutSaved: "快捷键已设置，保存后生效",
      shortcutsReset: "已恢复默认快捷键，保存后生效",
      languageSaved: "界面语言已切换",
      progressSummary: "总字数：{total} | 当前位置：{offset} | 进度：{percent}%",
      fitNotInserted: "本页显示：未插入",
      fitPlain: "本页显示：{chars}字",
      fitEmbedded: "本页显示：{chars}字{lines}{width}",
      lineCount: "，{count}行",
      widthFixed: "，显示宽度{width}px",
      widthAuto: "，实际宽度{width}px，上限{max}px",
      widthTooSmall: "当前宽度过小，无法完整显示文字",
      saveNovelFirst: "先在插件弹窗中保存小说文本",
      reachedTextEnd: "已经到达文本末尾",
      selectPageText: "先选中网页中的一段文字",
      inserted: "已插入",
      nextPage: "下一页",
      previousPage: "上一页",
      insertSummary: "{prefix} {chars} 字{lines}{width}",
      insertionUnsupported: "当前页面不支持在此处插入",
      positionSaved: "位置已保存：{offset}",
      noInsertedContent: "当前没有插入内容",
      restored: "已恢复",
      versionLabel: "版本：v{version}",
      disclaimer: "仅供本地个人阅读使用，请遵守网站规则及适用法律。"
    },
    en: {
      headerDescription: "Save text, select words on a webpage, then use a shortcut to insert it.",
      pageStatusDetecting: "Current page: Detecting",
      detecting: "Detecting",
      novelText: "Reading text",
      novelPlaceholder: "Paste TXT content here",
      importTxt: "Import TXT",
      chooseTxt: "Choose TXT",
      noFileSelected: "No file selected",
      importEpub: "Import EPUB",
      chooseEpub: "Open EPUB importer",
      epubImportTitle: "Import EPUB",
      epubImportDescription: "Parse a local book and keep using the existing embedded reading modes.",
      chooseEpubFile: "Choose EPUB file",
      epubAuthor: "Author",
      epubChapterCount: "Chapters",
      epubCharacterCount: "Characters",
      epubIllustrationCount: "Illustrations",
      importAndReplace: "Import and replace current text",
      epubLocalOnly: "The file is parsed and stored only in this browser. It is never uploaded.",
      epubUntitled: "Untitled book",
      epubUnknownAuthor: "Unknown author",
      epubWarnings: "Parsed with {count} incompatible items skipped or corrected.",
      epubParsing: "Parsing EPUB…",
      epubReady: "Parsing complete; ready to import",
      epubParseFailed: "Parsing failed",
      epubReplaceConfirm: "Importing this EPUB replaces the current text and resets progress to 0. Continue?",
      epubSaving: "Saving book and illustrations…",
      epubImported: "Imported “{title}”: {chapters} chapters, {chars} characters, {images} illustrations; progress reset.",
      epubImportFailed: "EPUB import failed: {message}",
      currentChapter: "Current chapter",
      chapterUnknown: "Unknown chapter",
      epubBookInfo: "“{title}” · {author}",
      epubProgressSummary: "“{title}” | {chapter} | {progress}",
      chapterJumped: "Jumped to: {chapter}",
      showEpubIllustrations: "Show EPUB illustration button",
      epubIllustrationsEnabled: "EPUB illustration button shown",
      epubIllustrationsDisabled: "EPUB illustration button hidden",
      epubRangeImages: " | Range illustrations: {count}",
      illustrationLoading: "Loading illustration…",
      illustrationLoadFailed: "Unable to load illustration",
      error_EPUB_CONTAINER_MISSING: "Invalid EPUB: container.xml is missing.",
      error_EPUB_PACKAGE_MISSING: "Invalid EPUB: the package document is missing.",
      error_EPUB_SPINE_EMPTY: "The EPUB has no readable spine.",
      error_EPUB_TEXT_EMPTY: "No readable text was found in this EPUB.",
      error_EPUB_FIXED_LAYOUT_UNSUPPORTED: "Fixed-layout-only EPUB files are not supported.",
      error_EPUB_DRM_UNSUPPORTED: "DRM-protected EPUB files are not supported.",
      error_EPUB_ARCHIVE_INVALID: "The file is not a valid EPUB/ZIP archive.",
      error_EPUB_ARCHIVE_PATH_UNSAFE: "The EPUB contains an unsafe file path.",
      error_EPUB_ARCHIVE_TOO_MANY_ENTRIES: "The EPUB contains an abnormal number of files.",
      error_EPUB_ARCHIVE_ENTRY_TOO_LARGE: "A file inside the EPUB is too large.",
      error_EPUB_ARCHIVE_TOO_LARGE: "The expanded EPUB is too large.",
      error_EPUB_FILE_TOO_LARGE: "The EPUB file exceeds the 256 MB import limit.",
      charsPerPage: "Characters per page",
      separator: "Separator",
      currentPosition: "Current position",
      displaySettings: "Display settings",
      readingMode: "Reading mode",
      plainInsertion: "Plain insertion",
      embeddedReading: "Embedded reading",
      embedMethod: "Embedding method",
      fixedWidth: "Fixed width",
      autoFit: "Auto fit",
      maxDisplayWidth: "Maximum display width (px)",
      displayWidth: "Display width (px)",
      displayLines: "Display lines",
      textVerticalPosition: "Vertical text position",
      shortcutSettings: "Shortcut settings",
      shortcuts: "Shortcuts",
      actionInsert: "Insert",
      actionPrevious: "Previous page",
      actionNext: "Next page",
      actionRestore: "Restore / remove",
      actionHide: "Quick hide",
      resetShortcuts: "Reset shortcuts",
      saveSettings: "Save settings",
      clearText: "Clear text",
      previewPending: "Previewing; save to keep this setting",
      pageUnavailable: "Current page: Unavailable",
      pageEnabled: "Current page: Enabled",
      pagePaused: "Current page: Paused",
      pageToggleUnavailable: "Unavailable on this page",
      pagePause: "Pause on this page",
      pageEnable: "Enable on this page",
      saved: "Saved",
      saveQuotaError: "Save failed: the text is too large or browser storage is full",
      saveError: "Save failed: {message}",
      shortcutConflict: "Shortcut conflict: {first} and {second} both use {shortcut}",
      clearConfirm: "This will delete the current text and reset the reading position to 0. Continue?",
      textCleared: "Text cleared",
      importConfirm: "Importing new text will replace the current text and reset the reading position to 0. Continue?",
      importedReset: "Imported and progress reset",
      shortcutModifierRequired: "A shortcut must include Alt, Ctrl, or Shift",
      shortcutSaved: "Shortcut set; save to apply",
      shortcutsReset: "Default shortcuts restored; save to apply",
      languageSaved: "Interface language changed",
      progressSummary: "Total: {total} | Position: {offset} | Progress: {percent}%",
      fitNotInserted: "Displayed: Not inserted",
      fitPlain: "Displayed: {chars} chars",
      fitEmbedded: "Displayed: {chars} chars{lines}{width}",
      lineCount: ", {count} lines",
      widthFixed: ", width {width}px",
      widthAuto: ", actual width {width}px, limit {max}px",
      widthTooSmall: "The current width is too small to display text completely",
      saveNovelFirst: "Save reading text in the extension popup first",
      reachedTextEnd: "End of text reached",
      selectPageText: "Select some text on the webpage first",
      inserted: "Inserted",
      nextPage: "Next page",
      previousPage: "Previous page",
      insertSummary: "{prefix}: {chars} chars{lines}{width}",
      insertionUnsupported: "This page does not support insertion here",
      positionSaved: "Position saved: {offset}",
      noInsertedContent: "There is no inserted content",
      restored: "Restored",
      versionLabel: "Version: v{version}",
      disclaimer: "Personal local use only. Follow site rules and applicable laws."
    }
  };

  function normalizeLanguagePreference(value) {
    const language = String(value || "").toLowerCase();
    return SUPPORTED_LANGUAGES.has(language) ? language : DEFAULT_LANGUAGE_PREFERENCE;
  }

  function resolveLanguage(preference, browserLanguage = "") {
    const normalized = normalizeLanguagePreference(preference);
    if (normalized !== DEFAULT_LANGUAGE_PREFERENCE) {
      return normalized;
    }

    return String(browserLanguage).toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function translate(key, language = "en", params = {}) {
    const resolvedLanguage = SUPPORTED_LANGUAGES.has(language) ? language : "en";
    const template = MESSAGES[resolvedLanguage][key] ?? MESSAGES.en[key] ?? key;
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
    });
  }

  function getMissingTranslationKeys() {
    const keys = new Set([...Object.keys(MESSAGES.zh), ...Object.keys(MESSAGES.en)]);
    return Array.from(keys).filter((key) => !MESSAGES.zh[key] || !MESSAGES.en[key]);
  }

  function applyTranslations(documentRoot, language) {
    documentRoot.documentElement?.setAttribute("lang", language === "zh" ? "zh-CN" : "en");
    documentRoot.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n, language);
    });
    documentRoot.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder, language));
    });
    documentRoot.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel, language));
    });
  }

  const api = {
    DEFAULT_LANGUAGE_PREFERENCE,
    MESSAGES,
    applyTranslations,
    getMissingTranslationKeys,
    normalizeLanguagePreference,
    resolveLanguage,
    translate
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
