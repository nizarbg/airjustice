import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import PolicyStepper from "./PolicyStepper";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { API, apiGet, apiPut, apiPost } from "./partnerApi";
import {
  LABELS,
  useLang,
  isAcceptedFile,
  validateFlightNumber,
  normalizeIata,
  nowIso,
  shortName,
  mapCollaboratorStatus,
  policyStatusLabel,
  policyStatusColor,
} from "./partnerUtils";
import Toasts from "./components/Toasts";
import Stepper from "./components/Stepper";
import LangDropdown from "./components/LangDropdown";
import KpiCard from "./components/KpiCard";

// ═════════════════════════════════════════════════════════════════════════════
export default function PartnerDashboard() {
  const { token, user, logout } = useAuth();
  const isPrincipal = user?.role === "PARTNER_PRINCIPAL";
  const isCollab = user?.role === "PARTNER_COLLAB";
  const [lang, setLang] = useLang();
  const L = LABELS[lang] || LABELS.fr;

  // ── Tabs by role ────────────────────────────────────────────────────────────
  const tabs = useMemo(() => {
    if (isPrincipal) {
      return [
        { key: "partnerDashboard", label: L.dashboard },
        { key: "createPolicy", label: L.createPolicy },
        { key: "policies", label: L.policies },
        { key: "balance", label: L.balance },
        { key: "users", label: L.agents },
        { key: "account", label: L.account },
        { key: "security", label: L.settings },
      ];
    }

    return [
      { key: "createPolicy", label: L.createPolicy },
      { key: "myPolicies", label: L.myPolicies },
      { key: "security", label: L.settings },
    ];
  }, [isPrincipal, L]);

  const [tab, setTab] = useState(() =>
    isPrincipal ? "partnerDashboard" : "createPolicy"
  );
  const [err, setErr] = useState("");

  // ── Toasts ──────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(1);

  const addToast = (type, message, ttlMs = 3500) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [
      ...prev,
      { id, type, message, createdAt: nowIso() },
    ]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      ttlMs
    );
  };

  const closeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Data ────────────────────────────────────────────────────────────────────
  const [account, setAccount] = useState(null);
  const [limited, setLimited] = useState(null);
  const [balance, setBalance] = useState(null);
  const [docs, setDocs] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [myPolicies, setMyPolicies] = useState([]);
  const [policyFilter, setPolicyFilter] = useState({ q: "", status: "ALL" });
  const [disableBox, setDisableBox] = useState({
    open: false,
    policyId: null,
    reason: "",
  });
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]); // placeholder

  // ── Forms ───────────────────────────────────────────────────────────────────
  const [contactForm, setContactForm] = useState({
    contactEmail: "",
    contactPhone: "",
    preferredLanguage: "fr",
  });
  const [agencyForm, setAgencyForm] = useState({
    agencyName: "",
    city: "",
    country: "",
  });
  const [threshold, setThreshold] = useState("");
  const [addCollab, setAddCollab] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // ── Me / 2FA ────────────────────────────────────────────────────────────────
  const [meData, setMeData] = useState(null);
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [capsLock, setCapsLock] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState("EMAIL");
  const [interfaceLang, setInterfaceLang] = useState(
    () => localStorage.getItem("pref_lang") || "fr"
  );
  const [notifPrefs, setNotifPrefs] = useState({
    notifyEmail: true,
    notifySms: false,
    notifySystem: true,
  });
  const [profileEdit, setProfileEdit] = useState({ phone: "", email: "" });

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
        msg: match
          ? "Les mots de passe correspondent."
          : "Les mots de passe ne correspondent pas.",
      },
    };
  }, [pwd]);

  // ── Create-policy stepper ────────────────────────────────────────────────────
  const steps = [
    {
      key: "upload",
      label: "Upload",
      hint: "PDF/JPG/PNG • drag & drop • multi-fichiers",
    },
    {
      key: "extract",
      label: "Extraction & validation AI",
      hint: "Corriger/valider les champs détectés",
    },
    {
      key: "contact",
      label: "Contact & résumé",
      hint: "Email/téléphone + création sans changer de page",
    },
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
  const [aiState, setAiState] = useState({
    uncertainFields: {},
    passengers: [{ fullName: "" }],
    segments: [
      {
        flightNumber: "",
        depIata: "",
        arrIata: "",
        date: "",
        time: "",
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
        {
          flightNumber: "",
          depIata: "",
          arrIata: "",
          date: "",
          time: "",
          airline: "",
        },
      ],
    });
    setContactState({
      email: "",
      phone: "",
      notifyEmail: true,
      notifySms: false,
    });
    setCreatedState({ created: false, policy: null });
    setSelectedPolicy(null);
  };

  // ── Load policies (all – principal) ─────────────────────────────────────────
  const loadPolicies = async () => {
    const qs = new URLSearchParams();
    if (policyFilter.q?.trim()) qs.set("q", policyFilter.q.trim());
    if (policyFilter.status && policyFilter.status !== "ALL") {
      qs.set("status", policyFilter.status);
    }
    const path = qs.toString()
      ? `/api/partner/policies?${qs}`
      : "/api/partner/policies";
    const list = await apiGet(path, token);
    setPolicies(Array.isArray(list) ? list : []);
  };

  // ── Load policies (agent – own) ──────────────────────────────────────────────
  const loadMyPolicies = async () => {
    const list = await apiGet("/api/partner/policies/mine", token);
    setMyPolicies(Array.isArray(list) ? list : []);
  };

  // ── File upload / analysis ───────────────────────────────────────────────────
  const pushFiles = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    const bad = list.find((f) => !isAcceptedFile(f));
    if (bad) {
      setUploadState((s) => ({
        ...s,
        error: `Format non supporté: ${bad.name}.`,
      }));
      addToast("error", `Format non supporté: ${bad.name}`);
      return;
    }

    setUploadState((s) => ({
      ...s,
      files: [...s.files, ...list],
      error: "",
      analyzing: true,
      progress: 0,
      unreadable: false,
      noFlightDetected: false,
    }));

    for (let p = 1; p <= 100; p += 10) {
      await new Promise((r) => setTimeout(r, 90));
      setUploadState((s) => ({ ...s, progress: p }));
    }

    const fileNames = list
      .map((f) => (f.name || "").toLowerCase())
      .join(" ");

    if (fileNames.includes("bad") || fileNames.includes("unreadable")) {
      setUploadState((s) => ({
        ...s,
        analyzing: false,
        unreadable: true,
        error: "Document illisible. Veuillez réuploader une version plus nette.",
      }));
      addToast("error", "Document illisible.");
      return;
    }

    if (fileNames.includes("noflight") || fileNames.includes("no-flight")) {
      setUploadState((s) => ({
        ...s,
        analyzing: false,
        noFlightDetected: true,
        error: "Aucun vol détecté. Saisie manuelle possible.",
      }));
      addToast("info", "Aucun vol détecté.");
      return;
    }

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

  const removeUploadedFile = (idx) =>
    setUploadState((s) => {
      const next = [...s.files];
      next.splice(idx, 1);
      return { ...s, files: next };
    });

  const canGoStep2 =
    uploadState.files.length > 0 &&
    !uploadState.analyzing &&
    !uploadState.unreadable;

  const canConfirmAI = () => {
    const s0 = aiState.segments?.[0] || {};
    return (
      validateFlightNumber(s0.flightNumber).ok &&
      normalizeIata(s0.depIata) &&
      normalizeIata(s0.arrIata) &&
      s0.date
    );
  };

  const canCreatePolicy = () =>
    contactState.email?.trim() &&
    contactState.phone?.trim() &&
    canConfirmAI();

  const goNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const confirmAIData = () => {
    if (!canConfirmAI()) {
      addToast(
        "error",
        "Merci de corriger les champs requis (numéro de vol, IATA, date)."
      );
      return;
    }
    addToast("success", "Données confirmées.");
    setActiveStep(2);
  };

  const createPolicy = async () => {
    setErr("");
    try {
      if (!canCreatePolicy()) {
        addToast(
          "error",
          "Email et téléphone requis. Vérifiez aussi les données de vol."
        );
        return;
      }

      const passenger = aiState.passengers?.[0] || { fullName: "" };
      const seg = aiState.segments?.[0] || {};

      const payload = {
        clientName: passenger.fullName || "",
        clientEmail: contactState.email,
        clientPhone: contactState.phone,
        flightNumber: (seg.flightNumber || "").toUpperCase(),
        flightDate: seg.date,
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
      addToast("success", `Police créée: #${created.id}`);
      loadPolicies().catch(() => {});
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const bal = await apiGet("/api/partner/account/balance", token);
        setBalance(bal);
        setThreshold(String(bal.lowBalanceThreshold ?? ""));

        if (isPrincipal) {
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
          const lim = await apiGet("/api/partner/account/limited", token);
          setLimited(lim);
        }

        const me = await apiGet("/api/partner/me", token);
        setMeData(me);
        setTwoFactorMethod(me.twoFactorMethod || "EMAIL");
        setTwoFactorEnabled(me.twoFactorEnabled ?? true);
        setNotifPrefs({
          notifyEmail: me.notifyEmail ?? true,
          notifySms: me.notifySms ?? false,
          notifySystem: me.notifySystem ?? true,
        });
        setProfileEdit({ phone: me.phone || "", email: me.email || "" });
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [token, isPrincipal]);

  // ── Tab-specific loads ───────────────────────────────────────────────────────
  const loadDocs = async () => {
    const list = await apiGet("/api/partner/documents", token);
    setDocs(list);
  };

  const loadCollabs = async () => {
    const list = await apiGet("/api/partner/collaborators", token);
    setCollabs(list);
  };

  useEffect(() => {
    setErr("");
    if (tab === "partnerDashboard") loadPolicies().catch(() => {});
    if (tab === "policies" && isPrincipal)
      loadPolicies().catch((e) => setErr(e.message));
    if (tab === "myPolicies" && isCollab)
      loadMyPolicies().catch((e) => setErr(e.message));
    if (tab === "account" && isPrincipal)
      loadDocs().catch((e) => setErr(e.message));
    if (tab === "users" && isPrincipal)
      loadCollabs().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Principal actions ────────────────────────────────────────────────────────
  const saveContact = async () => {
    try {
      const acc = await apiPut(
        "/api/partner/account/contact",
        token,
        contactForm
      );
      setAccount(acc);
      addToast("success", "Contact mis à jour.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const saveAgency = async () => {
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
    try {
      const bal = await apiPut(
        "/api/partner/account/balance/threshold",
        token,
        { lowBalanceThreshold: threshold }
      );
      setBalance(bal);
      addToast("success", "Seuil d'alerte enregistré.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const updatePrincipal2fa = async (enabled) => {
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

  // ── User admin ───────────────────────────────────────────────────────────────
  const addCollaborator = async () => {
    try {
      if (
        !addCollab.firstName.trim() ||
        !addCollab.lastName.trim() ||
        !addCollab.email.trim()
      ) {
        addToast("error", "Nom, prénom et email sont requis.");
        return;
      }

      const fullName = `${addCollab.firstName} ${addCollab.lastName}`.trim();
      await apiPost("/api/partner/collaborators", token, {
        fullName,
        email: addCollab.email,
        phone: addCollab.phone,
      });
      setAddCollab({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
      await loadCollabs();
      addToast("success", "Collaborateur ajouté.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const deleteCollaborator = async (id) => {
    const prev = [...collabs];
    setCollabs((c) => c.filter((x) => x.id !== id));

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

  // ── Password / 2FA ───────────────────────────────────────────────────────────
  const changeMyPassword = async () => {
    try {
      if (
        !passwordValidation.current.ok ||
        !passwordValidation.next.ok ||
        !passwordValidation.confirm.ok
      ) {
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
    try {
      await apiPut("/api/partner/me/2fa-method", token, { twoFactorMethod });
      addToast("success", "Méthode 2FA enregistrée.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const saveNotifPrefs = async () => {
    try {
      await apiPut("/api/partner/me/notifications", token, notifPrefs);
      addToast("success", "Préférences de notification enregistrées.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  const saveProfile = async () => {
    try {
      const updated = await apiPut("/api/partner/me/profile", token, {
        phone: profileEdit.phone,
        email: profileEdit.email,
      });
      setMeData(updated);
      addToast("success", "Profil mis à jour.");
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  // ── Policy actions ───────────────────────────────────────────────────────────
  const showPolicy = async (id) => {
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
    try {
      if (!disableBox.reason.trim()) {
        addToast("error", "Veuillez fournir une justification.");
        return;
      }

      const updated = await apiPut(
        `/api/partner/policies/${disableBox.policyId}/disable`,
        token,
        { reason: disableBox.reason }
      );

      setDisableBox({ open: false, policyId: null, reason: "" });
      setSelectedPolicy((prev) => (prev?.id === updated.id ? updated : prev));
      addToast("success", `Police #${updated.id} désactivée.`);
      await loadPolicies();
    } catch (e) {
      setErr(e.message);
      addToast("error", e.message);
    }
  };

  // ── KPIs (computed from policies) ───────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((p) => p.status === "ACTIVE").length;
    const expired = policies.filter((p) => p.status === "EXPIRED").length;
    const today = policies.filter((p) =>
      p.createdAt?.startsWith(new Date().toISOString().slice(0, 10))
    ).length;
    const revenue = policies
      .reduce((s, p) => s + (parseFloat(p.price) || 0), 0)
      .toFixed(2);

    return { total, active, expired, today, revenue };
  }, [policies]);

  // ── User display name ────────────────────────────────────────────────────────
  const displayName = meData?.fullName
    ? shortName(meData.fullName)
    : user?.email || "";

  // ── Shared policy list renderer ─────────────────────────────────────────────
  const renderPoliciesList = (list, title) => (
    <div className="card">
      <h3>{title}</h3>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <Input
          placeholder="Recherche (nom, n° vol…)"
          value={policyFilter.q}
          onChange={(e) =>
            setPolicyFilter((f) => ({ ...f, q: e.target.value }))
          }
        />

        <select
          className="input"
          style={{ width: "auto" }}
          value={policyFilter.status}
          onChange={(e) =>
            setPolicyFilter((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expirée</option>
        </select>

        <Button variant="secondary" onClick={loadPolicies}>
          🔄 Actualiser
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="muted">Aucune police trouvée.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((p) => (
            <div key={p.id} className="card" style={{ padding: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <b>#{p.id}</b> — {p.clientName || "-"} • {p.flightNumber || "-"}
                  <div className="muted small">
                    <span
                      style={{
                        color: policyStatusColor(p.status),
                        fontWeight: 600,
                      }}
                    >
                      {policyStatusLabel(p.status)}
                    </span>{" "}
                    • {p.flightDate || "-"}
                  </div>
                  {p.depIata && (
                    <div className="muted small">
                      {p.depIata} → {p.arrIata}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={() => showPolicy(p.id)}>
                    Détails
                  </Button>
                  {p.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setDisableBox({
                          open: true,
                          policyId: p.id,
                          reason: "",
                        })
                      }
                    >
                      Désactiver
                    </Button>
                  )}
                </div>
              </div>

              {selectedPolicy?.id === p.id && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: "rgba(255,255,255,.04)",
                    borderRadius: 8,
                  }}
                >
                  <pre
                    className="muted small"
                    style={{ whiteSpace: "pre-wrap", margin: 0 }}
                  >
                    {JSON.stringify(selectedPolicy, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {disableBox.open && (
        <div
          className="card"
          style={{ marginTop: 14, border: "1px solid rgba(220,38,38,.35)" }}
        >
          <h4>Désactiver la police #{disableBox.policyId}</h4>
          <Input
            label="Justification *"
            value={disableBox.reason}
            onChange={(e) =>
              setDisableBox((b) => ({ ...b, reason: e.target.value }))
            }
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Button onClick={disablePolicy}>Confirmer</Button>
            <Button
              variant="ghost"
              onClick={() =>
                setDisableBox({ open: false, policyId: null, reason: "" })
              }
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Paramètres section (shared) ─────────────────────────────────────────────
  const renderSettings = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <h3>Profil utilisateur</h3>
        <div className="muted small" style={{ marginBottom: 10 }}>
          User-ID: {meData?.id ?? "–"}
        </div>

        <Input label="Nom Prénom" value={meData?.fullName || ""} readOnly />
        <Input
          label="Indicatif du pays + Téléphone"
          value={profileEdit.phone}
          onChange={(e) =>
            setProfileEdit((p) => ({ ...p, phone: e.target.value }))
          }
        />
        <Input
          label="Email"
          type="email"
          value={profileEdit.email}
          onChange={(e) =>
            setProfileEdit((p) => ({ ...p, email: e.target.value }))
          }
        />

        <div
          style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}
        >
          <Button onClick={saveProfile}>Enregistrer le profil</Button>
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}
      >
        <div className="card">
          <h3>Compte</h3>

          <label className="field">
            <span className="label">Langue de l'interface</span>
            <select
              className="input"
              value={interfaceLang}
              onChange={(e) => {
                setInterfaceLang(e.target.value);
                setLang(e.target.value);
              }}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="ar">🇹🇳 العربية</option>
            </select>
          </label>

          <hr
            style={{
              borderColor: "rgba(255,255,255,.08)",
              margin: "14px 0",
            }}
          />

          <label className="field">
            <span className="label">Mot de passe actuel</span>
            <div style={{ position: "relative" }}>
              <input
                className={`input ${
                  pwd.currentPassword && !passwordValidation.current.ok
                    ? "input-error"
                    : ""
                }`}
                type={showPwd.current ? "text" : "password"}
                value={pwd.currentPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, currentPassword: e.target.value })
                }
                onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                onBlur={() => setCapsLock(false)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  position: "absolute",
                  right: 4,
                  top: 4,
                  height: 34,
                  width: 34,
                  padding: 0,
                }}
                onClick={() =>
                  setShowPwd((s) => ({ ...s, current: !s.current }))
                }
                aria-label="Afficher/masquer"
              >
                {showPwd.current ? "🙈" : "👁️"}
              </button>
            </div>
            <span
              style={{
                fontSize: 12,
                color: passwordValidation.current.ok ? "#86efac" : "#f87171",
              }}
            >
              {pwd.currentPassword ? passwordValidation.current.msg : ""}
            </span>
          </label>

          <label className="field">
            <span className="label">Nouveau mot de passe</span>
            <div style={{ position: "relative" }}>
              <input
                className={`input ${
                  pwd.newPassword && !passwordValidation.next.ok
                    ? "input-error"
                    : ""
                }`}
                type={showPwd.next ? "text" : "password"}
                value={pwd.newPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, newPassword: e.target.value })
                }
                onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                onBlur={() => setCapsLock(false)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  position: "absolute",
                  right: 4,
                  top: 4,
                  height: 34,
                  width: 34,
                  padding: 0,
                }}
                onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                aria-label="Afficher/masquer"
              >
                {showPwd.next ? "🙈" : "👁️"}
              </button>
            </div>
            <span
              style={{
                fontSize: 12,
                color: passwordValidation.next.ok ? "#86efac" : "#f87171",
              }}
            >
              {pwd.newPassword ? passwordValidation.next.msg : ""}
            </span>
          </label>

          <label className="field">
            <span className="label">Confirmer nouveau mot de passe</span>
            <div style={{ position: "relative" }}>
              <input
                className={`input ${
                  pwd.confirm && !passwordValidation.confirm.ok
                    ? "input-error"
                    : ""
                }`}
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
                style={{
                  position: "absolute",
                  right: 4,
                  top: 4,
                  height: 34,
                  width: 34,
                  padding: 0,
                }}
                onClick={() =>
                  setShowPwd((s) => ({ ...s, confirm: !s.confirm }))
                }
                aria-label="Afficher/masquer"
              >
                {showPwd.confirm ? "🙈" : "👁️"}
              </button>
            </div>
            <span
              style={{
                fontSize: 12,
                color: passwordValidation.confirm.ok ? "#86efac" : "#f87171",
              }}
            >
              {pwd.confirm ? passwordValidation.confirm.msg : ""}
            </span>
          </label>

          {capsLock && (
            <p className="muted small">⚠️ Verr. Maj activée</p>
          )}

          <div
            style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}
          >
            <Button onClick={changeMyPassword}>Changer mon mot de passe</Button>
          </div>
        </div>

        <div className="card">
          <h3>Accès sécurisé</h3>

          <label className="checkbox" style={{ marginTop: 6 }}>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                setTwoFactorEnabled(enabled);
                if (isPrincipal) updatePrincipal2fa(enabled);
              }}
            />
            Activer l'authentification à deux facteurs
          </label>

          <hr
            style={{
              borderColor: "rgba(255,255,255,.08)",
              margin: "14px 0",
            }}
          />

          <h3>Méthode 2FA</h3>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {["EMAIL", "SMS"].map((m) => (
              <label key={m} className="checkbox" style={{ marginTop: 0 }}>
                <input
                  type="radio"
                  name="twoFactorMethod"
                  checked={twoFactorMethod === m}
                  onChange={() => setTwoFactorMethod(m)}
                  disabled={!twoFactorEnabled}
                />
                {m === "EMAIL" ? " Email" : " SMS"}
              </label>
            ))}
          </div>

          <div
            style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}
          >
            <Button onClick={saveMy2faMethod}>Enregistrer</Button>
          </div>

          <p className="muted small" style={{ marginTop: 10 }}>
            Dernière modification : {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Notifications</h3>
        <p className="muted small" style={{ marginBottom: 10 }}>
          Préférences de réception des alertes
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={notifPrefs.notifyEmail}
              onChange={(e) =>
                setNotifPrefs((n) => ({
                  ...n,
                  notifyEmail: e.target.checked,
                }))
              }
            />
            Notifications par Email
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={notifPrefs.notifySms}
              onChange={(e) =>
                setNotifPrefs((n) => ({ ...n, notifySms: e.target.checked }))
              }
            />
            Notifications par SMS
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={notifPrefs.notifySystem}
              onChange={(e) =>
                setNotifPrefs((n) => ({
                  ...n,
                  notifySystem: e.target.checked,
                }))
              }
            />
            Notifications système
          </label>
        </div>

        <div
          style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}
        >
          <Button onClick={saveNotifPrefs}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page">
      <Toasts toasts={toasts} onClose={closeToast} />

      <header className="nav">
        <div className="brand">AirJustice Partner</div>

        <div
          className="nav-actions"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <button
            className="btn btn-ghost"
            style={{ fontSize: 18, padding: "4px 8px" }}
            title="Notifications"
            aria-label="Notifications"
          >
            🔔
          </button>

          <LangDropdown
            lang={lang}
            setLang={(l) => {
              setLang(l);
              setInterfaceLang(l);
            }}
          />

          <span className="muted" style={{ fontWeight: 600 }}>
            👤 {displayName}
          </span>

          <Button variant="ghost" onClick={logout}>
            {L.logout}
          </Button>
        </div>
      </header>

      <main className="container">
        <div className="card" style={{ marginBottom: 14 }}>
          {isPrincipal && account && (
            <p
              className="muted"
              style={{
                marginBottom: 10,
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span>
                <b>Responsable principale:</b> {account.principalName || "-"}
              </span>
              <span>
                <b>💰 Solde:</b>{" "}
                {balance ? `${balance.prepaidBalance} TND` : "-"}
              </span>
            </p>
          )}

          {isCollab && limited && (
            <p className="muted" style={{ marginBottom: 10 }}>
              Accès agent • Agence: <b>{limited.agencyName || "-"}</b>
            </p>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

        {isPrincipal && tab === "partnerDashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              <KpiCard label="Polices total" value={kpis.total} color="#60a5fa" />
              <KpiCard
                label="Polices actives"
                value={kpis.active}
                color="#34d399"
              />
              <KpiCard
                label="Polices expirées"
                value={kpis.expired}
                color="#94a3b8"
              />
              <KpiCard
                label="Créées aujourd'hui"
                value={kpis.today}
                color="#f59e0b"
              />
              <KpiCard
                label="CA total (TND)"
                value={kpis.revenue}
                color="#a78bfa"
              />
              {balance && (
                <KpiCard
                  label="Solde disponible"
                  value={`${balance.prepaidBalance} TND`}
                  sub={balance.lowBalanceAlert ? "⚠️ Solde bas" : ""}
                  color={balance.lowBalanceAlert ? "#f87171" : "#34d399"}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={() => setTab("createPolicy")}>
                ➕ Créer une nouvelle police
              </Button>
              <Button variant="secondary" onClick={() => setTab("policies")}>
                📄 Voir toutes les polices
              </Button>
            </div>

            <div className="card">
              <h3>Polices récentes</h3>
              {policies.slice(0, 5).length === 0 ? (
                <p className="muted">Aucune police trouvée.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {policies.slice(0, 5).map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <b>#{p.id}</b> — {p.clientName || "-"} •{" "}
                          {p.flightNumber || "-"}
                          <div className="muted small">
                            {p.status} • {p.flightDate || "-"}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => showPolicy(p.id)}
                        >
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "createPolicy" && <PolicyStepper token={token} />}

        {isPrincipal && tab === "policies" &&
          renderPoliciesList(policies, "Toutes les polices du compte")}

        {isCollab && tab === "myPolicies" &&
          renderPoliciesList(myPolicies, "Mes polices")}

        {tab === "balance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card">
              <h3>Solde disponible</h3>
              {balance ? (
                <>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: balance.lowBalanceAlert ? "#f87171" : "#34d399",
                    }}
                  >
                    {String(balance.prepaidBalance)} TND
                  </div>

                  {balance.lowBalanceAlert && (
                    <p className="muted small" style={{ color: "#f87171" }}>
                      ⚠️ Solde bas — pensez à recharger.
                    </p>
                  )}

                  {isPrincipal && (
                    <>
                      <hr
                        style={{
                          borderColor: "rgba(255,255,255,.08)",
                          margin: "14px 0",
                        }}
                      />
                      <Input
                        label="Seuil d'alerte (TND)"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                      />
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button onClick={saveThreshold}>
                          Enregistrer le seuil
                        </Button>
                      </div>
                    </>
                  )}

                  {!isPrincipal && (
                    <p className="muted small">Lecture seule (Agent).</p>
                  )}
                </>
              ) : (
                <p className="muted">Chargement...</p>
              )}
            </div>

            {isPrincipal && (
              <div className="card">
                <h3>Recharger le compte</h3>
                <p className="muted">
                  Le rechargement se fait par virement ou via votre gestionnaire
                  de compte AirJustice.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() =>
                      addToast("info", "Fonctionnalité de rechargement à venir.")
                    }
                  >
                    💳 Recharger maintenant
                  </Button>
                </div>
              </div>
            )}

            <div className="card">
              <h3>Historique des paiements</h3>
              {paymentHistory.length === 0 ? (
                <p className="muted">Aucun paiement enregistré.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {paymentHistory.map((p, i) => (
                    <div key={i} className="card" style={{ padding: 12 }}>
                      <div
                        style={{ display: "flex", justifyContent: "space-between" }}
                      >
                        <span>{p.label}</span>
                        <b>{p.amount} TND</b>
                      </div>
                      <div className="muted small">{p.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isPrincipal && tab === "users" && (
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div className="card">
              <h3>Ajouter un agent</h3>
              <Input
                label="Prénom *"
                value={addCollab.firstName}
                onChange={(e) =>
                  setAddCollab({ ...addCollab, firstName: e.target.value })
                }
              />
              <Input
                label="Nom *"
                value={addCollab.lastName}
                onChange={(e) =>
                  setAddCollab({ ...addCollab, lastName: e.target.value })
                }
              />
              <Input
                label="Email *"
                type="email"
                value={addCollab.email}
                onChange={(e) =>
                  setAddCollab({ ...addCollab, email: e.target.value })
                }
              />
              <Input
                label="Téléphone"
                value={addCollab.phone}
                onChange={(e) =>
                  setAddCollab({ ...addCollab, phone: e.target.value })
                }
              />
              <div
                style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}
              >
                <Button onClick={addCollaborator}>Ajouter</Button>
              </div>
            </div>

            <div className="card">
              <h3>Liste des agents</h3>
              {collabs.length === 0 ? (
                <p className="muted">Aucun agent.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {collabs.map((c) => (
                    <div key={c.id} className="card" style={{ padding: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <b>{c.fullName}</b>
                          <div className="muted small">{c.email}</div>
                          <div className="muted small" style={{ marginTop: 2 }}>
                            Statut:{" "}
                            <span
                              style={{
                                color:
                                  mapCollaboratorStatus(c) === "Actif"
                                    ? "#34d399"
                                    : "#94a3b8",
                              }}
                            >
                              {mapCollaboratorStatus(c)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => deleteCollaborator(c.id)}
                        >
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

        {isPrincipal && tab === "account" && account && (
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div className="card">
              <h3>Agence</h3>
              <Input label="Nom" value={account.agencyName || ""} readOnly />
              <Input
                label="Registre de Commerce"
                value={account.rcNumber || ""}
                readOnly
              />
              <Input
                label="Matricule fiscale"
                value={account.fiscalNumber || ""}
                readOnly
              />
              <Input label="Code IATA" value={account.iataCode || ""} readOnly />
              <Input label="Ville" value={account.city || ""} readOnly />
              <Input label="Pays" value={account.country || ""} readOnly />
            </div>

            <div className="card">
              <h3>Responsable Principal</h3>
              <Input
                label="Nom / Prénom"
                value={account.principalName || ""}
                readOnly
              />
              <Input
                label="Téléphone"
                value={contactForm.contactPhone || ""}
                readOnly
              />
              <Input
                label="Email"
                value={contactForm.contactEmail || ""}
                readOnly
              />
            </div>

            <div className="card">
              <h3>Documents</h3>
              <label className="field">
                <span className="label">Uploader (PDF/image)</span>
                <input
                  className="input"
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] && uploadDoc(e.target.files[0])
                  }
                />
              </label>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {docs.map((d) => (
                  <div key={d.id} className="card" style={{ padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <b>{d.filename}</b>
                        <div className="muted small">
                          {new Date(d.uploadedAt).toLocaleString()}
                        </div>
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

        {tab === "security" && renderSettings()}
      </main>
    </div>
  );
}