import { Link } from "react-router-dom";

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm font-medium text-slate-300 transition hover:text-white"
    >
      {children}
    </Link>
  );
}

function PrimaryButton({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 backdrop-blur">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function StatCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
      <div className="text-lg font-bold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-400">{text}</div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.20),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.12),transparent_25%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/30">
              AJ
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">AirJustice</div>
              <div className="text-xs text-slate-400">Flight disruption protection flow</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/check">Passager</NavLink>
            <NavLink to="/track">Suivre un dossier</NavLink>
            <NavLink to="/partner/login">Se connecter</NavLink>
            <NavLink to="/partner/apply">Devenir partenaire</NavLink>
            <PrimaryButton to="/check">Vérifier mon vol</PrimaryButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur lg:p-10">
            <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-xs font-medium text-blue-300">
              Voyageurs & agences partenaires
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              AirJustice — Accédez à vos droits en cas de retard ou d’annulation
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Sélectionnez votre vol, activez le service, puis recevez une notification après le voyage.
              En cas de perturbation, nous vous expliquons les règles applicables et vous guidons vers la réclamation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton to="/check">Vérifier mon vol</PrimaryButton>
              <SecondaryButton to="/track">Suivre mon dossier</SecondaryButton>
              <SecondaryButton to="/partner/apply">Devenir partenaire</SecondaryButton>
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-400">
              AirJustice n’est pas une assurance et ne garantit pas une indemnisation.
              Le service facilite l’accès à l’information, au suivi et à la réclamation.
            </p>
          </div>

          <div className="grid gap-4">
            <StatCard
              title="Parcours passager"
              text="Choisir le vol → payer → voyager → recevoir le résultat + lien de réclamation"
            />
            <StatCard
              title="Règles"
              text="Retard important, annulation ou surbooking peuvent ouvrir des droits selon les conditions applicables."
            />
            <StatCard
              title="Notifications"
              text="Email + SMS pour informer le client du suivi et du résultat après le vol."
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Vous êtes passager ?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Aucun compte n’est nécessaire. Après paiement, vous recevez un code de suivi.
                Après le vol, nous vérifions automatiquement la situation et vous notifions du résultat.
              </p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton to="/check">Commencer</PrimaryButton>
              <SecondaryButton to="/track">J’ai déjà un code</SecondaryButton>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              title="1) Choisir le vol"
              text="Recherchez et sélectionnez votre vol à partir d’un parcours simple et rapide."
            />
            <InfoCard
              title="2) Activer le service"
              text="Renseignez vos coordonnées, finalisez le paiement et recevez un code de suivi."
            />
            <InfoCard
              title="3) Recevoir les notifications"
              text="Le client reçoit un email et un SMS confirmant que le vol sera analysé."
            />
            <InfoCard
              title="4) Résultat après le vol"
              text="Si une perturbation est détectée, les règles et le lien de réclamation sont affichés."
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          <InfoCard
            title="Service simple"
            text="Un parcours fluide pour les voyageurs et une intégration claire pour les agences."
          />
          <InfoCard
            title="Suivi après vol"
            text="Le dossier reste consultable via un code de suivi, sans créer de compte passager."
          />
          <InfoCard
            title="Portail partenaire"
            text="Les agences peuvent créer des polices, suivre leur activité et gérer leurs collaborateurs."
          />
          <InfoCard
            title="Expérience premium"
            text="Un design moderne, plus rassurant et plus lisible pour inspirer confiance."
          />
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} AirJustice</span>
          <div className="flex gap-4">
            <span>Passenger flow</span>
            <span>Partner onboarding</span>
            <span>Policy monitoring</span>
          </div>
        </div>
      </footer>
    </div>
  );
}