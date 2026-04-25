import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import PageLayout from "../../components/PageLayout";
import { API, extractApiErrorMessage, parseApiBody } from "./partnerApi";

/* ───────────────────────── Static data ───────────────────────── */

const COUNTRIES = [
  { code: "TN", label: "Tunisie" }, { code: "DZ", label: "Algérie" },
  { code: "MA", label: "Maroc" }, { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" }, { code: "CH", label: "Suisse" },
  { code: "CA", label: "Canada" }, { code: "DE", label: "Deutschland" },
  { code: "GB", label: "United Kingdom" }, { code: "IT", label: "Italia" },
  { code: "ES", label: "España" }, { code: "NL", label: "Nederland" },
  { code: "TR", label: "Türkiye" }, { code: "EG", label: "Egypt" },
  { code: "LY", label: "Libya" }, { code: "MR", label: "Mauritania" },
  { code: "SN", label: "Sénégal" },
];

const PHONE_CODES = [
  { code: "+216", flag: "🇹🇳" }, { code: "+213", flag: "🇩🇿" },
  { code: "+212", flag: "🇲🇦" }, { code: "+33",  flag: "🇫🇷" },
  { code: "+32",  flag: "🇧🇪" }, { code: "+41",  flag: "🇨🇭" },
  { code: "+1",   flag: "🇨🇦" }, { code: "+49",  flag: "🇩🇪" },
  { code: "+44",  flag: "🇬🇧" }, { code: "+39",  flag: "🇮🇹" },
  { code: "+34",  flag: "🇪🇸" }, { code: "+31",  flag: "🇳🇱" },
  { code: "+90",  flag: "🇹🇷" }, { code: "+20",  flag: "🇪🇬" },
  { code: "+218", flag: "🇱🇾" }, { code: "+222", flag: "🇲🇷" },
  { code: "+221", flag: "🇸🇳" },
];

const DOC_TYPE_KEYS = ["RNE", "IDENTITY_DOCUMENT", "TRAVEL_AGENCY_LICENSE"];
const PRIVACY_VERSION = "1.0";
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/* ───────────────────────── i18n ───────────────────────── */

const tr = {
  FR: {
    title: "Inscription agence de voyage",
    subtitle: "Enregistrez votre agence de voyage sur AirJustice.",
    required: "Les champs marqués d'un * sont obligatoires.",
    step: "Étape",
    companyInfo: "Informations société",
    agencyName: "Nom de la société *",
    country: "Pays d'immatriculation *",
    addressLine1: "Ligne d'adresse 1",
    addressLine2: "Ligne d'adresse 2",
    streetName: "Nom de la rue *",
    houseNumber: "Numéro de maison *",
    postalCode: "Code postal *",
    city: "Ville *",
    ownerRep: "Propriétaire / Représentant légal",
    contactName: "Nom complet *",
    contactEmail: "Adresse email *",
    contactPhone: "Numéro de téléphone *",
    legalData: "Données juridiques de l'entreprise",
    tradeRegister: "Numéro de registre de commerce *",
    taxId: "Matricule fiscale *",
    adminUser: "Utilisateur administrateur",
    managerName: "Nom complet *",
    email: "Adresse email *",
    phone: "Numéro de téléphone *",
    password: "Mot de passe *",
    confirmPassword: "Confirmer le mot de passe *",
    documents: "Documents requis",
    docRne: "RNE (Tunisie)",
    docId: "Pièce d'identité du responsable",
    docLicense: "Licence agence de voyage",
    tipRne: "Registre National des Entreprises (Tunisie)",
    tipId: "Passeport, CIN ou titre de voyage du responsable",
    tipLicense: "Licence officielle d'agence de voyage délivrée par l'autorité compétente",
    docHint: "Formats acceptés : PDF, JPG, PNG — max 10 Mo par fichier",
    dragHere: "Glissez-déposez vos fichiers ici",
    orBrowse: "ou cliquez pour parcourir",
    uploadedTable: "Documents téléversés",
    colName: "Nom du fichier",
    colType: "Type de document",
    colSize: "Taille",
    colDate: "Date",
    colAction: "Action",
    noFiles: "Aucun fichier téléversé.",
    docTypeRne: "RNE",
    docTypeId: "Pièce d'identité",
    docTypeLicense: "Licence agence",
    docTypeOther: "Autre / Sélectionner",
    privacy: "J'ai lu et j'accepte la politique de confidentialité",
    privacyNotice: "Nous traitons vos données conformément à notre politique de confidentialité. Vos documents sont stockés de manière sécurisée et accessibles uniquement par les réviseurs autorisés.",
    createBtn: "Soumettre l'inscription",
    successTitle: "Inscription soumise avec succès !",
    successMsg: "Votre dossier est en cours d'examen. Vous recevrez un email de confirmation une fois votre compte approuvé par notre équipe.",
    successSub: "Merci pour votre confiance. Nous traitons généralement les demandes sous 24 à 48 heures ouvrées.",
    backHome: "Retour à l'accueil",
    pwdShort: "Le mot de passe doit contenir au moins 8 caractères.",
    pwdMismatch: "Les mots de passe ne correspondent pas.",
    phoneFormat: "Numéro de téléphone invalide.",
    consentRequired: "Vous devez accepter la politique de confidentialité.",
  },
  EN: {
    title: "Agency Registration",
    subtitle: "Register your travel agency on AirJustice.",
    required: "Fields marked with * are required.",
    step: "Step",
    companyInfo: "Company Information",
    agencyName: "Company name *",
    country: "Country of registration *",
    addressLine1: "Address Line 1",
    addressLine2: "Address Line 2",
    streetName: "Street name *",
    houseNumber: "House number *",
    postalCode: "Postal code *",
    city: "City *",
    ownerRep: "Owner / Legal Representative",
    contactName: "Full name *",
    contactEmail: "Email address *",
    contactPhone: "Phone number *",
    legalData: "Legal Company Details",
    tradeRegister: "Trade register number *",
    taxId: "Tax identification number *",
    adminUser: "Admin User",
    managerName: "Full name *",
    email: "Email address *",
    phone: "Phone number *",
    password: "Password *",
    confirmPassword: "Confirm password *",
    documents: "Required Documents",
    docRne: "RNE (Tunisia)",
    docId: "Identity document of responsible person",
    docLicense: "Travel agency license",
    tipRne: "National Business Register (Tunisia)",
    tipId: "Passport, national ID or travel document of the responsible person",
    tipLicense: "Official travel agency license issued by the competent authority",
    docHint: "Accepted formats: PDF, JPG, PNG — max 10 MB per file",
    dragHere: "Drag & drop your files here",
    orBrowse: "or click to browse",
    uploadedTable: "Uploaded Documents",
    colName: "File name",
    colType: "Document type",
    colSize: "Size",
    colDate: "Date",
    colAction: "Action",
    noFiles: "No files uploaded yet.",
    docTypeRne: "RNE",
    docTypeId: "Identity document",
    docTypeLicense: "Agency license",
    docTypeOther: "Other / Select",
    privacy: "I have read and accept the privacy policy",
    privacyNotice: "We process your data in accordance with our privacy policy. Your documents are stored securely and accessible only by authorized reviewers.",
    createBtn: "Submit Registration",
    successTitle: "Registration submitted successfully!",
    successMsg: "Your application is under review. You will receive a confirmation email once your account has been approved by our team.",
    successSub: "Thank you for your trust. We typically process applications within 24 to 48 business hours.",
    backHome: "Back to home",
    pwdShort: "Password must be at least 8 characters.",
    pwdMismatch: "Passwords do not match.",
    phoneFormat: "Invalid phone number.",
    consentRequired: "You must accept the privacy policy.",
  },
  DE: {
    title: "Agenturregistrierung",
    subtitle: "Registrieren Sie Ihre Reiseagentur auf AirJustice.",
    required: "Mit * gekennzeichnete Felder sind Pflichtfelder.",
    step: "Schritt",
    companyInfo: "Unternehmensinformationen",
    agencyName: "Firmenname *",
    country: "Land der Registrierung *",
    addressLine1: "Adresszeile 1",
    addressLine2: "Adresszeile 2",
    streetName: "Straßenname *",
    houseNumber: "Hausnummer *",
    postalCode: "Postleitzahl *",
    city: "Stadt *",
    ownerRep: "Eigentümer / gesetzlicher Vertreter",
    contactName: "Vollständiger Name *",
    contactEmail: "E-Mail-Adresse *",
    contactPhone: "Telefonnummer *",
    legalData: "Rechtliche Unternehmensdaten",
    tradeRegister: "Handelsregisternummer *",
    taxId: "Steueridentifikationsnummer *",
    adminUser: "Admin-Benutzer",
    managerName: "Vollständiger Name *",
    email: "E-Mail-Adresse *",
    phone: "Telefonnummer *",
    password: "Passwort *",
    confirmPassword: "Passwort bestätigen *",
    documents: "Erforderliche Dokumente",
    docRne: "RNE (Tunesien)",
    docId: "Ausweis des Verantwortlichen",
    docLicense: "Reiseagenturlizenz",
    tipRne: "Nationales Unternehmensregister (Tunesien)",
    tipId: "Reisepass, Personalausweis oder Reisedokument der verantwortlichen Person",
    tipLicense: "Offizielle Reiseagenturlizenz der zuständigen Behörde",
    docHint: "Zulässige Formate: PDF, JPG, PNG — max. 10 MB pro Datei",
    dragHere: "Dateien hier ablegen",
    orBrowse: "oder klicken zum Durchsuchen",
    uploadedTable: "Hochgeladene Dokumente",
    colName: "Dateiname",
    colType: "Dokumenttyp",
    colSize: "Größe",
    colDate: "Datum",
    colAction: "Aktion",
    noFiles: "Keine Dateien hochgeladen.",
    docTypeRne: "RNE",
    docTypeId: "Ausweisdokument",
    docTypeLicense: "Agenturlizenz",
    docTypeOther: "Sonstige / Auswählen",
    privacy: "Ich habe die Datenschutzerklärung gelesen und akzeptiere sie",
    privacyNotice: "Wir verarbeiten Ihre Daten gemäß unserer Datenschutzrichtlinie. Ihre Dokumente werden sicher gespeichert und sind nur für autorisierte Prüfer zugänglich.",
    createBtn: "Registrierung absenden",
    successTitle: "Registrierung erfolgreich eingereicht!",
    successMsg: "Ihr Antrag wird geprüft. Sie erhalten eine Bestätigungs-E-Mail, sobald Ihr Konto von unserem Team genehmigt wurde.",
    successSub: "Vielen Dank für Ihr Vertrauen. Wir bearbeiten Anträge in der Regel innerhalb von 24 bis 48 Werktagen.",
    backHome: "Zurück zur Startseite",
    pwdShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    pwdMismatch: "Die Passwörter stimmen nicht überein.",
    phoneFormat: "Ungültige Telefonnummer.",
    consentRequired: "Sie müssen die Datenschutzerklärung akzeptieren.",
  },
  AR: {
    title: "تسجيل وكالة سفر",
    subtitle: "سجّل وكالة السفر الخاصة بك على AirJustice.",
    required: "الحقول المميزة بـ * مطلوبة.",
    step: "خطوة",
    companyInfo: "معلومات الشركة",
    agencyName: "اسم الشركة *",
    country: "بلد التسجيل *",
    addressLine1: "سطر العنوان 1",
    addressLine2: "سطر العنوان 2",
    streetName: "اسم الشارع *",
    houseNumber: "رقم المنزل *",
    postalCode: "الرمز البريدي *",
    city: "المدينة *",
    ownerRep: "المالك / الممثل القانوني",
    contactName: "الاسم الكامل *",
    contactEmail: "البريد الإلكتروني *",
    contactPhone: "رقم الهاتف *",
    legalData: "البيانات القانونية للشركة",
    tradeRegister: "رقم السجل التجاري *",
    taxId: "رقم التعريف الضريبي *",
    adminUser: "المستخدم المسؤول",
    managerName: "الاسم الكامل *",
    email: "البريد الإلكتروني *",
    phone: "رقم الهاتف *",
    password: "كلمة المرور *",
    confirmPassword: "تأكيد كلمة المرور *",
    documents: "المستندات المطلوبة",
    docRne: "RNE (تونس)",
    docId: "وثيقة هوية المسؤول",
    docLicense: "رخصة وكالة السفر",
    tipRne: "السجل الوطني للمؤسسات (تونس)",
    tipId: "جواز السفر أو بطاقة الهوية الوطنية للشخص المسؤول",
    tipLicense: "رخصة وكالة السفر الرسمية الصادرة عن الجهة المختصة",
    docHint: "الصيغ المقبولة: PDF، JPG، PNG — 10 ميغا بايت كحد أقصى لكل ملف",
    dragHere: "اسحب وأفلت ملفاتك هنا",
    orBrowse: "أو انقر للاستعراض",
    uploadedTable: "المستندات المرفوعة",
    colName: "اسم الملف",
    colType: "نوع المستند",
    colSize: "الحجم",
    colDate: "التاريخ",
    colAction: "إجراء",
    noFiles: "لم يتم رفع أي ملفات بعد.",
    docTypeRne: "RNE",
    docTypeId: "وثيقة هوية",
    docTypeLicense: "رخصة الوكالة",
    docTypeOther: "أخرى / اختر",
    privacy: "لقد قرأت وأوافق على سياسة الخصوصية",
    privacyNotice: "نعالج بياناتك وفقاً لسياسة الخصوصية الخاصة بنا. يتم تخزين مستنداتك بشكل آمن ولا يمكن الوصول إليها إلا من قبل المراجعين المعتمدين.",
    createBtn: "إرسال التسجيل",
    successTitle: "تم تقديم التسجيل بنجاح!",
    successMsg: "طلبك قيد المراجعة. ستتلقى بريداً إلكترونياً تأكيدياً بمجرد الموافقة على حسابك من قِبل فريقنا.",
    successSub: "شكراً لثقتك بنا. نعالج الطلبات عادةً في غضون 24 إلى 48 ساعة عمل.",
    backHome: "العودة إلى الصفحة الرئيسية",
    pwdShort: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    pwdMismatch: "كلمات المرور غير متطابقة.",
    phoneFormat: "رقم الهاتف غير صالح.",
    consentRequired: "يجب قبول سياسة الخصوصية.",
  },
};

/* ───────────────────────── Helpers ───────────────────────── */

function detectDocType(filename) {
  const n = filename.toLowerCase();
  if (n.includes("rne")) return "RNE";
  if (
    n.includes("cin") || n.includes("identity") || n.includes("identit") ||
    n.includes("passport") || n.includes("passeport") || /\bid\b/.test(n)
  ) return "IDENTITY_DOCUMENT";
  if (n.includes("licens") || n.includes("licenc") || n.includes("travel") || n.includes("agence"))
    return "TRAVEL_AGENCY_LICENSE";
  return "";
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ───────────────────────── Sub-components ───────────────────────── */

const inputCls =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
const labelCls = "text-sm font-medium text-slate-700";
const sectionTitleCls = "text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3";

function Field({ label, children }) {
  return (
    <div className="grid gap-1">
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}

function PhoneInput({ label, codeName, codeValue, numName, numValue, onChange }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <select
          name={codeName}
          value={codeValue}
          onChange={onChange}
          className="h-11 min-w-[96px] rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        >
          {PHONE_CODES.map((p) => (
            <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
          ))}
        </select>
        <input
          name={numName}
          value={numValue}
          onChange={onChange}
          placeholder="12345678"
          required
          className={inputCls + " flex-1"}
        />
      </div>
    </Field>
  );
}

function PasswordInput({ label, name, value, onChange, show, onToggle }) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          className={inputCls + " pr-10"}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-7s4.477-7 10-7a9.95 9.95 0 014.142.888M15 12a3 3 0 01-3 3m0 0a3 3 0 01-3-3m3 3v.01M3 3l18 18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </Field>
  );
}

