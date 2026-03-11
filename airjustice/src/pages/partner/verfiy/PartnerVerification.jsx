import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

const API = "http://localhost:8080";

export default function PartnerVerification() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    rcNumber: "",
    fiscalNumber: "",
    iataCode: "",
    file: null,
  });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!form.file) {
      setErr("Merci d'ajouter un document justificatif.");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append("email", form.email);
      body.append("rcNumber", form.rcNumber);
      body.append("fiscalNumber", form.fiscalNumber);
      body.append("iataCode", form.iataCode);
      body.append("file", form.file);

      const res = await fetch(API + "/api/partner/verify-submission", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Impossible d'envoyer les documents.");

      setSuccess("Documents transmis. Votre dossier est maintenant en attente d'approbation admin.");
      window.setTimeout(() => nav("/partner/login"), 1200);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Vérification administrative</h2>
        <p className="muted mt-2">
          Merci de fournir les documents suivants pour activer votre compte partenaire.
        </p>
        {err && <div className="alert">{err}</div>}
        {success && <div className="card" style={{ border: "1px solid rgba(34,197,94,.35)", background: "rgba(34,197,94,.08)" }}>{success}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <Input
            label="Email du compte *"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Numéro Registre de Commerce *"
            value={form.rcNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, rcNumber: e.target.value }))}
            required
          />
          <Input
            label="Matricule fiscale *"
            value={form.fiscalNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, fiscalNumber: e.target.value }))}
            required
          />
          <Input
            label="Code IATA (optionnel)"
            value={form.iataCode}
            onChange={(e) => setForm((prev) => ({ ...prev, iataCode: e.target.value }))}
          />

          <label className="field">
            <span className="label">Autorisation d'exercice</span>
            <div className="muted small">Téléverser un PDF ou une image</div>
            <input
              type="file"
              className="input"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              required
            />
            <div className="muted small" style={{ marginTop: 6 }}>
              Formats acceptés : PDF, JPG, PNG
            </div>
          </label>

          <Button type="submit" disabled={loading}>{loading ? "..." : "Valider mes documents"}</Button>
          <div className="auth-links">
            <Link className="link" to="/partner/login">J’ai déjà un compte</Link>
            <Link className="link" to="/">← Retour</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
