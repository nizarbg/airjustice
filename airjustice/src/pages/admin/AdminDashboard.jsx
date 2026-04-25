import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { useLanguage } from "../../context/LanguageContext";
import PageLayout from "../../components/PageLayout";

const API = "http://localhost:8080";

const STATUS_KEYS = ["SUBMITTED","CONTACT_IN_PROGRESS","DOCUMENTS_REQUESTED","DOCUMENTS_RECEIVED","VERIFICATION_IN_PROGRESS","APPROVED","REJECTED","PENDING","VERIFIED","ACTIVE","ALL"];

const STATUS_LABELS_I18N = {
  DE: { SUBMITTED: "Eingereicht", CONTACT_IN_PROGRESS: "Kontaktaufnahme", DOCUMENTS_REQUESTED: "Dokumente angefordert", DOCUMENTS_RECEIVED: "Dokumente erhalten", VERIFICATION_IN_PROGRESS: "Überprüfung läuft", APPROVED: "Genehmigt", REJECTED: "Abgelehnt", PENDING: "Ausstehend", VERIFIED: "Verifiziert", ACTIVE: "Aktiv", ALL: "Alle" },
  EN: { SUBMITTED: "Submitted", CONTACT_IN_PROGRESS: "Contacting", DOCUMENTS_REQUESTED: "Documents requested", DOCUMENTS_RECEIVED: "Documents received", VERIFICATION_IN_PROGRESS: "Verification in progress", APPROVED: "Approved", REJECTED: "Rejected", PENDING: "Pending", VERIFIED: "Verified", ACTIVE: "Active", ALL: "All" },
  FR: { SUBMITTED: "Soumis", CONTACT_IN_PROGRESS: "Prise de contact", DOCUMENTS_REQUESTED: "Documents demandés", DOCUMENTS_RECEIVED: "Documents reçus", VERIFICATION_IN_PROGRESS: "Vérification en cours", APPROVED: "Approuvé", REJECTED: "Rejeté", PENDING: "En attente", VERIFIED: "Vérifié", ACTIVE: "Actif", ALL: "Tous" },
  AR: { SUBMITTED: "مُقدَّم", CONTACT_IN_PROGRESS: "جاري التواصل", DOCUMENTS_REQUESTED: "المستندات مطلوبة", DOCUMENTS_RECEIVED: "المستندات مستلمة", VERIFICATION_IN_PROGRESS: "التحقق جاري", APPROVED: "مُوافق عليه", REJECTED: "مرفوض", PENDING: "قيد الانتظار", VERIFIED: "تم التحقق", ACTIVE: "نشط", ALL: "الكل" },
};

