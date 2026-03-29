import { useState } from "react";

const QUICK_OPTIONS = [
  { label: "Gluteo", text: "Treino focado em gluteo e posterior de coxa" },
  { label: "Core", text: "Treino intenso de core e abdominais" },
  { label: "HIIT", text: "Treino HIIT com exercicios compostos de alta intensidade" },
  { label: "Upper", text: "Treino de membros superiores: peito, costas, ombros e bracos" },
  { label: "Lower", text: "Treino de membros inferiores: quadriceps, isquiotibiais, panturrilha" },
  { label: "Mobilidade", text: "Treino de mobilidade, flexibilidade e estabilizacao articular" },
];

export default function ExtraWorkoutModal({ onClose, onApply, currentTreinos, exDb }) {
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // parsed treino
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    if (!request.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setJustificativa("");
    try {
      const res = await fetch("/api/treinos/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: request.trim(),
          currentTreinos: currentTreinos || {},
          exerciseDb: exDb || {},
        }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      if (d.parsed) {
        setResult(d.parsed);
        setJustificativa(d.parsed.justificativa || "");
      } else {
        setError("IA nao retornou estrutura valida. Tente novamente.");
      }
    } catch (e) {
      setError("Erro: " + e.message);
    }
    setLoading(false);
  }

  function handleApply() {
    if (!result) return;
    const today = new Date().toISOString().split("T")[0];
    onApply({ ...result, date: today });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#13131a", border: "1px solid #f59e0b44", borderRadius: 22, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", letterSpacing: 3, color: "#f59e0b" }}>
            TREINO EXTRA
          </h2>
          <button onClick={onClose} style={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, color: "#6b7280", padding: "4px 10px", cursor: "pointer", fontSize: ".8rem" }}>✕</button>
        </div>

        {!result ? (
          <>
            {/* Input */}
            <label style={{ fontSize: ".7rem", fontWeight: 800, color: "#6b7280", letterSpacing: 1, display: "block", marginBottom: 6 }}>O QUE QUER TREINAR HOJE?</label>
            <textarea value={request} onChange={e => setRequest(e.target.value)}
              placeholder="Ex: Quero focar em gluteo e posterior de coxa, ou Core intenso com prancha e variações..."
              rows={3}
              style={{ width: "100%", background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 11, padding: "10px 13px", color: "#f0f0f8", fontSize: ".82rem", resize: "none", outline: "none", marginBottom: 10, fontFamily: "DM Sans,sans-serif", boxSizing: "border-box" }} />

            {/* Quick options */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {QUICK_OPTIONS.map(opt => (
                <button key={opt.label} onClick={() => setRequest(opt.text)}
                  style={{
                    background: request === opt.text ? "rgba(245,158,11,.15)" : "#1a1a24",
                    border: `1px solid ${request === opt.text ? "#f59e0b44" : "#2a2a3a"}`,
                    borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                    color: request === opt.text ? "#f59e0b" : "#6b7280",
                    fontSize: ".7rem", fontWeight: 700,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={generate} disabled={loading || !request.trim()}
              style={{
                width: "100%", background: loading ? "#92400e" : "#f59e0b",
                color: "#000", border: "none", borderRadius: 11, padding: "12px",
                fontWeight: 900, fontSize: ".88rem",
                cursor: loading || !request.trim() ? "not-allowed" : "pointer",
                opacity: !request.trim() ? 0.5 : 1,
              }}>
              {loading ? "Gerando..." : "Gerar Treino Extra"}
            </button>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#f59e0b", fontSize: ".8rem", marginTop: 12 }}>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(245,158,11,.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Gerando treino com IA...
              </div>
            )}

            {error && (
              <div style={{ marginTop: 10, padding: 12, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 11, color: "#fca5a5", fontSize: ".78rem" }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Preview */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: ".62rem", fontWeight: 900, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>
                Treino Gerado
              </div>
              <div style={{ background: "#111118", border: "1px solid #f59e0b22", borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: ".85rem", color: "#fbbf24", marginBottom: 10 }}>
                  {result.label || "Treino Extra"}
                </div>
                {(result.blocos || []).map((bl, bi) => (
                  <div key={bi} style={{ marginBottom: bi < result.blocos.length - 1 ? 10 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <span style={{ background: "rgba(245,158,11,.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.25)", borderRadius: 4, padding: "1px 7px", fontSize: ".6rem", fontWeight: 900 }}>
                        {["I", "II", "III"][bi] || bi + 1}
                      </span>
                      <span style={{ fontSize: ".72rem", color: "#6b7280", fontWeight: 700 }}>{bl.nome}</span>
                    </div>
                    {bl.exercises.map((ex, ei) => {
                      const exData = exDb?.[ex.id];
                      const name = exData?.name || ex.id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <div key={ei} style={{ fontSize: ".77rem", color: "#c9ced6", lineHeight: 1.7, display: "flex", justifyContent: "space-between", padding: "2px 6px", borderBottom: ei < bl.exercises.length - 1 ? "1px solid #111118" : "none" }}>
                          <span>{ei + 1}. {name}</span>
                          <span style={{ fontSize: ".65rem", color: "#4b5563", fontWeight: 700 }}>{ex.s}x{ex.r}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {justificativa && (
                <div style={{ marginTop: 8, padding: 10, background: "rgba(34,197,94,.05)", border: "1px solid rgba(34,197,94,.15)", borderRadius: 10, fontSize: ".72rem", color: "#a7f3d0", lineHeight: 1.6 }}>
                  {justificativa}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setResult(null); setJustificativa(""); }}
                style={{ flex: 1, padding: 11, borderRadius: 11, border: "1px solid #2a2a3a", background: "#1a1a24", color: "#6b7280", fontWeight: 800, cursor: "pointer", fontSize: ".78rem" }}>
                Gerar Outro
              </button>
              <button onClick={handleApply}
                style={{ flex: 2, padding: 11, borderRadius: 11, border: "none", background: "#f59e0b", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: ".82rem" }}>
                Usar Este Treino
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