function Tooltip({ tip, children }) {
  return (
    <span className="relative group inline-flex items-center">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {tip}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
      </span>
    </span>
  );
}

/* ───────────────────────── Main component ───────────────────────── */

export default function PartnerApply() {
  const nav = useNavigate();
  const { language } = useLanguage();
  const l = tr[language] || tr.FR;
  const isRTL = language === "AR";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    agencyName: "", country: "TN",
    streetName: "", houseNumber: "", postalCode: "", city: "",
    contactPersonName: "", contactEmail: "",
    contactPhoneCode: "+216", contactPhoneNumber: "",
    tradeRegisterNumber: "", taxIdentificationNumber: "",
    managerName: "", email: "",
    phoneCode: "+216", phoneNumber: "",
    password: "", confirmPassword: "",
    consent: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  /* ── File handling ── */
  const processFiles = (rawFiles) => {
    const valid = ["pdf", "jpg", "jpeg", "png"];
    const max = 10 * 1024 * 1024;
    const toAdd = [];
    for (const file of rawFiles) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!valid.includes(ext) || file.size > max) { setErr(l.docHint); continue; }
      toAdd.push({
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        docType: detectDocType(file.name),
        date: new Date().toLocaleDateString(),
      });
    }
    if (toAdd.length > 0) { setErr(""); setUploadedFiles((p) => [...p, ...toAdd]); }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); };
  const handleFileInput = (e) => processFiles(Array.from(e.target.files));
  const removeFile = (id) => setUploadedFiles((p) => p.filter((f) => f.id !== id));
  const updateDocType = (id, val) => setUploadedFiles((p) => p.map((f) => (f.id === id ? { ...f, docType: val } : f)));

  /* ── Validation ── */
  const validateStep1 = () => {
    if (!form.agencyName || !form.country) return false;
    if (!form.streetName || !form.houseNumber || !form.postalCode || !form.city) return false;
    if (!form.contactPersonName || !form.contactEmail || !form.contactPhoneNumber) return false;
    if (!form.tradeRegisterNumber || !form.taxIdentificationNumber) return false;
    if (!E164_REGEX.test(form.contactPhoneCode + form.contactPhoneNumber)) { setErr(l.phoneFormat); return false; }
    setErr(""); return true;
  };

  const validateStep2 = () => {
    if (!form.managerName || !form.email || !form.phoneNumber) return false;
    if (!E164_REGEX.test(form.phoneCode + form.phoneNumber)) { setErr(l.phoneFormat); return false; }
    if (form.password.length < 8) { setErr(l.pwdShort); return false; }
    if (form.password !== form.confirmPassword) { setErr(l.pwdMismatch); return false; }
    setErr(""); return true;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.consent) { setErr(l.consentRequired); return; }
    setLoading(true);
    try {
      const address = `${form.streetName} ${form.houseNumber}, ${form.postalCode} ${form.city}`;
      const res = await fetch(API + "/api/partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: form.agencyName, country: form.country, address,
          contactPersonName: form.contactPersonName, contactEmail: form.contactEmail,
          contactPhone: form.contactPhoneCode + form.contactPhoneNumber,
          managerName: form.managerName, email: form.email,
          phone: form.phoneCode + form.phoneNumber,
          tradeRegisterNumber: form.tradeRegisterNumber,
          taxIdentificationNumber: form.taxIdentificationNumber,
          password: form.password, consentAccepted: true,
          privacyPolicyVersion: PRIVACY_VERSION, city: form.city,
          language: language.toLowerCase(),
        }),
      });
      const data = await parseApiBody(res);
      if (!res.ok) throw new Error(extractApiErrorMessage(data, "Erreur lors de l'inscription"));

      if (uploadedFiles.length > 0) {
        const fd = new FormData();
        fd.append("email", form.email);
        uploadedFiles.forEach((f) => fd.append("files", f.file));
        fd.append("documentTypes", uploadedFiles.map((f) => f.docType || "RNE").join(","));
        const docRes = await fetch(API + "/api/partner/apply/documents", { method: "POST", body: fd });
        const docData = await parseApiBody(docRes);
        if (!docRes.ok) throw new Error(extractApiErrorMessage(docData, "Erreur lors du téléversement des documents"));
      }
      setSubmitted(true);
    } catch (error) {
      const msg = error.message || "";
      setErr(msg);
      // If the error concerns contactEmail, go back to step 1 so the user can fix it
      if (msg.toLowerCase().includes("contact")) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const docTypeLabel = (key) => {
    if (key === "RNE") return l.docTypeRne;
    if (key === "IDENTITY_DOCUMENT") return l.docTypeId;
    if (key === "TRAVEL_AGENCY_LICENSE") return l.docTypeLicense;
    return l.docTypeOther;
  };

  /* ───────────────────────── Render ───────────────────────── */

  /* ── Success screen ── */
  if (submitted) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
            {/* Animated check icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{l.successTitle}</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{l.successMsg}</p>
            <p className="mt-2 text-xs text-slate-400">{l.successSub}</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 w-full">
                <svg className="h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{form.email}</span>
              </div>
              <Link to="/" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">
                {l.backHome}
              </Link>
            </div>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 flex items-start justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{l.subtitle}</p>
          <p className="mt-1 text-xs text-slate-400">{l.required}</p>

          {/* Stepper */}
          <div className="mt-5 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (s < step) setStep(s); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition
                    ${step === s ? "bg-red-600 text-white shadow-md shadow-red-300" : step > s ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}
                >
                  {step > s ? "✓" : s}
                </button>
                {s < 3 && <div className={`h-0.5 w-10 rounded-full ${step > s ? "bg-emerald-400" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          {err && (
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 grid gap-6">

            {/* ════════════ STEP 1 ════════════ */}
            {step === 1 && (
              <>
                {/* Company Info */}
                <section className="grid gap-4">
                  <h4 className={sectionTitleCls}>{l.companyInfo}</h4>
                  <Field label={l.agencyName}>
                    <input name="agencyName" value={form.agencyName} onChange={set} required className={inputCls} />
                  </Field>
                  <Field label={l.country}>
                    <select name="country" value={form.country} onChange={set} required className={inputCls}>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </Field>

                  {/* Address Line 1 */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">{l.addressLine1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={l.streetName}>
                        <input name="streetName" value={form.streetName} onChange={set} required className={inputCls} />
                      </Field>
                      <Field label={l.houseNumber}>
                        <input name="houseNumber" value={form.houseNumber} onChange={set} required className={inputCls} />
                      </Field>
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">{l.addressLine2}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={l.postalCode}>
                        <input name="postalCode" value={form.postalCode} onChange={set} required className={inputCls} />
                      </Field>
                      <Field label={l.city}>
                        <input name="city" value={form.city} onChange={set} required className={inputCls} />
                      </Field>
                    </div>
                  </div>
                </section>

                {/* Owner / Legal Representative */}
                <section className="grid gap-4">
                  <h4 className={sectionTitleCls}>{l.ownerRep}</h4>
                  <Field label={l.contactName}>
                    <input name="contactPersonName" value={form.contactPersonName} onChange={set} required className={inputCls} />
                  </Field>
                  <Field label={l.contactEmail}>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={set} required className={inputCls} />
                  </Field>
                  <PhoneInput
                    label={l.contactPhone}
                    codeName="contactPhoneCode" codeValue={form.contactPhoneCode}
                    numName="contactPhoneNumber" numValue={form.contactPhoneNumber}
                    onChange={set}
                  />
                </section>

                {/* Legal Company Details */}
                <section className="grid gap-4">
                  <h4 className={sectionTitleCls}>{l.legalData}</h4>
                  <Field label={l.tradeRegister}>
                    <input name="tradeRegisterNumber" value={form.tradeRegisterNumber} onChange={set} required className={inputCls} />
                  </Field>
                  <Field label={l.taxId}>
                    <input name="taxIdentificationNumber" value={form.taxIdentificationNumber} onChange={set} required className={inputCls} />
                  </Field>
                </section>

                <Button type="button" onClick={() => { if (validateStep1()) setStep(2); }}>
                  {l.step} 2 →
                </Button>
              </>
            )}

            {/* ════════════ STEP 2 ════════════ */}
            {step === 2 && (
              <>
                <section className="grid gap-4">
                  <h4 className={sectionTitleCls}>{l.adminUser}</h4>
                  <Field label={l.managerName}>
                    <input name="managerName" value={form.managerName} onChange={set} required className={inputCls} />
                  </Field>
                  <Field label={l.email}>
                    <input type="email" name="email" value={form.email} onChange={set} required className={inputCls} />
                  </Field>
                  <PhoneInput
                    label={l.phone}
                    codeName="phoneCode" codeValue={form.phoneCode}
                    numName="phoneNumber" numValue={form.phoneNumber}
                    onChange={set}
                  />
                  <PasswordInput
                    label={l.password} name="password" value={form.password}
                    onChange={set} show={showPwd} onToggle={() => setShowPwd((v) => !v)}
                  />
                  <PasswordInput
                    label={l.confirmPassword} name="confirmPassword" value={form.confirmPassword}
                    onChange={set} show={showPwdConfirm} onToggle={() => setShowPwdConfirm((v) => !v)}
                  />
                </section>

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>← {l.step} 1</Button>
                  <Button type="button" onClick={() => { if (validateStep2()) setStep(3); }}>{l.step} 3 →</Button>
                </div>
              </>
            )}

            {/* ════════════ STEP 3 ════════════ */}
            {step === 3 && (
              <>
                {/* Required documents list */}
                <section>
                  <h4 className={sectionTitleCls}>{l.documents}</h4>
                  <ul className="mb-4 grid gap-2">
                    {[
                      { label: l.docRne, tip: l.tipRne },
                      { label: l.docId, tip: l.tipId },
                      { label: l.docLicense, tip: l.tipLicense },
                    ].map(({ label, tip }) => (
                      <li key={label} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">•</span>
                        {label}
                        <Tooltip tip={tip}>
                          <span className="ml-1 inline-flex h-4 w-4 cursor-help select-none items-center justify-center rounded-full border border-slate-300 text-[10px] text-slate-400">i</span>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>

                  <p className="mb-3 text-xs text-slate-400">{l.docHint}</p>

                  {/* Drag & Drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 transition
                      ${isDragging ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-red-400 hover:bg-red-50/40"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">{l.dragHere}</p>
                    <p className="text-xs text-slate-400">{l.orBrowse}</p>
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} className="hidden" />
                  </div>
                </section>

                {/* Uploaded documents table */}
                <section>
                  <h4 className={sectionTitleCls}>{l.uploadedTable}</h4>
                  {uploadedFiles.length === 0 ? (
                    <p className="text-sm italic text-slate-400">{l.noFiles}</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 text-left">{l.colName}</th>
                            <th className="px-4 py-3 text-left">{l.colType}</th>
                            <th className="px-4 py-3 text-left">{l.colSize}</th>
                            <th className="px-4 py-3 text-left">{l.colDate}</th>
                            <th className="px-4 py-3 text-center">{l.colAction}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {uploadedFiles.map((f) => (
                            <tr key={f.id} className="transition hover:bg-slate-50/60">
                              {/* File name */}
                              <td className="max-w-[180px] px-4 py-3">
                                <div className="flex items-center gap-2 truncate">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="truncate text-slate-700">{f.name}</span>
                                </div>
                              </td>
                              {/* Doc type */}
                              <td className="px-4 py-3">
                                <select
                                  value={f.docType}
                                  onChange={(e) => updateDocType(f.id, e.target.value)}
                                  className={`rounded-lg border px-2 py-1 text-xs outline-none focus:border-red-500 transition
                                    ${f.docType
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
                                      : "border-slate-300 bg-white text-slate-700"}`}
                                >
                                  <option value="">{l.docTypeOther}</option>
                                  {DOC_TYPE_KEYS.map((k) => (
                                    <option key={k} value={k}>{docTypeLabel(k)}</option>
                                  ))}
                                </select>
                              </td>
                              {/* Size */}
                              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtSize(f.size)}</td>
                              {/* Date */}
                              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{f.date}</td>
                              {/* Delete */}
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeFile(f.id)}
                                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Privacy */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">{l.privacyNotice}</div>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                  <input type="checkbox" name="consent" checked={form.consent} onChange={set}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-red-500 focus:ring-red-400/30" />
                  {l.privacy}
                </label>

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>← {l.step} 2</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        ...
                      </span>
                    ) : l.createBtn}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </main>
    </PageLayout>
  );
}
