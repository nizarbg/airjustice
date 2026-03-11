import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { loginRequest } from "../auth/authApi";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await loginRequest({ email, password });
      login(data);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page center">
      <div className="card auth-card">
        <div className="auth-head">
          <h2>Connexion</h2>
          <p className="muted">Accédez à vos vols et services AirJustice.</p>
        </div>

        {err && <div className="alert">{err}</div>}

        <form onSubmit={onSubmit} className="form">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: demo@airjustice.tn"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ex: demo123"
            required
          />

          <Button className="mt-1" disabled={loading} type="submit">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="auth-links">
            <Link className="link" to="/">← Retour</Link>
            <Link className="link" to="/partner/apply">Vous êtes une agence ? Devenir partenaire</Link>
            <a className="link" href="#" onClick={(e) => { e.preventDefault(); alert("TODO: forgot password"); }}>
              Mot de passe oublié
            </a>
          </div>
        </form>

        <div className="muted small mt-5 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
          Demo: <b>demo@airjustice.tn</b> / <b>demo123</b>
        </div>
      </div>
    </div>
  );
}
