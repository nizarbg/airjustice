export default function Toasts({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: 360,
        maxWidth: "calc(100vw - 28px)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="card"
          style={{
            padding: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background:
              t.type === "success"
                ? "rgba(24,160,88,.15)"
                : t.type === "error"
                ? "rgba(220,38,38,.15)"
                : "rgba(255,255,255,.06)",
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
          >
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {t.type === "success"
                  ? "Succès"
                  : t.type === "error"
                  ? "Erreur"
                  : "Info"}
              </div>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {t.message}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ height: 34 }}
              onClick={() => onClose(t.id)}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
