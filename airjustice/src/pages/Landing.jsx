import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, CheckCircle2, X as XIcon, Zap } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import SharedNavbar from "../components/SharedNavbar";


// Navbar Component
function Navbar({ language, setLanguage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLabels = {
    DE: { passenger: "Passagier", track: "Fall verfolgen", partnerLogin: "Partner Login", becomePartner: "Partner werden", admin: "Admin Projekt", checkFlight: "Flug überprüfen" },
    EN: { passenger: "Passenger", track: "Track case", partnerLogin: "Partner Login", becomePartner: "Become Partner", admin: "Admin Project", checkFlight: "Check flight" },
    FR: { passenger: "Passager", track: "Suivre un dossier", partnerLogin: "Se connecter", becomePartner: "Devenir partenaire", admin: "Admin projet", checkFlight: "Vérifier mon vol" },
    AR: { passenger: "الراكب", track: "تتبع الحالة", partnerLogin: "تسجيل الدخول للشريك", becomePartner: "أصبح شريكًا", admin: "مشروع إدارة", checkFlight: "تحقق من الرحلة" },
  };

  const labels = navLabels[language];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="AirJustice" className="h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/check" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">
              {labels.passenger}
            </Link>
            <Link to="/track" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">
              {labels.track}
            </Link>
            <Link to="/partner/login" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">
              {labels.partnerLogin}
            </Link>
            <Link to="/partner/apply" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">
              {labels.becomePartner}
            </Link>
            <Link to="/admin/login" className="text-sm font-semibold text-slate-700 hover:text-red-600 transition">
              {labels.admin}
            </Link>
            <Link
              to="/check"
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
            >
              {labels.checkFlight}
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={24} className="text-slate-700" /> : <Menu size={24} className="text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-slate-200">
            <div className="flex flex-col gap-3 pt-4">
              <Link to="/check" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>
                {labels.passenger}
              </Link>
              <Link to="/track" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>
                {labels.track}
              </Link>
              <Link to="/partner/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>
                {labels.partnerLogin}
              </Link>
              <Link to="/partner/apply" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>
                {labels.becomePartner}
              </Link>
              <Link to="/admin/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded transition" onClick={() => setMobileMenuOpen(false)}>
                {labels.admin}
              </Link>
              <Link
                to="/check"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {labels.checkFlight}
              </Link>
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

// Animated Counter Component
function AnimatedCounter({ end, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasStarted.current) {
        hasStarted.current = true;
        let start = 0;
        const increment = end / (duration * 60);
        
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 1000 / 60);
      }
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [end, duration]);

  return <span ref={ref}>{count}</span>;
}

