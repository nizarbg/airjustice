export default function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "btn " + (variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "btn-secondary");
  return <button className={`${base} ${className}`} {...props} />;
}
