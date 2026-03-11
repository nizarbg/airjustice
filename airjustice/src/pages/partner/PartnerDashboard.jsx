import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import PolicyStepper from "./PolicyStepper";
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

/**
 * Lightweight toast system (no external deps).
 */
function Toasts({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: 360,
        maxWidth: "calc(100vw - 28px)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="card"
          style={{
            padding: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background:
              t.type === "success"
                ? "rgba(24, 160, 88, .15)"
                : t.type === "error"
                  ? "rgba(220, 38, 38, .15)"
                  : "rgba(255,255,255,.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {t.type === "success" ? "Succès" : t.type === "error" ? "Erreur" : "Info"}
              </div>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {t.message}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ height: 34 }}
              onClick={() => onClose(t.id)}
              aria-label="Close toast"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stepper({ steps, activeIndex }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {steps.map((s, idx) => {
        const state = idx < activeIndex ? "done" : idx === activeIndex ? "active" : "todo";
        return (
          <div
            key={s.key}
            className="card"
            style={{
              padding: 10,
              minWidth: 190,
              border:
                state === "active"
                  ? "1px solid rgba(255,255,255,.35)"
                  : "1px solid rgba(255,255,255,.10)",
              opacity: state === "todo" ? 0.7 : 1,
            }}
          >
            <div style={{ fontWeight: 800 }}>
              {idx + 1}. {s.label}
            </div>
            <div className="muted small">{s.hint}</div>
          </div>
        );
      })}
    </div>
  );
}

function isAcceptedFile(file) {
  const okTypes = ["application/pdf", "image/jpeg", "image/png"];
  // Some browsers may return empty type for pdf; fallback to extension
  const name = (file?.name || "").toLowerCase();
  const extOk = name.endsWith(".pdf") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
  return okTypes.includes(file.type) || extOk;
}

// Very light flight number validation (MVP). Example: "TU123", "AF111", "BA12"
function validateFlightNumber(value) {
  const v = (value || "").trim().toUpperCase();
  if (!v) return { ok: false, msg: "Numéro de vol requis." };
  if (!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(v)) {
    return { ok: false, msg: "Format invalide (ex: TU123, AF111, BA12)." };
  }
  return { ok: true, msg: "" };
}

function normalizeIata(v) {
  return (v || "").trim().toUpperCase();
}

function nowIso() {
  return new Date().toISOString();
}

export default function PartnerDashboard() {
  const { token, user, logout } = useAuth();
  const isPrincipal = user?.role === "PARTNER_PRINCIPAL";
  const isCollab = user?.role === "PARTNER_COLLAB";

  // Tabs
  const tabs = useMemo(() => {
    if (isPrincipal) {
      return [
        { key: "partnerDashboard", label: "Tableau de bord" },
        { key: "account", label: "Compte" },
        { key: "balance", label: "Solde" },
        { key: "users", label: "User Administration" },
        { key: "security", label: "Paramètres" },
      ];
    }
    // Collaborator: limited dashboard
    return [
      { key: "partnerDashboard", label: "Tableau de bord" },
      { key: "balance", label: "Solde" },
      { key: "me", label: "Mon compte" },
    ];
  }, [isPrincipal]);

  const [tab, setTab] = useState("partnerDashboard");
  const [err, setErr] = useState("");

  // Toasts
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(1);
  const addToast = (type, message, ttlMs = 3500) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, type, message, createdAt: nowIso() }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttlMs);
  };
  const closeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Dashboard sub-tabs (policies section)
  const [dashboardTab, setDashboardTab] = useState("createPolicy"); // createPolicy | managePolicies

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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // My account (both roles)
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [capsLock, setCapsLock] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState("EMAIL"); // EMAIL | SMS

  const passwordValidation = useMemo(() => {
    const currentOk = pwd.currentPassword.trim().length > 0;
    const nextLenOk = pwd.newPassword.length >= 8;
    const nextOk = pwd.newPassword.trim().length > 0 && nextLenOk;
    const confirmFilled = pwd.confirm.trim().length > 0;
    const match = confirmFilled && pwd.confirm === pwd.newPassword;

    return {
      current: {
        ok: currentOk,
        msg: currentOk ? "Mot de passe actuel saisi." : "Ce champ est requis.",
      },
      next: {
        ok: nextOk,
        msg: nextOk ? "Format valide." : "Au moins 8 caractères.",
      },
      confirm: {
        ok: match,
        msg: match ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas.",
      },
    };
  }, [pwd]);

  const mapCollaboratorStatus = (collaborator) => {
    const hasConnected =
      collaborator?.hasLoggedIn === true ||
      collaborator?.isActive === true ||
      collaborator?.loggedInAt != null ||
      collaborator?.lastLoginAt != null ||
      collaborator?.lastLogin != null;
    return hasConnected ? "Actif" : "Inactif";
  };

  // Policies (real backend)
  const [policies, setPolicies] = useState([]);
  const [policyFilter, setPolicyFilter] = useState({ q: "", status: "ALL" });
  const [disableBox, setDisableBox] = useState({ open: false, policyId: null, reason: "" });
  const [selectedPolicy, setSelectedPolicy] = useState(null); // detail view

  const loadPolicies = async () => {
    const q = policyFilter.q?.trim() || "";
    const status = policyFilter.status || "ALL";
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status && status !== "ALL") qs.set("status", status);
    const path = qs.toString() ? `/api/partner/policies?${qs}` : "/api/partner/policies";
    const list = await apiGet(path, token);
    setPolicies(Array.isArray(list) ? list : []);
  };

  // ============ Create policy stepper (New UX) ============
  const steps = [
    { key: "upload", label: "Upload", hint: "PDF/JPG/PNG • drag & drop • multi-fichiers" },
    { key: "extract", label: "Extraction & validation AI", hint: "Corriger/valider les champs détectés" },
    { key: "contact", label: "Contact & résumé", hint: "Email/téléphone + création sans changer de page" },
  ];
  const [activeStep, setActiveStep] = useState(0);

  const [uploadState, setUploadState] = useState({
    files: [],
    progress: 0,
    analyzing: false,
    error: "",
    noFlightDetected: false,
    unreadable: false,
  });

  // Simulated AI extraction result (editable) – MVP.
  // Backend doesn’t currently provide extraction endpoint; we mimic it client-side.
  const [aiState, setAiState] = useState({
    uncertainFields: {}, // e.g. { "segments.0.flightNumber": true }
    passengers: [
      {
        fullName: "",
      },
    ],
    segments: [
      {
        flightNumber: "",
        depIata: "",
        arrIata: "",
        date: "", // YYYY-MM-DD
        time: "", // HH:MM
        airline: "",
      },
    ],
  });

  const [contactState, setContactState] = useState({
    email: "",
    phone: "",
    notifyEmail: true,
    notifySms: false,
  });

  const [createdState, setCreatedState] = useState({
    created: false,
    policy: null,
  });

  const resetCreateFlow = () => {
    setActiveStep(0);
    setUploadState({
      files: [],
      progress: 0,
      analyzing: false,
      error: "",
      noFlightDetected: false,
      unreadable: false,
    });
    setAiState({
      uncertainFields: {},
      passengers: [{ fullName: "" }],
      segments: [
        { flightNumber: "", depIata: "", arrIata: "", date: "", time: "", airline: "" },
      ],
    });
    setContactState({ email: "", phone: "", notifyEmail: true, notifySms: false });
    setCreatedState({ created: false, policy: null });
    setSelectedPolicy(null);
  };

  const pushFiles = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    // Validate format
    const bad = list.find((f) => !isAcceptedFile(f));
    if (bad) {
      setUploadState((s) => ({
        ...s,
        error: `Format non supporté: ${bad.name}. Formats acceptés: PDF, JPG, PNG.`,
      }));
      addToast("error", `Format non supporté: ${bad.name}`);
      return;
    }

    // Simulated analysis
    setUploadState((s) => ({
      ...s,
      files: [...s.files, ...list],
      error: "",
      analyzing: true,
      progress: 0,
      unreadable: false,
      noFlightDetected: false,
    }));

    // Fake progress
    for (let p = 1; p <= 100; p += 10) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 90));
      setUploadState((s) => ({ ...s, progress: p }));
    }

    // Mock outcomes: if file name contains "noflight" => noFlightDetected, "bad" => unreadable
    const fileNames = list.map((f) => (f.name || "").toLowerCase()).join(" ");
    const unreadable = fileNames.includes("bad") || fileNames.includes("unreadable");
    const noFlightDetected = fileNames.includes("noflight") || fileNames.includes("no-flight");

    if (unreadable) {
      setUploadState((s) => ({
        ...s,
        analyzing: false,
        unreadable: true,
        error: "Document illisible. Veuillez réuploader une version plus nette.",
      }));
      addToast("error", "Document illisible. Réupload possible.");
      return;
    }

    if (noFlightDetected) {
      setUploadState((s) => ({
        ...s,
        analyzing: false,
        noFlightDetected: true,
        error: "Aucun vol détecté. Vous pouvez saisir manuellement les informations.",
      }));
      addToast("info", "Aucun vol détecté. Saisie manuelle possible.");
      // Still allow to proceed to step 2 with blank fields
      return;
    }

    // Simulate extracted data
    setAiState((prev) => ({
      ...prev,
      uncertainFields: {
        "segments.0.flightNumber": true,
        "segments.0.airline": true,
      },
      passengers: [{ fullName: prev.passengers?.[0]?.fullName || "" }],
      segments: [
        {
          flightNumber: "TU123",
          depIata: "TUN",
          arrIata: "CDG",
          date: new Date().toISOString().slice(0, 10),
          time: "10:30",
          airline: "",
        },
      ],
    }));

    setUploadState((s) => ({ ...s, analyzing: false }));
    addToast("success", "Fichiers uploadés. Extraction en cours (MVP).");
  };

  const removeUploadedFile = (idx) => {
    setUploadState((s) => {
      const next = [...s.files];
      next.splice(idx, 1);
      return { ...s, files: next };
    });
  };

  const canGoStep2 = uploadState.files.length > 0 && !uploadState.analyzing && !uploadState.unreadable;
  const canConfirmAI = () => {
    // At least 1 segment with flightNumber valid, dep/arr, date present
    const segs = aiState.segments || [];
    if (segs.length === 0) return false;
    const s0 = segs[0];
    const fn = validateFlightNumber(s0.flightNumber);
    if (!fn.ok) return false;
    if (!normalizeIata(s0.depIata) || !normalizeIata(s0.arrIata)) return false;
    if (!s0.date) return false;
    return true;
  };

  const canCreatePolicy = () => {
    if (!contactState.email?.trim()) return false;
    if (!contactState.phone?.trim()) return false;
    if (!canConfirmAI()) return false;
    return true;
  };

  const goNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const confirmAIData = () => {
    if (!canConfirmAI()) {
      addToast("error", "Merci de corriger les champs requis (numéro de vol, IATA, date).");
      return;
    }
    // If multiple passengers: keep as-is (MVP). For creation we only use passenger[0].
    addToast("success", "Données confirmées.");
    setActiveStep(2);
  };

  const createPolicy = async () => {
    setErr("");
    try {
      if (!canCreatePolicy()) {
        addToast("error", "Email et téléphone requis. Vérifiez aussi les données de vol.");
        return;
      }

      // Map stepper state => CreatePolicyRequest (backend)
      const passenger = aiState.passengers?.[0] || { fullName: "" };
      const seg = aiState.segments?.[0] || {};

      const payload = {
        clientName: passenger.fullName || "",
        clientEmail: contactState.email,
        clientPhone: contactState.phone,
        flightNumber: (seg.flightNumber || "").toUpperCase(),
        flightDate: seg.date, // yyyy-mm-dd
        depIata: normalizeIata(seg.depIata),
        arrIata: normalizeIata(seg.arrIata),
        price: "8",
        currency: "TND",
        autoAssign: true,
        assignedAgentId: null,
        notifyEmail: !!contactState.notifyEmail,
        notifySms: !!contactState.notifySms,
      };

      const created = await apiPost("/api/partner/policies", token, payload);

      setCreatedState({ created: true, policy: created });
      addToast("success", `Police créée: #${created.id} • Statut: Activement surveillé`);

      // Refresh list so it appears in "manage"
      loadPolicies().catch(() => {});

      // Keep user on same screen (no page change). Show “created state” UI.
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

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
          setTwoFactorEnabled(acc.twoFactorEnabled ?? true);
        } else {
          // Collab must NOT access /account in new rules
          const lim = await apiGet("/api/partner/account/limited", token);
          setLimited(lim);
        }

        // Load "me" preferences
        const me = await apiGet("/api/partner/me", token);
        setTwoFactorMethod(me.twoFactorMethod || "EMAIL");
        if (!isPrincipal) {
          setTwoFactorEnabled(me.twoFactorEnabled ?? true);
        }
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

  // Load policies when dashboard open
  useEffect(() => {
    if (tab !== "partnerDashboard") return;
    loadPolicies().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Load docs/collabs when tabs active
  useEffect(() => {
    setErr("");

    if (tab === "account" && isPrincipal) {
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
      addToast("success", "Contact mis à jour.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const saveAgency = async () => {
    setErr("");
    try {
      const acc = await apiPut("/api/partner/account/agency", token, agencyForm);
      setAccount(acc);
      addToast("success", "Infos agence mises à jour.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
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
      addToast("success", "Seuil d’alerte enregistré.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const updatePrincipal2fa = async (enabled) => {
    setErr("");
    try {
      await apiPut("/api/partner/account/2fa", token, { enabled });
      const acc = await apiGet("/api/partner/account", token);
      setAccount(acc);
      setTwoFactorEnabled(acc.twoFactorEnabled ?? enabled);
      addToast("success", "2FA mis à jour.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
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
      addToast("success", "Document envoyé.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  // User Admin (principal only)
  const addCollaborator = async () => {
    setErr("");
    try {
      if (!addCollab.firstName.trim() || !addCollab.lastName.trim() || !addCollab.email.trim()) {
        addToast("error", "Nom, prénom et email sont requis.");
        return;
      }
      const fullName = `${addCollab.lastName} ${addCollab.firstName}`.trim();
      await apiPost("/api/partner/collaborators", token, {
        fullName,
        email: addCollab.email,
        phone: addCollab.phone,
      });
      setAddCollab({ firstName: "", lastName: "", email: "", phone: "" });
      await loadCollabs();
      addToast("success", "Collaborateur ajouté.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const deleteCollaborator = async (id) => {
    setErr("");
    const prev = [...collabs];
    setCollabs((current) => current.filter((c) => c.id !== id));
    try {
      const res = await fetch(API + `/api/partner/collaborators/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Erreur");
      addToast("success", "Collaborateur supprimé.");
    } catch (e) {
      setCollabs(prev);
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  // My account (both roles)
  const changeMyPassword = async () => {
    setErr("");
    try {
      if (!passwordValidation.current.ok || !passwordValidation.next.ok || !passwordValidation.confirm.ok) {
        setErr("Veuillez corriger les champs du mot de passe.");
        addToast("error", "Veuillez corriger les champs du mot de passe.");
        return;
      }
      await apiPut("/api/partner/me/password", token, {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      setCapsLock(false);
      addToast("success", "Mot de passe modifié.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const saveMy2faMethod = async () => {
    setErr("");
    try {
      await apiPut("/api/partner/me/2fa-method", token, { twoFactorMethod });
      addToast("success", "Méthode 2FA enregistrée.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const showPolicy = async (id) => {
    setErr("");
    try {
      const p = await apiGet(`/api/partner/policies/${id}`, token);
      setSelectedPolicy(p);
      addToast("info", `Police #${p.id} chargée.`);
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const disablePolicy = async () => {
    setErr("");
    try {
      if (!disableBox.reason.trim()) {
        addToast("error", "Veuillez fournir une justification.");
        return;
      }
      const updated = await apiPut(`/api/partner/policies/${disableBox.policyId}/disable`, token, {
        reason: disableBox.reason,
      });
      setDisableBox({ open: false, policyId: null, reason: "" });
      setSelectedPolicy((prev) => (prev?.id === updated.id ? updated : prev));
      addToast("success", `Police #${updated.id} désactivée.`);
      await loadPolicies();
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  return (
    <div className="page">
      <Toasts toasts={toasts} onClose={closeToast} />

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
              Statut: <b>{account.status}</b> • Responsable principal:{" "}
              <b>{account.principalName || "-"}</b>
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

        {/* ============ DASHBOARD: POLICIES (Principal + Collab) ============ */}
        {isPrincipal && tab === "partnerDashboard" && (
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
          <PolicyStepper token={token} />

           <div className="card">
              <h3>Gérer les polices existantes</h3>
              <p className="muted">
                 Utilisez l’onglet <b>User Administration</b> pour les utilisateurs, et l’onglet <b>Compte</b> pour les paramètres agence.
              </p>
          </div>
        </div>
        )}

        {/* ============ PRINCIPAL: COMPTE ============ */}
        {isPrincipal && tab === "account" && account && (
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card">
              <h3>Agence</h3>
              <Input label="Nom" value={account.agencyName || ""} readOnly />
              <Input label="Registre de Commerce" value={account.rcNumber || ""} readOnly />
              <Input label="Matricule fiscale" value={account.fiscalNumber || ""} readOnly />
              <Input label="Code IATA" value={account.iataCode || ""} readOnly />
              <Input label="Ville" value={account.city || ""} readOnly />
              <Input label="Pays" value={account.country || ""} readOnly />
            </div>

            <div className="card">
              <h3>Responsable Principal</h3>
              <Input label="Nom / Prénom" value={account.principalName || ""} readOnly />
              <Input label="Téléphone" value={contactForm.contactPhone} readOnly />
              <Input label="Email" value={contactForm.contactEmail} readOnly />
            </div>

            <div className="card">
              <h3>Documents</h3>
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
                <p className="muted">Alerte recharge: {balance.lowBalanceAlert ? "✅ Solde bas" : "OK"}</p>

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
                value={addCollab.lastName}
                onChange={(e) => setAddCollab({ ...addCollab, lastName: e.target.value })}
              />
              <Input
                label="Prénom"
                value={addCollab.firstName}
                onChange={(e) => setAddCollab({ ...addCollab, firstName: e.target.value })}
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
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={addCollaborator}>Ajouter</Button>
              </div>
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
                          <div className="muted small">Nom & Prénom: {c.fullName}</div>
                          <div className="muted small">Statut: {mapCollaboratorStatus(c)}</div>
                        </div>
                        <Button variant="ghost" onClick={() => deleteCollaborator(c.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ PRINCIPAL: SECURITY ============ */}
        {isPrincipal && tab === "security" && (
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Card 1: Password only */}
            <div className="card">
              <h3>Compte</h3>

              <label className="field">
                <span className="label">Mot de passe actuel</span>
                <div style={{ position: "relative" }}>
                  <input
                    className={`input ${pwd.currentPassword && !passwordValidation.current.ok ? "input-error" : ""}`}
                    type={showPwd.current ? "text" : "password"}
                    value={pwd.currentPassword}
                    onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ position: "absolute", right: 4, top: 4, height: 34, width: 34, padding: 0 }}
                    onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                    aria-label={showPwd.current ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    title={showPwd.current ? "Masquer" : "Afficher"}
                  >
                    {showPwd.current ? "Off" : "On"}
                  </button>
                </div>
                <span className={passwordValidation.current.ok ? "small" : "error"} style={{ color: passwordValidation.current.ok ? "#86efac" : undefined }}>
                  {passwordValidation.current.msg}
                </span>
              </label>

              <label className="field">
                <span className="label">Nouveau mot de passe</span>
                <div style={{ position: "relative" }}>
                  <input
                    className={`input ${pwd.newPassword && !passwordValidation.next.ok ? "input-error" : ""}`}
                    type={showPwd.next ? "text" : "password"}
                    value={pwd.newPassword}
                    onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ position: "absolute", right: 4, top: 4, height: 34, width: 34, padding: 0 }}
                    onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                    aria-label={showPwd.next ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    title={showPwd.next ? "Masquer" : "Afficher"}
                  >
                    {showPwd.next ? "Off" : "On"}
                  </button>
                </div>
                <span className={passwordValidation.next.ok ? "small" : "error"} style={{ color: passwordValidation.next.ok ? "#86efac" : undefined }}>
                  {passwordValidation.next.msg}
                </span>
              </label>

              <label className="field">
                <span className="label">Confirmer nouveau mot de passe</span>
                <div style={{ position: "relative" }}>
                  <input
                    className={`input ${pwd.confirm && !passwordValidation.confirm.ok ? "input-error" : ""}`}
                    type={showPwd.confirm ? "text" : "password"}
                    value={pwd.confirm}
                    onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ position: "absolute", right: 4, top: 4, height: 34, width: 34, padding: 0 }}
                    onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                    aria-label={showPwd.confirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    title={showPwd.confirm ? "Masquer" : "Afficher"}
                  >
                    {showPwd.confirm ? "Off" : "On"}
                  </button>
                </div>
                <span className={passwordValidation.confirm.ok ? "small" : "error"} style={{ color: passwordValidation.confirm.ok ? "#86efac" : undefined }}>
                  {passwordValidation.confirm.msg}
                </span>
              </label>

              {capsLock && <p className="muted small">Verr. Maj activée</p>}

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={changeMyPassword}>Changer mon mot de passe</Button>
              </div>
            </div>

            {/* Card 2: 2FA enable/disable + method */}
            <div className="card">
              <h3>Accès sécurisé</h3>
              <label className="checkbox" style={{ marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setTwoFactorEnabled(enabled);
                    updatePrincipal2fa(enabled);
                  }}
                />
                Activer l’authentification à deux facteurs
              </label>

              <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "14px 0" }} />

              <h3>Méthode 2FA</h3>
              <label className="field">
                <span className="label">Méthode</span>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <label className="checkbox" style={{ marginTop: 0 }}>
                    <input
                      type="radio"
                      name="twoFactorMethod"
                      checked={twoFactorMethod === "EMAIL"}
                      onChange={() => setTwoFactorMethod("EMAIL")}
                      disabled={!twoFactorEnabled}
                    />
                    Email
                  </label>
                  <label className="checkbox" style={{ marginTop: 0 }}>
                    <input
                      type="radio"
                      name="twoFactorMethod"
                      checked={twoFactorMethod === "SMS"}
                      onChange={() => setTwoFactorMethod("SMS")}
                      disabled={!twoFactorEnabled}
                    />
                    SMS
                  </label>
                </div>
              </label>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={saveMy2faMethod}>Enregistrer</Button>
              </div>

              <p className="muted small" style={{ marginTop: 10 }}>
                Dernière modification : 12.02.2026
              </p>
            </div>
          </div>
        )}

        {/* ============ COLLAB: ME ============ */}
        {isCollab && tab === "me" && (
          <div className="card">
            <h3>Mon compte</h3>

            <h4 className="muted" style={{ marginTop: 0 }}>
              Changer mon mot de passe
            </h4>
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
              label="Confirmer Nouveau mot de passe"
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
            <Button onClick={changeMyPassword}>Mettre à jour</Button>

            <hr style={{ borderColor: "rgba(255,255,255,.08)", margin: "14px 0" }} />

            <h3>Méthode d’authentification (2FA)</h3>
            <p className="muted">Vous pouvez choisir la méthode (email / SMS) pour votre propre accès.</p>
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