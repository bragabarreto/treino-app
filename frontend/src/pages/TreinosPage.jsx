import { useState } from "react";
import { useApp } from "../context/AppContext";
import WorkoutBlock from "../components/workout/WorkoutBlock";
import ExtraWorkoutModal from "../components/workout/ExtraWorkoutModal";

const AVULSO_COLORS = { A:"#3b82f6", B:"#22c55e", C:"#f59e0b", D:"#f97316" };
const AVULSO_DIAS   = { A:"Seg", B:"Qua", C:"Sex", D:"Sáb" };
const P_COLORS = { PA:"#a855f7", PB:"#ec4899", PC:"#06b6d4", PD:"#f59e0b", PE:"#10b981", PF:"#f97316" };
const getPColor = (k, t) => t?.color || P_COLORS[k] || "#a855f7";

export default function TreinosPage() {
  const {
    tab, setTab, apiStatus, runAPITest, getAvulsoEligibility,
    setShowFeedbackModal, markWorkoutComplete,
    extraTreino, setExtraTreino, allTreinos, exDb,
    archiveWorkout, workoutHistory,
  } = useApp();
  const [toast, setToast] = useState(null);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  const el = getAvulsoEligibility();
  const todayISO = new Date().toISOString().split("T")[0];
  const hasExtra = extraTreino?.date === todayISO;

  // Tabs dinâmicas: avulsos (A, B, C...) + pessoais (PA, PB, PC...)
  const avulsoEntries = Object.entries(allTreinos)
    .filter(([k]) => !k.startsWith("P") && allTreinos[k])
    .sort(([a], [b]) => a.localeCompare(b));

  const personalEntries = Object.entries(allTreinos)
    .filter(([k]) => k.startsWith("P") && allTreinos[k])
    .sort(([a], [b]) => a.localeCompare(b));

  const TABS = [
    ...avulsoEntries.map(([k, t]) => {
      const label = t?.label?.replace("Treino ","").replace(" Avulso","") || `Avulso ${k}`;
      const shortLabel = label.split("—")[0].trim();
      return [k, shortLabel, AVULSO_DIAS[k] || "", t?.color || AVULSO_COLORS[k] || "#3b82f6"];
    }),
    ...personalEntries.map(([k, t]) => {
      const label = t?.label?.replace("Personal — Treino ","P").replace("Personal ","P") || k;
      return [k, label, t?.dia?.split("/")[0] || "", getPColor(k, t)];
    }),
  ];

  // Garante que a tab ativa existe
  const activeTab = TABS.find(([k]) => k === tab) ? tab : (TABS[0]?.[0] || "A");
  const activeColor = TABS.find(([k]) => k === activeTab)?.[3] || "#3b82f6";

  function getTreinoLabel(tk) {
    const t = allTreinos[tk];
    return t?.label || `Treino ${tk}`;
  }

  function handleComplete(tk) {
    markWorkoutComplete(tk);
    setToast(`${getTreinoLabel(tk)} marcado no calendário!`);
    setTimeout(() => setToast(null), 4000);
  }

  function handleDiscardExtra() {
    if (extraTreino) archiveWorkout("extra", extraTreino);
    setExtraTreino(null);
    setShowExtra(false);
  }

  const cols = Math.min(TABS.length, 4);

  return (
    <div style={{ animation:"fadeIn .3s ease" }}>

      {/* Tabs dinâmicas */}
      <div style={{ display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:5,marginBottom:14 }}>
        {TABS.map(([k, l, d, c]) => (
          <button key={k} onClick={() => { setTab(k); setShowExtra(false); }} style={{
            background: activeTab===k && !showExtra ? `${c}18` : "transparent",
            border: `1px solid ${activeTab===k && !showExtra ? c+"44" : "#1e1e2c"}`,
            borderRadius:11,padding:"9px 4px",cursor:"pointer",
            textAlign:"center",transition:"all .2s",
          }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:".88rem",letterSpacing:2,display:"block",color: activeTab===k && !showExtra ? c : "#4b5563" }}>
              {l}
            </span>
            {d && <span style={{ fontSize:".5rem",color: activeTab===k && !showExtra ? c+"aa" : "#2a2a3a",fontWeight:700,letterSpacing:1 }}>{d}</span>}
          </button>
        ))}
      </div>

      {/* Se não há nenhum treino cadastrado */}
      {TABS.length === 0 && (
        <p style={{ color:"#4b5563",fontSize:".78rem",textAlign:"center",padding:"24px 0" }}>
          Nenhum treino cadastrado. Acesse a página do Personal para configurar.
        </p>
      )}

      {/* API status */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5,marginBottom:10 }}>
        <div style={{ width:5,height:5,borderRadius:"50%",background: apiStatus==="ok" ? "#22c55e" : apiStatus==="error" ? "#ef4444" : "#2a2a3a" }} />
        <span style={{ fontSize:".58rem",color:"#374151",fontWeight:700 }}>
          {apiStatus==="ok" ? "IA ativa" : apiStatus==="error" ? "IA offline" : "Claude IA"}
        </span>
        {apiStatus !== "ok" && (
          <button onClick={runAPITest} style={{ background:"none",border:"1px solid #1e1e2c",borderRadius:6,color:"#374151",padding:"2px 8px",fontSize:".55rem",cursor:"pointer",fontWeight:700 }}>
            Testar
          </button>
        )}
      </div>

      {/* Treino regular */}
      {!showExtra && TABS.length > 0 && (
        <WorkoutBlock tk={activeTab} onComplete={handleComplete} />
      )}

      {/* Treino Extra ativo */}
      {showExtra && hasExtra && (
        <div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:4,height:18,borderRadius:2,background:"#f59e0b" }} />
              <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:3,color:"#f59e0b" }}>
                {extraTreino.label || "TREINO EXTRA"}
              </span>
            </div>
            <button onClick={() => setShowExtra(false)}
              style={{ background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"4px 10px",cursor:"pointer",fontSize:".7rem",fontWeight:700 }}>
              Voltar
            </button>
          </div>
          <WorkoutBlock tk="EX" overrideTreino={extraTreino} onComplete={handleComplete} />
          <div style={{ display:"flex",gap:6,marginTop:8 }}>
            <button onClick={() => { archiveWorkout("extra", extraTreino); setToast("Treino extra salvo no histórico!"); setTimeout(()=>setToast(null),3000); }}
              style={{ flex:1,background:"rgba(59,130,246,.06)",border:"1px solid rgba(59,130,246,.2)",borderRadius:11,padding:"9px",cursor:"pointer",color:"#60a5fa",fontWeight:800,fontSize:".7rem" }}>
              Salvar no Histórico
            </button>
            <button onClick={handleDiscardExtra}
              style={{ flex:1,background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.18)",borderRadius:11,padding:"9px",cursor:"pointer",color:"#fca5a5",fontWeight:800,fontSize:".7rem" }}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",
          background:"rgba(10,10,15,.92)",border:`1px solid ${activeColor}55`,
          borderRadius:12,padding:"10px 20px",
          color:"#4ade80",fontSize:".8rem",fontWeight:800,
          zIndex:200,backdropFilter:"blur(16px)",
          animation:"fadeIn .3s ease",whiteSpace:"nowrap",
          boxShadow:`0 4px 24px rgba(34,197,94,.15)`,
        }}>
          {toast}
        </div>
      )}

      {/* Banner de elegibilidade (avulsos) */}
      {!showExtra && el.eligible && (
        <div style={{ background:"rgba(59,130,246,.05)",border:"1px solid rgba(59,130,246,.18)",borderRadius:12,padding:"12px 14px",marginTop:10 }}>
          <div style={{ fontSize:".65rem",color:"#4b5563",marginBottom:8 }}>
            {el.completed}/{el.possible} avulsos ({Math.round(el.pct*100)}%) — elegível para atualização
          </div>
          <button onClick={() => setShowFeedbackModal(true)} style={{
            width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            border:"none",borderRadius:10,color:"#fff",fontWeight:900,
            padding:"10px 16px",cursor:"pointer",fontSize:".82rem",
          }}>
            Gerar Treino do Próximo Mês
          </button>
        </div>
      )}

      {/* Treino Extra — seção */}
      {!showExtra && (
        <div style={{ background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.12)",borderRadius:12,padding:"12px 14px",marginTop:10 }}>
          {hasExtra ? (
            <>
              <div style={{ fontSize:".65rem",color:"#f59e0b",marginBottom:8,fontWeight:700 }}>
                Treino Extra gerado para hoje
              </div>
              <div style={{ display:"flex",gap:6 }}>
                <button onClick={() => { archiveWorkout("extra", extraTreino); setToast("Treino extra salvo!"); setTimeout(()=>setToast(null),3000); }}
                  style={{ flex:1,background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,color:"#60a5fa",fontWeight:800,padding:"9px 8px",cursor:"pointer",fontSize:".7rem" }}>
                  Salvar
                </button>
                <button onClick={() => setShowExtra(true)} style={{
                  flex:2,background:"linear-gradient(135deg,#f59e0b,#d97706)",
                  border:"none",borderRadius:10,color:"#000",fontWeight:900,
                  padding:"10px 16px",cursor:"pointer",fontSize:".82rem",
                }}>
                  Abrir Treino Extra
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:".65rem",color:"#92400e",marginBottom:8,fontWeight:700 }}>
                Quer fazer um treino a mais esta semana?
              </div>
              <button onClick={() => setShowExtraModal(true)} style={{
                width:"100%",background:"linear-gradient(135deg,#f59e0b,#d97706)",
                border:"none",borderRadius:10,color:"#000",fontWeight:900,
                padding:"10px 16px",cursor:"pointer",fontSize:".82rem",
              }}>
                Gerar Treino Extra com IA
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal de geração de treino extra */}
      {showExtraModal && (
        <ExtraWorkoutModal
          onClose={() => setShowExtraModal(false)}
          onApply={(treino) => { setExtraTreino(treino); setShowExtra(true); }}
          currentTreinos={allTreinos}
          exDb={exDb}
        />
      )}
    </div>
  );
}
