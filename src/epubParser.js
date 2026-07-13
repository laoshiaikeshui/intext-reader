(function attachEpubParser(root) {
  const model = root.IntextReaderEpubModel || (typeof require === "function" ? require("./epubModel.js") : null);
  const BLOCK_NAMES = new Set([
    "address", "article", "aside", "blockquote", "dd", "div", "dl", "dt", "figcaption", "figure",
    "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "li", "main", "nav", "ol", "p",
    "pre", "section", "table", "td", "th", "tr", "ul"
  ]);
  const SKIP_NAMES = new Set(["script", "style", "form", "input", "button", "select", "textarea", "rp", "rt"]);
  const SUPPORTED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const FONT_OBFUSCATION_ALGORITHMS = new Set([
    "http://www.idpf.org/2008/embedding",
    "http://ns.adobe.com/pdf/enc#RC"
  ]);

  function epubError(code, details = {}) {
    const error = new Error(code);
    error.code = code;
    error.details = details;
    return error;
  }

  function decodeText(bytes) {
    const data = bytes || new Uint8Array();
    if (data[0] === 0xff && data[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(data.subarray(2));
    }
    if (data[0] === 0xfe && data[1] === 0xff) {
      return new TextDecoder("utf-16be").decode(data.subarray(2));
    }
    return new TextDecoder("utf-8").decode(data);
  }

  function localName(node) {
    return String(node?.localName || node?.nodeName || "").split(":").pop().toLowerCase();
  }

  function descendants(node, name) {
    const wanted = String(name).toLowerCase();
    const results = [];
    function visit(current) {
      for (let child = current?.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 1) {
          if (localName(child) === wanted) {
            results.push(child);
          }
          visit(child);
        }
      }
    }
    if (node && node.nodeType === 1 && localName(node) === wanted) {
      results.push(node);
    }
    visit(node);
    return results;
  }

  function first(node, name) {
    return descendants(node, name)[0] || null;
  }

  function attr(node, name) {
    return node?.getAttribute?.(name) || "";
  }

  function cleanLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function parseXml(value, options = {}) {
    const DOMParserClass = options.DOMParserClass || root.DOMParser;
    if (!DOMParserClass) {
      throw epubError("EPUB_XML_PARSER_UNAVAILABLE");
    }
    const errors = [];
    let parser;
    try {
      parser = new DOMParserClass({
        onError(level, message) {
          if (level === "error" || level === "fatalError") {
            errors.push(message);
          }
        }
      });
    } catch (error) {
      parser = new DOMParserClass();
    }
    const document = parser.parseFromString(String(value || ""), "application/xml");
    if (!document?.documentElement || errors.length > 0 || descendants(document, "parsererror").length > 0) {
      throw epubError("EPUB_XML_INVALID");
    }
    return document;
  }

  function parseContainer(files, options) {
    const bytes = files["META-INF/container.xml"];
    if (!bytes) {
      throw epubError("EPUB_CONTAINER_MISSING");
    }
    const document = parseXml(decodeText(bytes), options);
    const rootfile = first(document, "rootfile");
    const rawPackagePath = attr(rootfile, "full-path");
    const packagePath = rawPackagePath ? model.normalizeArchivePath("root.opf", rawPackagePath) : "";
    if (!packagePath || !files[packagePath]) {
      throw epubError("EPUB_PACKAGE_MISSING");
    }
    return packagePath;
  }

  function parsePackage(files, packagePath, options) {
    const document = parseXml(decodeText(files[packagePath]), options);
    const manifest = new Map();
    for (const item of descendants(first(document, "manifest"), "item")) {
      const id = attr(item, "id");
      if (!id) continue;
      const href = attr(item, "href");
      let path = "";
      let external = false;
      try {
        path = model.normalizeArchivePath(packagePath, href);
      } catch (error) {
        if (error.code !== "EPUB_PATH_EXTERNAL") throw error;
        external = true;
      }
      manifest.set(id, {
        id,
        href,
        path,
        external,
        mediaType: attr(item, "media-type"),
        properties: attr(item, "properties").split(/\s+/).filter(Boolean)
      });
    }
    const spineElement = first(document, "spine");
    const spine = descendants(spineElement, "itemref")
      .map((item) => {
        const resource = manifest.get(attr(item, "idref"));
        return resource ? {
          ...resource,
          spineProperties: attr(item, "properties").split(/\s+/).filter(Boolean)
        } : null;
      })
      .filter(Boolean);
    if (spine.length === 0) {
      throw epubError("EPUB_SPINE_EMPTY");
    }
    const metadata = first(document, "metadata");
    const metaValues = descendants(metadata, "meta");
    const legacyCoverId = attr(metaValues.find((item) => attr(item, "name") === "cover"), "content");
    const coverItem = Array.from(manifest.values()).find((item) => item.properties.includes("cover-image")) ||
      manifest.get(legacyCoverId);
    const packageFixedLayout = metaValues.some((item) => {
      return (attr(item, "property") === "rendition:layout" && cleanLabel(item.textContent) === "pre-paginated") ||
        (attr(item, "name") === "fixed-layout" && attr(item, "content") === "true");
    });
    const spineFixedLayout = spine.every((item) => item.spineProperties.some((property) => {
      return property === "rendition:layout-pre-paginated" || property.endsWith(":layout-pre-paginated");
    }));
    return {
      document,
      manifest,
      spine,
      tocId: attr(spineElement, "toc"),
      coverPath: coverItem?.path || "",
      fixedLayout: packageFixedLayout || spineFixedLayout,
      metadata: {
        title: cleanLabel(first(metadata, "title")?.textContent),
        author: cleanLabel(first(metadata, "creator")?.textContent),
        language: cleanLabel(first(metadata, "language")?.textContent)
      }
    };
  }

  function parseNavigation(files, packagePath, packageData, options) {
    const entries = [];
    function addEntry(basePath, href, title) {
      const label = cleanLabel(title);
      if (!href || !label) return;
      const hashIndex = href.indexOf("#");
      const fragmentValue = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
      let fragment = "";
      try {
        fragment = fragmentValue ? decodeURIComponent(fragmentValue) : "";
      } catch (error) {
        fragment = fragmentValue;
      }
      entries.push({
        path: model.normalizeArchivePath(basePath, href),
        fragment,
        title: label
      });
    }
    const navItem = Array.from(packageData.manifest.values()).find((item) => item.properties.includes("nav"));
    if (navItem && files[navItem.path]) {
      const document = parseXml(decodeText(files[navItem.path]), options);
      const navs = descendants(document, "nav");
      const toc = navs.find((item) => attr(item, "epub:type") === "toc" || attr(item, "type") === "toc") || navs[0];
      for (const anchor of descendants(toc, "a")) {
        const href = attr(anchor, "href");
        addEntry(navItem.path, href, anchor.textContent);
      }
      return entries;
    }

    const ncxItem = packageData.manifest.get(packageData.tocId) ||
      Array.from(packageData.manifest.values()).find((item) => item.mediaType === "application/x-dtbncx+xml");
    if (ncxItem && files[ncxItem.path]) {
      const document = parseXml(decodeText(files[ncxItem.path]), options);
      for (const point of descendants(document, "navpoint")) {
        const source = attr(first(point, "content"), "src");
        const label = cleanLabel(first(first(point, "navlabel"), "text")?.textContent);
        addEntry(ncxItem.path, source, label);
      }
    }
    return entries;
  }

  function findAncestor(node, name) {
    let current = node?.parentNode;
    while (current) {
      if (localName(current) === name) return current;
      current = current.parentNode;
    }
    return null;
  }

  function extractSpineDocument(document, context) {
    let output = "";
    const images = [];
    const warnings = [];
    const elementOffsets = new Map();
    const body = first(document, "body") || document.documentElement;

    function addBreak(count = 2) {
      output = output.replace(/[ \t]+$/g, "");
      const existing = (output.match(/\n+$/) || [""])[0].length;
      if (output && existing < count) output += "\n".repeat(count - existing);
    }

    function appendText(value) {
      const raw = String(value || "");
      const normalized = raw.replace(/\s+/g, " ");
      if (!normalized.trim()) return;
      const leading = /^\s/.test(normalized);
      const trailing = /\s$/.test(normalized);
      const core = normalized.trim();
      if (leading && output && !/[\s]$/.test(output)) output += " ";
      output += core;
      if (trailing) output += " ";
    }

    function handleImage(node) {
      const href = attr(node, "src") || attr(node, "href") || attr(node, "xlink:href");
      if (!href) return;
      let sourcePath;
      try {
        sourcePath = model.normalizeArchivePath(context.documentPath, href);
      } catch (error) {
        warnings.push({ code: error.code || "EPUB_IMAGE_PATH_INVALID", path: href });
        return;
      }
      const resource = context.resourcesByPath.get(sourcePath);
      const mediaType = resource?.mediaType || "";
      if (mediaType === "image/svg+xml" || sourcePath.toLowerCase().endsWith(".svg")) {
        warnings.push({ code: "EPUB_IMAGE_SVG_SKIPPED", path: sourcePath });
        return;
      }
      if (!SUPPORTED_IMAGES.has(mediaType) || !context.files[sourcePath]) {
        warnings.push({ code: "EPUB_IMAGE_UNSUPPORTED", path: sourcePath });
        return;
      }
      const figure = findAncestor(node, "figure");
      const caption = cleanLabel(first(figure, "figcaption")?.textContent);
      const intrinsicSize = model.getImageDimensions(context.files[sourcePath], mediaType);
      const metadata = {
        width: Number(attr(node, "width")) || intrinsicSize.width,
        height: Number(attr(node, "height")) || intrinsicSize.height,
        alt: cleanLabel(attr(node, "alt")),
        caption,
        inFigure: Boolean(figure),
        occurrences: context.occurrences.get(sourcePath) || 1
      };
      const classification = model.classifyImage(metadata);
      if (classification === "divider") {
        addBreak(2);
        return;
      }
      if (classification === "decorative") return;
      if (classification === "text") {
        appendText(metadata.alt);
        return;
      }
      output = output.replace(/[ \t]+$/g, "");
      images.push({ sourcePath, mediaType, textOffset: output.length, ...metadata });
    }

    function walk(node) {
      if (node.nodeType === 3) {
        appendText(node.nodeValue);
        return;
      }
      if (node.nodeType !== 1) return;
      const name = localName(node);
      if (SKIP_NAMES.has(name) || attr(node, "hidden") || /display\s*:\s*none/i.test(attr(node, "style"))) return;
      if (name === "br") {
        addBreak(1);
        return;
      }
      if (name === "img" || name === "image") {
        handleImage(node);
        return;
      }
      const block = BLOCK_NAMES.has(name);
      if (block) addBreak(2);
      const id = attr(node, "id") || attr(node, "xml:id");
      if (id && !elementOffsets.has(id)) elementOffsets.set(id, output.length);
      for (let child = node.firstChild; child; child = child.nextSibling) walk(child);
      if (block) addBreak(2);
    }

    walk(body);
    const text = output.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    images.forEach((image) => {
      image.textOffset = Math.min(image.textOffset, text.length);
    });
    const heading = cleanLabel(descendants(body, "h1")[0]?.textContent || descendants(body, "h2")[0]?.textContent);
    return { text, heading, images, warnings, elementOffsets };
  }

  function collectImageOccurrences(files, spine, options) {
    const counts = new Map();
    for (const item of spine) {
      if (!files[item.path]) continue;
      const document = parseXml(decodeText(files[item.path]), options);
      for (const image of [...descendants(document, "img"), ...descendants(document, "image")]) {
        const href = attr(image, "src") || attr(image, "href") || attr(image, "xlink:href");
        if (!href) continue;
        try {
          const path = model.normalizeArchivePath(item.path, href);
          counts.set(path, (counts.get(path) || 0) + 1);
        } catch (error) {
          // The extraction pass records the warning.
        }
      }
    }
    return counts;
  }

  function hasUnsupportedEncryption(files, packageData, options) {
    const encryptionPath = "META-INF/encryption.xml";
    if (!files[encryptionPath]) return false;
    const document = parseXml(decodeText(files[encryptionPath]), options);
    const encryptedItems = descendants(document, "encrypteddata");
    if (encryptedItems.length === 0) return true;
    const resourcesByPath = new Map(Array.from(packageData.manifest.values()).map((item) => [item.path, item]));
    return encryptedItems.some((item) => {
      const algorithm = attr(first(item, "encryptionmethod"), "algorithm");
      const uri = attr(first(item, "cipherreference"), "uri");
      if (!FONT_OBFUSCATION_ALGORITHMS.has(algorithm) || !uri) return true;
      try {
        const path = model.normalizeArchivePath(encryptionPath, uri);
        const resource = resourcesByPath.get(path);
        return !resource || !/^font\//i.test(resource.mediaType);
      } catch (error) {
        return true;
      }
    });
  }

  async function parseEpubFiles(files, options = {}) {
    if (files["META-INF/rights.xml"]) {
      throw epubError("EPUB_DRM_UNSUPPORTED");
    }
    const packagePath = parseContainer(files, options);
    const packageData = parsePackage(files, packagePath, options);
    if (hasUnsupportedEncryption(files, packageData, options)) throw epubError("EPUB_DRM_UNSUPPORTED");
    if (packageData.fixedLayout) throw epubError("EPUB_FIXED_LAYOUT_UNSUPPORTED");
    const navigation = parseNavigation(files, packagePath, packageData, options);
    const resourcesByPath = new Map(Array.from(packageData.manifest.values())
      .filter((item) => item.path)
      .map((item) => [item.path, item]));
    const occurrences = collectImageOccurrences(files, packageData.spine, options);
    const parts = [];
    const localImageSets = [];
    const detachedImageSets = [];
    const warnings = [];

    for (let index = 0; index < packageData.spine.length; index += 1) {
      const item = packageData.spine[index];
      if (!files[item.path]) {
        warnings.push({ code: "EPUB_SPINE_DOCUMENT_MISSING", path: item.path });
        continue;
      }
      const document = parseXml(decodeText(files[item.path]), options);
      const extracted = extractSpineDocument(document, {
        documentPath: item.path,
        files,
        resourcesByPath,
        coverPath: packageData.coverPath,
        occurrences
      });
      warnings.push(...extracted.warnings);
      if (!extracted.text && extracted.images.length === 0) continue;
      if (!extracted.text && extracted.images.length > 0) {
        detachedImageSets.push({ beforePartIndex: parts.length, images: extracted.images });
        continue;
      }
      const documentEntries = navigation.filter((entry) => entry.path === item.path);
      const boundaries = documentEntries.map((entry, entryIndex) => ({
        entry,
        start: entryIndex === 0 ? 0 : extracted.elementOffsets.get(entry.fragment)
      })).filter((boundary, boundaryIndex) => boundaryIndex === 0 || Number.isFinite(boundary.start));
      if (boundaries.length === 0) {
        boundaries.push({ entry: null, start: 0 });
      }
      boundaries.sort((left, right) => left.start - right.start);

      boundaries.forEach((boundary, boundaryIndex) => {
        const segmentStart = boundary.start;
        const segmentEnd = boundaries[boundaryIndex + 1]?.start ?? extracted.text.length;
        const segmentText = extracted.text.slice(segmentStart, segmentEnd).trim();
        const title = model.resolveChapterTitle({
          navigationTitle: boundary.entry?.title,
          heading: boundaryIndex === 0 ? extracted.heading : "",
          index: parts.length
        }, packageData.metadata.language === "zh" ? "zh" : "en");
        const startsWithTitle = cleanLabel(segmentText).startsWith(cleanLabel(title));
        const prefix = startsWithTitle ? "" : `${title}\n\n`;
        const finalSegment = boundaryIndex === boundaries.length - 1;
        const segmentImages = extracted.images
          .filter((image) => image.textOffset >= segmentStart && (
            image.textOffset < segmentEnd || (finalSegment && image.textOffset === segmentEnd)
          ))
          .map((image) => ({ ...image, textOffset: image.textOffset - segmentStart + prefix.length }));
        if (!segmentText && segmentImages.length === 0) return;
        parts.push({ title, text: `${prefix}${segmentText}`.trim() });
        localImageSets.push(segmentImages);
      });
    }

    if (parts.length === 0 || !parts.some((part) => part.text.trim())) {
      throw epubError("EPUB_TEXT_EMPTY");
    }

    const referencedImages = [...localImageSets, ...detachedImageSets.map((set) => set.images)].flat();
    const coverResource = resourcesByPath.get(packageData.coverPath);
    if (
      packageData.coverPath &&
      files[packageData.coverPath] &&
      SUPPORTED_IMAGES.has(coverResource?.mediaType) &&
      !referencedImages.some((image) => image.sourcePath === packageData.coverPath)
    ) {
      const dimensions = model.getImageDimensions(files[packageData.coverPath], coverResource.mediaType);
      detachedImageSets.unshift({
        beforePartIndex: 0,
        images: [{
          sourcePath: packageData.coverPath,
          mediaType: coverResource.mediaType,
          textOffset: 0,
          alt: packageData.metadata.title,
          caption: "",
          width: dimensions.width,
          height: dimensions.height
        }]
      });
    }

    const leadingImages = Array.from({ length: parts.length }, () => []);
    const trailingImages = Array.from({ length: parts.length }, () => []);
    detachedImageSets.forEach((set) => {
      if (set.beforePartIndex < parts.length) {
        leadingImages[set.beforePartIndex].push(...set.images.map((image) => ({ ...image, textOffset: 0 })));
        return;
      }
      const lastIndex = parts.length - 1;
      trailingImages[lastIndex].push(...set.images.map((image) => ({
        ...image,
        textOffset: parts[lastIndex].text.length
      })));
    });
    localImageSets.forEach((set, index) => {
      localImageSets[index] = [...leadingImages[index], ...set, ...trailingImages[index]];
    });

    const chapters = model.buildChapterRanges(parts);
    const novelText = parts.map((part) => part.text).join("\n\n");
    const imageAnchors = [];
    const images = [];
    const imageAssetsByPath = new Map();
    localImageSets.forEach((set, chapterIndex) => {
      set.forEach((image) => {
        let asset = imageAssetsByPath.get(image.sourcePath);
        if (!asset) {
          asset = {
            id: `image-${images.length + 1}`,
            mediaType: image.mediaType,
            bytes: files[image.sourcePath]
          };
          imageAssetsByPath.set(image.sourcePath, asset);
          images.push(asset);
        }
        imageAnchors.push({
          id: asset.id,
          textOffset: chapters[chapterIndex].startOffset + image.textOffset,
          chapterIndex,
          sourcePath: image.sourcePath,
          mediaType: image.mediaType,
          alt: image.alt,
          caption: image.caption,
          width: image.width,
          height: image.height
        });
      });
    });

    return {
      metadata: packageData.metadata,
      cover: packageData.coverPath && files[packageData.coverPath]
        ? {
            mediaType: resourcesByPath.get(packageData.coverPath)?.mediaType || "application/octet-stream",
            bytes: files[packageData.coverPath]
          }
        : null,
      novelText,
      chapters,
      imageAnchors,
      images,
      warnings
    };
  }

  const api = { extractSpineDocument, parseEpubFiles, parseNavigation, parsePackage, parseXml };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderEpubParser = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
