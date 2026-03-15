import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

const API = "http://localhost:8080";

const STATUS_LABELS = {
  SUBMITTED: "Soumis",
  CONTACT_IN_PROGRESS: "Prise de contact",
  DOCUMENTS_REQUESTED: "Documents demandés",
  DOCUMENTS_RECEIVED: "Documents reçus",
  VERIFICATION_IN_PROGRESS: "Vérification en cours",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  PENDING: "En attente (legacy)",
  VERIFIED: "Vérifié (legacy)",
  ACTIVE: "Actif (legacy)",
  ALL: "Tous",
};

const STATUS_NEXT = {
  SUBMITTED: "CONTACT_IN_PROGRESS",
  CONTACT_IN_PROGRESS: "DOCUMENTS_REQUESTED",
  DOCUMENTS_REQUESTED: "DOCUMENTS_RECEIVED",
  DOCUMENTS_RECEIVED: "VERIFICATION_IN_PROGRESS",
  VERIFICATION_IN_PROGRESS: "APPROVED",
};

async function api(path, token, options = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur admin.");
  return data;
}

function Badge({ status }) {
  const colors = {
    SUBMITTED:               { bg: "rgba(245,158,11,.15)",  border: "rgba(245,158,11,.35)" },
    CONTACT_IN_PROGRESS:     { bg: "rgba(168,85,247,.15)",  border: "rgba(168,85,247,.35)" },
    DOCUMENTS_REQUESTED:     { bg: "rgba(234,179,8,.15)",   border: "rgba(234,179,8,.35)" },
    DOCUMENTS_RECEIVED:      { bg: "rgba(59,130,246,.15)",  border: "rgba(59,130,246,.35)" },
    VERIFICATION_IN_PROGRESS:{ bg: "rgba(14,165,233,.15)",  border: "rgba(14,165,233,.35)" },
    APPROVED:                { bg: "rgba(34,197,94,.15)",   border: "rgba(34,197,94,.35)" },
    REJECTED:                { bg: "rgba(220,38,38,.15)",   border: "rgba(220,38,38,.35)" },
    PENDING:                 { bg: "rgba(245,158,11,.15)",  border: "rgba(245,158,11,.35)" },
    VERIFIED:                { bg: "rgba(59,130,246,.15)",  border: "rgba(59,130,246,.35)" },
    ACTIVE:                  { bg: "rgba(34,197,94,.15)",   border: "rgba(34,197,94,.35)" },
  };
  const c = colors[status] || { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.12)" };
  return (
    <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.bg, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function AdminDashboard() {
  const { adminToken, adminUser, logoutAdmin } = useAuth();
  const [status, setStatus] = useState("ALL");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ rcNumber: "", fiscalNumber: "", iataCode: "" });
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = async (nextStatus = status) => {
    setLoading(true);
    setErr("");
    try {
      const data = await api(`/api/admin/partners/applications?status=${encodeURIComponent(nextStatus)}`, adminToken);
      setItems(Array.isArray(data) ? data : []);
      if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);
    } catch (error) { setErr(error.message); }
    finally { setLoading(false); }
  };

  const loadDetails = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    setErr("");
    try {
      const data = await api(`/api/admin/partners/applications/${id}`, adminToken);
      setDetails(data);
      setVerifyForm({ rcNumber: data.rcNumber || "", fiscalNumber: data.fiscalNumber || "", iataCode: data.iataCode || "" });
    } catch (error) { setErr(error.message); }
    finally { setDetailsLoading(false); }
  };

  useEffect(() => { loadApplications(); }, [status]); // eslint-disable-line
  useEffect(() => { if (selectedId) loadDetails(selectedId); }, [selectedId]); // eslint-disable-line

  const groupedStats = useMemo(() => items.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {}), [items]);

  const setApplicationStatus = async (newStatus) => {
    if (!selectedId) return;
    setErr(""); setSuccess("");
    try {
      const data = await api(`/api/admin/partners/applications/${selectedId}/status`, adminToken, {
        method: "PUT", body: JSON.stringify({ status: newStatus }),
      });
      setDetails(data);
      setSuccess(`Statut mis à jour: ${STATUS_LABELS[newStatus] || newStatus}`);
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const verifyAccount = async () => {
    if (!selectedId) return;
    setErr(""); setSuccess("");
    try {
      const data = await api(`/api/admin/partners/applications/${selectedId}/verify`, adminToken, {
        method: "PUT", body: JSON.stringify(verifyForm),
      });
      setDetails(data);
      setSuccess("Dossier vérifié — statut: Vérification en cours.");
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const approveAccount = async () => {
    if (!selectedId) return;
    setErr(""); setSuccess("");
    try {
      const data = await api(`/api/admin/partners/applications/${selectedId}/approve`, adminToken, { method: "PUT" });
      setDetails(data);
      setSuccess("Compte approuvé. Le partenaire a maintenant accès à la plateforme.");
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const rejectAccount = async () => {
    if (!selectedId) return;
    if (!window.confirm("Rejeter ce dossier supprimera le compte partenaire. Continuer ?")) return;
    setErr(""); setSuccess("");
    try {
      await api(`/api/admin/partners/applications/${selectedId}`, adminToken, { method: "DELETE" });
      setSuccess("Dossier rejeté et compte supprimé.");
      setSelectedId(null); setDetails(null);
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const nextStatus = details ? STATUS_NEXT[details.status] : null;

  return (
    <div className="page">
      <header className="nav">
        <div className="brand">AirJustice Owner Admin</div>
        <div className="nav-actions">
          <span className="muted">{adminUser?.email}</span>
          <Button variant="ghost" onClick={logoutAdmin}>Logout</Button>
        </div>
      </header>

      <main className="container">
        <div className="card" style={{ marginBottom: 14 }}>
          <h2>Validation des inscriptions agences</h2>
          <p className="muted">Gérez le processus d'inscription complet : soumission → contact → documents → vérification → activation.</p>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14, marginBottom: 14, alignItems: "center" }}>
            {["SUBMITTED", "CONTACT_IN_PROGRESS", "DOCUMENTS_REQUESTED", "DOCUMENTS_RECEIVED", "VERIFICATION_IN_PROGRESS", "APPROVED"].map((s, idx) => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Badge status={s} />
                {idx < 5 && <span style={{ color: "rgba(255,255,255,.3)" }}>→</span>}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["ALL", "SUBMITTED", "CONTACT_IN_PROGRESS", "DOCUMENTS_REQUESTED", "DOCUMENTS_RECEIVED", "VERIFICATION_IN_PROGRESS", "APPROVED", "REJECTED"].map((option) => (
              <Button key={option} variant={status === option ? "primary" : "secondary"} onClick={() => setStatus(option)} style={{ fontSize: 12, padding: "6px 12px" }}>
                {STATUS_LABELS[option] || option}
                {option !== "ALL" && groupedStats[option] ? ` (${groupedStats[option]})` : ""}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "360px 1fr", gap: 14 }}>
          <div className="card">
            <h3>Dossiers</h3>
            <div className="muted small" style={{ marginBottom: 10 }}>
              {Object.entries(groupedStats).map(([k, v]) => `${STATUS_LABELS[k] || k}: ${v}`).join(" • ") || "Aucun"}
            </div>
            {loading ? (
              <p className="muted">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="muted">Aucun dossier pour ce filtre.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <button key={item.id} type="button" className="card" onClick={() => setSelectedId(item.id)}
                    style={{ textAlign: "left", padding: 14, cursor: "pointer", border: selectedId === item.id ? "1px solid rgba(255,255,255,.35)" : "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <b>{item.agencyName || "Agence"}</b>
                      <Badge status={item.status} />
                    </div>
                    <div className="muted small" style={{ marginTop: 6 }}>{item.managerName || "Responsable non renseigné"}</div>
                    <div className="muted small">{item.contactEmail}</div>
                    <div className="muted small">{item.city} • {item.country}</div>
                    <div className="muted small">Documents: {item.documentsCount}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            {!selectedId ? (
              <p className="muted">Sélectionnez un dossier.</p>
            ) : detailsLoading ? (
              <p className="muted">Chargement du détail...</p>
            ) : details ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <h3 style={{ marginBottom: 6 }}>{details.agencyName}</h3>
                    <div className="muted">Responsable: <b>{details.managerName || "-"}</b></div>
                  </div>
                  <Badge status={details.status} />
                </div>

                {(err || success) && (
                  <div className={err ? "alert" : "card"} style={!err ? { border: "1px solid rgba(34,197,94,.35)", background: "rgba(34,197,94,.08)" } : undefined}>
                    {err || success}
                  </div>
                )}

                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <h4>Agence</h4>
                    <div className="muted small">Ville: {details.city || "-"}</div>
                    <div className="muted small">Pays: {details.country || "-"}</div>
                    <div className="muted small">Email: {details.contactEmail || "-"}</div>
                    <div className="muted small">Téléphone: {details.contactPhone || "-"}</div>
                  </div>
                  <div>
                    <h4>Responsable principal</h4>
                    <div className="muted small">Nom: {details.managerName || "-"}</div>
                    <div className="muted small">Email: {details.managerEmail || "-"}</div>
                    <div className="muted small">Téléphone: {details.managerPhone || "-"}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: 14, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <h4 style={{ marginBottom: 10 }}>Documents administratifs soumis par le partenaire</h4>
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>Registre de Commerce</div>
                      <div style={{ fontWeight: 600 }}>{details.rcNumber || <span className="muted">Non renseigné</span>}</div>
                    </div>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>Matricule Fiscale</div>
                      <div style={{ fontWeight: 600 }}>{details.fiscalNumber || <span className="muted">Non renseigné</span>}</div>
                    </div>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>Code IATA</div>
                      <div style={{ fontWeight: 600 }}>{details.iataCode || <span className="muted">Non renseigné</span>}</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ marginBottom: 10 }}>Valider / corriger les informations administratives</h4>
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <Input label="Registre de commerce" value={verifyForm.rcNumber} onChange={(e) => setVerifyForm({ ...verifyForm, rcNumber: e.target.value })} />
                    <Input label="Matricule fiscale" value={verifyForm.fiscalNumber} onChange={(e) => setVerifyForm({ ...verifyForm, fiscalNumber: e.target.value })} />
                    <Input label="Code IATA" value={verifyForm.iataCode} onChange={(e) => setVerifyForm({ ...verifyForm, iataCode: e.target.value })} />
                  </div>
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <Button variant="secondary" onClick={verifyAccount}>Sauvegarder et vérifier</Button>
                  </div>
                </div>

                <div>
                  <h4>Documents reçus</h4>
                  {details.documents?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {details.documents.map((doc) => (
                        <div key={doc.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <b>{doc.filename}</b>
                            <div className="muted small">{doc.type} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                          </div>
                          <a className="btn btn-secondary" href={`${API}/api/admin/partners/documents/${doc.id}/download`} target="_blank" rel="noreferrer">Télécharger</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Aucun document téléversé pour le moment.</p>
                  )}
                </div>

                <div className="card" style={{ padding: 14, border: "1px solid rgba(255,255,255,.12)" }}>
                  <h4 style={{ marginBottom: 10 }}>Actions sur le dossier</h4>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {nextStatus && (
                      <Button onClick={() => setApplicationStatus(nextStatus)}>
                        ➡️ Passer à : {STATUS_LABELS[nextStatus] || nextStatus}
                      </Button>
                    )}
                    {details.status !== "APPROVED" && details.status !== "REJECTED" && (
                      <Button onClick={approveAccount}>✅ Approuver le compte</Button>
                    )}
                    {details.status !== "REJECTED" && details.status !== "APPROVED" && (
                      <Button variant="ghost" onClick={rejectAccount}>❌ Rejeter et supprimer</Button>
                    )}
                  </div>
                  <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "14px 0" }} />
                  <div className="muted small" style={{ marginBottom: 8 }}>Forcer un statut manuellement :</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["SUBMITTED", "CONTACT_IN_PROGRESS", "DOCUMENTS_REQUESTED", "DOCUMENTS_RECEIVED", "VERIFICATION_IN_PROGRESS", "APPROVED"].map((s) => (
                      <Button key={s} variant={details.status === s ? "primary" : "secondary"} style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={() => setApplicationStatus(s)} disabled={details.status === s}>
                        {STATUS_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">Chargement...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

