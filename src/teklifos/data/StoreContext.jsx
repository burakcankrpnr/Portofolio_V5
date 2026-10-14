/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createActions, loadState, reducer, saveState } from "./store.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [storageError, setStorageError] = useState("");
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      saveState(state);
      setStorageError("");
    } catch {
      setStorageError("Tarayıcı deposu dolu. Görselleri küçültün veya veriyi dışa aktarıp sıfırlayın.");
    }
  }, [state]);

  const api = useMemo(() => createActions(dispatch, () => stateRef.current), []);

  const value = useMemo(() => ({ state, storageError, ...api }), [state, storageError, api]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore StoreProvider içinde kullanılmalı");
  return context;
}
