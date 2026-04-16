import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { loginRequest } from "../auth/authApi";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageLayout from "../components/PageLayout";

const t = {
  DE: { title: "Anmeldung", subtitle: "Greifen Sie auf Ihre Flüge und AirJustice-Dienste zu.", email: "E-Mail", password: "Passwort", loginBtn: "Anmelden", loading: "Anmeldung...", back: "← Zurück", partnerLink: "Sie sind eine Agentur? Partner werden", forgot: "Passwort vergessen" },
  EN: { title: "Login", subtitle: "Access your flights and AirJustice services.", email: "Email", password: "Password", loginBtn: "Log in", loading: "Logging in...", back: "← Back", partnerLink: "Are you an agency? Become a partner", forgot: "Forgot password" },
  FR: { title: "Connexion", subtitle: "Accédez à vos vols et services AirJustice.", email: "Email", password: "Mot de passe", loginBtn: "Se connecter", loading: "Connexion...", back: "← Retour", partnerLink: "Vous êtes une agence ? Devenir partenaire", forgot: "Mot de passe oublié" },
  AR: { title: "تسجيل الدخول", subtitle: "الوصول إلى رحلاتك وخدمات AirJustice.", email: "البريد الإلكتروني", password: "كلمة المرور", loginBtn: "تسجيل الدخول", loading: "جاري الدخول...", back: "← رجوع", partnerLink: "هل أنت وكالة؟ أصبح شريكًا", forgot: "نسيت كلمة المرور" },
};

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

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
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-start justify-center" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <div className="mb-2 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
            <p className="text-sm text-slate-500">{l.subtitle}</p>
          </div>

          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          <form onSubmit={onSubmit} className="mt-5 grid gap-4">
            <Input
              label={l.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: demo@airjustice.tn"
              required
            />
            <Input
              label={l.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ex: demo123"
              required
            />
            <Button className="mt-1" disabled={loading} type="submit">
              {loading ? l.loading : l.loginBtn}
            </Button>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/">{l.back}</Link>
              <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/partner/apply">{l.partnerLink}</Link>
              <a className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" href="#" onClick={(e) => { e.preventDefault(); alert("TODO: forgot password"); }}>
                {l.forgot}
              </a>
            </div>
          </form>

          <div className="mt-5 text-xs text-slate-500 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            Demo: <b>demo@airjustice.tn</b> / <b>demo123</b>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
