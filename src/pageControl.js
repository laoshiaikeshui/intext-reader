(function attachPageControlHelpers(root) {
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

  function getPageStatusText(available, enabled) {
    if (!available) {
      return "当前页面：不可用";
    }

    return enabled ? "当前页面：已启用" : "当前页面：已暂停";
  }

  function getPageToggleText(available, enabled) {
    if (!available) {
      return "当前页面不可用";
    }

    return enabled ? "暂停当前页面" : "启用当前页面";
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

