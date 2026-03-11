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
        <div className="card max-w-2xl">
          <h2>Suivre mon dossier</h2>
          <p className="muted mt-2 text-sm">Entrez le code reçu après paiement pour consulter le statut.</p>
          <Input label="Code de suivi" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="AJ-XXXXXX" />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => nav(`/case/${code.trim().toUpperCase()}`)}>Voir</Button>
          </div>
        </div>
      </main>
    </div>
  );
}