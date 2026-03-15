export default function Stepper({ steps, activeIndex }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {steps.map((s, idx) => {
        const state =
          idx < activeIndex ? "done" : idx === activeIndex ? "active" : "todo";

        return (
          <div
            key={s.key}
            className="card"
            style={{
              padding: 10,
              minWidth: 190,
              border:
                state === "active"
                  ? "1px solid rgba(255,255,255,.35)"
                  : "1px solid rgba(255,255,255,.10)",
              opacity: state === "todo" ? 0.7 : 1,
            }}
          >
            <div style={{ fontWeight: 800 }}>
              {idx + 1}. {s.label}
            </div>
            <div className="muted small">{s.hint}</div>
          </div>
        );
      })}
    </div>
  );
}
