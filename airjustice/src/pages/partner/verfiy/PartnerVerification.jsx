import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import { useLanguage } from "../../../context/LanguageContext";
import PageLayout from "../../../components/PageLayout";

const API = "http://localhost:8080";

const tr = {
  DE: { title: "Administrative Überprüfung", subtitle: "Bitte stellen Sie die folgenden Dokumente bereit, um Ihr Partnerkonto zu aktivieren.", emailLabel: "Konto-E-Mail *", rcLabel: "Handelsregisternummer *", fiscalLabel: "Steuernummer *", iataLabel: "IATA-Code (optional)", fileLabel: "Geschäftsgenehmigung", fileHint: "PDF oder Bild hochladen", formats: "Akzeptierte Formate: PDF, JPG, PNG", submitBtn: "Meine Dokumente validieren", loginLink: "Ich habe bereits ein Konto", home: "← Zurück", missingFile: "Bitte fügen Sie ein Beglaubigungsdokument hinzu.", success: "Dokumente übermittelt. Ihr Antrag wartet nun auf Genehmigung." },
  EN: { title: "Administrative Verification", subtitle: "Please provide the following documents to activate your partner account.", emailLabel: "Account email *", rcLabel: "Trade Register Number *", fiscalLabel: "Tax identification number *", iataLabel: "IATA Code (optional)", fileLabel: "Business license", fileHint: "Upload a PDF or image", formats: "Accepted formats: PDF, JPG, PNG", submitBtn: "Validate my documents", loginLink: "I already have an account", home: "← Back", missingFile: "Please add a supporting document.", success: "Documents submitted. Your application is now pending admin approval." },
  FR: { title: "Vérification administrative", subtitle: "Merci de fournir les documents suivants pour activer votre compte partenaire.", emailLabel: "Email du compte *", rcLabel: "Numéro Registre de Commerce *", fiscalLabel: "Matricule fiscale *", iataLabel: "Code IATA (optionnel)", fileLabel: "Autorisation d'exercice", fileHint: "Téléverser un PDF ou une image", formats: "Formats acceptés : PDF, JPG, PNG", submitBtn: "Valider mes documents", loginLink: "J'ai déjà un compte", home: "← Retour", missingFile: "Merci d'ajouter un document justificatif.", success: "Documents transmis. Votre dossier est maintenant en attente d'approbation admin." },
  AR: { title: "التحقق الإداري", subtitle: "يرجى تقديم المستندات التالية لتفعيل حساب الشريك الخاص بك.", emailLabel: "البريد الإلكتروني للحساب *", rcLabel: "رقم السجل التجاري *", fiscalLabel: "الرقم الضريبي *", iataLabel: "رمز IATA (اختياري)", fileLabel: "ترخيص العمل", fileHint: "تحميل PDF أو صورة", formats: "الصيغ المقبولة: PDF، JPG، PNG", submitBtn: "التحقق من مستنداتي", loginLink: "لدي حساب بالفعل", home: "← رجوع", missingFile: "يرجى إضافة مستند داعم.", success: "تم إرسال المستندات. طلبك الآن في انتظار موافقة المسؤول." },
};

export default function PartnerVerification() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const l = tr[language] || tr.FR;
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    rcNumber: "",
    fiscalNumber: "",
    iataCode: "",
    file: null,
  });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!form.file) {
      setErr(l.missingFile);
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append("email", form.email);
      body.append("rcNumber", form.rcNumber);
      body.append("fiscalNumber", form.fiscalNumber);
      body.append("iataCode", form.iataCode);
      body.append("file", form.file);

      const res = await fetch(API + "/api/partner/verify-submission", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Error");

      setSuccess(l.success);
      window.setTimeout(() => nav("/partner/login"), 1200);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-start justify-center" dir={language === 'AR' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{l.subtitle}</p>
          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
          {success && <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <Input label={l.emailLabel} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            <Input label={l.rcLabel} value={form.rcNumber} onChange={(e) => setForm((p) => ({ ...p, rcNumber: e.target.value }))} required />
            <Input label={l.fiscalLabel} value={form.fiscalNumber} onChange={(e) => setForm((p) => ({ ...p, fiscalNumber: e.target.value }))} required />
            <Input label={l.iataLabel} value={form.iataCode} onChange={(e) => setForm((p) => ({ ...p, iataCode: e.target.value }))} />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">{l.fileLabel}</span>
              <span className="text-xs text-slate-400">{l.fileHint}</span>
              <input type="file" className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} required />
              <span className="text-xs text-slate-400">{l.formats}</span>
            </label>

            <Button type="submit" disabled={loading}>{loading ? '...' : l.submitBtn}</Button>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/partner/login">{l.loginLink}</Link>
              <Link className="text-sm text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline" to="/">{l.home}</Link>
            </div>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}
