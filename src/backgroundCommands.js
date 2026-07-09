(function attachBackgroundCommandHelpers(root) {
  async function sendActionToActiveTab(chromeApi, action) {
    const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return { ok: false, reason: "no-active-tab" };
    }

    try {
      await chromeApi.tabs.sendMessage(tab.id, {
        type: "intext-reader-command",
        action
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason: "send-failed",
        message: error?.message || String(error)
      };
    }
  }

  const api = { sendActionToActiveTab };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.IntextReaderBackground = api;
})(typeof globalThis !== "undefined" ? globalThis : self);

