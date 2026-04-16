import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import PageLayout from "../../components/PageLayout";

const API = "http://localhost:8080";

const t = {
  DE: { title: "Partner-Anmeldung", subtitle: "Melden Sie sich mit Ihrer E-Mail oder Ihrem Benutzernamen an.", note: "Wenn Ihr Antrag noch nicht vom Projektadministrator genehmigt wurde, bleibt der Zugang bis zur Genehmigung gesperrt.", emailLabel: "E-Mail oder Benutzername", passwordLabel: "Passwort", loginBtn: "Anmelden", otpLabel: "OTP-Code", verifyBtn: "Überprüfen", backBtn: "Zurück", becomePartner: "Partner werden", home: "← Zurück" },
  EN: { title: "Partner Login", subtitle: "Log in with your email or username.", note: "If your application has not yet been approved by the project admin, access remains blocked until validation.", emailLabel: "Email or username", passwordLabel: "Password", loginBtn: "Log in", otpLabel: "OTP Code", verifyBtn: "Verify", backBtn: "Back", becomePartner: "Become Partner", home: "Back" },
  FR: { title: "Connexion Partenaire", subtitle: "Connectez-vous avec votre email ou votre nom d'utilisateur.", note: "Si votre dossier n'est pas encore approuvé par l'administrateur du projet, l'accès reste bloqué jusqu'à validation.", emailLabel: "Email ou nom d'utilisateur", passwordLabel: "Mot de passe", loginBtn: "Se connecter", otpLabel: "Code OTP", verifyBtn: "Vérifier", backBtn: "Retour", becomePartner: "Devenir partenaire", home: "← Retour" },
  AR: { title: "تسجيل دخول الشريك", subtitle: "سجل الدخول باستخدام بريدك الإلكتروني أو اسم المستخدم.", note: "إذا لم تتم الموافقة على طلبك بعد من قبل مسؤول المشروع، يظل الوصول محظورًا حتى التحقق.", emailLabel: "البريد الإلكتروني أو اسم المستخدم", passwordLabel: "كلمة المرور", loginBtn: "تسجيل الدخول", otpLabel: "رمز OTP", verifyBtn: "تحقق", backBtn: "رجوع", becomePartner: "أصبح شريكًا", home: "← رجوع" },
};

export default function PartnerLogin() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

  const [step, setStep] = useState("login");
  const [identifier, setIdentifier] = useState("");
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
    if (!res.ok) throw new Error(data.message || "Error");
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
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-start justify-center" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{l.subtitle}</p>
          <p className="mt-1 text-xs text-slate-400">{l.note}</p>

          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          {step === "login" ? (
            <form onSubmit={onLogin} className="mt-5 grid gap-4">
              <Input label={l.emailLabel} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ex: user@email.com ou amal.bts" required />
              <Input label={l.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button disabled={loading} type="submit">{loading ? "..." : l.loginBtn}</Button>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/partner/apply">{l.becomePartner}</Link>
                <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/">{l.home}</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={onVerifyOtp} className="mt-5 grid gap-4">
              <Input label={l.otpLabel} value={otp} onChange={(e) => setOtp(e.target.value)} required />
              <Button disabled={loading} type="submit">{loading ? "..." : l.verifyBtn}</Button>
              <button className="text-sm text-slate-500 hover:text-slate-700 transition" type="button" onClick={() => setStep("login")}>{l.backBtn}</button>
            </form>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
