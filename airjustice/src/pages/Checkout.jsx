import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import PageLayout from "../components/PageLayout";

const API = "http://localhost:8080";

const t = {
  DE: {
    title: "AirJustice bezahlen (Gast)",
    subtitle: "Schließen Sie den Flugschutz in wenigen Sekunden ab.",
    flight: "Flug",
    noFlight: "Kein Flug ausgewählt. Zurück zu /check.",
    fullName: "Vollständiger Name",
    email: "E-Mail",
    phone: "Telefon (SMS)",
    payBtn: "Bezahlen (Mock)",
    afterPay: "Nach der Zahlung: Sie erhalten E-Mail + SMS. Wir analysieren Ihren Flug nach der Reise.",
  },
  EN: {
    title: "Pay AirJustice (Guest)",
    subtitle: "Finalize the flight protection in a few seconds.",
    flight: "Flight",
    noFlight: "No flight selected. Go back to /check.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone (SMS)",
    payBtn: "Pay (Mock)",
    afterPay: "After payment: you receive Email + SMS. We will analyze your flight after the trip.",
  },
  FR: {
    title: "Payer AirJustice (Guest)",
    subtitle: "Finalisez la protection du vol en quelques secondes.",
    flight: "Vol",
    noFlight: "Aucun vol sélectionné. Retournez à /check.",
    fullName: "Nom complet",
    email: "Email",
    phone: "Téléphone (SMS)",
    payBtn: "Payer (Mock)",
    afterPay: "Après paiement: vous recevez Email + SMS. Nous analyserons votre vol après le voyage.",
  },
  AR: {
    title: "دفع AirJustice (ضيف)",
    subtitle: "أكمل حماية الرحلة في ثوانٍ قليلة.",
    flight: "رحلة",
    noFlight: "لم يتم اختيار رحلة. عد إلى /check.",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "الهاتف (SMS)",
    payBtn: "دفع (تجريبي)",
    afterPay: "بعد الدفع: ستتلقى بريدًا إلكترونيًا + رسالة نصية. سنحلل رحلتك بعد السفر.",
  },
};

export default function Checkout() {
  const nav = useNavigate();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

  const [flight, setFlight] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const f = sessionStorage.getItem("selectedFlight");
    if (f) setFlight(JSON.parse(f));
  }, []);

  const pay = async () => {
    setErr("");
    if (!flight) return setErr(l.noFlight);

    const payload = {
      fullName, email, phone,
      flightNumber: flight.flightNumber,
      flightDate: flight.scheduledDeparture.slice(0, 10),
      depIata: flight.depIata,
      arrIata: flight.arrIata,
      airline: flight.airline,
      scheduledDeparture: flight.scheduledDeparture,
      scheduledArrival: flight.scheduledArrival,
    };

    const res = await fetch(API + "/api/public/flight/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.message || "Error");

    nav(`/case/${data.trackingCode}`);
  };

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{l.subtitle}</p>
          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          {flight ? (
            <p className="mt-3 text-sm text-slate-500">
              {l.flight}: <b className="text-slate-900">{flight.flightNumber}</b> • {flight.depIata} → {flight.arrIata}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{l.noFlight}</p>
          )}

          <div className="mt-5 grid gap-4">
            <Input label={l.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label={l.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label={l.phone} value={phone} onChange={(e) => setPhone(e.target.value)} required />

            <div className="mt-2 flex justify-end">
              <Button onClick={pay}>{l.payBtn}</Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">{l.afterPay}</p>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}