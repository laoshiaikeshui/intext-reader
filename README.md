# Intext Reader

**Intext Reader** is a local Chrome extension for reading text inside ordinary webpages.  
Instead of opening a separate reader window, it inserts your imported text directly after selected webpage text, so reading can stay visually blended with the page.

**Intext Reader** 是一个本地 Chrome 扩展，用来把阅读文本嵌入普通网页正文中。  
它不会打开单独的阅读窗口，而是把你导入的文本插入到网页选中文字后方，让阅读内容尽量和当前页面排版融合在一起。

## What It Does / 它能做什么

Intext Reader focuses on a simple idea: select some text on a webpage, press a shortcut, and continue reading your own imported text in that position.

It currently supports:

- importing or pasting `.txt` text;
- inserting text after selected webpage text;
- plain insertion with a fixed character count;
- embedded reading slots with width control;
- automatic fitting based on the current line width;
- multi-line embedded display;
- custom separators before and after inserted text;
- previous/next reading shortcuts;
- custom hotkeys;
- quick hide;
- current-page pause/resume;
- automatic restore after inserted text leaves the visible area;
- local-only storage.

---

Intext Reader 的核心思路很简单：  
在网页中选中一段文字，按下快捷键，就可以把你导入的阅读文本接在这个位置后面继续阅读。

当前支持：

- 导入或粘贴 `.txt` 文本；
- 将文本插入到网页选中文字后方；
- 按固定字数进行普通插入；
- 使用可控宽度的嵌入阅读槽；
- 根据当前行剩余宽度自动贴合；
- 多行嵌入显示；
- 自定义插入文本前后的分隔符；
- 上一页 / 下一页快捷键；
- 自定义快捷键；
- 一键隐藏；
- 当前页面启用 / 暂停；
- 插入内容离开可见区域后自动恢复；
- 本地存储阅读文本。

## Reading Modes / 阅读模式

### Plain Insertion / 普通插入

Plain insertion displays a fixed number of characters each time.  
This mode is straightforward: if you set the page size to `50`, each step shows 50 characters from the imported text.

普通插入会按固定字数显示文本。  
例如你设置每次显示 `50` 字，那么每次翻页都会显示导入文本中的 50 个字符。

This mode is useful when you care more about reading progress than layout stability.

这个模式适合更在意阅读进度、而不是页面排版稳定性的场景。

### Embedded Reading / 嵌入阅读

Embedded reading places the text inside an inline slot.  
The slot can use a fixed width or automatically fit the remaining width of the current line.

嵌入阅读会把文本放进一个行内阅读槽里。  
阅读槽可以使用固定宽度，也可以根据当前行剩余宽度自动贴合。

This helps reduce layout shifting when different languages or mixed text have different visual widths.

这可以减少不同语言、不同字符宽度导致的页面文字位置抖动。

Embedded reading supports:

- fixed-width slots;
- auto-fit slots;
- 1 to 3 display lines;
- vertical alignment adjustment;
- automatic character fitting based on actual rendered width.

嵌入阅读支持：

- 固定槽宽；
- 自动贴合槽宽；
- 1 到 3 行显示；
- 垂直位置校正；
- 根据真实渲染宽度自动决定本次显示多少字符。

## Quick Hide / 一键隐藏

Quick hide is designed to make the inserted text disappear quickly while still looking like a normal page scroll.

When triggered, Intext Reader finds the nearest scrollable container around the inserted text and scrolls that container instead of blindly scrolling the whole window. This makes it work better on both traditional pages and modern web apps with internal scrolling areas.

一键隐藏的目标是让插入文本快速离开视野，同时看起来像一次普通的页面滚动。

触发后，Intext Reader 会从插入文本的位置开始寻找最近的可滚动容器，并滚动这个容器，而不是固定滚动整个浏览器窗口。这样它既能适配传统网页，也能更好适配带内部滚动区域的现代网页应用。

If scrolling cannot move the text out of view, the extension falls back to removing the inserted text directly.

如果滚动无法让文本离开可见区域，插件会直接移除插入文本作为兜底。

## Shortcuts / 快捷键

Default shortcuts:

| Action | Shortcut |
| --- | --- |
| Insert / 插入 | `Alt+I` |
| Previous / 上一页 | `Alt+J` |
| Next / 下一页 | `Alt+K` |
| Restore / 恢复移除 | `Alt+R` |
| Quick hide / 一键隐藏 | `Alt+H` |

Shortcuts can be customized in the popup.  
A custom shortcut must include at least one modifier key: `Alt`, `Ctrl`, or `Shift`.

快捷键可以在扩展弹窗中自定义。  
自定义快捷键至少需要包含一个修饰键：`Alt`、`Ctrl` 或 `Shift`。

## Installation / 安装

1. Download the source code or release zip.
2. If you downloaded the release zip, unzip it first.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the folder that contains `manifest.json`.

---

1. 下载源码或 release 压缩包。
2. 如果下载的是 release zip，请先解压。
3. 打开 `chrome://extensions`。
4. 开启 **Developer mode / 开发者模式**。
5. 点击 **Load unpacked / 加载已解压的扩展程序**。
6. 选择包含 `manifest.json` 的文件夹。

## Usage / 使用方式

1. Open the extension popup.
2. Paste text or import a `.txt` file.
3. Choose plain insertion or embedded reading.
4. Adjust page size, separator, slot width, or shortcuts if needed.
5. Save settings.
6. Select text on a normal webpage.
7. Press the insert shortcut.
8. Use previous/next shortcuts to continue reading.
9. Use restore or quick hide when needed.

---

1. 打开扩展弹窗。
2. 粘贴文本或导入 `.txt` 文件。
3. 选择普通插入或嵌入阅读。
4. 按需调整每次字数、分隔符、槽宽或快捷键。
5. 保存设置。
6. 在普通网页中选中文字。
7. 按插入快捷键。
8. 使用上一页 / 下一页快捷键继续阅读。
9. 需要时使用恢复或一键隐藏。

## Privacy / 隐私说明

Intext Reader is local-only.

- Imported text is stored in `chrome.storage.local`.
- The extension does not upload imported text to any server.
- The extension does not include analytics.
- The extension does not load remote scripts.

---

Intext Reader 仅在本地工作。

- 导入文本保存在 `chrome.storage.local`。
- 插件不会将导入文本上传到任何服务器。
- 插件不包含统计分析。
- 插件不加载远程脚本。

## Known Limitations / 已知限制

- It does not work on pages that block content scripts, such as `chrome://` pages and the Chrome Web Store.
- Some complex web apps may re-render page content and remove inserted nodes.
- Embedded reading prioritizes visual stability over fixed character count.
- Plain insertion prioritizes fixed character count over visual stability.
- EPUB parsing, bookshelf management, cloud sync, and per-site profiles are not included in v1.0.0.

---

- 不支持禁止内容脚本注入的页面，例如 `chrome://` 页面和 Chrome Web Store。
- 部分复杂网页应用可能会重新渲染内容，导致插入节点被移除。
- 嵌入阅读优先保证视觉稳定，而不是固定字数。
- 普通插入优先保证固定字数，而不是视觉稳定。
- v1.0.0 不包含 EPUB 解析、书架、多设备同步和站点配置。

## Development / 开发

Run tests with Node.js:

```bash
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

```bash
node --check src/content.js
node --check src/popup.js
```

## License / 许可证

MIT License.
