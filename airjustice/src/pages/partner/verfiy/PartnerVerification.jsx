import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

export default function PartnerVerification() {
  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Vérification administrative</h2>
        <p className="muted mt-2">
          Merci de fournir les documents suivants pour activer votre compte partenaire.
        </p>

        <form className="form">
          <Input placeholder="Numéro Registre de Commerce" required />
          <Input placeholder="Matricule fiscale" required />
          <Input placeholder="Code IATA (optionnel)" />

          <label className="field">
            <span className="label">Autorisation d'exercice (PDF / image)</span>
            <div className="muted small">Téléverser un PDF ou une image</div>
            <input
              type="file"
              className="input"
              required
            />
            <div className="muted small" style={{ marginTop: 6 }}>
              Formats acceptés : PDF, JPG, PNG
            </div>
          </label>

          <Button type="submit">Valider mes documents</Button>
        </form>
      </div>
    </div>
  );
}
