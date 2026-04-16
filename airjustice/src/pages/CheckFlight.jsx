import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import PageLayout from "../components/PageLayout";

const API = "http://localhost:8080";

const t = {
  DE: {
    title: "AirJustice-Schutz hinzufügen",
    subtitle: "Suchen Sie Ihren Flug, wählen Sie die beste Route und fahren Sie mit der sicheren Zahlung fort.",
    depLabel: "Abflug (IATA)",
    arrLabel: "Ankunft (IATA)",
    dateLabel: "Datum",
    flightLabel: "Flugnummer (optional)",
    searchBtn: "Suchen",
    resultsTitle: "Ergebnisse",
    departure: "Abflug",
    arrival: "Ankunft",
    selectBtn: "Auswählen",
  },
  EN: {
    title: "Add AirJustice Protection",
    subtitle: "Search for your flight, choose the best route, then proceed to secure payment.",
    depLabel: "Departure (IATA)",
    arrLabel: "Arrival (IATA)",
    dateLabel: "Date",
    flightLabel: "Flight number (optional)",
    searchBtn: "Search",
    resultsTitle: "Results",
    departure: "Departure",
    arrival: "Arrival",
    selectBtn: "Select",
  },
  FR: {
    title: "Ajouter la protection AirJustice",
    subtitle: "Recherchez votre vol, choisissez le meilleur trajet, puis continuez vers le paiement sécurisé.",
    depLabel: "Départ (IATA)",
    arrLabel: "Arrivée (IATA)",
    dateLabel: "Date",
    flightLabel: "Numéro de vol (optionnel)",
    searchBtn: "Rechercher",
    resultsTitle: "Résultats",
    departure: "Départ",
    arrival: "Arrivée",
    selectBtn: "Sélectionner",
  },
  AR: {
    title: "أضف حماية AirJustice",
    subtitle: "ابحث عن رحلتك، اختر أفضل مسار، ثم تابع إلى الدفع الآمن.",
    depLabel: "المغادرة (IATA)",
    arrLabel: "الوصول (IATA)",
    dateLabel: "التاريخ",
    flightLabel: "رقم الرحلة (اختياري)",
    searchBtn: "بحث",
    resultsTitle: "النتائج",
    departure: "المغادرة",
    arrival: "الوصول",
    selectBtn: "اختيار",
  },
};

export default function CheckFlight() {
  const nav = useNavigate();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

  const [depIata, setDepIata] = useState("TUN");
  const [arrIata, setArrIata] = useState("CDG");
  const [date, setDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  const search = async (e) => {
    e.preventDefault();
    setErr("");
    const res = await fetch(API + "/api/public/flight/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depIata, arrIata, date, flightNumber }),
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) return setErr(data.message || "Error");
    setResults(data);
  };

  const selectFlight = (f) => {
    sessionStorage.setItem("selectedFlight", JSON.stringify(f));
    nav("/checkout");
  };

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{l.subtitle}</p>
          {err && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={search}>
            <Input label={l.depLabel} value={depIata} onChange={(e) => setDepIata(e.target.value)} />
            <Input label={l.arrLabel} value={arrIata} onChange={(e) => setArrIata(e.target.value)} />
            <Input label={l.dateLabel} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Input label={l.flightLabel} value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">{l.searchBtn}</Button>
            </div>
          </form>
        </div>

        {results.length > 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">{l.resultsTitle}</h3>
            <div className="mt-4 flex flex-col gap-3">
              {results.map((f, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-semibold text-slate-900">{f.flightNumber} • {f.airline}</p>
                  <p className="mt-1 text-slate-600">{f.depIata} → {f.arrIata}</p>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {l.departure}: {new Date(f.scheduledDeparture).toLocaleString()} • {l.arrival}: {new Date(f.scheduledArrival).toLocaleString()}
                  </span>
                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => selectFlight(f)}>{l.selectBtn}</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  );
}