const assert = require("node:assert/strict");
const { sendActionToActiveTab } = require("../src/backgroundCommands.js");

(async () => {
  const sentMessages = [];
  const okChrome = {
    tabs: {
      query: async () => [{ id: 7 }],
      sendMessage: async (tabId, message) => {
        sentMessages.push({ tabId, message });
      }
    }
  };

  const okResult = await sendActionToActiveTab(okChrome, "insert");
  assert.deepEqual(okResult, { ok: true });
  assert.deepEqual(sentMessages, [
    {
      tabId: 7,
      message: { type: "intext-reader-command", action: "insert" }
    }
  ]);

  const blockedChrome = {
    tabs: {
      query: async () => [{ id: 9 }],
      sendMessage: async () => {
        throw new Error("Receiving end does not exist.");
      }
    }
  };

  const blockedResult = await sendActionToActiveTab(blockedChrome, "next");
  assert.equal(blockedResult.ok, false);
  assert.equal(blockedResult.reason, "send-failed");
  assert.match(blockedResult.message, /Receiving end/);
})();

