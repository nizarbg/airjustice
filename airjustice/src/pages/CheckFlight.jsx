import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

export default function CheckFlight() {
  const nav = useNavigate();
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
    if (!res.ok) return setErr(data.message || "Erreur search");
    setResults(data);
  };

  const selectFlight = (f) => {
    sessionStorage.setItem("selectedFlight", JSON.stringify(f));
    nav("/checkout");
  };

  return (
    <div className="page">
      <main className="container">
        <div className="card">
          <h2>Ajouter la protection AirJustice</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Recherchez votre vol, choisissez le meilleur trajet, puis continuez vers le paiement sécurisé.
          </p>
          {err && <div className="alert">{err}</div>}

          <form className="form" onSubmit={search}>
            <Input label="Départ (IATA)" value={depIata} onChange={(e)=>setDepIata(e.target.value)} />
            <Input label="Arrivée (IATA)" value={arrIata} onChange={(e)=>setArrIata(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
            <Input label="Numéro de vol (optionnel)" value={flightNumber} onChange={(e)=>setFlightNumber(e.target.value)} />
            <Button type="submit">Rechercher</Button>
          </form>
        </div>

        {results.length > 0 && (
          <div className="card mt-4">
            <h3>Résultats</h3>
            <div className="mt-4 flex flex-col gap-3">
              {results.map((f, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-base font-semibold text-white">{f.flightNumber} • {f.airline}</p>
                  <p className="mt-1 text-slate-200">{f.depIata} → {f.arrIata}</p>
                  <span className="muted small mt-1 block">
                    Départ: {new Date(f.scheduledDeparture).toLocaleString()} • Arrivée: {new Date(f.scheduledArrival).toLocaleString()}
                  </span>
                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => selectFlight(f)}>Sélectionner</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}