import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useNavigate } from "react-router-dom";

export default function Track() {
  const nav = useNavigate();
  const [code, setCode] = useState("");

  return (
    <div className="page">
      <main className="container">
        <div className="card">
          <h2>Suivre mon dossier</h2>
          <Input label="Code de suivi" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="AJ-XXXXXX" />
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => nav(`/case/${code.trim().toUpperCase()}`)}>Voir</Button>
          </div>
        </div>
      </main>
    </div>
  );
}