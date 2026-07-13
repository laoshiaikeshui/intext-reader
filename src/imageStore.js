(function attachImageStore(root) {
  const DATABASE_NAME = "intext-reader-books";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "images";

  function toArrayBuffer(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || 0);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  function encodeImageBytes(value) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || 0);
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return root.btoa(binary);
  }

  function createImageRepository(adapter) {
    return {
      async saveBook(bookId, images) {
        if (!bookId) throw new Error("bookId is required");
        const records = (images || []).map((image) => ({
          bookId,
          imageId: image.id,
          mediaType: image.mediaType,
          bytes: toArrayBuffer(image.bytes)
        }));
        await adapter.putMany(records);
        return records.length;
      },
      getImage(bookId, imageId) {
        return adapter.get(bookId, imageId);
      },
      deleteBook(bookId) {
        return bookId ? adapter.deleteBook(bookId) : Promise.resolve();
      }
    };
  }

  function openImageDatabase(indexedDB = root.indexedDB) {
    return new Promise((resolve, reject) => {
      if (!indexedDB) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: ["bookId", "imageId"] });
          store.createIndex("bookId", "bookId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Unable to open image database"));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Image transaction failed"));
      transaction.onabort = () => reject(transaction.error || new Error("Image transaction aborted"));
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Image request failed"));
    });
  }

  function createIndexedDbAdapter(indexedDB = root.indexedDB) {
    return {
      async putMany(records) {
        if (records.length === 0) return;
        const database = await openImageDatabase(indexedDB);
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        records.forEach((record) => store.put(record));
        await transactionDone(transaction);
        database.close();
      },
      async get(bookId, imageId) {
        const database = await openImageDatabase(indexedDB);
        const transaction = database.transaction(STORE_NAME, "readonly");
        const result = await requestResult(transaction.objectStore(STORE_NAME).get([bookId, imageId]));
        database.close();
        return result;
      },
      async deleteBook(bookId) {
        const database = await openImageDatabase(indexedDB);
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const index = transaction.objectStore(STORE_NAME).index("bookId");
        const range = root.IDBKeyRange?.only(bookId);
        const request = range ? index.openCursor(range) : index.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (cursor.value.bookId === bookId) cursor.delete();
          cursor.continue();
        };
        await transactionDone(transaction);
        database.close();
      }
    };
  }

  async function handleImageMessage(message, repository) {
    if (message?.action === "image-get") {
      const record = await repository.getImage(message.bookId, message.imageId);
      return record
        ? { ok: true, mediaType: record.mediaType, base64: encodeImageBytes(record.bytes) }
        : { ok: false, reason: "image-not-found" };
    }
    if (message?.action === "image-delete-book") {
      await repository.deleteBook(message.bookId);
      return { ok: true };
    }
    return { ok: false, reason: "unsupported-action" };
  }

  const api = {
    createImageRepository,
    createIndexedDbAdapter,
    encodeImageBytes,
    handleImageMessage,
    openImageDatabase
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntextReaderImageStore = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
