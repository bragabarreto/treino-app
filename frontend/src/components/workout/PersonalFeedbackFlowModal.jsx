import { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function PersonalFeedbackFlowModal({ personalTreinos, onApply, onClose }) {
  const { allTreinos, exDb, archiveWorkout } = useApp();
  const [step, setStep] = useState(1); // 1=periodo, 2=formato, 3=arquivo?, 4=gerando, 5=resultado
  const [periodo, setPeriodo] = useState("");
  const [saude, setSaude] = useState("");
  const [necessidades, setNecessidades] = useState("");
  const [format, setFormat] = useState("AB");
  const [archiveAvulso, setArchiveAvulso] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const currentAvulsoKeys = Object.keys(allTreinos).filter(k => !k.startsWith("P"));
  const hasCurrentAvulsos = currentAvulsoKeys.some(k => allTreinos[k]);

  async function generate() {
    if (archiveAvulso && hasCurrentAvulsos) {
      const snapshot = currentAvulsoKeys.reduce((obj, k) => {
        if (allTreinos[k]) obj[k] = allTreinos[k];
        return obj;
      }, {});
      archiveWorkout("avulso", snapshot);
    }

    setStep(4);
    setError("");

    const feedback = [
      periodo && `Período anterior: ${periodo}`,
      saude && `Saúde: ${saude}`,
      necessidades && `Necessidades para o próximo ciclo: ${necessidades}`,
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/treinos/generate-avulsos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalTreinos, feedback, format, exerciseDb: exDb }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.parsed?.treinos) throw new Error("Resposta inesperada da IA. Tente novamente.");
      setResult(data.parsed);
      setStep(5);
    } catch (e) {
      setError(e.message);
      setStep(3);
    }
  }

  function apply() {
    onApply(result.treinos);
    onClose();
  }

  const stepTitles = ["", "Como foi o período?", "Próximo ciclo", "Antes de gerar...", "", "Treinos gerados!"];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:16 }}>
      <div style={{ background:"#13131a",border:"1px solid #2a2a3a",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",padding:22 }}>

        {/* Barra de progresso */}
        <div style={{ display:"flex",gap:4,marginBottom:16 }}>
          {[1,2,3,5].map(s => (
            <div key={s} style={{ flex:1,height:3,borderRadius:2,background: step >= s ? "#3b82f6" : "#1e1e2c",transition:"background .3s" }} />
          ))}
        </div>

        {/* Título */}
        {step !== 4 && step !== 5 && (
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",letterSpacing:3,color:"#f0f0f8",marginBottom:4 }}>
            {stepTitles[step] || ""}
          </h2>
        )}

        {/* ── STEP 1: Período + Saúde ─────────────────────────────────── */}
        {step === 1 && (
          <>
            <p style={{ color:"#6b7280",fontSize:".73rem",marginBottom:14 }}>
              Conte como foram os treinos, progresso e dificuldades do ciclo que está encerrando.
            </p>
            <label style={{ fontSize:".62rem",fontWeight:800,color:"#4b5563",letterSpacing:1,display:"block",marginBottom:4 }}>PERÍODO ANTERIOR</label>
            <textarea value={periodo} onChange={e => setPeriodo(e.target.value)}
              placeholder="Ex: Fiz a maioria dos treinos, senti boa evolução no supino mas tive dificuldade no terra..."
              style={{ width:"100%",background:"#111118",border:"1px solid #1e1e2c",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".79rem",resize:"vertical",minHeight:80,outline:"none",fontFamily:"DM Sans,sans-serif",marginBottom:12 }} />
            <label style={{ fontSize:".62rem",fontWeight:800,color:"#4b5563",letterSpacing:1,display:"block",marginBottom:4 }}>ESTADO DE SAÚDE</label>
            <textarea value={saude} onChange={e => setSaude(e.target.value)}
              placeholder="Ex: Leve desconforto no ombro direito, joelho ok, disposição boa..."
              style={{ width:"100%",background:"#111118",border:"1px solid #1e1e2c",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".79rem",resize:"vertical",minHeight:60,outline:"none",fontFamily:"DM Sans,sans-serif",marginBottom:16 }} />
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={onClose}
                style={{ flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem" }}>
                Pular
              </button>
              <button onClick={() => setStep(2)}
                style={{ flex:2,padding:11,borderRadius:11,border:"none",background:"#3b82f6",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".82rem" }}>
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Necessidades + Formato ─────────────────────────── */}
        {step === 2 && (
          <>
            <label style={{ fontSize:".62rem",fontWeight:800,color:"#4b5563",letterSpacing:1,display:"block",marginBottom:4 }}>NECESSIDADES / OBJETIVOS</label>
            <textarea value={necessidades} onChange={e => setNecessidades(e.target.value)}
              placeholder="Ex: Quero focar mais em ombros e core, reduzir volume de pernas, testar exercícios novos..."
              style={{ width:"100%",background:"#111118",border:"1px solid #1e1e2c",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".79rem",resize:"vertical",minHeight:80,outline:"none",fontFamily:"DM Sans,sans-serif",marginBottom:16 }} />
            <label style={{ fontSize:".62rem",fontWeight:800,color:"#4b5563",letterSpacing:1,display:"block",marginBottom:8 }}>FORMATO DOS TREINOS AVULSOS</label>
            <div style={{ display:"flex",gap:8,marginBottom:16 }}>
              {[
                ["AB",  "A — B",        "2 treinos", "Segunda + Quarta"],
                ["ABC", "A — B — C",    "3 treinos", "Seg + Qua + Sex"],
              ].map(([v, label, qty, days]) => (
                <button key={v} onClick={() => setFormat(v)} style={{
                  flex:1,padding:"12px 8px",borderRadius:12,cursor:"pointer",textAlign:"center",
                  background: format===v ? "rgba(59,130,246,.12)" : "#111118",
                  border: `1px solid ${format===v ? "#3b82f655" : "#1e1e2c"}`,
                  color: format===v ? "#60a5fa" : "#4b5563",
                }}>
                  <div style={{ fontWeight:900,fontSize:".9rem",letterSpacing:1 }}>{label}</div>
                  <div style={{ fontWeight:700,fontSize:".68rem",marginTop:2 }}>{qty}</div>
                  <div style={{ fontSize:".6rem",marginTop:1,opacity:.7 }}>{days}</div>
                </button>
              ))}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={() => setStep(1)}
                style={{ flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem" }}>
                ← Voltar
              </button>
              <button onClick={() => setStep(3)}
                style={{ flex:2,padding:11,borderRadius:11,border:"none",background:"#3b82f6",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".82rem" }}>
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Arquivar avulsos atuais? ────────────────────────── */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",letterSpacing:3,color:"#f0f0f8",marginBottom:6 }}>
              Arquivar treinos atuais?
            </h2>
            {hasCurrentAvulsos ? (
              <>
                <p style={{ color:"#6b7280",fontSize:".73rem",marginBottom:14 }}>
                  Os treinos avulsos atuais serão substituídos pelos novos. Deseja salvar uma cópia no histórico antes?
                </p>
                <div style={{ display:"flex",gap:8,marginBottom:14 }}>
                  {[[true,"Sim, salvar no histórico"],[false,"Não, pode descartar"]].map(([v, l]) => (
                    <button key={String(v)} onClick={() => setArchiveAvulso(v)} style={{
                      flex:1,padding:"10px 8px",borderRadius:12,cursor:"pointer",
                      background: archiveAvulso===v ? "rgba(59,130,246,.12)" : "#111118",
                      border: `1px solid ${archiveAvulso===v ? "#3b82f655" : "#1e1e2c"}`,
                      color: archiveAvulso===v ? "#60a5fa" : "#4b5563",
                      fontWeight:800,fontSize:".74rem",textAlign:"center",
                    }}>{l}</button>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color:"#6b7280",fontSize:".73rem",marginBottom:14 }}>
                Nenhum treino avulso ativo para arquivar. Pronto para gerar!
              </p>
            )}
            {error && (
              <div style={{ background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:9,padding:"9px 12px",color:"#fca5a5",fontSize:".74rem",marginBottom:10 }}>
                Erro: {error}
              </div>
            )}
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={() => setStep(2)}
                style={{ flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem" }}>
                ← Voltar
              </button>
              <button onClick={generate}
                style={{ flex:2,padding:11,borderRadius:11,border:"none",background:"#3b82f6",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".82rem" }}>
                Gerar Treinos com IA
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: Gerando ─────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{ textAlign:"center",padding:"48px 0" }}>
            <div style={{ width:36,height:36,border:"3px solid rgba(59,130,246,.25)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 18px" }} />
            <p style={{ color:"#60a5fa",fontWeight:700,fontSize:".9rem" }}>Gerando treinos avulsos...</p>
            <p style={{ color:"#4b5563",fontSize:".72rem",marginTop:6,lineHeight:1.5 }}>
              Analisando seus treinos do personal<br />e criando complementos personalizados
            </p>
          </div>
        )}

        {/* ── STEP 5: Resultado ───────────────────────────────────────── */}
        {step === 5 && result && (
          <>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",letterSpacing:3,color:"#22c55e",marginBottom:12 }}>
              Treinos Gerados!
            </h2>
            {result.justificativa && (
              <div style={{ background:"rgba(34,197,94,.04)",border:"1px solid rgba(34,197,94,.15)",borderRadius:11,padding:12,marginBottom:14,fontSize:".73rem",color:"#a7f3d0",lineHeight:1.7 }}>
                {result.justificativa}
              </div>
            )}
            {Object.entries(result.treinos || {}).map(([k, t]) => {
              const c = t.color || "#3b82f6";
              return (
                <div key={k} style={{ background:"#111118",border:`1px solid ${c}25`,borderRadius:12,padding:12,marginBottom:10 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                    <span style={{ background:`${c}18`,color:c,border:`1px solid ${c}30`,borderRadius:20,padding:"2px 10px",fontSize:".62rem",fontWeight:900 }}>{k}</span>
                    <span style={{ color:"#c9ced6",fontWeight:800,fontSize:".8rem" }}>{t.label}</span>
                    {t.dia && <span style={{ color:"#4b5563",fontSize:".65rem" }}>{t.dia}</span>}
                  </div>
                  {t.blocos?.map((bl, bi) => (
                    <div key={bi} style={{ fontSize:".68rem",color:"#6b7280",lineHeight:1.7 }}>
                      <span style={{ color:"#9ca3af",fontWeight:700 }}>{bl.nome}: </span>
                      {bl.exercises?.map(e => exDb[e.id]?.name || e.id).join(", ")}
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{ display:"flex",gap:8,marginTop:6 }}>
              <button onClick={onClose}
                style={{ flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem" }}>
                Cancelar
              </button>
              <button onClick={apply}
                style={{ flex:2,padding:11,borderRadius:11,border:"none",background:"#22c55e",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".84rem" }}>
                Aplicar Treinos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
