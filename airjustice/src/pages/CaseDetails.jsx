import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../ui/Button";

const API = "http://localhost:8080";

export default function CaseDetails() {
  const { trackingCode } = useParams();
  const [info, setInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    const res = await fetch(API + `/api/public/cases/${trackingCode}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.message || "Introuvable");
    setInfo(data);

    const r = await fetch(API + `/api/public/cases/${trackingCode}/result`);
    const rd = await r.json().catch(() => null);
    if (r.ok) setResult(rd);
  };

  useEffect(() => { load(); }, [trackingCode]);

  const trigger = async () => {
    await fetch(API + `/api/public/dev/cases/${trackingCode}/trigger-review`, { method:"POST" });
    load();
  };

  return (
    <div className="page">
      <main className="container">
        <div className="card">
          <h2>Dossier {trackingCode}</h2>
          {err && <div className="alert">{err}</div>}

          {info && (
            <p className="muted">
              Statut: <b>{info.status}</b><br/>
              Vol: <b>{info.flightNumber}</b> • {info.depIata} → {info.arrIata}
            </p>
          )}

          {!result ? (
            <>
              <p className="muted">Résultat pas encore disponible. Revenez après le vol.</p>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={trigger}>DEV: Trigger Review</Button>
              </div>
            </>
          ) : (
            <div className="card" style={{ marginTop: 14 }}>
              <h3>Résultat</h3>
              <p>
                <b>Outcome:</b> {result.outcome}<br/>
                <b>Éligible:</b> {result.eligible ? "Oui" : "Non"}<br/>
                {result.delayMinutes != null && <><b>Retard:</b> {result.delayMinutes} min<br/></>}
                {result.compensationBand != null && <><b>Indemnisation (estimation):</b> {result.compensationBand}€<br/></>}
              </p>
              <p className="muted">{result.userMessage}</p>

              {result.claimLink && (
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <a className="btn btn-primary" href={result.claimLink} target="_blank" rel="noreferrer">
                    Déposer une réclamation
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}