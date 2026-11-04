const DB_NAME = "beril-translations";
const DB_VERSION = 1;
const STORE = "items";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB açılamadı"));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB işlemi başarısız"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB iptal"));
  });
}

/**
 * @param {{ id: string, name: string, pageCount: number|null, blob: Blob, createdAt?: number }} item
 */
export async function saveHistoryItem(item) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({
    id: item.id,
    name: item.name,
    pageCount: item.pageCount ?? null,
    blob: item.blob,
    createdAt: item.createdAt || Date.now(),
  });
  await txDone(tx);
  db.close();
}

/** @returns {Promise<Array<{ id: string, name: string, pageCount: number|null, blob: Blob, createdAt: number }>>} */
export async function listHistory() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const req = store.getAll();
  const rows = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function removeHistoryItem(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

export async function clearHistory() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).clear();
  await txDone(tx);
  db.close();
}

export function formatHistoryDate(ts) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}
