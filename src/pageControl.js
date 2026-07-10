(function attachPageControlHelpers(root) {
  const { translate } = root.IntextReaderI18n || require("./i18n.js");
  const PAGE_ACTIONS = new Set(["insert", "previous", "next", "restore", "hide"]);
  const CONTROL_ACTIONS = new Set(["get-status", "set-enabled"]);

  function canRunPageAction(pageEnabled, action) {
    if (CONTROL_ACTIONS.has(action)) {
      return true;
    }

    if (PAGE_ACTIONS.has(action)) {
      return Boolean(pageEnabled);
    }

    return false;
  }

  function getPageStatusText(available, enabled, language = "zh") {
    if (!available) {
      return translate("pageUnavailable", language);
    }

    return translate(enabled ? "pageEnabled" : "pagePaused", language);
  }

  function getPageToggleText(available, enabled, language = "zh") {
    if (!available) {
      return translate("pageToggleUnavailable", language);
    }

    return translate(enabled ? "pagePause" : "pageEnable", language);
  }

  const api = {
    canRunPageAction,
    getPageStatusText,
    getPageToggleText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderPageControl = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

