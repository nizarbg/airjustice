import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { useAuth } from "../../auth/AuthContext";

const API = "http://localhost:8080";

export default function PartnerLogin() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("login"); // login | otp
  const [identifier, setIdentifier] = useState(""); // ✅ email OR username
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function post(url, body, token) {
    const res = await fetch(API + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Erreur");
    return data;
  }

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await post("/api/partner/auth/login", { identifier, password });

      if (data.twoFactorRequired) {
        setTempToken(data.tempToken);
        setStep("otp");
      } else {
        login({ token: data.token, user: data.user });
        nav("/partner/dashboard");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await post("/api/partner/auth/verify-otp", { otp }, tempToken);
      login({ token: data.token, user: data.user });
      nav("/partner/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Connexion Partenaire</h2>
        <p className="muted">Connectez-vous avec votre email ou votre nom d’utilisateur.</p>

        {err && <div className="alert">{err}</div>}

        {step === "login" ? (
          <form onSubmit={onLogin} className="form">
            <Input
              label="Email ou nom d’utilisateur"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ex: user@email.com ou amal.bts"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button disabled={loading} type="submit">
              {loading ? "..." : "Se connecter"}
            </Button>

            <div className="auth-links">
              <Link className="link" to="/partner/apply">Devenir partenaire</Link>
              <Link className="link" to="/">← Retour</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="form">
            <Input
              label="Code OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <Button disabled={loading} type="submit">
              {loading ? "..." : "Vérifier"}
            </Button>
            <button className="btn btn-ghost" type="button" onClick={() => setStep("login")}>
              Retour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}