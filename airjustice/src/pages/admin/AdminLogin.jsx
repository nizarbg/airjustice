import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../ui/Input";
import Button from "../../ui/Button";

const API = "http://localhost:8080";

export default function AdminLogin() {
  const nav = useNavigate();
  const { loginAdmin } = useAuth();
  const [form, setForm] = useState({ email: "owner@airjustice.local", password: "Owner123!" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(API + "/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Connexion admin impossible.");
      loginAdmin(data);
      nav("/admin/dashboard");
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Connexion administrateur</h2>
        <p className="muted mt-2">Espace propriétaire du projet pour gérer les inscriptions agences.</p>
        {err && <div className="alert">{err}</div>}

        <form className="form" onSubmit={submit}>
          <Input
            label="Email admin"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <Button type="submit" disabled={loading}>{loading ? "..." : "Se connecter"}</Button>
          <div className="auth-links">
            <Link className="link" to="/partner/apply">Voir le parcours agence</Link>
            <Link className="link" to="/">← Retour</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

