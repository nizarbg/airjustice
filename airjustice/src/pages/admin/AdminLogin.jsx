import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import PageLayout from "../../components/PageLayout";

const API = "http://localhost:8080";

const t = {
  DE: { title: "Administratoranmeldung", subtitle: "Eigentümerbereich zur Verwaltung der Agenturanmeldungen.", email: "Admin-E-Mail", password: "Passwort", loginBtn: "Anmelden", partnerLink: "Agenturprozess anzeigen", home: "← Zurück" },
  EN: { title: "Administrator Login", subtitle: "Project owner area to manage agency registrations.", email: "Admin email", password: "Password", loginBtn: "Log in", partnerLink: "View agency process", home: "← Back" },
  FR: { title: "Connexion administrateur", subtitle: "Espace propriétaire du projet pour gérer les inscriptions agences.", email: "Email admin", password: "Mot de passe", loginBtn: "Se connecter", partnerLink: "Voir le parcours agence", home: "← Retour" },
  AR: { title: "تسجيل دخول المسؤول", subtitle: "منطقة مالك المشروع لإدارة تسجيلات الوكالات.", email: "البريد الإلكتروني للمسؤول", password: "كلمة المرور", loginBtn: "تسجيل الدخول", partnerLink: "عرض مسار الوكالة", home: "← رجوع" },
};

export default function AdminLogin() {
  const nav = useNavigate();
  const { loginAdmin } = useAuth();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

  const [form, setForm] = useState({ email: "owner@airjustice.local", password: "Owner123!" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(API + "/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Error");
      loginAdmin(data);
      nav("/admin/dashboard");
    } catch (error) {
      setErr(error.message);
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
          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <Input label={l.email} type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
            <Input label={l.password} type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
            <Button type="submit" disabled={loading}>{loading ? "..." : l.loginBtn}</Button>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/partner/apply">{l.partnerLink}</Link>
              <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/">{l.home}</Link>
            </div>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}

