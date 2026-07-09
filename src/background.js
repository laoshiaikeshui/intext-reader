importScripts("backgroundCommands.js");

const COMMAND_TO_ACTION = {
  "intext-insert": "insert",
  "intext-previous": "previous",
  "intext-next": "next",
  "intext-restore": "restore",
  "intext-hide": "hide"
};

const { sendActionToActiveTab } = globalThis.IntextReaderBackground;

chrome.commands.onCommand.addListener(async (command) => {
  const action = COMMAND_TO_ACTION[command];
  if (!action) {
    return;
  }

  await sendActionToActiveTab(chrome, action);
});


