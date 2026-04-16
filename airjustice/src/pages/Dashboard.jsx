import { useAuth } from "../auth/AuthContext";
import Button from "../ui/Button";
import { useLanguage } from "../context/LanguageContext";
import PageLayout from "../components/PageLayout";

const t = {
  DE: { title: "Dashboard", subtitle: "Nächste Schritte: \"Meine Flüge\" anzeigen, Flug hinzufügen, Kaufstatus, Benachrichtigungen.", logout: "Abmelden" },
  EN: { title: "Dashboard", subtitle: "Next: list \"My flights\", add flight, purchase status, notifications.", logout: "Logout" },
  FR: { title: "Dashboard", subtitle: "Next: list \"Mes vols\", add flight, purchase status, notifications.", logout: "Déconnexion" },
  AR: { title: "لوحة التحكم", subtitle: "التالي: عرض \"رحلاتي\"، إضافة رحلة، حالة الشراء، الإشعارات.", logout: "تسجيل الخروج" },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const l = t[language] || t.FR;

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10" dir={language === "AR" ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-slate-500">{user?.email}</span>
          <Button variant="ghost" onClick={logout}>{l.logout}</Button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{l.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{l.subtitle}</p>
        </div>
      </main>
    </PageLayout>
  );
}
