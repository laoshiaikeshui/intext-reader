importScripts("backgroundCommands.js", "imageStore.js");

const COMMAND_TO_ACTION = {
  "intext-insert": "insert",
  "intext-previous": "previous",
  "intext-next": "next",
  "intext-restore": "restore",
  "intext-hide": "hide"
};

const { sendActionToActiveTab } = globalThis.IntextReaderBackground;
const {
  createImageRepository,
  createIndexedDbAdapter,
  handleImageMessage
} = globalThis.IntextReaderImageStore;
const imageRepository = createImageRepository(createIndexedDbAdapter());

chrome.commands.onCommand.addListener(async (command) => {
  const action = COMMAND_TO_ACTION[command];
  if (!action) {
    return;
  }

  await sendActionToActiveTab(chrome, action);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "intext-reader-image") {
    return;
  }
  handleImageMessage(message, imageRepository)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, reason: "image-storage-error", message: error?.message || String(error) }));
  return true;
});


