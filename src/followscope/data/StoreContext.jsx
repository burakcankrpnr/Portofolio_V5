/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { analyzeLists } from "../lib/instagram/analyze.js";
import { compareSnapshots } from "../lib/instagram/compareSnapshots.js";
import { parseInstagramArchive } from "../lib/instagram/parseArchive.js";
import {
  clearAllSnapshots,
  deleteSnapshot,
  getCurrentSnapshotId,
  listSnapshots,
  saveSnapshot,
} from "../lib/storage/snapshotStorage.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [snapshots, setSnapshots] = useState([]);
  const [currentId, setCurrentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [lastMeta, setLastMeta] = useState(null);

  const refresh = useCallback(async () => {
    const [list, id] = await Promise.all([listSnapshots(), getCurrentSnapshotId()]);
    setSnapshots(list);
    setCurrentId(id || list[0]?.id || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err.message || "Yerel geçmiş okunamadı");
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const current = useMemo(
    () => snapshots.find((item) => item.id === currentId) || snapshots[0] || null,
    [snapshots, currentId]
  );

  const previous = useMemo(() => {
    if (!current) return null;
    const older = snapshots.filter((item) => item.id !== current.id);
    return older[0] || null;
  }, [snapshots, current]);

  const analysis = useMemo(
    () => (current ? analyzeLists(current.followers, current.following) : null),
    [current]
  );

  const changes = useMemo(
    () => compareSnapshots(previous, current || { id: "", createdAt: "", followers: [], following: [] }),
    [previous, current]
  );

  const importArchive = useCallback(async (file) => {
    setBusy(true);
    setError("");
    setWarnings([]);
    try {
      const result = await parseInstagramArchive(file);
      if (!result.ok) {
        setError(result.error || "Arşiv okunamadı");
        return result;
      }
      await saveSnapshot(result.snapshot);
      setWarnings(result.warnings || []);
      setLastMeta(result.meta || null);
      await refresh();
      setCurrentId(result.snapshot.id);
      return result;
    } catch (err) {
      const message = err.message || "Arşiv işlenemedi";
      setError(message);
      return { ok: false, error: message };
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const selectSnapshot = useCallback((id) => {
    setCurrentId(id);
  }, []);

  const removeSnapshot = useCallback(async (id) => {
    await deleteSnapshot(id);
    await refresh();
  }, [refresh]);

  const clearHistory = useCallback(async () => {
    await clearAllSnapshots();
    setSnapshots([]);
    setCurrentId("");
    setWarnings([]);
    setLastMeta(null);
    setError("");
  }, []);

  const value = {
    bootstrapped,
    busy,
    error,
    setError,
    warnings,
    lastMeta,
    snapshots,
    current,
    previous,
    analysis,
    changes,
    importArchive,
    selectSnapshot,
    removeSnapshot,
    clearHistory,
    refresh,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFollowScope() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useFollowScope StoreProvider içinde kullanılmalı");
  return value;
}
