import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

export default function PartnerApply() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    agencyName: "",
    managerName: "",
    email: "",
    phone: "",
    city: "",
    country: "Tunisie",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const API = "http://localhost:8080";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (form.password.length < 8) {
      setErr("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErr("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API + "/api/partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: form.agencyName,
          managerName: form.managerName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          country: form.country,
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur");
      nav(`/partner/verify?email=${encodeURIComponent(form.email)}&agency=${encodeURIComponent(form.agencyName)}&manager=${encodeURIComponent(form.managerName)}`);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Inscription rapide</h2>
        <p className="muted mt-2 text-sm">
          Rejoignez le programme partenaire et commencez votre demande de compte agence.
        </p>
        <p className="muted small">Les champs marqués d'un * sont obligatoires.</p>
        {err && <div className="alert">{err}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div style={{ marginBottom: 14 }}>
            <h4 className="muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Informations agence</h4>
            <Input
              label="Nom de l'agence *"
              name="agencyName"
              value={form.agencyName}
              onChange={handleChange}
              required
            />
            <Input
              label="Ville *"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
            <label className="field">
              <span className="label">Pays *</span>
              <select
                className="input"
                name="country"
                value={form.country}
                onChange={handleChange}
                required
              >
                <option value="Tunisie">Tunisie</option>
                <option value="Algérie">Algérie</option>
                <option value="Maroc">Maroc</option>
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Canada">Canada</option>
                <option value="Autre">Autre</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: 14 }}>
            <h4 className="muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Responsable principal</h4>
            <Input
              label="Nom & Prénom *"
              name="managerName"
              value={form.managerName}
              onChange={handleChange}
              required
            />
            <Input
              label="Email professionnel *"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Téléphone *"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Mot de passe *"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Confirmer le mot de passe *"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <label className="checkbox">
            <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} required />
            J'accepte les conditions générales et la protection des données
          </label>

          <Button className="mt-1" type="submit" disabled={loading}>{loading ? "..." : "Créer mon compte"}</Button>
        </form>
      </div>
    </div>
  );
}
