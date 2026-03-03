import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

export default function Checkout() {
  const nav = useNavigate();
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
    if (!flight) return setErr("Aucun vol sélectionné.");

    const payload = {
      fullName, email, phone,
      flightNumber: flight.flightNumber,
      flightDate: flight.scheduledDeparture.slice(0,10),
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
    if (!res.ok) return setErr(data.message || "Erreur checkout");

    nav(`/case/${data.trackingCode}`);
  };

  return (
    <div className="page">
      <main className="container">
        <div className="card">
          <h2>Payer AirJustice (Guest)</h2>
          {err && <div className="alert">{err}</div>}

          {flight ? (
            <p className="muted">
              Vol: <b>{flight.flightNumber}</b> • {flight.depIata} → {flight.arrIata}
            </p>
          ) : (
            <p className="muted">Aucun vol sélectionné. Retournez à /check.</p>
          )}

          <div className="form">
            <Input label="Nom complet" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            <Input label="Téléphone (SMS)" value={phone} onChange={(e)=>setPhone(e.target.value)} required />

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={pay}>Payer (Mock)</Button>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              Après paiement: vous recevez Email + SMS. Nous analyserons votre vol après le voyage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}