// Translations
const translations = {
  DE: {
    heroTitle: "Verpasse nie wieder eine Flugentschädigung",
    heroText: "AirJustice überwacht deine Flüge automatisch und informiert dich, wenn du Anspruch hast.",
    heroBenefit1: "Automatische Flugüberwachung",
    heroBenefit2: "Sofortige Benachrichtigung bei Anspruch",
    heroBenefit3: "Direkte Weiterleitung zur Auszahlung",
    checkFlightBtn: "Flug kostenlos überprüfen",
    noCard: "Keine Kreditkarte",
    noObligation: "100% Kostenlos",
    
    howTitle: "So funktioniert AirJustice",
    howStep1Title: "Flug registrieren",
    howStep1Desc: "Gib deine Flugdaten einfach in unter 2 Minuten ein.",
    howStep2Title: "Wir überwachen",
    howStep2Desc: "AirJustice trackt deinen Flug automatisch 24/7.",
    howStep3Title: "Du wirst informiert",
    howStep3Desc: "Bei Verspätung, Annullierung oder Problem erhältst du sofort eine Benachrichtigung.",
    howStep4Title: "Geld erhalten",
    howStep4Desc: "Wir leiten dich direkt zu AirHelp zur Auszahlung weiter.",
    
    whyTitle: "Warum AirJustice besser ist",
    whyAJ: "AirJustice",
    whyTraditional: "Klassische Anbieter",
    whyAirhelp: "AirHelp direkt",
    whyFeatureProactive: "Proaktive Überwachung",
    whyFeatureAlerts: "Automatische Alerts",
    whyFeatureReward: "Null Aufwand für dich",
    whyFeatureFull: "100% Automatisiert",
    whyTraditionalFeature1: "Manuelle Prüfung",
    whyTraditionalFeature2: "Selbst recherchieren",
    whyTraditionalFeature3: "Komplizierter Prozess",
    whyTraditionalFeature4: "Zeitaufwendig",
    whyAirhelpFeature1: "Nur Claim möglich",
    whyAirhelpFeature2: "Keine Überwachung",
    whyAirhelpFeature3: "Nur reaktiv",
    whyAirhelpFeature4: "Teuer (30% Provision)",
    
    whoTitle: "Für wen ist AirJustice?",
    whoTraveler: "Vielreisende",
    whoTravelerDesc: "Behalte alle deine Flüge im Blick — automatisch.",
    whoAgency: "Geschätsreisende",
    whoAgencyDesc: "Dein winde entschädigungsberechtigte Verspätungen.",
    whoFamily: "Familien",
    whoFamilyDesc: "Wir überwachen auch die Flüge deiner Liebsten.",
    whoGlobal: "Alle Flugpassagiere",
    whoGlobalDesc: "Egal ob Privat- oder Business — wir helfen dir deinem Recht.",
    
    ctaTitle: "Wir sagen dir automatisch, wenn der Geld zusteht.",
    ctaBtn: "Jetzt Flug überprüfen",
    
    footerText: "AirJustice ist ein unabhängiger Service • Powered by AirHelp Partnership",
  },
  
  EN: {
    heroTitle: "Never miss a flight compensation again",
    heroText: "AirJustice monitors your flights automatically and tells you when you have a claim.",
    heroBenefit1: "Automatic flight monitoring",
    heroBenefit2: "Instant notification if eligible",
    heroBenefit3: "Direct forwarding to payout",
    checkFlightBtn: "Check flight for free",
    noCard: "No credit card",
    noObligation: "100% Free",
    
    howTitle: "How AirJustice Works",
    howStep1Title: "Register flight",
    howStep1Desc: "Enter your flight details in under 2 minutes.",
    howStep2Title: "We monitor",
    howStep2Desc: "AirJustice tracks your flight automatically 24/7.",
    howStep3Title: "You get notified",
    howStep3Desc: "If delayed, cancelled or problem occurs, you get instant notification.",
    howStep4Title: "Get compensated",
    howStep4Desc: "We forward you directly to AirHelp for payment.",
    
    whyTitle: "Why AirJustice is Better",
    whyAJ: "AirJustice",
    whyTraditional: "Traditional Providers",
    whyAirhelp: "AirHelp Direct",
    whyFeatureProactive: "Proactive monitoring",
    whyFeatureAlerts: "Automatic alerts",
    whyFeatureReward: "Zero effort for you",
    whyFeatureFull: "100% automated",
    whyTraditionalFeature1: "Manual review",
    whyTraditionalFeature2: "Self-research required",
    whyTraditionalFeature3: "Complicated process",
    whyTraditionalFeature4: "Time-consuming",
    whyAirhelpFeature1: "Claim only",
    whyAirhelpFeature2: "No monitoring",
    whyAirhelpFeature3: "Reactive only",
    whyAirhelpFeature4: "Expensive (30% fee)",
    
    whoTitle: "Who is AirJustice for?",
    whoTraveler: "Frequent Travelers",
    whoTravelerDesc: "Keep all your flights in check — automatically.",
    whoAgency: "Business Travelers",
    whoAgencyDesc: "Never miss entitled compensation.",
    whoFamily: "Families",
    whoFamilyDesc: "We monitor your loved ones' flights too.",
    whoGlobal: "All Air Passengers",
    whoGlobalDesc: "Private or business — we help you claim your right.",
    
    ctaTitle: "We'll tell you automatically when money is due.",
    ctaBtn: "Check flight now",
    
    footerText: "AirJustice is an independent service • Powered by AirHelp Partnership",
  },
  
  FR: {
    heroTitle: "Ne manquez jamais une indemnité de vol",
    heroText: "AirJustice surveille vos vols automatiquement et vous dit quand vous avez droit à une indemnité.",
    heroBenefit1: "Surveillance automatique des vols",
    heroBenefit2: "Notification instantanée si éligible",
    heroBenefit3: "Transfert direct au paiement",
    checkFlightBtn: "Vérifier mon vol gratuitement",
    noCard: "Pas de carte de crédit",
    noObligation: "100% Gratuit",
    
    howTitle: "Comment fonctionne AirJustice",
    howStep1Title: "Enregistrer un vol",
    howStep1Desc: "Entrez les détails de votre vol en moins de 2 minutes.",
    howStep2Title: "Nous surveillons",
    howStep2Desc: "AirJustice suit automatiquement votre vol 24/7.",
    howStep3Title: "Vous êtes informé",
    howStep3Desc: "En cas de retard, d'annulation ou de problème, vous recevez une notification instantanée.",
    howStep4Title: "Être indemnisé",
    howStep4Desc: "Nous vous redirection directement vers AirHelp pour le paiement.",
    
    whyTitle: "Pourquoi AirJustice est mieux",
    whyAJ: "AirJustice",
    whyTraditional: "Prestataires traditionnels",
    whyAirhelp: "AirHelp direct",
    whyFeatureProactive: "Surveillance proactive",
    whyFeatureAlerts: "Alertes automatiques",
    whyFeatureReward: "Zéro effort pour vous",
    whyFeatureFull: "100% automatisé",
    whyTraditionalFeature1: "Examen manuel",
    whyTraditionalFeature2: "Recherche personnelle requise",
    whyTraditionalFeature3: "Processus compliqué",
    whyTraditionalFeature4: "Chronophage",
    whyAirhelpFeature1: "Réclamation uniquement",
    whyAirhelpFeature2: "Pas de surveillance",
    whyAirhelpFeature3: "Réactif uniquement",
    whyAirhelpFeature4: "Cher (30% de frais)",
    
    whoTitle: "Pour qui est AirJustice?",
    whoTraveler: "Voyageurs fréquents",
    whoTravelerDesc: "Gardez tous vos vols à l'œil — automatiquement.",
    whoAgency: "Voyageurs d'affaires",
    whoAgencyDesc: "Ne manquez jamais une indemnité.",
    whoFamily: "Familles",
    whoFamilyDesc: "Nous monitrons aussi les vols de vos proches.",
    whoGlobal: "Tous les passagers aériens",
    whoGlobalDesc: "Privé ou professionnel — nous vous aidons à réclamer votre droit.",
    
    ctaTitle: "Nous vous dirons automatiquement quand l'argent est dû.",
    ctaBtn: "Vérifier le vol maintenant",
    
    footerText: "AirJustice est un service indépendant • Propulsé par le partenariat AirHelp",
  },
  
  AR: {
    heroTitle: "لا تفوت أبدًا تعويض الرحلة الجوية",
    heroText: "تراقب AirJustice رحلاتك تلقائيًا وتخبرك عندما يكون لديك مطالبة.",
    heroBenefit1: "مراقبة فلايت تلقائية",
    heroBenefit2: "إخطار فوري إذا كنت مؤهلاً",
    heroBenefit3: "تحويل مباشر إلى الدفع",
    checkFlightBtn: "تحقق من الرحلة مجانًا",
    noCard: "لا توجد بطاقة ائتمان",
    noObligation: "مجاني 100٪",
    
    howTitle: "كيف تعمل AirJustice",
    howStep1Title: "تسجيل الرحلة",
    howStep1Desc: "أدخل تفاصيل رحلتك في دقيقتين.",
    howStep2Title: "نحن نراقب",
    howStep2Desc: "تراقب AirJustice رحلتك تلقائيًا على مدار الساعة.",
    howStep3Title: "سيتم إخطارك",
    howStep3Desc: "في حالة التأخير أو الإلغاء أو المشكلة، ستتلقى إخطارًا فوريًا.",
    howStep4Title: "احصل على تعويض",
    howStep4Desc: "نحن نحيلك مباشرة إلى AirHelp للدفع.",
    
    whyTitle: "لماذا AirJustice أفضل",
    whyAJ: "AirJustice",
    whyTraditional: "مقدمو الخدمات التقليديون",
    whyAirhelp: "AirHelp المباشر",
    whyFeatureProactive: "المراقبة الاستباقية",
    whyFeatureAlerts: "التنبيهات التلقائية",
    whyFeatureReward: "بدون جهد منك",
    whyFeatureFull: "مؤتمت 100٪",
    whyTraditionalFeature1: "المراجعة اليدوية",
    whyTraditionalFeature2: "البحث الذاتي مطلوب",
    whyTraditionalFeature3: "عملية معقدة",
    whyTraditionalFeature4: "يستغرق وقتًا طويلاً",
    whyAirhelpFeature1: "المطالبة فقط",
    whyAirhelpFeature2: "لا توجد مراقبة",
    whyAirhelpFeature3: "تفاعلي فقط",
    whyAirhelpFeature4: "مكلف (رسم 30٪)",
    
    whoTitle: "من أجل من AirJustice؟",
    whoTraveler: "المسافرون المتكررون",
    whoTravelerDesc: "حافظ على جميع رحلاتك تحت السيطرة — تلقائيًا.",
    whoAgency: "مسافري الأعمال",
    whoAgencyDesc: "لا تفوت أبداً تعويض مستحق.",
    whoFamily: "العائلات",
    whoFamilyDesc: "نحن نراقب رحلات أحبائك أيضًا.",
    whoGlobal: "جميع الركاب الجويين",
    whoGlobalDesc: "خاص أو تجاري — نساعدك على المطالبة بحقك.",
    
    ctaTitle: "سنخبرك تلقائيًا عندما يكون المال مستحقًا.",
    ctaBtn: "تحقق من الرحلة الآن",
    
    footerText: "AirJustice هي خدمة مستقلة • مدعومة من شراكة AirHelp",
  },
};

