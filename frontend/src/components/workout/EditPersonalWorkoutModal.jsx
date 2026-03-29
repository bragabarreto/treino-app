import { useState, useMemo } from "react";

export default function EditPersonalWorkoutModal({ tk, treino, exDb, onSave, onClose }) {
  const color = tk === "PA" ? "#a855f7" : "#ec4899";
  const [editData, setEditData] = useState(() => JSON.parse(JSON.stringify(treino)));
  const [searchBlock, setSearchBlock] = useState(null); // {bi} — bloco recebendo exercicio
  const [searchQ, setSearchQ] = useState("");

  const filteredExercises = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    return Object.entries(exDb)
      .filter(([, ex]) => ex.name?.toLowerCase().includes(q) || (ex.muscles || []).some(m => m.toLowerCase().includes(q)) || (ex.category || "").toLowerCase().includes(q))
      .slice(0, 12);
  }, [searchQ, exDb]);

  function updateBloco(bi, field, value) {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n.blocos[bi][field] = value;
      return n;
    });
  }

  function updateExercise(bi, ei, field, value) {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n.blocos[bi].exercises[ei][field] = value;
      return n;
    });
  }

  function removeExercise(bi, ei) {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n.blocos[bi].exercises.splice(ei, 1);
      return n;
    });
  }

  function addExercise(bi, id) {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n.blocos[bi].exercises.push({ id, s: "3", r: "12" });
      return n;
    });
    setSearchBlock(null);
    setSearchQ("");
  }

  function moveExercise(bi, ei, dir) {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      const arr = n.blocos[bi].exercises;
      const target = ei + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[ei], arr[target]] = [arr[target], arr[ei]];
      return n;
    });
  }

  function addBloco() {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      const num = ["I", "II", "III", "IV", "V"][n.blocos.length] || (n.blocos.length + 1);
      n.blocos.push({ nome: `Bloco ${num}`, exercises: [] });
      return n;
    });
  }

  function removeBloco(bi) {
    setEditData(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n.blocos.splice(bi, 1);
      return n;
    });
  }

  function handleSave() {
    onSave(tk, editData);
    onClose();
  }

  const ROMAN = ["I", "II", "III", "IV", "V"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#13131a", border: `1px solid ${color}44`, borderRadius: 22, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", padding: 22 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", letterSpacing: 3, color }}>
            Editar {tk === "PA" ? "Personal A" : "Personal B"}
          </h2>
          <button onClick={onClose} style={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, color: "#6b7280", padding: "4px 10px", cursor: "pointer", fontSize: ".8rem" }}>✕</button>
        </div>

        {/* Dia */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: ".65rem", fontWeight: 800, color: "#6b7280", letterSpacing: 1, display: "block", marginBottom: 4 }}>DIA(S)</label>
          <input value={editData.dia || ""} onChange={e => setEditData(p => ({ ...p, dia: e.target.value }))}
            placeholder="Ex: Ter/Sex"
            style={{ width: "100%", background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 9, padding: "8px 11px", color: "#f0f0f8", fontSize: ".8rem", outline: "none" }} />
        </div>

        {/* Blocos */}
        {editData.blocos.map((bl, bi) => (
          <div key={bi} style={{ background: "#111118", border: `1px solid ${color}22`, borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>

            {/* Block header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: `1px solid ${color}15`, background: `${color}08` }}>
              <span style={{ background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 5, padding: "2px 8px", fontSize: ".6rem", fontWeight: 900, flexShrink: 0 }}>
                B{ROMAN[bi] || bi + 1}
              </span>
              <input value={bl.nome} onChange={e => updateBloco(bi, "nome", e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "#c9ced6", fontSize: ".78rem", fontWeight: 700, outline: "none" }} />
              {editData.blocos.length > 1 && (
                <button onClick={() => removeBloco(bi)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: ".7rem", fontWeight: 800 }}>Remover</button>
              )}
            </div>

            {/* Exercises */}
            {bl.exercises.map((ex, ei) => {
              const exData = exDb[ex.id];
              const name = exData?.name || ex.id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: ei < bl.exercises.length - 1 ? "1px solid #1a1a24" : "none" }}>
                  {/* Reorder */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
                    <button onClick={() => moveExercise(bi, ei, -1)} disabled={ei === 0}
                      style={{ background: "none", border: "none", color: ei === 0 ? "#1e1e2c" : "#6b7280", cursor: ei === 0 ? "default" : "pointer", fontSize: ".6rem", padding: 0, lineHeight: 1 }}>▲</button>
                    <button onClick={() => moveExercise(bi, ei, 1)} disabled={ei === bl.exercises.length - 1}
                      style={{ background: "none", border: "none", color: ei === bl.exercises.length - 1 ? "#1e1e2c" : "#6b7280", cursor: ei === bl.exercises.length - 1 ? "default" : "pointer", fontSize: ".6rem", padding: 0, lineHeight: 1 }}>▼</button>
                  </div>
                  {/* Name */}
                  <span style={{ flex: 1, fontSize: ".76rem", color: "#c9ced6", fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  {/* S x R */}
                  <input value={ex.s} onChange={e => updateExercise(bi, ei, "s", e.target.value)}
                    style={{ width: 32, background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 6, padding: "4px 5px", color: "#f0f0f8", fontSize: ".7rem", textAlign: "center", outline: "none" }} />
                  <span style={{ color: "#4b5563", fontSize: ".7rem" }}>x</span>
                  <input value={ex.r} onChange={e => updateExercise(bi, ei, "r", e.target.value)}
                    style={{ width: 52, background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 6, padding: "4px 5px", color: "#f0f0f8", fontSize: ".7rem", textAlign: "center", outline: "none" }} />
                  {/* Delete */}
                  <button onClick={() => removeExercise(bi, ei)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: ".72rem", flexShrink: 0, padding: "2px 4px" }}>✕</button>
                </div>
              );
            })}

            {/* Add exercise to block */}
            {searchBlock?.bi === bi ? (
              <div style={{ padding: "8px 12px" }}>
                <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Buscar exercicio..."
                  onKeyDown={e => { if (e.key === "Escape") { setSearchBlock(null); setSearchQ(""); } }}
                  style={{ width: "100%", background: "#1a1a24", border: `1px solid ${color}44`, borderRadius: 8, padding: "7px 10px", color: "#f0f0f8", fontSize: ".78rem", outline: "none", marginBottom: 4 }} />
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {filteredExercises.map(([id, ex]) => (
                    <button key={id} onClick={() => addExercise(bi, id)}
                      style={{ display: "block", width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #1a1a24", padding: "6px 8px", cursor: "pointer", textAlign: "left", color: "#c9ced6", fontSize: ".74rem" }}
                      onMouseOver={e => e.currentTarget.style.background = "#1a1a24"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontWeight: 700 }}>{ex.name}</span>
                      {ex.muscles?.[0] && <span style={{ color: "#6b7280", marginLeft: 6, fontSize: ".65rem" }}>{ex.muscles.join(", ")}</span>}
                    </button>
                  ))}
                  {searchQ.trim() && filteredExercises.length === 0 && (
                    <div style={{ padding: "8px", color: "#4b5563", fontSize: ".72rem" }}>Nenhum exercicio encontrado</div>
                  )}
                </div>
                <button onClick={() => { setSearchBlock(null); setSearchQ(""); }}
                  style={{ marginTop: 4, background: "none", border: "1px solid #2a2a3a", borderRadius: 7, padding: "4px 10px", color: "#6b7280", cursor: "pointer", fontSize: ".68rem" }}>Cancelar</button>
              </div>
            ) : (
              <button onClick={() => { setSearchBlock({ bi }); setSearchQ(""); }}
                style={{ width: "100%", background: "transparent", border: "none", borderTop: bl.exercises.length ? `1px solid ${color}10` : "none", padding: "8px 12px", cursor: "pointer", color, fontSize: ".72rem", fontWeight: 700, textAlign: "left" }}>
                + Adicionar exercicio
              </button>
            )}
          </div>
        ))}

        {/* Add block */}
        <button onClick={addBloco}
          style={{ width: "100%", background: `${color}08`, border: `1px dashed ${color}30`, borderRadius: 12, padding: "10px", cursor: "pointer", color, fontSize: ".76rem", fontWeight: 800, marginBottom: 16 }}>
          + Adicionar Bloco
        </button>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 11, borderRadius: 11, border: "1px solid #2a2a3a", background: "#1a1a24", color: "#6b7280", fontWeight: 800, cursor: "pointer", fontSize: ".82rem" }}>
            Cancelar
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, padding: 11, borderRadius: 11, border: "none", background: color, color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: ".82rem" }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
