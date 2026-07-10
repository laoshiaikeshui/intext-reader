# Intext Reader

[中文](#中文) | [English](#english)

## 中文

Intext Reader 是一款本地运行的 Chrome 浏览器扩展，可以把个人阅读文本自然地插入网页正文，并通过页面滚动完成相对平滑的一键隐藏。

它不会打开独立阅读窗口。导入文本后，只需在网页中选中文字并按下快捷键，阅读内容就会插入到选中文字后方。插件提供普通插入和嵌入阅读两种模式，可用于阅读小说、复习资料、背单词或浏览其他纯文本内容。

> 阅读文本仅保存在浏览器本地，不会上传到服务器。

### 项目目标

Intext Reader 主要解决两个问题：

- 让个人阅读文本尽量融入现有网页的字体和排版；
- 需要隐藏时，通过一次连续的页面滚动让文本离开视窗，而不是突兀地切换窗口。

### 主要功能

- 支持直接粘贴文本或导入 `.txt` 文件；
- 在网页选中文字后插入阅读内容，不替换原文字；
- 支持固定字数的普通插入；
- 支持限制显示宽度的嵌入阅读；
- 支持固定宽度和自动贴合两种嵌入方式；
- 支持一至三行嵌入显示；
- 支持实时预览显示宽度和文字上下位置；
- 支持自定义前后分隔符；
- 支持上一页、下一页、恢复和一键隐藏；
- 支持自定义页面内快捷键；
- 自动保存阅读位置；
- 插入内容离开视窗后自动移除；
- 支持暂停或启用当前页面；
- 支持中文和英文插件界面；
- 阅读文本和设置仅保存在浏览器本地。

### 安装方法

1. 打开本仓库的 [Releases](https://github.com/laoshiaikeshui/intext-reader/releases) 页面。
2. 下载最新版本的 `intext-reader-vX.X.X.zip`。
3. 解压 ZIP 文件。
4. 在 Chrome 或 Chromium 浏览器中打开 `chrome://extensions`。
5. 开启右上角的“开发者模式”。
6. 点击“加载已解压的扩展程序”。
7. 选择包含 `manifest.json` 的解压文件夹。

安装或更新插件后，请刷新已经打开的目标网页，使内容脚本重新加载。

### 快速开始

1. 打开插件弹窗。
2. 粘贴文本，或者选择一个 `.txt` 文件导入。
3. 导入 TXT 后，插件会自动保存新文本并将阅读位置归零。
4. 选择普通插入或嵌入阅读。
5. 修改显示方式、宽度、分隔符或快捷键后，点击“保存设置”。
6. 在普通网页中用鼠标选中一段文字。
7. 按下插入快捷键，阅读内容会出现在选中文字后方。
8. 使用上一页和下一页快捷键继续阅读。
9. 使用滚轮或一键隐藏快捷键让文本离开视窗，插件会自动移除插入内容。

文本被移除后，即使重新滚动到原位置也不会再次出现，需要重新选择文字并执行插入。

### 阅读模式

#### 普通插入

普通插入会按照设置的字数直接显示文本。例如设置为 `50`，每次会显示 50 个文本字符，前后分隔符不占用这 50 个字符。

这种方式简单直接，但不同字符的实际显示宽度不同。翻页后，原网页后方文字的位置可能随之变化，因此无法保证页面排版稳定。

#### 嵌入阅读

嵌入阅读会把文本放在限制宽度的行内显示区域中。翻页时，变化主要限制在该区域内，可以减少后方网页文字的位置变化。

嵌入阅读支持：

- 设置最大显示宽度；
- 选择固定宽度或自动贴合；
- 设置一至三行显示；
- 调整文字上下位置；
- 根据真实渲染宽度自动决定本页字数。

一般推荐使用 **嵌入阅读 + 自动贴合**。

#### 自动贴合

自动贴合会参考插入位置当前行的剩余宽度，在用户设置的最大显示宽度内自动收缩，并根据实际字体和字符宽度决定本次显示多少字符。

#### 固定宽度

固定宽度始终使用用户设置的显示宽度，不根据当前行的剩余空间自动收缩。

### 分隔符

分隔符会同时添加在阅读文本的前后，用于区分原网页内容和插入内容。

可以输入：

- 一个或多个空格；
- 逗号、分号等标点；
- 其他自定义字符；
- 留空，不添加分隔符。

在普通插入模式下，分隔符不占用设置的阅读字数。

### 一键隐藏

直接让文本瞬间消失可能比较突兀，因此 Intext Reader 会优先尝试通过页面滚动完成隐藏。

触发一键隐藏后，插件会：

1. 从插入位置寻找最近的可滚动区域；
2. 根据文本所在位置和可用滚动距离选择方向；
3. 使用数次连续滚动让文本离开当前视窗；
4. 文本离开视窗后自动恢复原网页；
5. 内部区域无法滚动时尝试滚动整个页面；
6. 所有滚动方式均失败时，直接移除文本作为最终兜底。

手动使用滚轮时，只要插入内容完全离开视窗，也会触发自动移除。

### 默认快捷键

| 功能 | 默认快捷键 |
| --- | --- |
| 插入文本 | `Alt + I` |
| 上一页 | `Alt + J` |
| 下一页 | `Alt + K` |
| 恢复或移除 | `Alt + R` |
| 一键隐藏 | `Alt + H` |

所有快捷键都可以在插件设置中修改。自定义快捷键必须包含至少一个 `Alt`、`Ctrl` 或 `Shift` 修饰键，并且不能与其他插件快捷键重复。

> **快捷键冲突提示：** 网页、浏览器或其他扩展可能占用相同的快捷键组合。如果快捷键没有响应，请先检查是否存在冲突，并在插件设置中改用不常用的组合。Windows 用户也可以配合 AutoHotkey 等按键映射工具，将顺手的按键映射到插件设置的快捷键组合。AutoHotkey 不属于本插件，需要单独安装和配置。

### v1.1.0 更新

v1.1.0 重点改进了界面和滚动兼容性：

- 新增中英文界面即时切换并记忆语言设置；
- 新增插件图标和本地化 TXT 文件选择控件；
- 默认最大显示宽度调整为 500 px；
- 默认文字上下位置调整为 -0.43 em；
- 优化显示宽度名称和实时阅读状态；
- 修复部分网页中页面滚动元素识别错误；
- 增加滚动结果检测和页面级回退；
- 保留无法滚动时直接移除文本的最终兜底；
- 在插件弹窗中显示版本信息和免责声明。

### 隐私与权限

Intext Reader 本地运行：

- 导入文本保存在 `chrome.storage.local`；
- 不会将阅读文本上传到任何服务器；
- 不包含统计分析或广告；
- 不加载远程脚本；
- 不收集浏览记录或个人信息。

扩展仅申请以下权限：

- `storage`：保存文本、阅读位置和插件设置；
- `activeTab`：与当前活动网页通信并执行用户触发的操作。

### 兼容性与已知限制

- 无法在 `chrome://` 页面、Chrome 应用商店等禁止内容脚本运行的页面使用；
- 部分动态网页重新渲染内容时，可能主动移除插件插入的节点；
- 自动贴合效果会受到网页字体、缩放比例和排版结构影响；
- 普通插入无法保证翻页前后的页面排版完全稳定；
- 特殊 iframe、编辑器和复杂内部滚动区域可能存在兼容性差异；
- 当前支持粘贴文本和 TXT 文件，暂不支持 EPUB 解析；
- 当前不包含书架、云同步和按网站保存独立配置。

正式使用前，建议在目标网页完整测试一次插入、翻页、手动滚动和一键隐藏流程。

### 常见问题排查

如果插件没有响应或页面行为异常，可以依次尝试：

1. 确认已经导入文本并保存设置；
2. 刷新目标网页；
3. 在 `chrome://extensions` 中重新加载插件；
4. 关闭并重新打开目标网页；
5. 重启浏览器；
6. 检查自定义快捷键是否与网页或其他扩展冲突。

### 开发与验证

本项目采用 AI 辅助开发，并结合自动化测试、代码检查和人工浏览器试用进行验证。由于不同网站的页面结构差异很大，仍可能存在尚未发现的兼容性问题。

运行测试需要 Node.js：

```powershell
Get-ChildItem tests -Filter *.test.js | ForEach-Object { node $_.FullName }
```

运行 JavaScript 语法检查：

```powershell
Get-ChildItem src -Filter *.js | ForEach-Object { node --check $_.FullName }
```

欢迎检查源码、提交 Issue 或自行修改使用。

### 免责声明

本项目仅供本地个人阅读、学习和技术交流使用。请遵守目标网站的使用规则、所在环境的管理要求以及适用法律。

由于网页结构、浏览器版本和其他扩展可能影响运行结果，本项目不保证在所有网站中均能正常工作，也不对使用本项目产生的直接或间接后果承担责任。

### 开源许可

本项目采用 [MIT License](LICENSE)。

---

## English

Intext Reader is a local Chrome extension that inserts personal reading text directly into webpage content and provides a scroll-based quick-hide action.

It does not open a separate reader window. After importing text, select text on a webpage and press the insert shortcut. Your reading content will appear immediately after the selection. The extension supports plain insertion and embedded reading for novels, study notes, vocabulary, and other plain-text material.

> Reading text is stored locally in the browser and is never uploaded to a server.

### Goals

Intext Reader focuses on two goals:

- Make personal reading text blend with the typography and layout of the current webpage.
- Hide inserted text through a continuous page scroll instead of an abrupt window switch.

### Features

- Paste text directly or import a `.txt` file.
- Insert reading content after selected webpage text without replacing it.
- Use plain insertion with a fixed character count.
- Use embedded reading with a constrained display width.
- Choose fixed-width or automatic width fitting.
- Display embedded content across one to three lines.
- Preview display width and vertical text position in real time.
- Add the same custom separator before and after inserted text.
- Navigate to the previous or next reading page.
- Restore content or trigger quick hide.
- Customize all in-page shortcuts.
- Save the current reading position automatically.
- Remove inserted content after it leaves the viewport.
- Pause or enable the extension on the current page.
- Switch the extension interface between Chinese and English.
- Keep all reading text and settings in local browser storage.

### Installation

1. Open the repository [Releases](https://github.com/laoshiaikeshui/intext-reader/releases) page.
2. Download the latest `intext-reader-vX.X.X.zip` file.
3. Extract the ZIP archive.
4. Open `chrome://extensions` in Chrome or a Chromium-based browser.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select the extracted folder that contains `manifest.json`.

After installing or updating the extension, refresh any webpage that was already open so the content script can reload.

### Quick Start

1. Open the extension popup.
2. Paste text or import a `.txt` file.
3. Importing a TXT file automatically saves the new text and resets the reading position.
4. Choose plain insertion or embedded reading.
5. After changing display mode, width, separator, or shortcuts, click **Save settings**.
6. Select text on a normal webpage.
7. Press the insert shortcut to place reading content after the selection.
8. Use the previous and next shortcuts to continue reading.
9. Use the mouse wheel or quick-hide shortcut to move the content out of view. The extension will then remove it automatically.

After inserted content is removed, scrolling back to its original position will not make it reappear. Select text and insert again when needed.

### Reading Modes

#### Plain Insertion

Plain insertion displays a fixed number of characters. For example, a page size of `50` displays 50 characters each time. The separators before and after the content do not count toward those 50 characters.

This mode is simple, but characters have different rendered widths. The position of the original webpage text may therefore change after moving to another page.

#### Embedded Reading

Embedded reading places text inside a width-constrained inline area. Page changes are mostly limited to that area, which reduces movement in the original webpage text that follows it.

Embedded reading supports:

- A configurable maximum display width.
- Fixed-width and automatic fitting modes.
- One to three display lines.
- Vertical text-position adjustment.
- Automatic character fitting based on actual rendered width.

For most pages, **Embedded reading + Auto fit** is recommended.

#### Auto Fit

Auto fit measures the remaining width of the current line and shrinks the reading area within the configured maximum width. The number of displayed characters is determined by the actual font and rendered character widths.

#### Fixed Width

Fixed width always uses the configured display width and does not shrink according to the remaining space on the current line.

### Separators

The same separator is placed before and after the inserted reading text to distinguish it from the original webpage content.

The separator can be:

- One or more spaces.
- Punctuation such as commas or semicolons.
- Any other custom text.
- Empty, if no separator is needed.

In plain insertion mode, separators do not count toward the configured page size.

### Quick Hide

Instantly deleting text can look abrupt, so Intext Reader first attempts to hide it through normal-looking page movement.

When quick hide is triggered, the extension:

1. Finds the nearest scrollable area around the inserted content.
2. Selects a direction based on the content position and available scroll distance.
3. Uses several continuous scroll steps to move the content out of view.
4. Restores the original webpage after the content leaves the viewport.
5. Falls back to scrolling the whole page if the internal area cannot move.
6. Removes the content directly as a final fallback when scrolling is impossible.

Manual mouse-wheel scrolling also removes the inserted content once it fully leaves the viewport.

### Default Shortcuts

| Action | Default shortcut |
| --- | --- |
| Insert text | `Alt + I` |
| Previous page | `Alt + J` |
| Next page | `Alt + K` |
| Restore or remove | `Alt + R` |
| Quick hide | `Alt + H` |

All shortcuts can be changed in the extension settings. A custom shortcut must include at least one modifier key: `Alt`, `Ctrl`, or `Shift`. Shortcuts must not conflict with one another.

> **Shortcut conflict notice:** Webpages, browsers, or other extensions may use the same key combination. If a shortcut does not respond, check for conflicts and configure a less commonly used combination in the extension settings. Windows users may also use a key-mapping tool such as AutoHotkey to map a convenient key to the configured shortcut. AutoHotkey is not part of this extension and must be installed and configured separately.

### v1.1.0 Changes

Version 1.1.0 focuses on interface quality and scrolling compatibility:

- Added instant Chinese/English switching with a saved preference.
- Added a new extension icon set and localized TXT file controls.
- Changed the default maximum display width to 500 px.
- Changed the default vertical text position to -0.43 em.
- Improved display-width labels and live reading status.
- Fixed page-scroller detection on some websites.
- Added scroll-movement detection and page-level fallback.
- Kept direct removal as the final fallback when scrolling is impossible.
- Added version information and a disclaimer to the popup.

### Privacy and Permissions

Intext Reader runs locally:

- Imported text is stored in `chrome.storage.local`.
- Reading text is never uploaded to a server.
- The extension contains no analytics or advertising.
- The extension does not load remote scripts.
- The extension does not collect browsing history or personal information.

The extension requests only these permissions:

- `storage`: Saves reading text, reading position, and extension settings.
- `activeTab`: Communicates with the active webpage for user-triggered actions.

### Compatibility and Known Limitations

- The extension cannot run on pages that block content scripts, including `chrome://` pages and the Chrome Web Store.
- Dynamic web applications may re-render their content and remove inserted nodes.
- Auto-fit results depend on webpage fonts, zoom level, and layout structure.
- Plain insertion cannot guarantee a stable layout between page changes.
- Special iframes, editors, and complex internal scrolling areas may behave differently.
- The current version supports pasted text and TXT files, but not EPUB parsing.
- Bookshelf management, cloud synchronization, and per-site profiles are not included.

Before regular use, test the complete insert, page navigation, manual scroll, and quick-hide flow on the target website.

### Troubleshooting

If the extension does not respond or the page behaves unexpectedly:

1. Confirm that reading text has been imported and settings have been saved.
2. Refresh the target webpage.
3. Reload the extension from `chrome://extensions`.
4. Close and reopen the target webpage.
5. Restart the browser.
6. Check whether custom shortcuts conflict with the webpage or another extension.

### Development and Verification

This project was developed with AI assistance and verified through automated tests, code checks, and manual browser testing. Because website structures vary significantly, undiscovered compatibility issues may still exist.

Run tests with Node.js:

```powershell
Get-ChildItem tests -Filter *.test.js | ForEach-Object { node $_.FullName }
```

Run JavaScript syntax checks:

```powershell
Get-ChildItem src -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Source review, issue reports, and personal modifications are welcome.

### Disclaimer

This project is intended for local personal reading, study, and technical discussion. Follow the target website's rules, applicable environment policies, and applicable laws.

Webpage structure, browser versions, and other extensions may affect behavior. This project does not guarantee compatibility with every website and accepts no liability for direct or indirect consequences arising from its use.

### License

This project is licensed under the [MIT License](LICENSE).
