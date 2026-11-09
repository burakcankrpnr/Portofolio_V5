/* eslint-disable react/prop-types */

export function PageHeader({ title, description, actions }) {
  return (
    <div className="fs-page-header" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="fs-card fs-empty">
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function Button({ variant = "secondary", type = "button", className = "", ...props }) {
  return <button type={type} className={`fs-btn fs-btn-${variant} ${className}`} {...props} />;
}

export function Note({ children }) {
  return <div className="fs-note" role="note">{children}</div>;
}
