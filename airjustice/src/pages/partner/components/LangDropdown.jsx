import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.closest("[data-lang-dropdown]")?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    setOpen((o) => !o);
  };

  return (
    <div data-lang-dropdown="" style={{ position: "relative" }}>
      <button
        ref={btnRef}
        className="btn btn-ghost"
        style={{ fontSize: 18, padding: "4px 8px" }}
        onClick={handleOpen}
        title="Langue"
        aria-label="Changer la langue"
      >
        🌐
      </button>

      {open && createPortal(
        <div
          data-lang-dropdown=""
          className="card"
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            zIndex: 9999,
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
        </div>,
        document.body
      )}
    </div>
  );
}