export default function Landing() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-white text-slate-900" dir={language === "AR" ? "rtl" : "ltr"}>
      <SharedNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-16 lg:py-20 border-b border-slate-200">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-200 bg-red-50 w-fit">
                <span className="text-xs font-bold text-red-600">✈️ Swiss-Based • Kostenlos • Keine Verpflichtung</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
                {t.heroTitle}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                {t.heroText}
              </p>

              <ul className="space-y-3 text-sm font-semibold text-slate-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.heroBenefit1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.heroBenefit2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.heroBenefit3}</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/check"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/30"
                >
                  {t.checkFlightBtn}
                </Link>
              </div>

              <div className="flex gap-8 text-sm font-semibold text-slate-600 pt-4">
                <div className="flex items-center gap-2">
                  <XIcon size={20} className="text-red-600" />
                  {t.noCard}
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-red-600" />
                  {t.noObligation}
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-red-50 p-8 shadow-xl">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-red-400 rounded-full blur-3xl opacity-20" />
                <div className="relative space-y-4">
                  <div className="text-center space-y-2">
                    <div className="text-6xl">✈️</div>
                    <div className="text-lg font-bold text-slate-900">LX1952</div>
                    <div className="text-sm text-slate-600">Zurich → Madrid</div>
                  </div>
                  <div className="border-t border-slate-200 pt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-red-600 text-white font-bold text-sm">
                      ✓ Anspruch gefunden! 600€
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-16 lg:py-20 border-b border-slate-200">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-4 text-slate-900">
            {t.howTitle}
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            {[
              { num: "1", title: t.howStep1Title, desc: t.howStep1Desc },
              { num: "2", title: t.howStep2Title, desc: t.howStep2Desc },
              { num: "3", title: t.howStep3Title, desc: t.howStep3Desc },
              { num: "4", title: t.howStep4Title, desc: t.howStep4Desc },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full hover:border-red-300 hover:shadow-lg transition">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400">
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Why AirJustice */}
        <section className="py-16 lg:py-20 border-b border-slate-200">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-slate-900">
            {t.whyTitle}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* AirJustice */}
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 relative">
              <div className="inline-block px-3 py-1 rounded-full bg-red-600 text-white font-bold text-sm mb-4">
                <span className="text-lg">✈️</span> {t.whyAJ}
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircle2 size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.whyFeatureProactive}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircle2 size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.whyFeatureAlerts}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircle2 size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.whyFeatureReward}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircle2 size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{t.whyFeatureFull}</span>
                </li>
              </ul>
            </div>

            {/* Traditional */}
            <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-6">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-700 text-white font-bold text-sm mb-4">
                {t.whyTraditional}
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyTraditionalFeature1}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyTraditionalFeature2}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyTraditionalFeature3}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyTraditionalFeature4}</span>
                </li>
              </ul>
            </div>

            {/* AirHelp Direct */}
            <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-6">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-700 text-white font-bold text-sm mb-4">
                {t.whyAirhelp}
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyAirhelpFeature1}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyAirhelpFeature2}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyAirhelpFeature3}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                  <XIcon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{t.whyAirhelpFeature4}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Who */}
        <section id="who" className="py-16 lg:py-20 border-b border-slate-200">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-slate-900">
            {t.whoTitle}
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: t.whoTraveler, desc: t.whoTravelerDesc, icon: "🧳" },
              { title: t.whoAgency, desc: t.whoAgencyDesc, icon: "💼" },
              { title: t.whoFamily, desc: t.whoFamilyDesc, icon: "👨‍👩‍👧‍👦" },
              { title: t.whoGlobal, desc: t.whoGlobalDesc, icon: "🌍" },
            ].map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 text-center hover:border-red-300 hover:shadow-lg transition">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Band */}
        <section className="py-8 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-bold text-slate-700">
            <div className="flex items-center gap-2">🛡️ Datenschutz garantiert</div>
            <div className="flex items-center gap-2">🇨🇭 Schweizer Unternehmen</div>
            <div className="flex items-center gap-2">✓ Kostenlos & unverbindlich</div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-20">
          <div className="rounded-3xl bg-gradient-to-r from-red-600 to-red-700 p-12 text-center text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-red-100 mb-8 max-w-2xl mx-auto">
              Starte jetzt deine kostenlose Flugüberwachung
            </p>
            <Link
              to="/check"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-red-600 font-bold hover:bg-red-50 transition shadow-lg"
            >
              {t.ctaBtn} →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-slate-200 text-center text-sm text-slate-600">
          <p>{t.footerText}</p>
        </footer>
      </main>
    </div>
  );
}
