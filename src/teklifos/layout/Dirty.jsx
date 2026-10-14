/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "../ui/ui.jsx";

const DirtyContext = createContext(null);

export function DirtyProvider({ children }) {
  const navigate = useNavigate();
  const dirtyRef = useRef(false);
  const [dirty, setDirtyState] = useState(false);
  const [pending, setPending] = useState(null);

  const setDirty = useCallback((value) => {
    dirtyRef.current = value;
    setDirtyState(value);
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const attempt = useCallback((to) => {
    if (!dirtyRef.current) {
      navigate(to);
      return;
    }
    setPending(to);
  }, [navigate]);

  const releaseAndGo = useCallback((to) => {
    dirtyRef.current = false;
    setDirtyState(false);
    navigate(to);
  }, [navigate]);

  const value = useMemo(() => ({ dirty, setDirty, attempt, releaseAndGo }), [dirty, setDirty, attempt, releaseAndGo]);

  return (
    <DirtyContext.Provider value={value}>
      {children}
      <Modal open={Boolean(pending)} title="Kaydedilmemiş değişiklik" onClose={() => setPending(null)}>
        <p>Bu sayfadaki değişiklikler henüz kaydedilmedi. Yine de ayrılsın mı?</p>
        <div className="tos-page-actions">
          <Button variant="secondary" onClick={() => setPending(null)}>Sayfada kal</Button>
          <Button
            variant="danger"
            onClick={() => {
              const next = pending;
              dirtyRef.current = false;
              setDirtyState(false);
              setPending(null);
              navigate(next);
            }}
          >
            Ayrıl
          </Button>
        </div>
      </Modal>
    </DirtyContext.Provider>
  );
}

export function useDirty() {
  return useContext(DirtyContext);
}
