import SharedNavbar from "./SharedNavbar";

export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <SharedNavbar />
      {children}
    </div>
  );
}
