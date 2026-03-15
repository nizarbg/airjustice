import { useEffect, useRef, useState } from "react";

export default function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-ghost"
        style={{ fontSize: 18, padding: "4px 8px" }}
        onClick={() => setOpen((o) => !o)}
        title="Langue"
        aria-label="Changer la langue"
      >
        🌐
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 1000,
            minWidth: 130,
            padding: 6,
          }}
        >
          {[
            { code: "fr", label: "🇫🇷 Français" },
            { code: "ar", label: "🇹🇳 العربية" },
          ].map(({ code, label }) => (
            <button
              key={code}
              className="btn btn-ghost"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                fontWeight: lang === code ? 700 : 400,
              }}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
            >
              {label} {lang === code ? "✓" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