const tr = {
  DE: { title: "Validierung der Agenturanmeldungen", subtitle: "Verwalten Sie den vollständigen Anmeldeprozess: Einreichung → Kontakt → Dokumente → Überprüfung → Aktivierung.", loading: "Laden...", noItems: "Keine Einträge für diesen Filter.", selectItem: "Wählen Sie einen Eintrag aus.", agency: "Agentur", manager: "Verantwortlicher", city: "Stadt", country: "Land", email: "E-Mail", phone: "Telefon", managerMain: "Hauptverantwortlicher", name: "Name", adminDocs: "Vom Partner eingereichte Verwaltungsdokumente", rc: "Handelsregister", fiscal: "Steuernummer", iata: "IATA-Code", notProvided: "Nicht angegeben", validateSection: "Verwaltungsinformationen validieren/korrigieren", saveVerify: "Speichern & überprüfen", receivedDocs: "Erhaltene Dokumente", download: "Herunterladen", noDocs: "Noch keine Dokumente hochgeladen.", actions: "Aktionen zum Eintrag", goTo: "Weiter zu:", approve: "Konto genehmigen", reject: "Ablehnen & löschen", forceStatus: "Status manuell erzwingen:", rejectConfirm: "Diesen Eintrag ablehnen? Das Partnerkonto wird gelöscht.", statusUpdated: "Status aktualisiert:", verified: "Eintrag verifiziert — Status: Überprüfung läuft.", approved: "Konto genehmigt. Der Partner hat jetzt Zugang.", rejected: "Eintrag abgelehnt und Konto gelöscht.", items: "Einträge", none: "Keine", docs: "Dokumente", logout: "Abmelden" },
  EN: { title: "Agency registration validation", subtitle: "Manage the full registration process: submission → contact → documents → verification → activation.", loading: "Loading...", noItems: "No entries for this filter.", selectItem: "Select an entry.", agency: "Agency", manager: "Manager", city: "City", country: "Country", email: "Email", phone: "Phone", managerMain: "Main manager", name: "Name", adminDocs: "Administrative documents submitted by the partner", rc: "Trade Register", fiscal: "Tax ID", iata: "IATA Code", notProvided: "Not provided", validateSection: "Validate / correct administrative information", saveVerify: "Save & verify", receivedDocs: "Received documents", download: "Download", noDocs: "No documents uploaded yet.", actions: "Case actions", goTo: "Move to:", approve: "Approve account", reject: "Reject & delete", forceStatus: "Force status manually:", rejectConfirm: "Reject this application? The partner account will be deleted.", statusUpdated: "Status updated:", verified: "Case verified — status: Verification in progress.", approved: "Account approved. The partner now has access.", rejected: "Application rejected and account deleted.", items: "Entries", none: "None", docs: "Documents", logout: "Logout" },
  FR: { title: "Validation des inscriptions agences", subtitle: "Gérez le processus d'inscription complet : soumission → contact → documents → vérification → activation.", loading: "Chargement...", noItems: "Aucun dossier pour ce filtre.", selectItem: "Sélectionnez un dossier.", agency: "Agence", manager: "Responsable", city: "Ville", country: "Pays", email: "Email", phone: "Téléphone", managerMain: "Responsable principal", name: "Nom", adminDocs: "Documents administratifs soumis par le partenaire", rc: "Registre de commerce", fiscal: "Matricule fiscale", iata: "Code IATA", notProvided: "Non renseigné", validateSection: "Valider / corriger les informations administratives", saveVerify: "Sauvegarder et vérifier", receivedDocs: "Documents reçus", download: "Télécharger", noDocs: "Aucun document téléversé pour le moment.", actions: "Actions sur le dossier", goTo: "Passer à :", approve: "Approuver le compte", reject: "Rejeter et supprimer", forceStatus: "Forcer un statut manuellement :", rejectConfirm: "Rejeter ce dossier supprimera le compte partenaire. Continuer ?", statusUpdated: "Statut mis à jour :", verified: "Dossier vérifié — statut : Vérification en cours.", approved: "Compte approuvé. Le partenaire a maintenant accès à la plateforme.", rejected: "Dossier rejeté et compte supprimé.", items: "Dossiers", none: "Aucun", docs: "Documents", logout: "Déconnexion" },
  AR: { title: "التحقق من تسجيلات الوكالات", subtitle: "إدارة عملية التسجيل الكاملة: تقديم ← تواصل ← مستندات ← تحقق ← تفعيل.", loading: "جاري التحميل...", noItems: "لا توجد ملفات لهذا الفلتر.", selectItem: "اختر ملفًا.", agency: "الوكالة", manager: "المسؤول", city: "المدينة", country: "البلد", email: "البريد", phone: "الهاتف", managerMain: "المسؤول الرئيسي", name: "الاسم", adminDocs: "المستندات الإدارية المقدمة من الشريك", rc: "السجل التجاري", fiscal: "الرقم الضريبي", iata: "رمز IATA", notProvided: "غير مُدخل", validateSection: "التحقق / تصحيح المعلومات الإدارية", saveVerify: "حفظ والتحقق", receivedDocs: "المستندات المستلمة", download: "تحميل", noDocs: "لم يتم تحميل أي مستند بعد.", actions: "إجراءات الملف", goTo: "الانتقال إلى:", approve: "الموافقة على الحساب", reject: "رفض وحذف", forceStatus: "فرض الحالة يدويًا:", rejectConfirm: "رفض هذا الملف سيؤدي إلى حذف حساب الشريك. متابعة؟", statusUpdated: "تم تحديث الحالة:", verified: "تم التحقق من الملف — الحالة: التحقق جارٍ.", approved: "تمت الموافقة على الحساب. الشريك يمكنه الآن الوصول.", rejected: "تم رفض الملف وحذف الحساب.", items: "الملفات", none: "لا يوجد", docs: "المستندات", logout: "تسجيل الخروج" },
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

function Badge({ status, statusLabels }) {
  const colors = {
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
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${colors[status] || "bg-slate-50 border-slate-200 text-slate-600"}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function AdminDashboard() {
  const { adminToken, adminUser, logoutAdmin } = useAuth();
  const { language } = useLanguage();
  const l = tr[language] || tr.FR;
  const statusLabels = STATUS_LABELS_I18N[language] || STATUS_LABELS_I18N.FR;
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
      setSuccess(`${l.statusUpdated} ${statusLabels[newStatus] || newStatus}`);
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
      setSuccess(l.verified);
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const approveAccount = async () => {
    if (!selectedId) return;
    setErr(""); setSuccess("");
    try {
      const data = await api(`/api/admin/partners/applications/${selectedId}/approve`, adminToken, { method: "PUT" });
      setDetails(data);
      setSuccess(l.approved);
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const rejectAccount = async () => {
    if (!selectedId) return;
    if (!window.confirm(l.rejectConfirm)) return;
    setErr(""); setSuccess("");
    try {
      await api(`/api/admin/partners/applications/${selectedId}`, adminToken, { method: "DELETE" });
      setSuccess(l.rejected);
      setSelectedId(null); setDetails(null);
      await loadApplications();
    } catch (error) { setErr(error.message); }
  };

  const nextStatus = details ? STATUS_NEXT[details.status] : null;

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" dir={language === 'AR' ? 'rtl' : 'ltr'}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">{adminUser?.email}</span>
          <Button variant="ghost" onClick={logoutAdmin}>{l.logout}</Button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl mb-4">
          <h2 className="text-xl font-bold text-slate-900">{l.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{l.subtitle}</p>

          <div className="mt-4 mb-4 flex flex-wrap items-center gap-2">
            {["SUBMITTED", "CONTACT_IN_PROGRESS", "DOCUMENTS_REQUESTED", "DOCUMENTS_RECEIVED", "VERIFICATION_IN_PROGRESS", "APPROVED"].map((s, idx) => (
              <span key={s} className="flex items-center gap-2">
                <Badge status={s} statusLabels={statusLabels} />
                {idx < 5 && <span className="text-slate-300">→</span>}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {["ALL", "SUBMITTED", "CONTACT_IN_PROGRESS", "DOCUMENTS_REQUESTED", "DOCUMENTS_RECEIVED", "VERIFICATION_IN_PROGRESS", "APPROVED", "REJECTED"].map((option) => (
              <button key={option} type="button" onClick={() => setStatus(option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${status === option ? "border-red-500 bg-red-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                {statusLabels[option] || option}
                {option !== "ALL" && groupedStats[option] ? ` (${groupedStats[option]})` : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "360px 1fr" }}>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{l.items}</h3>
            <div className="mt-1 mb-3 text-xs text-slate-400">
              {Object.entries(groupedStats).map(([k, v]) => `${statusLabels[k] || k}: ${v}`).join(" • ") || l.none}
            </div>
            {loading ? (
              <p className="text-sm text-slate-400">{l.loading}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-400">{l.noItems}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)}
                    className={`rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-red-400 bg-red-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-sm text-slate-900">{item.agencyName || l.agency}</b>
                      <Badge status={item.status} statusLabels={statusLabels} />
                    </div>
                    <div className="mt-1.5 text-xs text-slate-400">{item.managerName || l.manager}</div>
                    <div className="text-xs text-slate-400">{item.contactEmail}</div>
                    <div className="text-xs text-slate-400">{item.city} • {item.country}</div>
                    <div className="text-xs text-slate-400">{l.docs}: {item.documentsCount}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            {!selectedId ? (
              <p className="text-sm text-slate-400">{l.selectItem}</p>
            ) : detailsLoading ? (
              <p className="text-sm text-slate-400">{l.loading}</p>
            ) : details ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{details.agencyName}</h3>
                    <div className="text-sm text-slate-500">{l.manager}: <b>{details.managerName || "-"}</b></div>
                  </div>
                  <Badge status={details.status} statusLabels={statusLabels} />
                </div>

                {(err || success) && (
                  <div className={err ? "rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700" : "rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"}>
                    {err || success}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{l.agency}</h4>
                    <div className="mt-1 text-xs text-slate-400">{l.city}: {details.city || "-"}</div>
                    <div className="text-xs text-slate-400">{l.country}: {details.country || "-"}</div>
                    <div className="text-xs text-slate-400">Adresse: {details.address || "-"}</div>
                    <div className="text-xs text-slate-400">{l.email}: {details.contactEmail || "-"}</div>
                    <div className="text-xs text-slate-400">{l.phone}: {details.contactPhone || "-"}</div>
                    {details.contactPersonName && <div className="text-xs text-slate-400">Contact: {details.contactPersonName}</div>}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{l.managerMain}</h4>
                    <div className="mt-1 text-xs text-slate-400">{l.name}: {details.managerName || "-"}</div>
                    <div className="text-xs text-slate-400">{l.email}: {details.managerEmail || "-"}</div>
                    <div className="text-xs text-slate-400">{l.phone}: {details.managerPhone || "-"}</div>
                  </div>
                </div>

                {/* Legal data section */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.adminDocs}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-1 text-xs text-slate-400">{l.rc}</div>
                      <div className="text-sm font-semibold text-slate-900">{details.tradeRegisterNumber || details.rcNumber || <span className="text-slate-400">{l.notProvided}</span>}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-slate-400">{l.fiscal}</div>
                      <div className="text-sm font-semibold text-slate-900">{details.taxIdentificationNumber || details.fiscalNumber || <span className="text-slate-400">{l.notProvided}</span>}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-slate-400">{l.iata}</div>
                      <div className="text-sm font-semibold text-slate-900">{details.iataCode || <span className="text-slate-400">{l.notProvided}</span>}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-slate-400">Consentement</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {details.consentStatus ? <span className="text-emerald-600">✓ Accepté</span> : <span className="text-rose-600">✗ Non accepté</span>}
                        {details.consentTimestamp && <span className="ml-2 text-xs text-slate-400">{new Date(details.consentTimestamp).toLocaleString()}</span>}
                        {details.privacyPolicyVersion && <span className="ml-2 text-xs text-slate-400">v{details.privacyPolicyVersion}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.validateSection}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label={l.rc} value={verifyForm.rcNumber} onChange={(e) => setVerifyForm({ ...verifyForm, rcNumber: e.target.value })} />
                    <Input label={l.fiscal} value={verifyForm.fiscalNumber} onChange={(e) => setVerifyForm({ ...verifyForm, fiscalNumber: e.target.value })} />
                    <Input label={l.iata} value={verifyForm.iataCode} onChange={(e) => setVerifyForm({ ...verifyForm, iataCode: e.target.value })} />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button variant="secondary" onClick={verifyAccount}>{l.saveVerify}</Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{l.receivedDocs}</h4>
                  {details.documents?.length ? (
                    <div className="mt-3 flex flex-col gap-3">
                      {details.documents.map((doc) => (
                        <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                          <div>
                            <b className="text-sm text-slate-900">{doc.filename}</b>
                            <div className="text-xs text-slate-400">{doc.type} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                          </div>
                          <a className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" href={`${API}/api/admin/partners/documents/${doc.id}/download`} target="_blank" rel="noreferrer">{l.download}</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">{l.noDocs}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">{l.actions}</h4>
                  <div className="flex flex-wrap gap-2">
                    {nextStatus && (
                      <Button onClick={() => setApplicationStatus(nextStatus)}>
                        ➡️ {l.goTo} {statusLabels[nextStatus] || nextStatus}
                      </Button>
                    )}
                    {details.status !== "APPROVED" && details.status !== "REJECTED" && (
                      <Button onClick={approveAccount}>✅ {l.approve}</Button>
                    )}
                    {details.status !== "REJECTED" && details.status !== "APPROVED" && (
                      <Button variant="ghost" onClick={rejectAccount}>❌ {l.reject}</Button>
                    )}
                  </div>
                  <hr className="my-4 border-slate-200" />
                  <div className="mb-2 text-xs text-slate-400">{l.forceStatus}</div>
                  <div className="flex flex-wrap gap-2">
                    {["SUBMITTED", "CONTACT_IN_PROGRESS", "DOCUMENTS_REQUESTED", "DOCUMENTS_RECEIVED", "VERIFICATION_IN_PROGRESS", "APPROVED"].map((s) => (
                      <button key={s} type="button" onClick={() => setApplicationStatus(s)} disabled={details.status === s}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${details.status === s ? "border-red-500 bg-red-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} disabled:opacity-50`}>
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">{l.loading}</p>
            )}
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

