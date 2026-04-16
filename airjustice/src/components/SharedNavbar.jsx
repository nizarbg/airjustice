import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const navLabels = {
  DE: { passenger: "Passagier", track: "Fall verfolgen", partnerLogin: "Partner Login", becomePartner: "Partner werden", admin: "Admin Projekt", checkFlight: "Flug überprüfen" },
  EN: { passenger: "Passenger", track: "Track case", partnerLogin: "Partner Login", becomePartner: "Become Partner", admin: "Admin Project", checkFlight: "Check flight" },
  FR: { passenger: "Passager", track: "Suivre un dossier", partnerLogin: "Se connecter", becomePartner: "Devenir partenaire", admin: "Admin projet", checkFlight: "Vérifier mon vol" },
  AR: { passenger: "الراكب", track: "تتبع الحالة", partnerLogin: "تسجيل الدخول للشريك", becomePartner: "أصبح شريكًا", admin: "مشروع إدارة", checkFlight: "تحقق من الرحلة" },
};

export default function SharedNavbar() {
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const labels = navLabels[language] || navLabels.FR;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="AirJustice" className="h-12 w-auto object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <Link to="/check" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">{labels.passenger}</Link>
            <Link to="/track" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">{labels.track}</Link>
            <Link to="/partner/login" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">{labels.partnerLogin}</Link>
            <Link to="/partner/apply" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">{labels.becomePartner}</Link>
            <Link to="/admin/login" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">{labels.admin}</Link>
            <Link to="/check" className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">{labels.checkFlight}</Link>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="hidden md:block px-3 py-1 rounded-lg bg-white text-slate-700 text-sm border border-slate-300 hover:border-slate-400 transition cursor-pointer font-semibold"
            >
              <option value="DE">DE</option>
              <option value="EN">EN</option>
              <option value="FR">FR</option>
              <option value="AR">AR</option>
            </select>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition">
              {mobileMenuOpen ? <X size={24} className="text-slate-700" /> : <Menu size={24} className="text-slate-700" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-slate-200">
            <div className="flex flex-col gap-3 pt-4">
              <Link to="/check" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>{labels.passenger}</Link>
              <Link to="/track" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>{labels.track}</Link>
              <Link to="/partner/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>{labels.partnerLogin}</Link>
              <Link to="/partner/apply" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>{labels.becomePartner}</Link>
              <Link to="/admin/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>{labels.admin}</Link>
              <Link to="/check" className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition" onClick={() => setMobileMenuOpen(false)}>{labels.checkFlight}</Link>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mx-4 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm border border-slate-300 font-semibold"
              >
                <option value="DE">Deutsch</option>
                <option value="EN">English</option>
                <option value="FR">Français</option>
                <option value="AR">العربية</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
