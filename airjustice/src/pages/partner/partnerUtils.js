import { useState } from "react";

// ── i18n ──────────────────────────────────────────────────────────────────────
export const LABELS = {
  fr: {
    dashboard: "Dashboard",
    createPolicy: "➕ Créer une police",
    policies: "📄 Polices",
    myPolicies: "📄 Mes polices",
    balance: "Solde",
    agents: "Agents",
    settings: "⚙️ Paramètres",
    account: "Compte",
    logout: "Déconnexion",
    lang: "fr",
    notifications: "Notifications",
  },
  ar: {
    dashboard: "لوحة القيادة",
    createPolicy: "➕ إنشاء وثيقة",
    policies: "📄 الوثائق",
    myPolicies: "📄 وثائقي",
    balance: "الرصيد",
    agents: "الوكلاء",
    settings: "⚙️ الإعدادات",
    account: "الحساب",
    logout: "تسجيل الخروج",
    lang: "ar",
    notifications: "الإشعارات",
  },
};

export function useLang() {
  const [lang, setLangState] = useState(
    () => localStorage.getItem("pref_lang") || "fr"
  );

  const setLang = (l) => {
    localStorage.setItem("pref_lang", l);
    setLangState(l);
  };

  return [lang, setLang];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function isAcceptedFile(file) {
  const okTypes = ["application/pdf", "image/jpeg", "image/png"];
  const name = (file?.name || "").toLowerCase();
  const extOk =
    name.endsWith(".pdf") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png");
  return okTypes.includes(file.type) || extOk;
}

export function validateFlightNumber(value) {
  const v = (value || "").trim().toUpperCase();
  if (!v) return { ok: false, msg: "Numéro de vol requis." };
  if (!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(v)) {
    return {
      ok: false,
      msg: "Format invalide (ex: TU123, AF111, BA12).",
    };
  }
  return { ok: true, msg: "" };
}

export function normalizeIata(v) {
  return (v || "").trim().toUpperCase();
}

export function nowIso() {
  return new Date().toISOString();
}

/** Prénom + initiale Nom  →  "Amine C." */
export function shortName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  return `${first} ${rest[rest.length - 1][0].toUpperCase()}.`;
}

export function mapCollaboratorStatus(c) {
  const active =
    c?.hasLoggedIn === true ||
    c?.isActive === true ||
    c?.loggedInAt != null ||
    c?.lastLoginAt != null ||
    c?.lastLogin != null;

  return active ? "Actif" : "Inactif";
}

export function policyStatusLabel(status) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "EXPIRED":
      return "Expirée";
    case "DISABLED":
      return "Désactivée";
    case "PENDING":
      return "En attente";
    default:
      return status || "-";
  }
}

export function policyStatusColor(status) {
  switch (status) {
    case "ACTIVE":
      return "#34d399";
    case "EXPIRED":
      return "#94a3b8";
    case "DISABLED":
      return "#f87171";
    case "PENDING":
      return "#f59e0b";
    default:
      return "#cbd5e1";
  }
}
