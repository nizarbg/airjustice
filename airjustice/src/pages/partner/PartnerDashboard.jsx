import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

const API = "http://localhost:8080";

async function apiGet(path, token) {
  const res = await fetch(API + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
}

async function apiPut(path, token, body) {
  const res = await fetch(API + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
}

async function apiPost(path, token, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
}

export default function PartnerDashboard() {
  const { token, user, logout } = useAuth();
  const isPrincipal = user?.role === "PARTNER_PRINCIPAL";
  const isCollab = user?.role === "PARTNER_COLLAB";

  // Tabs
  const tabs = useMemo(() => {
    if (isPrincipal) {
      return [
        { key: "partnerDashboard", label: "Account Dashboard" },
        { key: "account", label: "Compte" },
        { key: "balance", label: "Solde" },
        { key: "users", label: "User Administration" },
        { key: "security", label: "Paramètres" },
      ];
    }
    // Collaborator: limited dashboard
    return [
      { key: "sales", label: "Ventes" },
      { key: "balance", label: "Solde" },
      { key: "me", label: "Mon compte" },
    ];
  }, [isPrincipal]);

  const [tab, setTab] = useState(isPrincipal ? "account" : "sales");
  const [err, setErr] = useState("");

  // Dashboard sub-tabs
const [dashboardTab, setDashboardTab] = useState("createPolicy"); // createPolicy | managePolicies

// Create policy form
const [policyForm, setPolicyForm] = useState({
  // Données client
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  // Données de vol
  flightNumber: "",
  flightDate: "",
  depIata: "",
  arrIata: "",
  // Prix
  price: "8",
  currency: "TND",
  // Attribution
  assignMode: "AUTO", // AUTO | MANUAL
  assignedAgentId: "",
});

// Existing policies (mock for now)
const [policies, setPolicies] = useState([]);
const [policyFilter, setPolicyFilter] = useState({ q: "", status: "ALL" });

// Disable modal/state
const [disableBox, setDisableBox] = useState({ open: false, policyId: null, reason: "" });

  // Data
  const [account, setAccount] = useState(null); // principal only
  const [limited, setLimited] = useState(null); // collab only
  const [balance, setBalance] = useState(null); // both (collab read-only)
  const [docs, setDocs] = useState([]); // principal only

  // Forms (principal only for account edits)
  const [contactForm, setContactForm] = useState({
    contactEmail: "",
    contactPhone: "",
    preferredLanguage: "fr",
  });
  const [agencyForm, setAgencyForm] = useState({ agencyName: "", city: "", country: "" });
  const [threshold, setThreshold] = useState("");

  // User Admin (principal only)
  const [collabs, setCollabs] = useState([]);
  const [addCollab, setAddCollab] = useState({
    fullName: "",
    email: "",
    phone: "",
    tempPassword: "",
  });
  const [resetPwd, setResetPwd] = useState({ id: "", newPassword: "" });

  // My account (both roles)
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [twoFactorMethod, setTwoFactorMethod] = useState("EMAIL"); // EMAIL | SMS

  // Initial load
  useEffect(() => {
    (async () => {
      setErr("");
      try {
        // Balance is allowed for both (collab should be read-only)
        const bal = await apiGet("/api/partner/account/balance", token);
        setBalance(bal);
        setThreshold(String(bal.lowBalanceThreshold ?? ""));

        if (isPrincipal) {
          // Principal can access full account + docs
          const acc = await apiGet("/api/partner/account", token);
          setAccount(acc);

          setContactForm({
            contactEmail: acc.contactEmail || "",
            contactPhone: acc.contactPhone || "",
            preferredLanguage: acc.preferredLanguage || "fr",
          });

          setAgencyForm({
            agencyName: acc.agencyName || "",
            city: acc.city || "",
            country: acc.country || "",
          });

          // You can also load collaborators here if you want:
          // const list = await apiGet("/api/partner/collaborators", token);
          // setCollabs(list);
        } else {
          // Collab must NOT access /account in new rules
          const lim = await apiGet("/api/partner/account/limited", token);
          setLimited(lim);
        }

        // Load "me" preferences
        const me = await apiGet("/api/partner/me", token);
        setTwoFactorMethod(me.twoFactorMethod || "EMAIL");
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [token, isPrincipal]);

  // Principal-only: documents
  const loadDocs = async () => {
    const list = await apiGet("/api/partner/documents", token);
    setDocs(list);
  };

  // Principal-only: collaborators
  const loadCollabs = async () => {
    const list = await apiGet("/api/partner/collaborators", token);
    setCollabs(list);
  };

  useEffect(() => {
  if (tab !== "partnerDashboard") return;
  // Mock data for now
  if (policies.length === 0) {
    setPolicies([
      { id: 1, clientName: "Client A", flightNumber: "TU123", flightDate: "2026-03-10", status: "ACTIVE", price: 8, currency: "TND", agent: "AUTO" },
      { id: 2, clientName: "Client B", flightNumber: "AF111", flightDate: "2026-03-12", status: "DISABLED", price: 8, currency: "TND", agent: "Agent #5" },
    ]);
  }
}, [tab]);

  useEffect(() => {
    setErr("");

    if (tab === "account" && isPrincipal) {
      // optionally load docs for account section if you show them there
      loadDocs().catch((e) => setErr(e.message));
    }
    if (tab === "users" && isPrincipal) {
      loadCollabs().catch((e) => setErr(e.message));
    }
  }, [tab, isPrincipal]);

  // Principal actions
  const saveContact = async () => {
    setErr("");
    try {
      const acc = await apiPut("/api/partner/account/contact", token, contactForm);
      setAccount(acc);
      alert("Contact mis à jour.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveAgency = async () => {
    setErr("");
    try {
      const acc = await apiPut("/api/partner/account/agency", token, agencyForm);
      setAccount(acc);
      alert("Infos agence mises à jour.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveThreshold = async () => {
    setErr("");
    try {
      // principal only in backend; collab will get 403
      const bal = await apiPut("/api/partner/account/balance/threshold", token, {
        lowBalanceThreshold: threshold,
      });
      setBalance(bal);
      alert("Seuil d’alerte enregistré.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggle2faPrincipal = async () => {
    setErr("");
    try {
      // principal only: enable/disable 2FA
      const enabled = !(account?.twoFactorEnabled ?? true);
      await apiPut("/api/partner/account/2fa", token, { enabled });
      const acc = await apiGet("/api/partner/account", token);
      setAccount(acc);
      alert("2FA mis à jour.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const uploadDoc = async (file) => {
    setErr("");
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(API + "/api/partner/documents/authorization", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur upload");

      await loadDocs();
      alert("Document envoyé.");
    } catch (e) {
      setErr(e.message);
    }
  };

  // User Admin (principal only)
  const addCollaborator = async () => {
    setErr("");
    try {
      await apiPost("/api/partner/collaborators", token, addCollab);
      setAddCollab({ fullName: "", email: "", phone: "", tempPassword: "" });
      await loadCollabs();
      alert("Collaborateur ajouté.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const deleteCollaborator = async (id) => {
    setErr("");
    try {
      const res = await fetch(API + `/api/partner/collaborators/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur");
      await loadCollabs();
    } catch (e) {
      setErr(e.message);
    }
  };

  const resetCollaboratorPassword = async () => {
    setErr("");
    try {
      await apiPost(`/api/partner/collaborators/${resetPwd.id}/reset-password`, token, {
        newPassword: resetPwd.newPassword,
      });
      setResetPwd({ id: "", newPassword: "" });
      alert("Mot de passe collaborateur réinitialisé.");
    } catch (e) {
      setErr(e.message);
    }
  };

  // My account (both roles)
  const changeMyPassword = async () => {
    setErr("");
    try {
      if (pwd.newPassword !== pwd.confirm) {
        setErr("Les mots de passe ne correspondent pas.");
        return;
      }
      await apiPut("/api/partner/me/password", token, {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      alert("Mot de passe modifié.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveMy2faMethod = async () => {
    setErr("");
    try {
      await apiPut("/api/partner/me/2fa-method", token, { twoFactorMethod });
      alert("Méthode 2FA enregistrée.");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="page">
      <header className="nav">
        <div className="brand">AirJustice Partner</div>
        <div className="nav-actions">
          <span className="muted">{user?.email}</span>
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container">
        <div className="card" style={{ marginBottom: 14 }}>
          <h2>Tableau de bord partenaire</h2>

          {/* Status: principal only */}
          {isPrincipal && account && (
            <p className="muted">
              Statut: <b>{account.status}</b> • Responsable principal: <b>{account.principalName || "-"}</b>
            </p>
          )}

          {/* Limited header for collab */}
          {isCollab && limited && (
            <p className="muted">
              Accès collaborateur (limité) • Agence: <b>{limited.agencyName || "-"}</b>
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {tabs.map((t) => (
              <Button
                key={t.key}
                variant={tab === t.key ? "primary" : "secondary"}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {err && <div className="alert">{err}</div>}

        {/* ============ PRINCIPAL: ACCOUNT DASHBOARD (Policies) ============ */}
{isPrincipal && tab === "partnerDashboard" && (
  <div className="card">
    <h3>Gestion des polices</h3>
    <p className="muted">Créer et gérer les polices (audit, désactivation, filtre).</p>

    {/* Sub-tabs */}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
      <Button
        variant={dashboardTab === "createPolicy" ? "primary" : "secondary"}
        onClick={() => setDashboardTab("createPolicy")}
      >
        Créer une nouvelle police
      </Button>
      <Button
        variant={dashboardTab === "managePolicies" ? "primary" : "secondary"}
        onClick={() => setDashboardTab("managePolicies")}
      >
        Gérer les polices existantes
      </Button>
    </div>

    {/* ===== Create Policy ===== */}
    {dashboardTab === "createPolicy" && (
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <div className="card">
          <h3>Données client</h3>
          <Input label="Nom complet" value={policyForm.clientName}
            onChange={(e)=>setPolicyForm({ ...policyForm, clientName: e.target.value })} />
          <Input label="Email" type="email" value={policyForm.clientEmail}
            onChange={(e)=>setPolicyForm({ ...policyForm, clientEmail: e.target.value })} />
          <Input label="Téléphone" value={policyForm.clientPhone}
            onChange={(e)=>setPolicyForm({ ...policyForm, clientPhone: e.target.value })} />
        </div>

        <div className="card">
          <h3>Données de vol</h3>
          <Input label="Numéro de vol" value={policyForm.flightNumber}
            onChange={(e)=>setPolicyForm({ ...policyForm, flightNumber: e.target.value })} />
          <Input label="Date du vol" type="date" value={policyForm.flightDate}
            onChange={(e)=>setPolicyForm({ ...policyForm, flightDate: e.target.value })} />
          <Input label="Départ (IATA)" value={policyForm.depIata}
            onChange={(e)=>setPolicyForm({ ...policyForm, depIata: e.target.value })} />
          <Input label="Arrivée (IATA)" value={policyForm.arrIata}
            onChange={(e)=>setPolicyForm({ ...policyForm, arrIata: e.target.value })} />
        </div>

        <div className="card">
          <h3>Prix</h3>
          <Input label="Montant" value={policyForm.price}
            onChange={(e)=>setPolicyForm({ ...policyForm, price: e.target.value })} />
          <label className="field">
            <span className="label">Devise</span>
            <select
              className="input"
              value={policyForm.currency}
              onChange={(e)=>setPolicyForm({ ...policyForm, currency: e.target.value })}
            >
              <option value="TND">TND</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>

        <div className="card">
          <h3>Attribution à l’agent</h3>
          <label className="field">
            <span className="label">Mode</span>
            <select
              className="input"
              value={policyForm.assignMode}
              onChange={(e)=>setPolicyForm({ ...policyForm, assignMode: e.target.value })}
            >
              <option value="AUTO">Attribution automatique</option>
              <option value="MANUAL">Manuel</option>
            </select>
          </label>

          {policyForm.assignMode === "MANUAL" && (
            <Input
              label="ID Agent"
              value={policyForm.assignedAgentId}
              onChange={(e)=>setPolicyForm({ ...policyForm, assignedAgentId: e.target.value })}
              placeholder="ex: 5"
            />
          )}

          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                // UI-only: push policy mock
                const newPolicy = {
                  id: Date.now(),
                  clientName: policyForm.clientName || "—",
                  flightNumber: policyForm.flightNumber || "—",
                  flightDate: policyForm.flightDate || "—",
                  status: "ACTIVE",
                  price: Number(policyForm.price || 0),
                  currency: policyForm.currency,
                  agent: policyForm.assignMode === "AUTO" ? "AUTO" : `Agent #${policyForm.assignedAgentId || "?"}`,
                };
                setPolicies([newPolicy, ...policies]);
                alert("Police créée (mock). À connecter au backend.");
              }}
            >
              Créer la police
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ===== Manage Policies ===== */}
    {dashboardTab === "managePolicies" && (
      <div style={{ marginTop: 14 }}>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="card">
            <h3>Filtrer</h3>
            <Input
              label="Recherche (client / vol)"
              value={policyFilter.q}
              onChange={(e)=>setPolicyFilter({ ...policyFilter, q: e.target.value })}
            />
            <label className="field">
              <span className="label">Statut</span>
              <select
                className="input"
                value={policyFilter.status}
                onChange={(e)=>setPolicyFilter({ ...policyFilter, status: e.target.value })}
              >
                <option value="ALL">Tous</option>
                <option value="ACTIVE">Actifs</option>
                <option value="DISABLED">Désactivés</option>
              </select>
            </label>
          </div>

          <div className="card">
            <h3>Historique d’audit</h3>
            <p className="muted">
              (MVP) On affichera ici les actions: création, désactivation, modifications, par qui et quand.
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3>Polices</h3>

          {(() => {
            const q = policyFilter.q.trim().toLowerCase();
            const filtered = policies.filter((p) => {
              const matchesQ =
                !q ||
                p.clientName.toLowerCase().includes(q) ||
                p.flightNumber.toLowerCase().includes(q);

              const matchesStatus =
                policyFilter.status === "ALL" || p.status === policyFilter.status;

              return matchesQ && matchesStatus;
            });

            return filtered.length === 0 ? (
              <p className="muted">Aucune police.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((p) => (
                  <div key={p.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap: 10, flexWrap:"wrap" }}>
                      <div>
                        <b>#{p.id}</b> • <b>{p.clientName}</b>
                        <div className="muted small">
                          Vol: {p.flightNumber} • Date: {p.flightDate} • Prix: {p.price} {p.currency} • Agent: {p.agent}
                        </div>
                        <div className="muted small">
                          Statut: <b>{p.status}</b>
                        </div>
                      </div>

                      <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
                        <Button
                          variant="secondary"
                          onClick={() => alert("Afficher (à connecter au backend).")}
                        >
                          Afficher
                        </Button>

                        {p.status === "ACTIVE" ? (
                          <Button
                            onClick={() => setDisableBox({ open: true, policyId: p.id, reason: "" })}
                          >
                            Désactiver
                          </Button>
                        ) : (
                          <Button variant="ghost" disabled>
                            Désactivée
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Disable modal (simple inline) */}
        {disableBox.open && (
          <div className="card" style={{ marginTop: 14 }}>
            <h3>Désactiver la police #{disableBox.policyId}</h3>
            <Input
              label="Justification"
              value={disableBox.reason}
              onChange={(e)=>setDisableBox({ ...disableBox, reason: e.target.value })}
              placeholder="Pourquoi désactiver ?"
            />

            <div style={{ marginTop: 12, display:"flex", justifyContent:"flex-end", gap: 10 }}>
              <Button
                variant="secondary"
                onClick={() => setDisableBox({ open: false, policyId: null, reason: "" })}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!disableBox.reason.trim()) {
                    alert("Veuillez fournir une justification.");
                    return;
                  }
                  setPolicies(policies.map(p =>
                    p.id === disableBox.policyId ? { ...p, status: "DISABLED", disabledReason: disableBox.reason } : p
                  ));
                  alert("Police désactivée (mock). À connecter au backend + audit.");
                  setDisableBox({ open: false, policyId: null, reason: "" });
                }}
              >
                Confirmer désactivation
              </Button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}

        {/* ============ PRINCIPAL: COMPTE ============ */}
        {isPrincipal && tab === "account" && account && (
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card">
              <h3>Agence</h3>
              <Input
                label="Nom"
                value={agencyForm.agencyName}
                onChange={(e) => setAgencyForm({ ...agencyForm, agencyName: e.target.value })}
              />
              <Input label="Registre de Commerce" value={account.rcNumber || ""} readOnly />
              <Input label="Matricule fiscale" value={account.fiscalNumber || ""} readOnly />
              <Input label="Code IATA" value={account.iataCode || ""} readOnly />
              <Input
                label="Ville"
                value={agencyForm.city}
                onChange={(e) => setAgencyForm({ ...agencyForm, city: e.target.value })}
              />
              <Input
                label="Pays"
                value={agencyForm.country}
                onChange={(e) => setAgencyForm({ ...agencyForm, country: e.target.value })}
              />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={saveAgency}>Enregistrer</Button>
              </div>
            </div>

            <div className="card">
              <h3>Responsable Principale</h3>
              <Input
                label="Email"
                value={contactForm.contactEmail}
                onChange={(e) => setContactForm({ ...contactForm, contactEmail: e.target.value })}
              />
              <Input
                label="Téléphone"
                value={contactForm.contactPhone}
                onChange={(e) => setContactForm({ ...contactForm, contactPhone: e.target.value })}
              />
              <label className="field">
                <span className="label">Langue préférée</span>
                <select
                  className="input"
                  value={contactForm.preferredLanguage}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, preferredLanguage: e.target.value })
                  }
                >
                  <option value="fr">Français</option>
                  <option value="ar">Arabe</option>
                </select>
              </label>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={saveContact}>Enregistrer</Button>
              </div>
            </div>

            <div className="card">
              <h3>Historique documents</h3>
              <p className="muted">Autorisation d’exercice</p>

              <label className="field">
                <span className="label">Uploader (PDF/image)</span>
                <input
                  className="input"
                  type="file"
                  onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])}
                />
              </label>

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {docs.map((d) => (
                  <div key={d.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <b>{d.filename}</b>
                        <div className="muted small">{new Date(d.uploadedAt).toLocaleString()}</div>
                      </div>
                      <a
                        className="btn btn-secondary"
                        href={`${API}/api/partner/documents/${d.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Télécharger
                      </a>
                    </div>
                  </div>
                ))}
                {docs.length === 0 && <p className="muted">Aucun document.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ============ BOTH: SOLDE ============ */}
        {tab === "balance" && (
          <div className="card">
            <h3>Solde prépayé & alertes</h3>
            {balance ? (
              <>
                <p>
                  <b>Solde:</b> {String(balance.prepaidBalance)} TND
                </p>
                <p className="muted">
                  Alerte recharge: {balance.lowBalanceAlert ? "✅ Solde bas" : "OK"}
                </p>

                {/* Principal can edit threshold; collab read-only */}
                {isPrincipal ? (
                  <>
                    <Input
                      label="Seuil d’alerte (TND)"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={saveThreshold}>Enregistrer le seuil</Button>
                    </div>
                  </>
                ) : (
                  <p className="muted small">Lecture seule (Collaborateur).</p>
                )}
              </>
            ) : (
              <p className="muted">Chargement...</p>
            )}
          </div>
        )}

        {/* ============ PRINCIPAL: USER ADMIN ============ */}
        {isPrincipal && tab === "users" && (
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card">
              <h3>Ajouter un collaborateur</h3>
              <Input
                label="Nom"
                value={addCollab.fullName}
                onChange={(e) => setAddCollab({ ...addCollab, fullName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={addCollab.email}
                onChange={(e) => setAddCollab({ ...addCollab, email: e.target.value })}
              />
              <Input
                label="Téléphone"
                value={addCollab.phone}
                onChange={(e) => setAddCollab({ ...addCollab, phone: e.target.value })}
              />
              <Input
                label="Mot de passe temporaire"
                type="password"
                value={addCollab.tempPassword}
                onChange={(e) => setAddCollab({ ...addCollab, tempPassword: e.target.value })}
              />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={addCollaborator}>Créer</Button>
              </div>
              <p className="muted small">
                Le collaborateur aura un accès restreint (ventes + solde lecture seule).
              </p>
            </div>

            <div className="card">
              <h3>Liste des collaborateurs</h3>
              {collabs.length === 0 ? (
                <p className="muted">Aucun collaborateur.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {collabs.map((c) => (
                    <div key={c.id} className="card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div>
                          <b>{c.fullName}</b>
                          <div className="muted small">{c.email}</div>
                        </div>
                        <Button variant="ghost" onClick={() => deleteCollaborator(c.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "14px 0" }} />

              <h3>Réinitialiser mot de passe</h3>
              <Input
                label="ID collaborateur"
                value={resetPwd.id}
                onChange={(e) => setResetPwd({ ...resetPwd, id: e.target.value })}
                placeholder="ex: 12"
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={resetPwd.newPassword}
                onChange={(e) => setResetPwd({ ...resetPwd, newPassword: e.target.value })}
              />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={resetCollaboratorPassword}>Réinitialiser</Button>
              </div>
            </div>
          </div>
        )}

      {/* ============ PRINCIPAL: SECURITY ============ */}
{isPrincipal && tab === "security" && (
  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    {/* Card 1: Password only */}
    <div className="card">
      <h3>Mon compte</h3>

      <Input
        label="Mot de passe actuel"
        type="password"
        value={pwd.currentPassword}
        onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
      />
      <Input
        label="Nouveau mot de passe"
        type="password"
        value={pwd.newPassword}
        onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
      />
      <Input
        label="Confirmer"
        type="password"
        value={pwd.confirm}
        onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
      />

      {/* ✅ spacing so button is not too close */}
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={changeMyPassword}>Changer mon mot de passe</Button>
      </div>
    </div>

    {/* Card 2: 2FA enable/disable + method */}
    <div className="card">
      <h3>Accès sécurisé</h3>
      <p className="muted">
        Le Responsable principal peut activer / désactiver la double authentification (2FA).
      </p>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={toggle2faPrincipal}>Activer/Désactiver 2FA</Button>
      </div>

      <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "14px 0" }} />

      <h3>Méthode 2FA</h3>
      <label className="field">
        <span className="label">Choisir la méthode</span>
        <select
          className="input"
          value={twoFactorMethod}
          onChange={(e) => setTwoFactorMethod(e.target.value)}
        >
          <option value="EMAIL">E-mail</option>
          <option value="SMS">SMS</option>
        </select>
      </label>

      {/* ✅ spacing so button is not too close */}
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={saveMy2faMethod}>Enregistrer</Button>
      </div>
    </div>
  </div>
)}

        {/* ============ COLLAB: SALES (placeholder) ============ */}
        {isCollab && tab === "sales" && (
          <div className="card">
            <h3>Ventes</h3>
            <p className="muted">
              Accès limité collaborateur — ici on affichera les ventes (à connecter au backend).
            </p>
          </div>
        )}

        {/* ============ COLLAB: ME ============ */}
        {isCollab && tab === "me" && (
          <div className="card">
            <h3>Mon compte</h3>

            <h4 className="muted" style={{ marginTop: 0 }}>Changer mon mot de passe</h4>
            <Input
              label="Mot de passe actuel"
              type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            />
            <Input
              label="Confirmer"
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
            <Button onClick={changeMyPassword}>Mettre à jour</Button>

            <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "14px 0" }} />

            <h3>Méthode d’authentification (2FA)</h3>
            <p className="muted">
              Vous pouvez choisir la méthode (email / SMS) pour votre propre accès.
            </p>
            <label className="field">
              <span className="label">Méthode 2FA</span>
              <select
                className="input"
                value={twoFactorMethod}
                onChange={(e) => setTwoFactorMethod(e.target.value)}
              >
                <option value="EMAIL">E-mail</option>
                <option value="SMS">SMS</option>
              </select>
            </label>
            <Button onClick={saveMy2faMethod}>Enregistrer</Button>

            <p className="muted small" style={{ marginTop: 10 }}>
              Le collaborateur ne peut pas gérer le compte ni les documents.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}