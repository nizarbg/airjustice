import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { useLanguage } from "../../context/LanguageContext";
import PageLayout from "../../components/PageLayout";

const API = "http://localhost:8080";

/* ─── Status catalogue ─── */
const STATUS_KEYS = [
  "SUBMITTED","CONTACT_IN_PROGRESS","DOCUMENTS_REQUESTED",
  "DOCUMENTS_RECEIVED","VERIFICATION_IN_PROGRESS","APPROVED","REJECTED",
  "PENDING","VERIFIED","ACTIVE","ALL",
];

/* Filter preset → comma-separated statuses sent to backend */
const PRESET_STATUSES = {
  ACTIVE_QUEUE:
    "SUBMITTED,CONTACT_IN_PROGRESS,DOCUMENTS_REQUESTED,DOCUMENTS_RECEIVED,VERIFICATION_IN_PROGRESS,PENDING",
  ALL: "ALL",
  SUBMITTED: "SUBMITTED",
  CONTACT_IN_PROGRESS: "CONTACT_IN_PROGRESS",
  DOCUMENTS_REQUESTED: "DOCUMENTS_REQUESTED",
  DOCUMENTS_RECEIVED: "DOCUMENTS_RECEIVED",
  VERIFICATION_IN_PROGRESS: "VERIFICATION_IN_PROGRESS",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const STATUS_NEXT = {
  SUBMITTED: "CONTACT_IN_PROGRESS",
  CONTACT_IN_PROGRESS: "DOCUMENTS_REQUESTED",
  DOCUMENTS_REQUESTED: "DOCUMENTS_RECEIVED",
  DOCUMENTS_RECEIVED: "VERIFICATION_IN_PROGRESS",
  VERIFICATION_IN_PROGRESS: "APPROVED",
};

/* ─── i18n ─── */
const STATUS_LABELS_I18N = {
  FR: { SUBMITTED:"Soumis", CONTACT_IN_PROGRESS:"Prise de contact", DOCUMENTS_REQUESTED:"Documents demandés", DOCUMENTS_RECEIVED:"Documents reçus", VERIFICATION_IN_PROGRESS:"Vérification en cours", APPROVED:"Approuvé", REJECTED:"Rejeté", PENDING:"En attente", VERIFIED:"Vérifié", ACTIVE:"Actif", ALL:"Tous", ACTIVE_QUEUE:"File active" },
  EN: { SUBMITTED:"Submitted", CONTACT_IN_PROGRESS:"Contacting", DOCUMENTS_REQUESTED:"Docs requested", DOCUMENTS_RECEIVED:"Docs received", VERIFICATION_IN_PROGRESS:"Verifying", APPROVED:"Approved", REJECTED:"Rejected", PENDING:"Pending", VERIFIED:"Verified", ACTIVE:"Active", ALL:"All", ACTIVE_QUEUE:"Active queue" },
  DE: { SUBMITTED:"Eingereicht", CONTACT_IN_PROGRESS:"Kontakt", DOCUMENTS_REQUESTED:"Dokumente angefordert", DOCUMENTS_RECEIVED:"Dokumente erhalten", VERIFICATION_IN_PROGRESS:"Überprüfung", APPROVED:"Genehmigt", REJECTED:"Abgelehnt", PENDING:"Ausstehend", VERIFIED:"Verifiziert", ACTIVE:"Aktiv", ALL:"Alle", ACTIVE_QUEUE:"Aktive Warteschlange" },
  AR: { SUBMITTED:"مُقدَّم", CONTACT_IN_PROGRESS:"جاري التواصل", DOCUMENTS_REQUESTED:"المستندات مطلوبة", DOCUMENTS_RECEIVED:"المستندات مستلمة", VERIFICATION_IN_PROGRESS:"التحقق جارٍ", APPROVED:"مُوافق عليه", REJECTED:"مرفوض", PENDING:"قيد الانتظار", VERIFIED:"تم التحقق", ACTIVE:"نشط", ALL:"الكل", ACTIVE_QUEUE:"الطابور النشط" },
};

const tr = {
  FR: {
    title:"Validation des inscriptions agences", subtitle:"File centralisée · Filtrage · Tri · Revue de conformité",
    loading:"Chargement...", noItems:"Aucun dossier pour ce filtre.", selectItem:"Sélectionnez un dossier.",
    agency:"Agence", manager:"Responsable", city:"Ville", country:"Pays", email:"Email", phone:"Téléphone",
    submissionDate:"Date de soumission", filterStatus:"Statut", filterCountry:"Pays",
    filterDateFrom:"Du", filterDateTo:"Au", allCountries:"Tous les pays",
    sortBy:"Trier par", sortDate:"Date", sortCountry:"Pays", sortAsc:"↑ Croissant", sortDesc:"↓ Décroissant",
    applyFilters:"Appliquer", resetFilters:"Réinitialiser",
    items:"Dossiers", none:"Aucun", docs:"Documents", logout:"Déconnexion",
    managerMain:"Responsable principal", name:"Nom",
    adminDocs:"Documents administratifs soumis", rc:"Registre de commerce", fiscal:"Matricule fiscale",
    iata:"Code IATA", notProvided:"Non renseigné", validateSection:"Valider / corriger les informations",
    saveVerify:"Sauvegarder & vérifier", receivedDocs:"Documents reçus", download:"Télécharger",
    noDocs:"Aucun document téléversé.", actions:"Actions sur le dossier", goTo:"Passer à :",
    approve:"Approuver le compte", reject:"Rejeter et supprimer",
    forceStatus:"Forcer un statut manuellement :",
    rejectConfirm:"Rejeter ce dossier supprimera le compte partenaire. Continuer ?",
    statusUpdated:"Statut mis à jour :", verified:"Dossier vérifié — vérification en cours.",
    approved:"Compte approuvé. Le partenaire a maintenant accès.", rejected:"Dossier rejeté.",
    checklist:"Liste de contrôle de conformité", identityVerified:"Identité vérifiée",
    licenseValid:"Licence valide", companyRegistered:"Société enregistrée",
    reviewNotes:"Notes de révision", saveChecklist:"Enregistrer la checklist",
    checklistSaved:"Checklist enregistrée.", duplicates:"⚠️ Alertes de doublons détectés",
  },
  EN: {
    title:"Agency Registration Validation", subtitle:"Centralized queue · Filtering · Sorting · Compliance review",
    loading:"Loading...", noItems:"No entries for this filter.", selectItem:"Select an entry.",
    agency:"Agency", manager:"Manager", city:"City", country:"Country", email:"Email", phone:"Phone",
    submissionDate:"Submission date", filterStatus:"Status", filterCountry:"Country",
    filterDateFrom:"From", filterDateTo:"To", allCountries:"All countries",
    sortBy:"Sort by", sortDate:"Date", sortCountry:"Country", sortAsc:"↑ Ascending", sortDesc:"↓ Descending",
    applyFilters:"Apply", resetFilters:"Reset",
    items:"Entries", none:"None", docs:"Documents", logout:"Logout",
    managerMain:"Main manager", name:"Name",
    adminDocs:"Administrative documents submitted", rc:"Trade Register", fiscal:"Tax ID",
    iata:"IATA Code", notProvided:"Not provided", validateSection:"Validate / correct admin information",
    saveVerify:"Save & verify", receivedDocs:"Received documents", download:"Download",
    noDocs:"No documents uploaded.", actions:"Case actions", goTo:"Move to:",
    approve:"Approve account", reject:"Reject & delete",
    forceStatus:"Force status manually:",
    rejectConfirm:"Reject this application? The partner account will be deleted.",
    statusUpdated:"Status updated:", verified:"Case verified — verification in progress.",
    approved:"Account approved. The partner now has access.", rejected:"Application rejected.",
    checklist:"Compliance checklist", identityVerified:"Identity verified",
    licenseValid:"License valid", companyRegistered:"Company registered",
    reviewNotes:"Review notes", saveChecklist:"Save checklist",
    checklistSaved:"Checklist saved.", duplicates:"⚠️ Duplicate alerts detected",
  },
  DE: {
    title:"Validierung der Agenturanmeldungen", subtitle:"Zentrale Warteschlange · Filtern · Sortieren · Compliance",
    loading:"Laden...", noItems:"Keine Einträge.", selectItem:"Eintrag auswählen.",
    agency:"Agentur", manager:"Verantwortlicher", city:"Stadt", country:"Land", email:"E-Mail", phone:"Telefon",
    submissionDate:"Einreichungsdatum", filterStatus:"Status", filterCountry:"Land",
    filterDateFrom:"Von", filterDateTo:"Bis", allCountries:"Alle Länder",
    sortBy:"Sortieren nach", sortDate:"Datum", sortCountry:"Land", sortAsc:"↑ Aufsteigend", sortDesc:"↓ Absteigend",
    applyFilters:"Anwenden", resetFilters:"Zurücksetzen",
    items:"Einträge", none:"Keine", docs:"Dokumente", logout:"Abmelden",
    managerMain:"Hauptverantwortlicher", name:"Name",
    adminDocs:"Eingereichte Verwaltungsdokumente", rc:"Handelsregister", fiscal:"Steuernummer",
    iata:"IATA-Code", notProvided:"Nicht angegeben", validateSection:"Verwaltungsinformationen validieren",
    saveVerify:"Speichern & prüfen", receivedDocs:"Erhaltene Dokumente", download:"Herunterladen",
    noDocs:"Keine Dokumente.", actions:"Aktionen", goTo:"Weiter zu:",
    approve:"Konto genehmigen", reject:"Ablehnen & löschen",
    forceStatus:"Status manuell erzwingen:",
    rejectConfirm:"Diesen Eintrag ablehnen? Das Konto wird gelöscht.",
    statusUpdated:"Status aktualisiert:", verified:"Eintrag verifiziert.",
    approved:"Konto genehmigt.", rejected:"Eintrag abgelehnt.",
    checklist:"Compliance-Checkliste", identityVerified:"Identität geprüft",
    licenseValid:"Lizenz gültig", companyRegistered:"Unternehmen registriert",
    reviewNotes:"Prüfnotizen", saveChecklist:"Checkliste speichern",
    checklistSaved:"Checkliste gespeichert.", duplicates:"⚠️ Doppelte Einträge erkannt",
  },
  AR: {
    title:"التحقق من تسجيلات الوكالات", subtitle:"طابور مركزي · تصفية · ترتيب · مراجعة الامتثال",
    loading:"جاري التحميل...", noItems:"لا توجد ملفات.", selectItem:"اختر ملفًا.",
    agency:"الوكالة", manager:"المسؤول", city:"المدينة", country:"البلد", email:"البريد", phone:"الهاتف",
    submissionDate:"تاريخ التقديم", filterStatus:"الحالة", filterCountry:"البلد",
    filterDateFrom:"من", filterDateTo:"إلى", allCountries:"جميع البلدان",
    sortBy:"ترتيب حسب", sortDate:"التاريخ", sortCountry:"البلد", sortAsc:"↑ تصاعدي", sortDesc:"↓ تنازلي",
    applyFilters:"تطبيق", resetFilters:"إعادة تعيين",
    items:"الملفات", none:"لا يوجد", docs:"المستندات", logout:"تسجيل الخروج",
    managerMain:"المسؤول الرئيسي", name:"الاسم",
    adminDocs:"المستندات الإدارية المقدمة", rc:"السجل التجاري", fiscal:"الرقم الضريبي",
    iata:"رمز IATA", notProvided:"غير مُدخل", validateSection:"التحقق من المعلومات الإدارية",
    saveVerify:"حفظ والتحقق", receivedDocs:"المستندات المستلمة", download:"تحميل",
    noDocs:"لم يتم تحميل أي مستند.", actions:"إجراءات الملف", goTo:"الانتقال إلى:",
    approve:"الموافقة على الحساب", reject:"رفض وحذف",
    forceStatus:"فرض الحالة يدويًا:",
    rejectConfirm:"رفض هذا الملف سيؤدي إلى حذف الحساب. متابعة؟",
    statusUpdated:"تم تحديث الحالة:", verified:"تم التحقق.",
    approved:"تمت الموافقة.", rejected:"تم الرفض.",
    checklist:"قائمة التحقق من الامتثال", identityVerified:"الهوية محققة",
    licenseValid:"الترخيص ساري", companyRegistered:"الشركة مسجلة",
    reviewNotes:"ملاحظات المراجعة", saveChecklist:"حفظ القائمة",
    checklistSaved:"تم حفظ القائمة.", duplicates:"⚠️ تنبيهات التكرار",
  },
};

/* ─── Helpers ─── */
async function apiFetch(path, token, options = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur admin.");
  return data;
}

async function downloadDoc(token, docId, filename) {
  const res = await fetch(`${API}/api/admin/partners/documents/${docId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Téléchargement échoué.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

/* ─── Badge & Status colour ─── */
const STATUS_COLORS = {
  SUBMITTED:                "bg-amber-50 border-amber-300 text-amber-700",
  CONTACT_IN_PROGRESS:      "bg-purple-50 border-purple-300 text-purple-700",
  DOCUMENTS_REQUESTED:      "bg-yellow-50 border-yellow-300 text-yellow-700",
  DOCUMENTS_RECEIVED:       "bg-blue-50 border-blue-300 text-blue-700",
  VERIFICATION_IN_PROGRESS: "bg-sky-50 border-sky-300 text-sky-700",
  APPROVED:                 "bg-emerald-50 border-emerald-300 text-emerald-700",
  REJECTED:                 "bg-rose-50 border-rose-300 text-rose-700",
  PENDING:                  "bg-amber-50 border-amber-300 text-amber-700",
  VERIFIED:                 "bg-blue-50 border-blue-300 text-blue-700",
  ACTIVE:                   "bg-emerald-50 border-emerald-300 text-emerald-700",
};

function Badge({ status, statusLabels }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[status] || "bg-slate-50 border-slate-200 text-slate-600"}`}>
      {statusLabels[status] || status}
    </span>
  );
}

