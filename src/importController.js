(function attachImportController(root) {
  const IMPORT_ERROR_TRANSLATIONS = {
    EPUB_CONTAINER_MISSING: "error_EPUB_CONTAINER_MISSING",
    EPUB_PACKAGE_MISSING: "error_EPUB_PACKAGE_MISSING",
    EPUB_SPINE_EMPTY: "error_EPUB_SPINE_EMPTY",
    EPUB_TEXT_EMPTY: "error_EPUB_TEXT_EMPTY",
    EPUB_FIXED_LAYOUT_UNSUPPORTED: "error_EPUB_FIXED_LAYOUT_UNSUPPORTED",
    EPUB_DRM_UNSUPPORTED: "error_EPUB_DRM_UNSUPPORTED",
    EPUB_ARCHIVE_INVALID: "error_EPUB_ARCHIVE_INVALID",
    EPUB_ARCHIVE_LIBRARY_UNAVAILABLE: "error_EPUB_ARCHIVE_INVALID",
    EPUB_XML_INVALID: "error_EPUB_ARCHIVE_INVALID",
    EPUB_ARCHIVE_PATH_UNSAFE: "error_EPUB_ARCHIVE_PATH_UNSAFE",
    EPUB_ARCHIVE_DUPLICATE_PATH: "error_EPUB_ARCHIVE_PATH_UNSAFE",
    EPUB_PATH_UNSAFE: "error_EPUB_ARCHIVE_PATH_UNSAFE",
    EPUB_PATH_INVALID: "error_EPUB_ARCHIVE_PATH_UNSAFE",
    EPUB_PATH_EXTERNAL: "error_EPUB_ARCHIVE_PATH_UNSAFE",
    EPUB_ARCHIVE_TOO_MANY_ENTRIES: "error_EPUB_ARCHIVE_TOO_MANY_ENTRIES",
    EPUB_ARCHIVE_ENTRY_TOO_LARGE: "error_EPUB_ARCHIVE_ENTRY_TOO_LARGE",
    EPUB_ARCHIVE_TOO_LARGE: "error_EPUB_ARCHIVE_TOO_LARGE",
    EPUB_FILE_TOO_LARGE: "error_EPUB_FILE_TOO_LARGE"
  };

  function resolveImportErrorTranslationKey(code) {
    return IMPORT_ERROR_TRANSLATIONS[code] || "epubImportFailed";
  }

  function normalizeCleanupIds(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
      .map((value) => String(value || ""))
      .filter(Boolean)));
  }

  function createImportController(dependencies) {
    let state = { state: "idle", parsed: null, error: null };

    function setState(next) {
      state = { ...state, ...next };
      return state;
    }

    async function parseFile(file) {
      setState({ state: "parsing", parsed: null, error: null });
      try {
        const maxFileBytes = Number(dependencies.maxFileBytes) || 256 * 1024 * 1024;
        if (Number(file.size) > maxFileBytes) {
          const error = new Error("EPUB_FILE_TOO_LARGE");
          error.code = "EPUB_FILE_TOO_LARGE";
          throw error;
        }
        const buffer = await file.arrayBuffer();
        const archive = await dependencies.extractArchive(buffer);
        const parsed = await dependencies.parseEpubFiles(archive.files);
        return setState({ state: "ready", parsed, archive, error: null });
      } catch (error) {
        setState({ state: "error", parsed: null, error });
        throw error;
      }
    }

    async function commit(parsed = state.parsed) {
      if (!parsed) {
        const error = new Error("EPUB_IMPORT_NOT_READY");
        error.code = "EPUB_IMPORT_NOT_READY";
        throw error;
      }
      setState({ state: "saving", error: null });
      const current = await dependencies.storage.get();
      const oldBookId = current.sourceType === "epub" ? current.bookId : "";
      const pendingCleanupIds = normalizeCleanupIds(current.pendingImageCleanupIds);
      const bookId = dependencies.generateId();
      try {
        await dependencies.repository.saveBook(bookId, parsed.images);
        const book = dependencies.buildEpubBook(parsed, current, bookId);
        await dependencies.storage.set(book);
        const cleanupTargets = normalizeCleanupIds([
          ...pendingCleanupIds,
          oldBookId && oldBookId !== bookId ? oldBookId : ""
        ]);
        const failedCleanupIds = [];
        for (const cleanupBookId of cleanupTargets) {
          try {
            await dependencies.repository.deleteBook(cleanupBookId);
          } catch (cleanupError) {
            failedCleanupIds.push(cleanupBookId);
          }
        }
        book.pendingImageCleanupIds = failedCleanupIds;
        if (pendingCleanupIds.length > 0 || failedCleanupIds.length > 0) {
          try {
            await dependencies.storage.set({ pendingImageCleanupIds: failedCleanupIds });
          } catch (cleanupTrackingError) {
            // The active new book remains valid even if cleanup bookkeeping cannot be updated.
          }
        }
        try {
          await dependencies.restoreActivePage?.();
        } catch (restoreError) {
          // Closing or navigating the source tab must not roll back a successfully stored book.
        }
        return setState({ state: "success", parsed, book, error: null });
      } catch (error) {
        try {
          await dependencies.repository.deleteBook(bookId);
        } catch (cleanupError) {
          // Preserve the original failure; orphaned candidate data is harmless and replaced on the next import.
        }
        setState({ state: "error", error });
        throw error;
      }
    }

    return {
      commit,
      getState: () => state,
      parseFile
    };
  }

  const api = { createImportController, normalizeCleanupIds, resolveImportErrorTranslationKey };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderImportController = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
