import { useMemo, useRef, useState } from "react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

const API = "http://localhost:8080";
const FLIGHT_NO_RE = /^[A-Z]{2}\d{1,4}[A-Z]?$/;

async function apiPost(path, token, body, isForm = false) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: isForm
      ? { Authorization: `Bearer ${token}` }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
    body: isForm ? body : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
}

function emptySegment() {
  return {
    flightNumber: "",
    depIata: "",
    arrIata: "",
    airline: "",
    departureDateTime: "",
    confidenceFlightNumber: 1,
    confidenceRoute: 1,
    confidenceDateTime: 1,
  };
}

export default function PolicyStepper({ token, onCreated }) {
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState(null);

  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [passenger, setPassenger] = useState({ fullName: "", confidence: 1 });
  const [segments, setSegments] = useState([emptySegment()]);
  const [multiPassengerDetected, setMultiPassengerDetected] = useState(false);
  const [noFlightDetected, setNoFlightDetected] = useState(false);

  const [contact, setContact] = useState({
    clientEmail: "",
    clientPhone: "",
    price: "8",
    currency: "TND",
    notifyClient: true,
  });

  const [creating, setCreating] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(null);

  const invalidSegments = useMemo(() => {
    return segments.map((s) => ({
      flightNumber: !!s.flightNumber && !FLIGHT_NO_RE.test(String(s.flightNumber).toUpperCase()),
      depIata: !!s.depIata && String(s.depIata).trim().length !== 3,
      arrIata: !!s.arrIata && String(s.arrIata).trim().length !== 3,
      departureDateTime: !s.departureDateTime,
    }));
  }, [segments]);

  const canConfirmData = useMemo(() => {
    if (!passenger.fullName.trim()) return false;
    if (segments.length === 0) return false;
    return segments.every((s, i) => {
      const inv = invalidSegments[i];
      return (
        s.flightNumber.trim() &&
        !inv.flightNumber &&
        s.depIata.trim().length === 3 &&
        s.arrIata.trim().length === 3 &&
        s.departureDateTime
      );
    });
  }, [passenger, segments, invalidSegments]);

  const canCreatePolicy = useMemo(() => {
    return (
      canConfirmData &&
      contact.clientEmail.trim() &&
      contact.clientPhone.trim() &&
      contact.price.trim()
    );
  }, [canConfirmData, contact]);

  const resetAll = () => {
    setStep(1);
    setDraftId(null);
    setFiles([]);
    setUploadedFiles([]);
    setPassenger({ fullName: "", confidence: 1 });
    setSegments([emptySegment()]);
    setMultiPassengerDetected(false);
    setNoFlightDetected(false);
    setContact({
      clientEmail: "",
      clientPhone: "",
      price: "8",
      currency: "TND",
      notifyClient: true,
    });
    setErr("");
    setSuccess(null);
  };

  const ensureDraft = async () => {
    if (draftId) return draftId;
    const data = await apiPost("/api/partner/policy-drafts", token, {});
    setDraftId(data.id);
    return data.id;
  };

  const handleFiles = (selected) => {
    const arr = Array.from(selected || []);
    if (arr.length === 0) return;
    setFiles((prev) => [...prev, ...arr]);
  };

  const uploadFiles = async () => {
    setErr("");
    if (files.length === 0) {
      setErr("Veuillez ajouter au moins un fichier.");
      return;
    }

    setUploading(true);
    try {
      const id = await ensureDraft();
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const data = await apiPost(`/api/partner/policy-drafts/${id}/upload`, token, form, true);
      setUploadedFiles(data.files || []);
      setStep(2);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  const runExtraction = async () => {
    setErr("");
    setLoadingExtract(true);
    try {
      const id = await ensureDraft();
      const data = await apiPost(`/api/partner/policy-drafts/${id}/extract`, token, {});
      setPassenger({
        fullName: data.passenger?.fullName || "",
        confidence: data.passenger?.confidence ?? 1,
      });
      setSegments(
        data.segments?.length
          ? data.segments.map((s) => ({
              flightNumber: s.flightNumber || "",
              depIata: s.depIata || "",
              arrIata: s.arrIata || "",
              airline: s.airline || "",
              departureDateTime: s.departureDateTime || "",
              confidenceFlightNumber: s.confidenceFlightNumber ?? 1,
              confidenceRoute: s.confidenceRoute ?? 1,
              confidenceDateTime: s.confidenceDateTime ?? 1,
            }))
          : [emptySegment()]
      );
      setMultiPassengerDetected(!!data.multiPassengerDetected);
      setNoFlightDetected(!!data.noFlightDetected);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingExtract(false);
    }
  };

  const confirmData = () => {
    if (!canConfirmData) {
      setErr("Veuillez corriger les données extraites avant de continuer.");
      return;
    }
    setErr("");
    setStep(3);
  };

  const createPolicy = async () => {
    setErr("");
    if (!canCreatePolicy) {
      setErr("Veuillez compléter les champs obligatoires.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        passengerFullName: passenger.fullName,
        clientEmail: contact.clientEmail,
        clientPhone: contact.clientPhone,
        price: Number(contact.price),
        currency: contact.currency,
        notifyClient: contact.notifyClient,
        segments: segments.map((s) => ({
          flightNumber: s.flightNumber.toUpperCase(),
          depIata: s.depIata.toUpperCase(),
          arrIata: s.arrIata.toUpperCase(),
          airline: s.airline,
          departureDateTime: s.departureDateTime,
        })),
      };

      const data = await apiPost(`/api/partner/policies/from-draft/${draftId}`, token, payload);

      setSuccess({
        policyId: data.policyId,
        status: data.status,
        message: data.message,
      });

      if (onCreated) onCreated(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  };

  const addSegment = () => setSegments((prev) => [...prev, emptySegment()]);

  const updateSegment = (index, patch) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSegment = (index) => {
    setSegments((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  return (
    <div className="card">
      <h3>Créer une nouvelle police</h3>
      <p className="muted">Upload → Vérification → Validation</p>

      {err && <div className="alert">{err}</div>}

      {success && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3>✅ Police créée</h3>
          <p className="muted">{success.message}</p>
          <p>
            <b>Numéro de police:</b> #{success.policyId}
            <br />
            <b>Statut:</b> {success.status}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <a
              className="btn btn-primary"
              href={`${API}/api/partner/policies/${success.policyId}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              Télécharger PDF
            </a>
            <Button variant="secondary" onClick={resetAll}>
              Créer une autre police
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "10px 0 16px" }}>
        <Button variant={step === 1 ? "primary" : "secondary"} onClick={() => setStep(1)}>
          1. Upload
        </Button>
        <Button variant={step === 2 ? "primary" : "secondary"} onClick={() => setStep(2)}>
          2. Extraction
        </Button>
        <Button variant={step === 3 ? "primary" : "secondary"} onClick={() => setStep(3)}>
          3. Contact & résumé
        </Button>
      </div>

      {step === 1 && (
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
          <div
            className="card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            style={{
              border: "1px dashed rgba(255,255,255,.18)",
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div>
              <h3 style={{ marginBottom: 8 }}>Glissez-déposez vos fichiers ici</h3>
              <p className="muted">
                PDF, JPG, PNG • Plusieurs fichiers possibles (ex. aller-retour)
              </p>
              <Button variant="secondary">Sélectionner un fichier</Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>

          <div className="card">
            <h3>Fichiers sélectionnés</h3>
            {files.length === 0 ? (
              <p className="muted">Aucun fichier sélectionné.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="card" style={{ padding: 12 }}>
                    <b>{f.name}</b>
                    <div className="muted small">{Math.round(f.size / 1024)} KB</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="secondary" onClick={() => setFiles([])}>
                Vider
              </Button>
              <Button onClick={uploadFiles} disabled={uploading || files.length === 0}>
                {uploading ? "Upload..." : "Uploader et continuer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <h3>Extraction et validation AI</h3>
                <p className="muted">Données extraites automatiquement, modifiables par l’agent.</p>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <Button onClick={runExtraction} disabled={loadingExtract || !draftId}>
                  {loadingExtract ? "Extraction..." : "Lancer l’extraction"}
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className="muted small">
                  {uploadedFiles.length} fichier(s) uploadé(s)
                </p>
              </div>
            )}

            {multiPassengerDetected && (
              <div className="alert" style={{ marginTop: 12 }}>
                Plusieurs passagers détectés. Vérifiez et corrigez si nécessaire.
              </div>
            )}

            {noFlightDetected && (
              <div className="alert" style={{ marginTop: 12 }}>
                Aucun vol détecté automatiquement. Saisie manuelle possible.
              </div>
            )}
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
            <div className="card">
              <h3>Passager</h3>
              <Input
                label="Nom complet"
                value={passenger.fullName}
                onChange={(e) => setPassenger((p) => ({ ...p, fullName: e.target.value }))}
              />
              {passenger.confidence < 0.7 && (
                <p className="muted small">⚠ Champ incertain, merci de vérifier.</p>
              )}
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <h3>Segments de vol</h3>
                <Button variant="secondary" onClick={addSegment}>
                  + Ajouter un segment
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                {segments.map((seg, idx) => {
                  const inv = invalidSegments[idx];
                  return (
                    <div key={idx} className="card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <b>Segment #{idx + 1}</b>
                        {segments.length > 1 && (
                          <Button variant="ghost" onClick={() => removeSegment(idx)}>
                            Supprimer
                          </Button>
                        )}
                      </div>

                      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                        <div>
                          <Input
                            label="Numéro de vol"
                            value={seg.flightNumber}
                            onChange={(e) =>
                              updateSegment(idx, { flightNumber: e.target.value.toUpperCase() })
                            }
                          />
                          {inv.flightNumber && (
                            <span className="error">Numéro de vol invalide.</span>
                          )}
                          {seg.confidenceFlightNumber < 0.7 && (
                            <p className="muted small">⚠ Numéro de vol incertain.</p>
                          )}
                        </div>

                        <Input
                          label="Compagnie aérienne"
                          value={seg.airline}
                          onChange={(e) => updateSegment(idx, { airline: e.target.value })}
                        />

                        <div>
                          <Input
                            label="Aéroport de départ"
                            value={seg.depIata}
                            onChange={(e) =>
                              updateSegment(idx, { depIata: e.target.value.toUpperCase() })
                            }
                          />
                          {inv.depIata && <span className="error">Code IATA invalide.</span>}
                        </div>

                        <div>
                          <Input
                            label="Aéroport d’arrivée"
                            value={seg.arrIata}
                            onChange={(e) =>
                              updateSegment(idx, { arrIata: e.target.value.toUpperCase() })
                            }
                          />
                          {inv.arrIata && <span className="error">Code IATA invalide.</span>}
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                          <Input
                            label="Date et heure"
                            type="datetime-local"
                            value={seg.departureDateTime ? seg.departureDateTime.slice(0, 16) : ""}
                            onChange={(e) =>
                              updateSegment(idx, { departureDateTime: e.target.value })
                            }
                          />
                          {inv.departureDateTime && (
                            <span className="error">Date/heure requise.</span>
                          )}
                          {seg.confidenceDateTime < 0.7 && (
                            <p className="muted small">⚠ Date/heure incertaine.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button onClick={confirmData} disabled={!canConfirmData}>
                  Confirmer les données
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="card">
            <h3>Contact client</h3>
            <Input
              label="Email"
              type="email"
              value={contact.clientEmail}
              onChange={(e) => setContact((c) => ({ ...c, clientEmail: e.target.value }))}
            />
            <Input
              label="Téléphone"
              value={contact.clientPhone}
              onChange={(e) => setContact((c) => ({ ...c, clientPhone: e.target.value }))}
            />
            <Input
              label="Prix"
              value={contact.price}
              onChange={(e) => setContact((c) => ({ ...c, price: e.target.value }))}
            />

            <label className="field">
              <span className="label">Devise</span>
              <select
                className="input"
                value={contact.currency}
                onChange={(e) => setContact((c) => ({ ...c, currency: e.target.value }))}
              >
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <input
                type="checkbox"
                checked={contact.notifyClient}
                onChange={(e) => setContact((c) => ({ ...c, notifyClient: e.target.checked }))}
              />
              <span>Notifier le client</span>
            </label>
          </div>

          <div className="card">
            <h3>Résumé</h3>
            <p>
              <b>Passager:</b> {passenger.fullName || "-"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {segments.map((s, i) => (
                <div key={i} className="card" style={{ padding: 12 }}>
                  <b>{s.flightNumber || "-"}</b> • {s.depIata || "-"} → {s.arrIata || "-"}
                  <div className="muted small">
                    {s.airline || "-"} • {s.departureDateTime || "-"}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <p className="muted small">
                Après création: toast succès, numéro de police, statut “Activement surveillé”, PDF.
              </p>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="secondary" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button onClick={createPolicy} disabled={!canCreatePolicy || creating}>
                {creating ? "Création..." : "Créer la police"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}