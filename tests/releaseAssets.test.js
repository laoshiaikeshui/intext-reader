const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const popupHtml = fs.readFileSync(path.join(root, "src", "popup.html"), "utf8");
const popupCss = fs.readFileSync(path.join(root, "src", "popup.css"), "utf8");
const contentJs = fs.readFileSync(path.join(root, "src", "content.js"), "utf8");
const illustrationOverlayJs = fs.readFileSync(path.join(root, "src", "illustrationOverlay.js"), "utf8");

assert.equal(manifest.version, "1.3.0");
assert(popupHtml.includes('data-language="zh"'));
assert(popupHtml.includes('data-language="en"'));
assert(popupHtml.includes('data-i18n="embeddedReading"'));
assert(popupHtml.includes('data-i18n="embedMethod"'));
assert(!popupHtml.includes("最大槽宽"));
assert(popupHtml.includes('id="chooseTxtButton"'));
assert(popupHtml.includes('data-i18n="chooseTxt"'));
assert(popupHtml.includes('id="selectedFileName"'));
assert(popupHtml.includes('id="chooseEpubButton"'));
assert(popupHtml.includes('id="chapterSelect"'));
assert(popupHtml.includes('id="showEpubIllustrations"'));
assert(popupHtml.includes('class="toggle-input"'));
assert(popupHtml.includes('class="toggle-control"'));
assert(popupCss.includes(".toggle-input:checked + .toggle-control"));
assert(popupHtml.includes('data-i18n="noFileSelected"'));
assert(popupHtml.includes('id="slotWidthWarning"'));
assert(popupHtml.includes('data-i18n="widthTooSmall"'));
assert(popupHtml.includes('id="slotWidth" type="number" min="1"'));
assert(popupHtml.includes('id="embedLineCount" type="number" min="1" max="10"'));
assert(popupHtml.includes('class="native-file-input"'));
assert(popupCss.includes(".native-file-input"));
assert(popupHtml.includes('id="versionInfo"'));
assert(popupHtml.includes('data-i18n="disclaimer"'));
assert(!popupHtml.includes("版本：v1.1.0"));
assert(popupCss.includes(".popup-footer"));
assert(!contentJs.includes("DEFAULT_MIN_SLOT_WIDTH"));
assert(illustrationOverlayJs.includes("width:100%;height:100%"));
assert(illustrationOverlayJs.includes("object-fit:contain"));
assert(popupHtml.indexOf('src="i18n.js"') < popupHtml.indexOf('src="popupState.js"'));

const contentScripts = manifest.content_scripts[0].js;
assert(contentScripts.indexOf("src/i18n.js") < contentScripts.indexOf("src/pageControl.js"));
assert(contentScripts.indexOf("src/epubModel.js") < contentScripts.indexOf("src/readingRange.js"));
assert(contentScripts.indexOf("src/epubModel.js") < contentScripts.indexOf("src/illustrationMarkers.js"));
assert(contentScripts.indexOf("src/illustrationMarkers.js") < contentScripts.indexOf("src/content.js"));
assert(contentScripts.indexOf("src/readingRange.js") < contentScripts.indexOf("src/content.js"));
assert(contentScripts.includes("src/illustrationOverlay.js"));
assert(manifest.permissions.includes("unlimitedStorage"));
assert(fs.existsSync(path.join(root, "src", "import.html")));
assert(fs.existsSync(path.join(root, "src", "import.js")));
assert(fs.existsSync(path.join(root, "vendor", "fflate-0.8.3.min.js")));
const importHtml = fs.readFileSync(path.join(root, "src", "import.html"), "utf8");
assert(!/<script[^>]+src=["']https?:/i.test(importHtml));

const expectedIcons = [16, 24, 32, 48, 128];
for (const size of expectedIcons) {
  const relativePath = `icons/icon-${size}.png`;
  const iconPath = path.join(root, relativePath);
  assert.equal(manifest.icons[String(size)], relativePath);
  assert(fs.existsSync(iconPath), `${relativePath} exists`);
  const png = fs.readFileSync(iconPath);
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}

assert.equal(manifest.action.default_icon["16"], "icons/icon-16.png");
assert.equal(manifest.action.default_icon["24"], "icons/icon-24.png");
assert.equal(manifest.action.default_icon["32"], "icons/icon-32.png");
assert(fs.existsSync(path.join(root, "icons", "icon-source.svg")));
