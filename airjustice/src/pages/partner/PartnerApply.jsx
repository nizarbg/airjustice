import { useEffect, useRef, useState } from "react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

export default function PartnerApply() {
  const [form, setForm] = useState({
    agencyName: "",
    managerName: "",
    email: "",
    phone: "",
    city: "",
    country: "Tunisie",
    language: "fr",
    terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

 const API = "http://localhost:8080";

 const handleSubmit = async (e) => {
  e.preventDefault();
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
      language: form.language,
    }),
  });
  const data = await res.json();
  if (!res.ok) return alert(data.message || "Erreur");
  alert(data.message);
  };

  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Inscription Agence (60 secondes)</h2>

        <form onSubmit={handleSubmit} className="form">
          <Input label="Nom de l’agence" name="agencyName" onChange={handleChange} required />
          <Input label="Nom du responsable" name="managerName" onChange={handleChange} required />
          <Input label="Email professionnel" type="email" name="email" onChange={handleChange} required />
          <Input label="Téléphone (WhatsApp recommandé)" name="phone" onChange={handleChange} required />
          <Input label="Ville" name="city" onChange={handleChange} required />

          <label className="field">
            <span className="label">Langue préférée</span>
            <select name="language" className="input" onChange={handleChange}>
              <option value="fr">Français</option>
              <option value="ar">Arabe</option>
            </select>
          </label>

          <label className="checkbox">
            <input type="checkbox" name="terms" onChange={handleChange} required />
            J’accepte les conditions générales et la protection des données
          </label>

          <Button type="submit">Envoyer</Button>
        </form>
      </div>
    </div>
  );
}
