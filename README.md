# Intext Reader

Intext Reader is a local Chrome extension that embeds private reading text into selected webpage text. It supports fixed-count inline insertion, width-fitted embedded reading slots, custom shortcuts, and a quick-hide action.

## Features

- Paste text directly or import a `.txt` file from the popup.
- Store imported text locally in `chrome.storage.local`.
- Insert reading text after selected webpage text without replacing the original selection.
- Choose between two reading modes:
  - Plain insertion: inserts a fixed number of characters.
  - Embedded reading: fits as many characters as possible into a width-limited inline slot.
- Configure separator text, reading offset, slot width, embedded line count, and vertical alignment.
- Use fixed-width or auto-fit embedded slots.
- Customize shortcuts for insert, previous, next, restore, and quick hide.
- Pause or enable the current page from the popup.
- Quickly hide inserted text by scrolling the nearest scrollable container.
- Automatically remove inserted text after it leaves the visible area.

## Default Shortcuts

- `Alt+I`: insert text after the current selection.
- `Alt+J`: previous page.
- `Alt+K`: next page.
- `Alt+R`: restore/remove inserted text.
- `Alt+H`: quick hide.

The popup lets you customize these shortcuts. At least one modifier key (`Alt`, `Ctrl`, or `Shift`) is required.

## Installation

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome or a Chromium-based browser.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select the extension folder that contains `manifest.json`.

For release zip files, unzip the archive first and select the unzipped folder.

## Usage

1. Open the extension popup.
2. Paste text or import a `.txt` file.
3. Choose plain insertion or embedded reading.
4. Save settings.
5. Select text on a normal webpage.
6. Use the insert shortcut.
7. Use previous/next shortcuts to continue reading.
8. Use restore or quick hide when needed.

## Privacy

Intext Reader is local-only:

- Imported text is stored in `chrome.storage.local`.
- The extension does not upload imported text to any server.
- The extension does not include analytics or remote scripts.

## Known Limitations

- The extension does not work on pages that block content scripts, such as `chrome://` pages and the Chrome Web Store.
- Complex web apps may re-render page content and remove inserted nodes.
- Embedded reading prioritizes stable visual width over fixed character count.
- Plain insertion prioritizes fixed character count over stable visual width.
- EPUB parsing, bookshelf management, sync, and per-site profiles are not included in v1.0.0.

## Development

Run the JavaScript tests with Node.js:

```powershell
node tests/backgroundCommands.test.js
node tests/displayMode.test.js
node tests/interactionPolicy.test.js
node tests/pageControl.test.js
node tests/popupState.test.js
node tests/readingText.test.js
node tests/shortcuts.test.js
node tests/textFitting.test.js
```

Run syntax checks:

```powershell
node --check src/content.js
node --check src/popup.js
```

## License

MIT License. See [LICENSE](LICENSE).
