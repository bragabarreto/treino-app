import { useState, useRef } from "react";
import EditPersonalWorkoutModal from "./EditPersonalWorkoutModal";

const P_COLORS = { PA:"#a855f7", PB:"#ec4899", PC:"#06b6d4", PD:"#f59e0b", PE:"#10b981", PF:"#f97316" };
const getPColor = (k) => P_COLORS[k] || "#a855f7";

const getNextKey = (existingKeys) => {
  for (const l of ["A","B","C","D","E","F"]) {
    if (!existingKeys.includes("P" + l)) return "P" + l;
  }
  return "P" + Date.now();
};

const EMPTY_TREINO = (key) => ({
  label: `Personal — Treino ${key.slice(1)}`,
  color: getPColor(key),
  dia: "",
  blocos: [{ nome: "Bloco I", exercises: [] }],
});

export default function ManagePersonalModal({ allTreinos, exDb, onSave, onClose }) {
  const [workouts, setWorkouts] = useState(() =>
    Object.entries(allTreinos)
      .filter(([k]) => k.startsWith("P"))
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((obj, [k, t]) => { obj[k] = JSON.parse(JSON.stringify(t)); return obj; }, {})
  );
  const [view, setView] = useState("list"); // "list" | "edit" | "import"
  const [editingKey, setEditingKey] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [importMode, setImportMode] = useState("text"); // "text" | "photo"
  const [importText, setImportText] = useState("");
  const [importImage, setImportImage] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [changed, setChanged] = useState(false);
  const importFileRef = useRef();

  const personalKeys = Object.keys(workouts).sort();

  function updateWorkout(key, data) {
    setWorkouts(p => ({ ...p, [key]: { ...data, _edited: true } }));
    setChanged(true);
  }

  function deleteWorkout(key) {
    if (!window.confirm(`Remover treino ${key}? Esta ação não pode ser desfeita.`)) return;
    setWorkouts(p => { const n = { ...p }; delete n[key]; return n; });
    setChanged(true);
  }

  function startAdd() {
    const key = getNextKey(personalKeys);
    setNewKey(key);
    setImportPreview(null);
    setImportText("");
    setImportImage(null);
    setImportError("");
    setView("import");
  }

  function startReplace(key) {
    setNewKey(key);
    setImportPreview(null);
    setImportText("");
    setImportImage(null);
    setImportError("");
    setView("import");
  }

  async function parseFromMedia() {
    if (!importText.trim() && !importImage) {
      setImportError("Adicione foto ou texto do treino.");
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/treinos/parse-personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: importImage || null, text: importText.trim() || null, exerciseDb: exDb }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.parsed) throw new Error("Não consegui extrair o treino. Tente adicionar mais detalhes.");
      setImportPreview(data.parsed);
    } catch (e) {
      setImportError(e.message);
    }
    setImporting(false);
  }

  function confirmImport() {
    if (!importPreview || !newKey) return;
    updateWorkout(newKey, { ...importPreview, color: getPColor(newKey) });
    setView("list");
    setImportPreview(null);
    setNewKey(null);
  }

  function editImport() {
    if (!importPreview || !newKey) return;
    setWorkouts(p => ({ ...p, [newKey]: { ...importPreview, color: getPColor(newKey), _edited: true } }));
    setEditingKey(newKey);
    setView("edit");
    setImportPreview(null);
  }

  function addBlank() {
    const key = getNextKey(personalKeys);
    setWorkouts(p => ({ ...p, [key]: EMPTY_TREINO(key) }));
    setEditingKey(key);
    setView("edit");
  }

  function handleSave() {
    onSave(workouts, changed);
  }

  // ── Edit view ─────────────────────────────────────────────────────────────
  if (view === "edit" && editingKey) {
    return (
      <EditPersonalWorkoutModal
        tk={editingKey}
        treino={workouts[editingKey] || EMPTY_TREINO(editingKey)}
        exDb={exDb}
        onSave={(tk, data) => {
          updateWorkout(tk, data);
          setView("list");
          setEditingKey(null);
        }}
        onClose={() => { setView("list"); setEditingKey(null); }}
      />
    );
  }

  // ── Main overlay ──────────────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:16 }}
      onClick={view === "list" ? onClose : undefined}>
      <div style={{ background:"#13131a",border:"1px solid #2a2a3a",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",padding:22 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",letterSpacing:3,color:"#f0f0f8" }}>
            {view === "import"
              ? (personalKeys.includes(newKey) ? `Substituir ${newKey}` : "Adicionar Treino")
              : "Gerenciar Treinos do Personal"}
          </h2>
          <button onClick={onClose} style={{ background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"4px 10px",cursor:"pointer",fontSize:".8rem" }}>✕</button>
        </div>

        {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
        {view === "list" && (
          <>
            {personalKeys.map(k => {
              const t = workouts[k];
              const color = getPColor(k);
              const isDefault = k === "PA" || k === "PB";
              return (
                <div key={k} style={{ background:"#111118",border:`1px solid ${color}22`,borderRadius:14,padding:12,marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                      <span style={{ background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:20,padding:"3px 11px",fontSize:".62rem",fontWeight:900 }}>
                        {k}
                      </span>
                      <span style={{ color:"#c9ced6",fontSize:".78rem",fontWeight:700 }}>{t.label}</span>
                      {t.dia && <span style={{ color:"#4b5563",fontSize:".65rem" }}>{t.dia}</span>}
                    </div>
                    <div style={{ display:"flex",gap:5,flexShrink:0,marginLeft:8 }}>
                      <button onClick={() => startReplace(k)}
                        title="Substituir via foto ou texto"
                        style={{ background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:8,color:"#60a5fa",padding:"4px 8px",cursor:"pointer",fontSize:".7rem" }}>
                        📷
                      </button>
                      <button onClick={() => { setEditingKey(k); setView("edit"); }}
                        style={{ background:`${color}12`,border:`1px solid ${color}30`,borderRadius:8,color,padding:"4px 10px",cursor:"pointer",fontSize:".62rem",fontWeight:800 }}>
                        Editar
                      </button>
                      {!isDefault && (
                        <button onClick={() => deleteWorkout(k)}
                          style={{ background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,color:"#ef4444",padding:"4px 8px",cursor:"pointer",fontSize:".62rem",fontWeight:800 }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ paddingLeft:4 }}>
                    {t.blocos?.slice(0,2).map((bl, bi) => (
                      <div key={bi} style={{ fontSize:".65rem",color:"#4b5563",lineHeight:1.6 }}>
                        <span style={{ color:"#374151",fontWeight:700 }}>{bl.nome}: </span>
                        {bl.exercises?.slice(0,4).map(e => exDb[e.id]?.name || e.id).join(", ")}
                        {bl.exercises?.length > 4 ? "..." : ""}
                      </div>
                    ))}
                    {t.blocos?.length > 2 && (
                      <div style={{ fontSize:".6rem",color:"#374151" }}>+ {t.blocos.length - 2} bloco(s)</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add buttons */}
            <div style={{ display:"flex",gap:6,marginBottom:16 }}>
              <button onClick={startAdd}
                style={{ flex:2,background:"rgba(59,130,246,.06)",border:"1px dashed rgba(59,130,246,.3)",borderRadius:12,padding:"10px",cursor:"pointer",color:"#60a5fa",fontSize:".74rem",fontWeight:800 }}>
                + Via Foto / Texto
              </button>
              <button onClick={addBlank}
                style={{ flex:1,background:"#111118",border:"1px dashed #1e1e2c",borderRadius:12,padding:"10px",cursor:"pointer",color:"#4b5563",fontSize:".72rem",fontWeight:700 }}>
                + Em Branco
              </button>
            </div>

            {/* Footer */}
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={onClose}
                style={{ flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem" }}>
                Cancelar
              </button>
              <button onClick={handleSave}
                style={{ flex:2,padding:11,borderRadius:11,border:"none",background: changed ? "#a855f7" : "#1a1a24",color: changed ? "#fff" : "#4b5563",fontWeight:900,cursor: changed ? "pointer" : "default",fontSize:".82rem" }}
                disabled={!changed}>
                {changed ? "Salvar Alterações" : "Nenhuma alteração"}
              </button>
            </div>
          </>
        )}

        {/* ── IMPORT VIEW ───────────────────────────────────────────────── */}
        {view === "import" && (
          <>
            <div style={{ display:"flex",gap:6,marginBottom:14 }}>
              {[["text","📝 Via Texto"],["photo","📷 Via Foto"]].map(([m, l]) => (
                <button key={m} onClick={() => setImportMode(m)} style={{
                  flex:1,padding:"8px",borderRadius:9,cursor:"pointer",
                  background: importMode===m ? "rgba(59,130,246,.12)" : "#111118",
                  border: `1px solid ${importMode===m ? "#3b82f655" : "#1e1e2c"}`,
                  color: importMode===m ? "#60a5fa" : "#4b5563",fontWeight:800,fontSize:".72rem",
                }}>{l}</button>
              ))}
            </div>

            {importMode === "photo" && (
              <div>
                <label style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",background:"#111118",border:"1px dashed #1e1e2c",borderRadius:10,padding:14,cursor:"pointer",fontSize:".78rem",color:"#4b5563",marginBottom:8 }}>
                  <input type="file" accept="image/*" ref={importFileRef}
                    onChange={e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setImportImage(ev.target.result); r.readAsDataURL(f); }}
                    style={{ display:"none" }} />
                  📷 Escolher foto do treino
                </label>
                {importImage && <img src={importImage} style={{ width:"100%",borderRadius:10,marginBottom:8,maxHeight:200,objectFit:"cover" }} alt="treino" />}
              </div>
            )}

            <textarea value={importText} onChange={e => setImportText(e.target.value)}
              placeholder={importMode==="text"
                ? "Cole o treino aqui com exercícios, séries, reps e blocos..."
                : "Observações adicionais (opcional)..."}
              style={{ width:"100%",background:"#111118",border:"1px solid #1e1e2c",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".78rem",resize:"vertical",minHeight: importMode==="text" ? 120 : 60,outline:"none",fontFamily:"DM Sans,sans-serif",marginBottom:8 }} />

            {importError && (
              <div style={{ background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:9,padding:"9px 12px",color:"#fca5a5",fontSize:".74rem",marginBottom:8 }}>
                {importError}
              </div>
            )}

            {!importPreview ? (
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={() => { setView("list"); setImportPreview(null); }}
                  style={{ flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem" }}>
                  Voltar
                </button>
                <button onClick={parseFromMedia} disabled={importing}
                  style={{ flex:2,padding:11,borderRadius:11,border:"none",background:"#3b82f6",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".82rem",opacity:importing?0.7:1 }}>
                  {importing ? "Analisando com IA..." : "Analisar com IA"}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background:"rgba(34,197,94,.05)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:".58rem",fontWeight:900,letterSpacing:2,color:"#34d399",marginBottom:8 }}>TREINO IDENTIFICADO</div>
                  <div style={{ color:"#f0f0f8",fontWeight:800,fontSize:".85rem",marginBottom:2 }}>{importPreview.label}</div>
                  {importPreview.dia && <div style={{ color:"#4b5563",fontSize:".7rem",marginBottom:10 }}>{importPreview.dia}</div>}
                  {importPreview.blocos?.map((bl, bi) => (
                    <div key={bi} style={{ fontSize:".7rem",color:"#6b7280",lineHeight:1.7 }}>
                      <span style={{ fontWeight:700,color:"#9ca3af" }}>{bl.nome}: </span>
                      {bl.exercises?.map(e => exDb[e.id]?.name || e.id).join(", ")}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  <button onClick={() => setImportPreview(null)}
                    style={{ flex:1,padding:10,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".74rem" }}>
                    Reanalisar
                  </button>
                  <button onClick={editImport}
                    style={{ flex:1,padding:10,borderRadius:11,border:"1px solid #3b82f630",background:"rgba(59,130,246,.08)",color:"#60a5fa",fontWeight:800,cursor:"pointer",fontSize:".74rem" }}>
                    Editar
                  </button>
                  <button onClick={confirmImport}
                    style={{ flex:1,padding:10,borderRadius:11,border:"none",background:"#22c55e",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".74rem" }}>
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
