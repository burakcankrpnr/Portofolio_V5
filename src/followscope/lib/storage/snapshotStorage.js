const DB_NAME = "followscope.v1";
const STORE = "snapshots";
const META = "meta";

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB açılamadı"));
  });
}

/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
function req(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB hatası"));
  });
}

/**
 * @returns {Promise<import("../../types/instagram.js").InstagramSnapshot[]>}
 */
export async function listSnapshots() {
  const db = await openDb();
  try {
    const rows = await req(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
    return (rows || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } finally {
    db.close();
  }
}

/**
 * @param {import("../../types/instagram.js").InstagramSnapshot} snapshot
 */
export async function saveSnapshot(snapshot) {
  const db = await openDb();
  try {
    const tx = db.transaction([STORE, META], "readwrite");
    await Promise.all([
      req(tx.objectStore(STORE).put(snapshot)),
      req(tx.objectStore(META).put({ key: "currentId", value: snapshot.id })),
    ]);
    return snapshot;
  } finally {
    db.close();
  }
}

export async function getCurrentSnapshotId() {
  const db = await openDb();
  try {
    const row = await req(db.transaction(META, "readonly").objectStore(META).get("currentId"));
    return row?.value || "";
  } finally {
    db.close();
  }
}

/**
 * @param {string} id
 */
export async function deleteSnapshot(id) {
  const db = await openDb();
  try {
    const tx = db.transaction([STORE, META], "readwrite");
    await req(tx.objectStore(STORE).delete(id));
    const current = await req(tx.objectStore(META).get("currentId"));
    if (current?.value === id) {
      const remaining = await req(tx.objectStore(STORE).getAll());
      const next = (remaining || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
      if (next) await req(tx.objectStore(META).put({ key: "currentId", value: next.id }));
      else await req(tx.objectStore(META).delete("currentId"));
    }
  } finally {
    db.close();
  }
}

export async function clearAllSnapshots() {
  const db = await openDb();
  try {
    const tx = db.transaction([STORE, META], "readwrite");
    await Promise.all([
      req(tx.objectStore(STORE).clear()),
      req(tx.objectStore(META).clear()),
    ]);
  } finally {
    db.close();
  }
}
