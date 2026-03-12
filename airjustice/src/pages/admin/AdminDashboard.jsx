import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

const API = "http://localhost:8080";
const STATUS_OPTIONS = ["ALL", "PENDING", "VERIFIED", "ACTIVE"];

async function api(path, token, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": options.body instanceof FormData ? undefined : "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur admin.");
  return data;
}

function Badge({ status }) {
  const styles = {
    PENDING: { background: "rgba(245, 158, 11, .15)", border: "1px solid rgba(245, 158, 11, .35)" },
    VERIFIED: { background: "rgba(59, 130, 246, .15)", border: "1px solid rgba(59, 130, 246, .35)" },
    ACTIVE: { background: "rgba(34, 197, 94, .15)", border: "1px solid rgba(34, 197, 94, .35)" },
  };
  return (
    <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, ...styles[status] }}>
      {status}
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
      if (!selectedId && data?.[0]?.id) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    setErr("");
    try {
      const data = await api(`/api/admin/partners/applications/${id}`, adminToken);
      setDetails(data);
      setVerifyForm({
        rcNumber: data.rcNumber || "",
        fiscalNumber: data.fiscalNumber || "",
        iataCode: data.iataCode || "",
      });
    } catch (error) {
      setErr(error.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (selectedId) loadDetails(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const groupedStats = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const verifyAccount = async () => {
    if (!selectedId) return;
    setErr("");
    setSuccess("");
    try {
      const data = await api(`/api/admin/partners/applications/${selectedId}/verify`, adminToken, {
        method: "PUT",
        body: JSON.stringify(verifyForm),
      });
      setDetails(data);
      setSuccess("Dossier vérifié. Le partenaire peut maintenant finaliser son activation au login.");
      await loadApplications();
    } catch (error) {
      setErr(error.message);
    }
  };

  const approveAccount = async () => {
    if (!selectedId) return;
    setErr("");
    setSuccess("");
    try {
      const data = await api(`/api/admin/partners/applications/${selectedId}/approve`, adminToken, {
        method: "PUT",
      });
      setDetails(data);
      setSuccess("Compte activé.");
      await loadApplications();
    } catch (error) {
      setErr(error.message);
    }
  };

  const rejectAccount = async () => {
    if (!selectedId) return;
    const confirmed = window.confirm("Rejeter ce dossier supprimera le compte partenaire. Continuer ?");
    if (!confirmed) return;
    setErr("");
    setSuccess("");
    try {
      await api(`/api/admin/partners/applications/${selectedId}`, adminToken, { method: "DELETE" });
      setSuccess("Dossier rejeté et compte supprimé.");
      setSelectedId(null);
      setDetails(null);
      await loadApplications();
    } catch (error) {
      setErr(error.message);
    }
  };

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
          <p className="muted">Vous gérez ici les demandes reçues depuis `PartnerApply`, les documents administratifs et l’activation finale du compte.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            {STATUS_OPTIONS.map((option) => (
              <Button key={option} variant={status === option ? "primary" : "secondary"} onClick={() => setStatus(option)}>
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "340px 1fr", gap: 14 }}>
          <div className="card">
            <h3>Dossiers</h3>
            <div className="muted small" style={{ marginBottom: 10 }}>
              PENDING: {groupedStats.PENDING || 0} • VERIFIED: {groupedStats.VERIFIED || 0} • ACTIVE: {groupedStats.ACTIVE || 0}
            </div>
            {loading ? (
              <p className="muted">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="muted">Aucun dossier pour ce filtre.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="card"
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      border: selectedId === item.id ? "1px solid rgba(255,255,255,.35)" : "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.03)",
                      cursor: "pointer",
                    }}
                  >
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
                          <a
                            className="btn btn-secondary"
                            href={`${API}/api/admin/partners/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Télécharger
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Aucun document téléversé pour le moment.</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Button variant="secondary" onClick={verifyAccount}>Vérifier le dossier</Button>
                  <Button onClick={approveAccount}>Activer le compte</Button>
                  <Button variant="ghost" onClick={rejectAccount}>Rejeter et supprimer</Button>
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

