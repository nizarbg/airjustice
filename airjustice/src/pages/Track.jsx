import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import PageLayout from "../components/PageLayout";

const t = {
  DE: { title: "Meinen Fall verfolgen", subtitle: "Geben Sie den Code ein, den Sie nach der Zahlung erhalten haben, um den Status einzusehen.", label: "Tracking-Code", btn: "Anzeigen" },
  EN: { title: "Track my case", subtitle: "Enter the code received after payment to check the status.", label: "Tracking code", btn: "View" },
  FR: { title: "Suivre mon dossier", subtitle: "Entrez le code reçu après paiement pour consulter le statut.", label: "Code de suivi", btn: "Voir" },
  AR: { title: "تتبع ملفي", subtitle: "أدخل الرمز الذي تلقيته بعد الدفع للتحقق من الحالة.", label: "رمز التتبع", btn: "عرض" },
};

export default function Track() {
  const nav = useNavigate();
  const { language } = useLanguage();
  const l = t[language] || t.FR;
  const [code, setCode] = useState("");

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-start justify-center" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="text-sm text-slate-500 mt-2">{l.subtitle}</p>
          <div className="mt-5">
            <Input label={l.label} value={code} onChange={(e) => setCode(e.target.value)} placeholder="AJ-XXXXXX" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => nav(`/case/${code.trim().toUpperCase()}`)}>{l.btn}</Button>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}