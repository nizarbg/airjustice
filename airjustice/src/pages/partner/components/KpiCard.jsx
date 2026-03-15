export default function KpiCard({ label, value, sub, color }) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        borderLeft: `3px solid ${color || "rgba(255,255,255,.2)"}`,
      }}
    >
      <div className="muted small">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
        {value ?? "–"}
      </div>
      {sub && (
        <div className="muted small" style={{ marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
