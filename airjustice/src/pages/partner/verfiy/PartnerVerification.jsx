export default function PartnerVerification() {
  return (
    <div className="page center">
      <div className="card auth-card">
        <h2>Vérification administrative</h2>
        <p className="muted">
          Merci de fournir les documents suivants pour activer votre compte partenaire.
        </p>

        <form className="form">
          <input className="input" placeholder="Numéro Registre de Commerce" required />
          <input className="input" placeholder="Matricule fiscale" required />
          <input className="input" placeholder="Code IATA (optionnel)" />
          
          <label className="field">
            <span className="label">Autorisation d’exercice (PDF / image)</span>
            <input type="file" className="input" required />
          </label>

          <button className="btn btn-primary">Soumettre</button>
        </form>
      </div>
    </div>
  );
}