/* ─── Checklist panel ─── */
function ChecklistPanel({ details, adminToken, selectedId, onSaved, setErr, l }) {
  const [form, setForm] = useState({
    identityVerified: false,
    licenseValid: false,
    companyRegistered: false,
    reviewNotes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (details) {
      setForm({
        identityVerified: details.identityVerified || false,
        licenseValid: details.licenseValid || false,
        companyRegistered: details.companyRegistered || false,
        reviewNotes: details.reviewNotes || "",
      });
    }
  }, [details]);

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/partners/applications/${selectedId}/checklist`, adminToken, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      onSaved(l.checklistSaved);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const checks = [
    { key: "identityVerified", label: l.identityVerified },
    { key: "licenseValid",     label: l.licenseValid },
    { key: "companyRegistered", label: l.companyRegistered },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.checklist}</h4>
      <div className="grid gap-2 mb-3">
        {checks.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={() => toggle(key)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400/30 accent-emerald-500"
            />
            <span className={`text-sm font-medium ${form[key] ? "text-emerald-700" : "text-slate-600"}`}>
              {form[key] ? "✓ " : ""}{label}
            </span>
          </label>
        ))}
      </div>
      <div className="grid gap-1 mb-3">
        <span className="text-xs font-medium text-slate-500">{l.reviewNotes}</span>
        <textarea
          value={form.reviewNotes}
          onChange={(e) => setForm((f) => ({ ...f, reviewNotes: e.target.value }))}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          placeholder="..."
        />
      </div>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={save} disabled={saving}>
          {saving ? "..." : l.saveChecklist}
        </Button>
      </div>
    </div>
  );
}

/* ─── Details panel ─── */
function DetailsPanel({
  details, detailsLoading, selectedId,
  err, success, setErr,
  verifyForm, setVerifyForm,
  onVerify, onApprove, onReject, onSetStatus,
  onChecklistSaved,
  adminToken,
  l, statusLabels,
}) {
  const nextStatus = details ? STATUS_NEXT[details.status] : null;
  const [dlErr, setDlErr] = useState("");

  if (!selectedId) return <p className="text-sm text-slate-400 py-4 text-center">{l.selectItem}</p>;
  if (detailsLoading || !details) return <p className="text-sm text-slate-400 py-4 text-center">{l.loading}</p>;

  const canAct = details.status !== "APPROVED" && details.status !== "REJECTED";

  const handleDownload = async (doc) => {
    setDlErr("");
    try { await downloadDoc(adminToken, doc.id, doc.filename); }
    catch (e) { setDlErr(e.message); }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{details.agencyName}</h3>
            <span className="text-xs text-slate-400">#{details.id}</span>
          </div>
          <div className="text-sm text-slate-500">{l.manager}: <b>{details.managerName || "—"}</b></div>
          {details.submittedAt && (
            <div className="text-xs text-slate-400">{l.submissionDate}: {fmtDate(details.submittedAt)}</div>
          )}
        </div>
        <Badge status={details.status} statusLabels={statusLabels} />
      </div>

      {/* Alerts */}
      {(err || success) && (
        <div className={err ? "rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                           : "rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"}>
          {err || success}
        </div>
      )}
      {dlErr && <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{dlErr}</div>}

      {/* Duplicate alerts */}
      {details.duplicateAlerts?.length > 0 && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 p-3">
          <p className="mb-2 text-xs font-bold text-orange-700">{l.duplicates}</p>
          <ul className="flex flex-col gap-1">
            {details.duplicateAlerts.map((a, i) => (
              <li key={i} className="text-xs text-orange-700">• {a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Company + Manager info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{l.agency}</h4>
          <div className="mt-1 space-y-0.5 text-xs text-slate-400">
            <div>{l.city}: {details.city || "—"}</div>
            <div>{l.country}: {details.country || "—"}</div>
            <div>Adresse: {details.address || "—"}</div>
            <div>{l.email}: {details.contactEmail || "—"}</div>
            <div>{l.phone}: {details.contactPhone || "—"}</div>
            {details.contactPersonName && <div>Contact: {details.contactPersonName}</div>}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{l.managerMain}</h4>
          <div className="mt-1 space-y-0.5 text-xs text-slate-400">
            <div>{l.name}: {details.managerName || "—"}</div>
            <div>{l.email}: {details.managerEmail || "—"}</div>
            <div>{l.phone}: {details.managerPhone || "—"}</div>
          </div>
        </div>
      </div>

      {/* Legal data */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.adminDocs}</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            [l.rc,       details.tradeRegisterNumber || details.rcNumber],
            [l.fiscal,   details.taxIdentificationNumber || details.fiscalNumber],
            [l.iata,     details.iataCode],
            ["Consentement", details.consentStatus
              ? `✓ Accepté${details.consentTimestamp ? " · " + fmtDate(details.consentTimestamp) : ""}`
              : "✗ Non accepté"],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="mb-1 text-xs text-slate-400">{label}</div>
              <div className="text-sm font-semibold text-slate-900">
                {val || <span className="font-normal text-slate-400">{l.notProvided}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verify form */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.validateSection}</h4>
        <div className="grid grid-cols-3 gap-3">
          <Input label={l.rc} value={verifyForm.rcNumber} onChange={(e) => setVerifyForm({ ...verifyForm, rcNumber: e.target.value })} />
          <Input label={l.fiscal} value={verifyForm.fiscalNumber} onChange={(e) => setVerifyForm({ ...verifyForm, fiscalNumber: e.target.value })} />
          <Input label={l.iata} value={verifyForm.iataCode} onChange={(e) => setVerifyForm({ ...verifyForm, iataCode: e.target.value })} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={onVerify}>{l.saveVerify}</Button>
        </div>
      </div>

      {/* Compliance checklist */}
      <ChecklistPanel
        details={details}
        adminToken={adminToken}
        selectedId={selectedId}
        onSaved={onChecklistSaved}
        setErr={setErr}
        l={l}
      />

      {/* Documents */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{l.receivedDocs}</h4>
        {details.documents?.length ? (
          <div className="mt-3 flex flex-col gap-3">
            {details.documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div>
                  <b className="text-sm text-slate-900">{doc.filename}</b>
                  <div className="text-xs text-slate-400">{doc.type} · {fmtDate(doc.uploadedAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  ⬇ {l.download}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">{l.noDocs}</p>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.actions}</h4>
        <div className="flex flex-wrap gap-2">
          {nextStatus && (
            <Button onClick={() => onSetStatus(nextStatus)}>
              ➡ {l.goTo} {statusLabels[nextStatus] || nextStatus}
            </Button>
          )}
          {canAct && <Button onClick={onApprove}>✅ {l.approve}</Button>}
          {canAct && <Button variant="ghost" onClick={onReject}>❌ {l.reject}</Button>}
        </div>
        <hr className="my-4 border-slate-200" />
        <div className="mb-2 text-xs text-slate-400">{l.forceStatus}</div>
        <div className="flex flex-wrap gap-2">
          {["SUBMITTED","CONTACT_IN_PROGRESS","DOCUMENTS_REQUESTED","DOCUMENTS_RECEIVED","VERIFICATION_IN_PROGRESS","APPROVED"].map((s) => (
            <button key={s} type="button" onClick={() => onSetStatus(s)} disabled={details.status === s}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition
                ${details.status === s ? "border-red-500 bg-red-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} disabled:opacity-50`}>
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Main component
═════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { adminToken, adminUser, logoutAdmin } = useAuth();
  const { language } = useLanguage();
  const l = tr[language] || tr.FR;
  const statusLabels = STATUS_LABELS_I18N[language] || STATUS_LABELS_I18N.FR;
  const isRTL = language === "AR";

  /* ─── Filter / sort state ─── */
  const [filterPreset, setFilterPreset] = useState("ACTIVE_QUEUE"); // status preset key
  const [filterCountry, setFilterCountry] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy]   = useState("submittedAt");
  const [sortDir, setSortDir] = useState("asc");

  /* ─── Data state ─── */
  const [items, setItems]               = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [details, setDetails]           = useState(null);
  const [verifyForm, setVerifyForm]     = useState({ rcNumber: "", fiscalNumber: "", iataCode: "" });
  const [loading, setLoading]           = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [err, setErr]                   = useState("");
  const [success, setSuccess]           = useState("");

  /* ─── Distinct countries from current list ─── */
  const availableCountries = useMemo(
    () => [...new Set(items.map((i) => i.country).filter(Boolean))].sort(),
    [items]
  );

  /* ─── Stats per status ─── */
  const groupedStats = useMemo(
    () => items.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {}),
    [items]
  );

  /* ─── Build query string ─── */
  const buildQuery = useCallback((preset, country, dateFrom, dateTo, sb, sd) => {
    const params = new URLSearchParams();
    params.set("statuses",  PRESET_STATUSES[preset] ?? "");
    if (country)  params.set("country",  country);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo",   dateTo);
    params.set("sortBy",  sb);
    params.set("sortDir", sd);
    return params.toString();
  }, []);

  /* ─── Loaders ─── */
  const loadApplications = useCallback(async (override = {}) => {
    const preset   = override.preset    ?? filterPreset;
    const country  = override.country   ?? filterCountry;
    const dateFrom = override.dateFrom  ?? filterDateFrom;
    const dateTo   = override.dateTo    ?? filterDateTo;
    const sb       = override.sortBy    ?? sortBy;
    const sd       = override.sortDir   ?? sortDir;

    setLoading(true); setErr("");
    try {
      const qs = buildQuery(preset, country, dateFrom, dateTo, sb, sd);
      const data = await apiFetch(`/api/admin/partners/applications?${qs}`, adminToken);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [adminToken, filterPreset, filterCountry, filterDateFrom, filterDateTo, sortBy, sortDir, buildQuery]);

  const loadDetails = useCallback(async (id) => {
    if (!id) return;
    setDetailsLoading(true); setErr("");
    try {
      const data = await apiFetch(`/api/admin/partners/applications/${id}`, adminToken);
      setDetails(data);
      setVerifyForm({ rcNumber: data.rcNumber || "", fiscalNumber: data.fiscalNumber || "", iataCode: data.iataCode || "" });
    } catch (e) { setErr(e.message); }
    finally { setDetailsLoading(false); }
  }, [adminToken]);

  /* ─── Effects ─── */
  useEffect(() => { loadApplications(); }, []); // eslint-disable-line
  useEffect(() => { if (selectedId) { setSuccess(""); loadDetails(selectedId); } }, [selectedId]); // eslint-disable-line

  /* ─── Apply / Reset filters ─── */
  const applyFilters = () => loadApplications();
  const resetFilters = () => {
    setFilterPreset("ACTIVE_QUEUE");
    setFilterCountry("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("submittedAt");
    setSortDir("asc");
    loadApplications({ preset: "ACTIVE_QUEUE", country: "", dateFrom: "", dateTo: "", sortBy: "submittedAt", sortDir: "asc" });
  };

  /* ─── Actions ─── */
  const apiAction = async (fn) => { setErr(""); setSuccess(""); try { await fn(); } catch (e) { setErr(e.message); } };

  const setApplicationStatus = (newStatus) =>
    apiAction(async () => {
      const data = await apiFetch(`/api/admin/partners/applications/${selectedId}/status`, adminToken, {
        method: "PUT", body: JSON.stringify({ status: newStatus }),
      });
      setDetails(data);
      setSuccess(`${l.statusUpdated} ${statusLabels[newStatus] || newStatus}`);
      await loadApplications();
    });

  const verifyAccount = () =>
    apiAction(async () => {
      const data = await apiFetch(`/api/admin/partners/applications/${selectedId}/verify`, adminToken, {
        method: "PUT", body: JSON.stringify(verifyForm),
      });
      setDetails(data); setSuccess(l.verified);
      await loadApplications();
    });

  const approveAccount = () =>
    apiAction(async () => {
      const data = await apiFetch(`/api/admin/partners/applications/${selectedId}/approve`, adminToken, { method: "PUT" });
      setDetails(data); setSuccess(l.approved);
      await loadApplications();
    });

  const rejectAccount = () => {
    if (!window.confirm(l.rejectConfirm)) return;
    apiAction(async () => {
      await apiFetch(`/api/admin/partners/applications/${selectedId}`, adminToken, { method: "DELETE" });
      setSuccess(l.rejected);
      setSelectedId(null); setDetails(null);
      await loadApplications();
    });
  };

  const handleChecklistSaved = async (msg) => {
    setSuccess(msg);
    await loadDetails(selectedId);
  };

  /* ─── Render ─── */
  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? "rtl" : "ltr"}>

        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">{adminUser?.email}</span>
          <Button variant="ghost" onClick={logoutAdmin}>{l.logout}</Button>
        </div>

        {/* Header card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl mb-4">
          <h2 className="text-xl font-bold text-slate-900">{l.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{l.subtitle}</p>

          {/* Status flow */}
          <div className="mt-4 mb-4 flex flex-wrap items-center gap-2">
            {["SUBMITTED","CONTACT_IN_PROGRESS","DOCUMENTS_REQUESTED","DOCUMENTS_RECEIVED","VERIFICATION_IN_PROGRESS","APPROVED"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <Badge status={s} statusLabels={statusLabels} />
                {i < 5 && <span className="text-slate-300">→</span>}
              </span>
            ))}
          </div>

          {/* ── Filters & Sort ── */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 grid gap-3">
            {/* Row 1: status presets */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">{l.filterStatus}:</span>
              {["ACTIVE_QUEUE","ALL","SUBMITTED","CONTACT_IN_PROGRESS","DOCUMENTS_REQUESTED","DOCUMENTS_RECEIVED","VERIFICATION_IN_PROGRESS","APPROVED","REJECTED"].map((p) => (
                <button key={p} type="button"
                  onClick={() => setFilterPreset(p)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition
                    ${filterPreset === p ? "border-red-500 bg-red-600 text-white shadow" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
                >
                  {statusLabels[p] || p}
                  {p !== "ACTIVE_QUEUE" && p !== "ALL" && groupedStats[p] ? ` (${groupedStats[p]})` : ""}
                </button>
              ))}
            </div>

            {/* Row 2: country + dates */}
            <div className="flex flex-wrap gap-3 items-end">
              {/* Country */}
              <div className="grid gap-1">
                <span className="text-xs font-medium text-slate-500">{l.filterCountry}</span>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">{l.allCountries}</option>
                  {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Date from */}
              <div className="grid gap-1">
                <span className="text-xs font-medium text-slate-500">{l.filterDateFrom}</span>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              </div>
              {/* Date to */}
              <div className="grid gap-1">
                <span className="text-xs font-medium text-slate-500">{l.filterDateTo}</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              </div>
              {/* Sort by */}
              <div className="grid gap-1">
                <span className="text-xs font-medium text-slate-500">{l.sortBy}</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-red-500">
                  <option value="submittedAt">{l.sortDate}</option>
                  <option value="country">{l.sortCountry}</option>
                  <option value="agencyName">{l.agency}</option>
                </select>
              </div>
              {/* Sort dir */}
              <div className="grid gap-1">
                <span className="text-xs font-medium text-slate-500 invisible">.</span>
                <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-red-500">
                  <option value="asc">{l.sortAsc}</option>
                  <option value="desc">{l.sortDesc}</option>
                </select>
              </div>
              {/* Buttons */}
              <div className="flex gap-2 items-end">
                <button type="button" onClick={applyFilters}
                  className="h-9 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow hover:bg-red-700 transition">
                  {l.applyFilters}
                </button>
                <button type="button" onClick={resetFilters}
                  className="h-9 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  {l.resetFilters}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-panel layout ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "380px 1fr" }}>

          {/* LEFT: queue list */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-slate-900">{l.items}</h3>
              <span className="text-xs text-slate-400">{items.length}</span>
            </div>
            <div className="mb-3 text-xs text-slate-400">
              {Object.entries(groupedStats).map(([k, v]) => `${statusLabels[k] || k}: ${v}`).join(" · ") || l.none}
            </div>
            {loading ? (
              <p className="text-sm text-slate-400">{l.loading}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-400">{l.noItems}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[72vh] overflow-y-auto pr-1">
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)}
                    className={`rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-red-400 bg-red-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-sm text-slate-900 truncate">{item.agencyName || "—"}</b>
                      <Badge status={item.status} statusLabels={statusLabels} />
                    </div>
                    <div className="mt-1.5 text-xs text-slate-400">{item.managerName || "—"}</div>
                    <div className="text-xs text-slate-400">{item.contactEmail}</div>
                    <div className="text-xs text-slate-400">{item.city} · {item.country}</div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{l.docs}: {item.documentsCount}</span>
                      {item.submittedAt && <span className="text-slate-300">{fmtDate(item.submittedAt)}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl overflow-y-auto max-h-[88vh]">
            <DetailsPanel
              details={details}
              detailsLoading={detailsLoading}
              selectedId={selectedId}
              err={err} success={success} setErr={setErr}
              verifyForm={verifyForm} setVerifyForm={setVerifyForm}
              onVerify={verifyAccount}
              onApprove={approveAccount}
              onReject={rejectAccount}
              onSetStatus={setApplicationStatus}
              onChecklistSaved={handleChecklistSaved}
              adminToken={adminToken}
              l={l} statusLabels={statusLabels}
            />
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

