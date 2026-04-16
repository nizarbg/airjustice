import { createContext, useContext, useState } from "react";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("aj_lang") || "FR");

  const changeLang = (lang) => {
    setLanguage(lang);
    localStorage.setItem("aj_lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}
