/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, Clock, MoreHorizontal, Send, X } from "lucide-react";
import { formatPercent, formatPlainAmount, parseMoneyToKurus, parsePercentToBps } from "../domain/money.js";

const ToastContext = createContext(() => {});
const ConfirmContext = createContext(async () => false);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (message, tone = "info") => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((toast) => toast.id !== id));
    }, 3400);
  };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="tos-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`tos-toast tos-toast-${toast.tone}`}>{toast.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = (options) => new Promise((resolve) => {
    setRequest({ ...options, resolve });
  });
  const close = (value) => {
    request?.resolve(value);
    setRequest(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={Boolean(request)} title={request?.title || "Onay"} onClose={() => close(false)}>
        <p>{request?.body}</p>
        <div className="tos-page-actions">
          <Button variant="secondary" onClick={() => close(false)}>Vazgeç</Button>
          <Button variant={request?.danger ? "danger" : "primary"} onClick={() => close(true)}>
            {request?.confirmLabel || "Onayla"}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function Button({ variant = "secondary", className = "", type = "button", ...props }) {
  return <button type={type} className={`tos-btn tos-btn-${variant} ${className}`} {...props} />;
}

export function Field({ label, hint, error, children }) {
  const id = useId();
  return (
    <div className="tos-field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      {typeof children === "function" ? children(id, error) : children}
      {error ? <p className="tos-error" role="alert">{error}</p> : hint ? <p className="tos-hint">{hint}</p> : null}
    </div>
  );
}

export function TextField({ label, hint, error, ...props }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, invalid) => (
        <input id={id} className="tos-input" aria-invalid={invalid ? "true" : "false"} {...props} />
      )}
    </Field>
  );
}

export function TextArea({ label, hint, error, ...props }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, invalid) => (
        <textarea id={id} className="tos-textarea" aria-invalid={invalid ? "true" : "false"} {...props} />
      )}
    </Field>
  );
}

export function SelectField({ label, hint, error, children, ...props }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, invalid) => (
        <select id={id} className="tos-select" aria-invalid={invalid ? "true" : "false"} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function MoneyField({ label, kurus, onValue, error, disabled, hint }) {
  const [text, setText] = useState(() => formatPlainAmount(kurus || 0));
  const [localError, setLocalError] = useState("");
  useEffect(() => {
    setText(formatPlainAmount(kurus || 0));
  }, [kurus]);
  return (
    <TextField
      label={label}
      hint={hint}
      error={error || localError}
      disabled={disabled}
      inputMode="decimal"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        if (!String(text).trim()) {
          setLocalError("");
          onValue(0);
          return;
        }
        const parsed = parseMoneyToKurus(text);
        if (parsed == null) {
          setLocalError("Tutar okunamadı");
          return;
        }
        setLocalError("");
        onValue(parsed);
        setText(formatPlainAmount(parsed));
      }}
    />
  );
}

export function PercentField({ label, bps, onValue, error, disabled, hint }) {
  const [text, setText] = useState(() => formatPercent(bps || 0).replace("%", ""));
  const [localError, setLocalError] = useState("");
  useEffect(() => {
    setText(formatPercent(bps || 0).replace("%", ""));
  }, [bps]);
  return (
    <TextField
      label={label}
      hint={hint || "Yüzde"}
      error={error || localError}
      disabled={disabled}
      inputMode="decimal"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        if (!String(text).trim()) {
          setLocalError("");
          onValue(0);
          return;
        }
        const parsed = parsePercentToBps(text);
        if (parsed == null) {
          setLocalError("Oran okunamadı");
          return;
        }
        setLocalError("");
        onValue(parsed);
      }}
    />
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="tos-page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="tos-page-actions">{actions}</div> : null}
    </div>
  );
}

const STATUS_ICON = {
  draft: Clock,
  preparing: Clock,
  sent: Send,
  approved: Check,
  rejected: X,
  expired: AlertCircle,
};

const STATUS_TONE = {
  draft: "",
  preparing: "tos-badge-warning",
  sent: "tos-badge-info",
  approved: "tos-badge-success",
  rejected: "tos-badge-danger",
  expired: "tos-badge-warning",
};

export function StatusBadge({ status, label }) {
  const Icon = STATUS_ICON[status] || AlertCircle;
  return (
    <span className={`tos-badge ${STATUS_TONE[status] || ""}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Badge({ tone = "", children }) {
  return <span className={`tos-badge ${tone ? `tos-badge-${tone}` : ""}`}>{children}</span>;
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="tos-empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Pagination({ page, pages, onPage, total }) {
  if (pages <= 1) return null;
  return (
    <div className="tos-pagination">
      <span>{total} kayıt</span>
      <div className="tos-page-actions">
        <Button disabled={page <= 1} onClick={() => onPage(page - 1)}>Önceki</Button>
        <span>{page} / {pages}</span>
        <Button disabled={page >= pages} onClick={() => onPage(page + 1)}>Sonraki</Button>
      </div>
    </div>
  );
}

export function usePage(items, size = 8) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(page, pages);
  const slice = items.slice((safePage - 1) * size, safePage * size);
  return { page: safePage, pages, slice, setPage, total: items.length };
}

export function Modal({ open, title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.activeElement;
    ref.current?.querySelector("input, select, textarea, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="tos-modal-backdrop" onMouseDown={onClose}>
      <div
        className="tos-modal"
        style={wide ? { width: "min(920px, 100%)" } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tos-dialog-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="tos-dialog-title">{title}</h2>
          <button type="button" className="tos-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>
        <div className="tos-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function RowMenu({ label = "İşlemler", items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div className="tos-menu" ref={ref}>
      <button type="button" className="tos-icon-btn" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="tos-menu-pop" role="menu">
          {items.filter(Boolean).map((item) => (
            <button
              type="button"
              role="menuitem"
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Thumb({ name, image }) {
  if (image) return <img className="tos-thumb" alt="" src={image} />;
  const letter = (name || "?").trim().slice(0, 1).toLocaleUpperCase("tr-TR");
  return <span className="tos-avatar" aria-hidden="true">{letter}</span>;
}

export function DemoBanner() {
  return (
    <div className="tos-demo" role="note">
      <AlertCircle size={16} aria-hidden="true" />
      <span>Ürünler Teklif_Urun_Secimli dosyasının EUR sayfasından okundu ve yalnızca bu tarayıcıda durur. Dosyadaki %64 iskonto bilgi olarak kayıtlıdır; satış fiyatının üstüne tekrar uygulanmaz.</span>
    </div>
  );
}
