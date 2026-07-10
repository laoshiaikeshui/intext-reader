# Intext Reader

[English](#english) | [中文](#中文)

## English

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
- Switch the popup and webpage notices between Chinese and English.
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
- EPUB parsing, bookshelf management, sync, and per-site profiles are not included.

## Development

Run the JavaScript tests with Node.js:

```powershell
node tests/backgroundCommands.test.js
node tests/displayMode.test.js
node tests/i18n.test.js
node tests/interactionPolicy.test.js
node tests/pageControl.test.js
node tests/popupState.test.js
node tests/readingText.test.js
node tests/releaseAssets.test.js
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

## 中文

Intext Reader 是一款本地运行的 Chrome 扩展，可以把阅读文本插入到网页中选中文字的后方。它支持固定字数的普通插入、按宽度自动容纳文字的嵌入阅读、自定义快捷键和一键隐藏。

### 功能

- 在弹窗中直接粘贴文本或导入 `.txt` 文件。
- 阅读文本仅保存在本地 `chrome.storage.local`。
- 在选中文字后插入内容，不替换原网页文字。
- 普通插入按设置的字数翻页。
- 嵌入阅读根据显示宽度和行数自动决定每页字数。
- 支持固定宽度和自动贴合两种嵌入方式。
- 可设置分隔符、阅读位置、最大显示宽度、显示行数和文字上下位置。
- 支持中文和英文界面即时切换。
- 可自定义插入、上一页、下一页、恢复和一键隐藏快捷键。
- 插入内容离开可视区域后自动恢复网页原状。

### 默认快捷键

- `Alt+I`：在当前选中文字后插入阅读内容。
- `Alt+J`：上一页。
- `Alt+K`：下一页。
- `Alt+R`：恢复或移除插入内容。
- `Alt+H`：一键隐藏。

弹窗中可以修改这些快捷键。快捷键必须包含至少一个 `Alt`、`Ctrl` 或 `Shift` 修饰键。

### 安装

1. 下载或克隆本仓库。
2. 在 Chrome 或 Chromium 浏览器中打开 `chrome://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择包含 `manifest.json` 的扩展文件夹。

如果下载的是 Release 压缩包，请先解压，再选择解压后的文件夹。

### 使用

1. 打开扩展弹窗。
2. 粘贴文本或导入 `.txt` 文件。
3. 选择普通插入或嵌入阅读。
4. 保存设置。
5. 在普通网页中选中一段文字。
6. 使用插入快捷键开始阅读。
7. 使用上一页和下一页快捷键继续阅读。
8. 需要时使用恢复或一键隐藏。

### 隐私

- 导入文本只保存在浏览器本地。
- 扩展不会把文本上传到服务器。
- 扩展不包含统计分析或远程脚本。

### 已知限制

- 无法在 `chrome://` 页面、Chrome 应用商店等禁止内容脚本的页面运行。
- 复杂网页应用重新渲染内容时，可能移除已插入的节点。
- 嵌入阅读优先保持显示宽度，不保证固定字数。
- 普通插入优先保持固定字数，不保证固定显示宽度。
- 当前不包含 EPUB 解析、书架、同步和按网站保存独立配置。

### 许可证

采用 MIT License，详见 [LICENSE](LICENSE)。
