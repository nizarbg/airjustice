import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { useLanguage } from "../../context/LanguageContext";
import PageLayout from "../../components/PageLayout";

const tr = {
  DE: {
    title: "Schnelle Registrierung", subtitle: "Treten Sie dem Partnerprogramm bei und starten Sie Ihre Agenturanfrage.", required: "Mit * gekennzeichnete Felder sind Pflichtfelder.",
    agencyInfo: "Agenturinformationen", agencyName: "Agenturname *", city: "Stadt *", country: "Land *",
    managerInfo: "Hauptverantwortlicher", managerName: "Vor- & Nachname *", email: "Berufliche E-Mail *", phone: "Telefon *", password: "Passwort *", confirmPassword: "Passwort bestätigen *",
    terms: "Ich akzeptiere die allgemeinen Geschäftsbedingungen und den Datenschutz", createBtn: "Konto erstellen",
    pwdShort: "Das Passwort muss mindestens 8 Zeichen lang sein.", pwdMismatch: "Die Passwörter stimmen nicht überein.",
  },
  EN: {
    title: "Quick Registration", subtitle: "Join the partner program and start your agency application.", required: "Fields marked with * are required.",
    agencyInfo: "Agency information", agencyName: "Agency name *", city: "City *", country: "Country *",
    managerInfo: "Main manager", managerName: "Full name *", email: "Professional email *", phone: "Phone *", password: "Password *", confirmPassword: "Confirm password *",
    terms: "I accept the terms and conditions and data protection", createBtn: "Create my account",
    pwdShort: "Password must be at least 8 characters.", pwdMismatch: "Passwords do not match.",
  },
  FR: {
    title: "Inscription rapide", subtitle: "Rejoignez le programme partenaire et commencez votre demande de compte agence.", required: "Les champs marqués d'un * sont obligatoires.",
    agencyInfo: "Informations agence", agencyName: "Nom de l'agence *", city: "Ville *", country: "Pays *",
    managerInfo: "Responsable principal", managerName: "Nom & Prénom *", email: "Email professionnel *", phone: "Téléphone *", password: "Mot de passe *", confirmPassword: "Confirmer le mot de passe *",
    terms: "J'accepte les conditions générales et la protection des données", createBtn: "Créer mon compte",
    pwdShort: "Le mot de passe doit contenir au moins 8 caractères.", pwdMismatch: "Les mots de passe ne correspondent pas.",
  },
  AR: {
    title: "تسجيل سريع", subtitle: "انضم إلى برنامج الشراكة وابدأ طلب حساب الوكالة.", required: "الحقول المميزة بـ * مطلوبة.",
    agencyInfo: "معلومات الوكالة", agencyName: "اسم الوكالة *", city: "المدينة *", country: "البلد *",
    managerInfo: "المسؤول الرئيسي", managerName: "الاسم الكامل *", email: "البريد الإلكتروني المهني *", phone: "الهاتف *", password: "كلمة المرور *", confirmPassword: "تأكيد كلمة المرور *",
    terms: "أوافق على الشروط والأحكام وحماية البيانات", createBtn: "إنشاء حسابي",
    pwdShort: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", pwdMismatch: "كلمات المرور غير متطابقة.",
  },
};

export default function PartnerApply() {
  const nav = useNavigate();
  const { language } = useLanguage();
  const l = tr[language] || tr.FR;
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
      setErr(l.pwdShort);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErr(l.pwdMismatch);
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
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-start justify-center" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{l.subtitle}</p>
          <p className="mt-1 text-xs text-slate-400">{l.required}</p>
          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-3">{l.agencyInfo}</h4>
              <div className="grid gap-4">
                <Input label={l.agencyName} name="agencyName" value={form.agencyName} onChange={handleChange} required />
                <Input label={l.city} name="city" value={form.city} onChange={handleChange} required />
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">{l.country}</span>
                  <select className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20" name="country" value={form.country} onChange={handleChange} required>
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
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-3">{l.managerInfo}</h4>
              <div className="grid gap-4">
                <Input label={l.managerName} name="managerName" value={form.managerName} onChange={handleChange} required />
                <Input label={l.email} type="email" name="email" value={form.email} onChange={handleChange} required />
                <Input label={l.phone} name="phone" value={form.phone} onChange={handleChange} required />
                <Input label={l.password} type="password" name="password" value={form.password} onChange={handleChange} required />
                <Input label={l.confirmPassword} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <label className="mt-1 flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} required className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-red-500 focus:ring-red-400/30" />
              {l.terms}
            </label>

            <Button className="mt-1" type="submit" disabled={loading}>{loading ? "..." : l.createBtn}</Button>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}
