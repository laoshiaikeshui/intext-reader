# Intext Reader v1.3.0

[中文](#中文) | [English](#english)

## 中文

### 本次更新

- 新增本地 EPUB 2/3 导入，自动提取正文、章节和插图；
- 新增章节选择、立即跳转和阅读位置记忆；
- 正文使用 `[图片N]` 标记插图位置；
- 新增可关闭、可拖动、自动贴边的数字插图悬浮球；
- 新增可调整大小的多图查看窗口，图片完整显示并保持原始比例；
- 保留封面、卷首插图和纯图片页面；
- 加强异常 EPUB 的解压前检查、加密/固定版式识别和重复图片去重；
- EPUB 内容和图片只保存在浏览器本地，不会上传。

### 使用方法

1. 打开插件弹窗，进入 EPUB 导入页并选择本地 `.epub` 文件；
2. 导入成功后，在弹窗中选择章节或继续当前进度；
3. 开启“显示 EPUB 插图悬浮球”；
4. 在网页选中文字，按插入快捷键开始阅读；
5. `[图片N]` 表示当前位置有 `N` 张图片，悬浮球数字表示当前插入范围内的图片总数；
6. 数字大于 `0` 时点击悬浮球查看图片；数字为 `0` 时只能拖动位置；
7. 图片窗口支持调整大小和多图切换，图片始终保持比例并完整显示。

### 注意事项

- 导入新 TXT 或 EPUB 会替换当前文本并将阅读位置归零；
- 不支持带 DRM、仅固定版式、有声或视频内容的 EPUB；
- SVG 插图暂不显示，单个 EPUB 文件上限为 256 MB；
- 更新扩展后，请刷新已打开的目标网页。

---

## English

### What's New

- Added local EPUB 2/3 import with text, chapter, and illustration extraction.
- Added chapter selection, immediate jumps, and saved reading progress.
- Added `[N images]` markers at illustration positions.
- Added an optional draggable numeric illustration button with edge snapping.
- Added a resizable multi-image viewer that keeps each image fully visible and preserves its aspect ratio.
- Retained covers, front matter illustrations, and image-only pages.
- Hardened pre-extraction checks, encryption/fixed-layout detection, and repeated-image deduplication.
- Kept EPUB text and images entirely in local browser storage with no upload.

### How to Use

1. Open the extension popup, open the EPUB importer, and select a local `.epub` file.
2. After import, choose a chapter in the popup or continue from the saved position.
3. Enable **Show EPUB illustration button**.
4. Select webpage text and press the insert shortcut to start reading.
5. An `[N images]` marker means `N` images are attached to that position; the edge button shows the total in the current inserted range.
6. Click the button when its number is greater than `0`; when it shows `0`, it can only be moved.
7. Resize the viewer or switch images as needed. Images remain fully visible without aspect-ratio distortion.

### Notes

- Importing a new TXT or EPUB replaces the current text and resets reading progress.
- DRM-protected, fixed-layout-only, audio, and video EPUB content is unsupported.
- SVG illustrations are skipped, and each EPUB file is limited to 256 MB.
- Refresh already-open webpages after updating the extension.
