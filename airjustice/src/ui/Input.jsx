export default function Input({ label, error, ...props }) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      <input className={`input ${error ? "input-error" : ""}`} {...props} />
      {error && <span className="error">{error}</span>}
    </label>
  );
}
