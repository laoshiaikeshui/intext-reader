(function attachEpubArchive(root) {
  const DEFAULT_LIMITS = {
    maxEntries: 10000,
    maxExpandedBytes: 512 * 1024 * 1024,
    maxEntryBytes: 64 * 1024 * 1024
  };

  function archiveError(code, details = {}) {
    const error = new Error(code);
    error.code = code;
    error.details = details;
    return error;
  }

  function normalizeEntryPath(path) {
    const raw = String(path || "").replace(/\\/g, "/");
    if (!raw || raw.includes("\0") || raw.startsWith("/") || /^[a-z]:/i.test(raw)) {
      throw archiveError("EPUB_ARCHIVE_PATH_UNSAFE", { path });
    }
    const parts = [];
    for (const part of raw.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") {
        if (parts.length === 0) throw archiveError("EPUB_ARCHIVE_PATH_UNSAFE", { path });
        parts.pop();
      } else {
        parts.push(part);
      }
    }
    if (parts.length === 0) throw archiveError("EPUB_ARCHIVE_PATH_UNSAFE", { path });
    return parts.join("/");
  }

  function unzipAsync(bytes, unzip) {
    return new Promise((resolve, reject) => {
      try {
        unzip(bytes, (error, files) => {
          if (error) {
            reject(error.code ? error : archiveError("EPUB_ARCHIVE_INVALID", { message: error.message || "Invalid ZIP" }));
            return;
          }
          if (!files || typeof files !== "object") {
            reject(archiveError("EPUB_ARCHIVE_INVALID", { message: error?.message || "Invalid ZIP" }));
            return;
          }
          resolve(files);
        });
      } catch (error) {
        reject(archiveError("EPUB_ARCHIVE_INVALID", { message: error?.message || String(error) }));
      }
    });
  }

  function createDefaultUnzip(limits) {
    if (typeof root.fflate?.unzip !== "function") return null;
    return (bytes, callback) => {
      let preflightError = null;
      let entryCount = 0;
      let expandedBytes = 0;
      const paths = new Set();
      const inspectEntry = (entry) => {
        if (preflightError) return false;
        try {
          const path = normalizeEntryPath(entry?.name);
          if (paths.has(path)) throw archiveError("EPUB_ARCHIVE_DUPLICATE_PATH", { path });
          paths.add(path);
          entryCount += 1;
          if (entryCount > limits.maxEntries) {
            throw archiveError("EPUB_ARCHIVE_TOO_MANY_ENTRIES", { count: entryCount, limit: limits.maxEntries });
          }
          const size = Math.max(0, Number(entry?.originalSize) || 0);
          if (size > limits.maxEntryBytes) {
            throw archiveError("EPUB_ARCHIVE_ENTRY_TOO_LARGE", { path, size, limit: limits.maxEntryBytes });
          }
          expandedBytes += size;
          if (expandedBytes > limits.maxExpandedBytes) {
            throw archiveError("EPUB_ARCHIVE_TOO_LARGE", { size: expandedBytes, limit: limits.maxExpandedBytes });
          }
        } catch (error) {
          preflightError = error;
        }
        return false;
      };
      root.fflate.unzip(bytes, { filter: inspectEntry }, (scanError) => {
        if (scanError || preflightError) {
          callback(preflightError || scanError);
          return;
        }
        root.fflate.unzip(bytes, { filter: () => true }, callback);
      });
    };
  }

  async function extractEpubArchive(arrayBuffer, options = {}) {
    const maxEntries = Number(options.maxEntries) || DEFAULT_LIMITS.maxEntries;
    const maxExpandedBytes = Number(options.maxExpandedBytes) || DEFAULT_LIMITS.maxExpandedBytes;
    const maxEntryBytes = Number(options.maxEntryBytes) || DEFAULT_LIMITS.maxEntryBytes;
    const limits = { maxEntries, maxExpandedBytes, maxEntryBytes };
    const unzip = options.unzip || createDefaultUnzip(limits);
    if (typeof unzip !== "function") {
      throw archiveError("EPUB_ARCHIVE_LIBRARY_UNAVAILABLE");
    }
    const extracted = await unzipAsync(new Uint8Array(arrayBuffer), unzip);
    const entries = Object.entries(extracted);
    if (entries.length > maxEntries) {
      throw archiveError("EPUB_ARCHIVE_TOO_MANY_ENTRIES", { count: entries.length, limit: maxEntries });
    }

    const files = Object.create(null);
    let expandedBytes = 0;
    for (const [rawPath, value] of entries) {
      const path = normalizeEntryPath(rawPath);
      if (Object.prototype.hasOwnProperty.call(files, path)) {
        throw archiveError("EPUB_ARCHIVE_DUPLICATE_PATH", { path });
      }
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      if (bytes.byteLength > maxEntryBytes) {
        throw archiveError("EPUB_ARCHIVE_ENTRY_TOO_LARGE", { path, size: bytes.byteLength, limit: maxEntryBytes });
      }
      expandedBytes += bytes.byteLength;
      if (expandedBytes > maxExpandedBytes) {
        throw archiveError("EPUB_ARCHIVE_TOO_LARGE", { size: expandedBytes, limit: maxExpandedBytes });
      }
      files[path] = bytes;
    }

    return { files, entryCount: entries.length, expandedBytes };
  }

  const api = { DEFAULT_LIMITS, extractEpubArchive };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderEpubArchive = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
