import { useAuth } from "../auth/AuthContext";
import Button from "../ui/Button";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <header className="nav">
        <div className="brand">AirJustice</div>
        <div className="nav-actions">
          <span className="muted">{user?.email}</span>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </header>

      <main className="container">
        <div className="card">
          <h2>Dashboard</h2>
          <p className="muted">Next: list “Mes vols”, add flight, purchase status, notifications.</p>
        </div>
      </main>
    </div>
  );
}
