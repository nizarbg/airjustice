import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../ui/Button";
import { useLanguage } from "../context/LanguageContext";
import PageLayout from "../components/PageLayout";

const API = "http://localhost:8080";

const t = {
  DE: { caseTitle: "Fall", status: "Status", flight: "Flug", noResult: "Ergebnis noch nicht verfügbar. Kommen Sie nach dem Flug zurück.", triggerBtn: "DEV: Review auslösen", resultTitle: "Ergebnis", outcome: "Ergebnis", eligible: "Berechtigt", yes: "Ja", no: "Nein", delay: "Verspätung", compensation: "Entschädigung (Schätzung)", claimBtn: "Beschwerde einreichen" },
  EN: { caseTitle: "Case", status: "Status", flight: "Flight", noResult: "Result not yet available. Come back after the flight.", triggerBtn: "DEV: Trigger Review", resultTitle: "Result", outcome: "Outcome", eligible: "Eligible", yes: "Yes", no: "No", delay: "Delay", compensation: "Compensation (estimate)", claimBtn: "File a claim" },
  FR: { caseTitle: "Dossier", status: "Statut", flight: "Vol", noResult: "Résultat pas encore disponible. Revenez après le vol.", triggerBtn: "DEV: Trigger Review", resultTitle: "Résultat", outcome: "Outcome", eligible: "Éligible", yes: "Oui", no: "Non", delay: "Retard", compensation: "Indemnisation (estimation)", claimBtn: "Déposer une réclamation" },
  AR: { caseTitle: "الملف", status: "الحالة", flight: "الرحلة", noResult: "النتيجة غير متاحة بعد. عد بعد الرحلة.", triggerBtn: "DEV: تشغيل المراجعة", resultTitle: "النتيجة", outcome: "النتيجة", eligible: "مؤهل", yes: "نعم", no: "لا", delay: "التأخير", compensation: "التعويض (تقدير)", claimBtn: "تقديم مطالبة" },
};

export default function CaseDetails() {
  const { trackingCode } = useParams();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

  const [info, setInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    const res = await fetch(API + `/api/public/cases/${trackingCode}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.message || "Not found");
    setInfo(data);

    const r = await fetch(API + `/api/public/cases/${trackingCode}/result`);
    const rd = await r.json().catch(() => null);
    if (r.ok) setResult(rd);
  };

  useEffect(() => { load(); }, [trackingCode]);

  const trigger = async () => {
    await fetch(API + `/api/public/dev/cases/${trackingCode}/trigger-review`, { method: "POST" });
    load();
  };

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.caseTitle} {trackingCode}</h2>
          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          {info && (
            <p className="mt-3 text-sm text-slate-500">
              {l.status}: <b className="text-slate-900">{info.status}</b><br />
              {l.flight}: <b className="text-slate-900">{info.flightNumber}</b> • {info.depIata} → {info.arrIata}
            </p>
          )}

          {!result ? (
            <>
              <p className="mt-4 text-sm text-slate-500">{l.noResult}</p>
              <div className="mt-3 flex justify-end">
                <Button onClick={trigger}>{l.triggerBtn}</Button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">{l.resultTitle}</h3>
              <div className="mt-3 text-sm text-slate-700 space-y-1">
                <p><b>{l.outcome}:</b> {result.outcome}</p>
                <p><b>{l.eligible}:</b> {result.eligible ? l.yes : l.no}</p>
                {result.delayMinutes != null && <p><b>{l.delay}:</b> {result.delayMinutes} min</p>}
                {result.compensationBand != null && <p><b>{l.compensation}:</b> {result.compensationBand}€</p>}
              </div>
              <p className="mt-2 text-sm text-slate-500">{result.userMessage}</p>

              {result.claimLink && (
                <div className="mt-4 flex justify-end">
                  <a
                    className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500 transition"
                    href={result.claimLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.claimBtn}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
}