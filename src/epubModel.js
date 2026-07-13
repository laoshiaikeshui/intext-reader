(function attachEpubModel(root) {
  function createError(code, message = code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function decodeHref(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      throw createError("EPUB_PATH_INVALID");
    }
  }

  function normalizeArchivePath(basePath, href) {
    const rawHref = String(href || "").split("#", 1)[0].split("?", 1)[0];
    if (/^[a-z]:[\\/]/i.test(rawHref)) {
      throw createError("EPUB_PATH_UNSAFE");
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(rawHref) || rawHref.startsWith("//")) {
      throw createError("EPUB_PATH_EXTERNAL");
    }

    const decoded = decodeHref(rawHref).replace(/\\/g, "/");
    if (!decoded || decoded.includes("\0") || decoded.startsWith("/") || /^[a-z]:/i.test(decoded)) {
      throw createError("EPUB_PATH_UNSAFE");
    }

    const baseParts = String(basePath || "").replace(/\\/g, "/").split("/");
    baseParts.pop();
    const parts = decoded.startsWith("/") ? [] : baseParts;
    for (const part of decoded.split("/")) {
      if (!part || part === ".") {
        continue;
      }
      if (part === "..") {
        if (parts.length === 0) {
          throw createError("EPUB_PATH_UNSAFE");
        }
        parts.pop();
      } else {
        parts.push(part);
      }
    }

    if (parts.length === 0) {
      throw createError("EPUB_PATH_UNSAFE");
    }
    return parts.join("/");
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function resolveChapterTitle(values = {}, language = "en") {
    const title = cleanText(values.navigationTitle) || cleanText(values.heading);
    if (title) {
      return title;
    }
    const number = Math.max(0, Number(values.index) || 0) + 1;
    return language === "zh" ? `第 ${number} 章` : `Chapter ${number}`;
  }

  function buildChapterRanges(parts) {
    let offset = 0;
    return (parts || []).map((part, index) => {
      const text = String(part.text || "");
      const chapter = {
        id: part.id || `chapter-${index + 1}`,
        index,
        title: String(part.title || ""),
        startOffset: offset,
        endOffset: offset + text.length
      };
      offset = chapter.endOffset + (index < parts.length - 1 ? 2 : 0);
      return chapter;
    });
  }

  function findChapterIndex(chapters, offset) {
    if (!Array.isArray(chapters) || chapters.length === 0) {
      return -1;
    }
    const target = Math.max(0, Number(offset) || 0);
    let low = 0;
    let high = chapters.length - 1;
    let result = 0;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (chapters[middle].startOffset <= target) {
        result = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return result;
  }

  function findImagesInRange(anchors, startOffset, endOffset) {
    const start = Math.max(0, Number(startOffset) || 0);
    const end = Math.max(start, Number(endOffset) || 0);
    if (end <= start) {
      return [];
    }
    return (anchors || []).filter((anchor) => anchor.textOffset >= start && anchor.textOffset < end);
  }

  function classifyImage(metadata = {}) {
    const width = Math.max(0, Number(metadata.width) || 0);
    const height = Math.max(0, Number(metadata.height) || 0);
    const alt = cleanText(metadata.alt);
    const caption = cleanText(metadata.caption);
    const occurrences = Math.max(1, Number(metadata.occurrences) || 1);
    const minSide = Math.min(width || Infinity, height || Infinity);
    const maxSide = Math.max(width, height);
    const extremeRatio = minSide !== Infinity && minSide > 0 && maxSide / minSide >= 12;

    if (metadata.inFigure || caption) {
      return "illustration";
    }
    if (extremeRatio && minSide <= 8 && !alt) {
      return "divider";
    }
    if (alt && maxSide > 0 && maxSide <= 32) {
      return "text";
    }
    if (!alt && occurrences >= 3 && maxSide > 0 && maxSide <= 32) {
      return "decorative";
    }
    return "illustration";
  }

  function getImageDimensions(value, mediaType = "") {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || 0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (mediaType === "image/png" && bytes.length >= 24) {
      return { width: view.getUint32(16), height: view.getUint32(20) };
    }
    if (mediaType === "image/gif" && bytes.length >= 10) {
      return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
    }
    if (mediaType === "image/webp" && bytes.length >= 30 && String.fromCharCode(...bytes.slice(12, 16)) === "VP8X") {
      const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      return { width, height };
    }
    if (mediaType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) {
      const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
      let offset = 2;
      while (offset + 8 < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = bytes[offset + 1];
        offset += 2;
        if (marker === 0xd8 || marker === 0xd9) continue;
        if (offset + 1 >= bytes.length) break;
        const length = view.getUint16(offset);
        if (length < 2 || offset + length > bytes.length) break;
        if (sofMarkers.has(marker) && length >= 7) {
          return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
        }
        offset += length;
      }
    }
    return { width: 0, height: 0 };
  }

  const api = {
    buildChapterRanges,
    classifyImage,
    findChapterIndex,
    findImagesInRange,
    getImageDimensions,
    normalizeArchivePath,
    resolveChapterTitle
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.IntextReaderEpubModel = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
