import { Link } from "react-router-dom";
import Button from "../ui/Button";

export default function Landing() {
  return (
    <div className="page">
      <header className="nav">
        <div className="brand">AirJustice</div>
        <nav className="nav-actions">
          {/* Passenger quick entry */}
          <Link to="/check" className="link">Passager</Link>
          <Link to="/track" className="link">Suivre un dossier</Link>

          <Link to="/partner/login" className="link">Se connecter</Link>
          <Link to="/partner/apply" className="link">Devenir partenaire</Link>

          {/* Passenger CTA */}
          <Link to="/check">
            <Button>Ajouter la protection AirJustice</Button>
          </Link>
        </nav>
      </header>

      <main className="container">
        <section className="hero card">
          <div className="hero-text">
            <h1>AirJustice — Accédez à vos droits en cas de retard ou annulation</h1>
            <p className="muted">
              Sélectionnez votre vol, payez le service, puis recevez une notification après le vol.
              Si perturbation, on vous explique les règles et on vous donne un lien pour déposer une réclamation.
            </p>

            <div className="hero-cta">
              <Link to="/check">
                <Button>Ajouter la protection AirJustice</Button>
              </Link>

              <Link to="/track">
                <Button variant="ghost">Suivre mon dossier</Button>
              </Link>

              <Link to="/partner/apply">
                <Button variant="secondary">Devenir partenaire</Button>
              </Link>
            </div>

            <p className="note">
              *AirJustice n’est pas une assurance et ne garantit pas une indemnisation. Il facilite l’accès à vos droits.
            </p>
          </div>

          <div className="hero-side">
            <div className="stat">
              <div className="stat-num">4 étapes</div>
              <div className="stat-text">Choisir vol → payer → voyage → notification</div>
            </div>
            <div className="stat">
              <div className="stat-num">EU261</div>
              <div className="stat-text">Retard ≥ 3h / annulation / surbooking</div>
            </div>
          </div>
        </section>

        {/* ✅ Passenger section */}
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Vous êtes passager ?</h2>
          <p className="muted">
            Aucun compte n’est nécessaire. Après paiement, vous recevez un <b>code de suivi</b> (Email + SMS).
            Après votre vol, nous vérifions automatiquement s’il y a eu une perturbation et nous vous notifions :
            <br />
            • S’il n’y a pas de retard/annulation : vous recevez une confirmation.
            <br />
            • S’il y a une perturbation : vous recevez les règles applicables + une estimation + un lien pour déposer une réclamation.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link to="/check" className="btn btn-primary">Ajouter la protection AirJustice</Link>
            <Link to="/track" className="btn btn-secondary">J’ai un code de suivi</Link>
          </div>

          <div
            className="grid"
            style={{
              marginTop: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div className="card" style={{ padding: 14 }}>
              <h3>1) Choisir le vol</h3>
              <p className="muted">Sélectionnez votre vol (comme un moteur de réservation).</p>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h3>2) Payer le service</h3>
              <p className="muted">Paiement unique. Vous recevez un code de suivi.</p>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h3>3) Notifications</h3>
              <p className="muted">Email + SMS : “Votre vol sera analysé après le voyage”.</p>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h3>4) Après le vol</h3>
              <p className="muted">Résultat + règles + lien de réclamation si éligible.</p>
            </div>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 16 }}>
          {[
            ["1) Acheter", "Paiement simple (8 TND) avant votre vol."],
            ["2) Ajouter votre vol", "Numéro de vol, date, email & téléphone."],
            ["3) En cas de perturbation", "Notification SMS / email automatique."],
            ["4) Accès partenaire", "Lien direct pour lancer la démarche."],
          ].map(([title, text]) => (
            <div key={title} className="card">
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        <span className="muted">© {new Date().getFullYear()} AirJustice</span>
      </footer>
    </div>
  );
}