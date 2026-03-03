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
          <div className="card" style={{ marginTop: 14 }}>
            <h3>Résultats</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {results.map((f, idx) => (
                <div key={idx} className="card" style={{ padding: 14 }}>
                  <b>{f.flightNumber}</b> • {f.airline}<br/>
                  {f.depIata} → {f.arrIata}<br/>
                  <span className="muted small">
                    Départ: {new Date(f.scheduledDeparture).toLocaleString()} • Arrivée: {new Date(f.scheduledArrival).toLocaleString()}
                  </span>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
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