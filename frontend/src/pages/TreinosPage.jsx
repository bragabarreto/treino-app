import { useState } from "react";
import { useApp } from "../context/AppContext";
import WorkoutBlock from "../components/workout/WorkoutBlock";
import ExtraWorkoutModal from "../components/workout/ExtraWorkoutModal";

const BASE_TABS = [
  ["A",  "Avulso A",   "Seg", "#3b82f6"],
  ["B",  "Avulso B",   "Qua", "#22c55e"],
  ["PA", "Personal A", "Ter", "#a855f7"],
  ["PB", "Personal B", "Sex", "#ec4899"],
];

const LABELS = { A:"Treino A Avulso", B:"Treino B Avulso", PA:"Personal A", PB:"Personal B", EX:"Treino Extra" };

export default function TreinosPage() {
  const { tab, setTab, apiStatus, runAPITest, getAvulsoEligibility, setShowFeedbackModal, markWorkoutComplete, extraTreino, setExtraTreino, allTreinos, exDb } = useApp();
  const [toast, setToast] = useState(null);
  const [showExtraModal, setShowExtraModal] = useState(false);

  const el = getAvulsoEligibility();

  const todayISO = new Date().toISOString().split("T")[0];
  const hasExtra = extraTreino?.date === todayISO;

  const TABS = hasExtra
    ? [...BASE_TABS, ["EX", "Extra", extraTreino.dia?.slice(0, 3) || "Hoje", "#f59e0b"]]
    : BASE_TABS;

  function handleComplete(tk) {
    markWorkoutComplete(tk);
    setToast(`${LABELS[tk] || "Treino"} marcado no calendario!`);
    setTimeout(() => setToast(null), 4000);
  }

  const activeColor = TABS.find(([k]) => k === tab)?.[3] || "#3b82f6";

  return (
    <div style={{animation:"fadeIn .3s ease"}}>

      {/* Tab selector */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${TABS.length},1fr)`,gap:5,marginBottom:14}}>
        {TABS.map(([k, l, d, c]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            background: tab===k ? `${c}18` : "transparent",
            border: `1px solid ${tab===k ? c+"44" : "#1e1e2c"}`,
            borderRadius: 11, padding: "9px 4px", cursor: "pointer",
            textAlign: "center", transition: "all .2s",
          }}>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize: TABS.length > 4 ? ".78rem" : ".9rem",letterSpacing:2,display:"block",color:tab===k?c:"#4b5563"}}>{l}</span>
            <span style={{fontSize:".5rem",color:tab===k?c+"aa":"#2a2a3a",fontWeight:700,letterSpacing:1}}>{d}</span>
          </button>
        ))}
      </div>

      {/* API status */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5,marginBottom:10}}>
        <div style={{width:5,height:5,borderRadius:"50%",background:apiStatus==="ok"?"#22c55e":apiStatus==="error"?"#ef4444":"#2a2a3a"}} />
        <span style={{fontSize:".58rem",color:"#374151",fontWeight:700}}>
          {apiStatus==="ok" ? "IA ativa" : apiStatus==="error" ? "IA offline" : "Claude IA"}
        </span>
        {apiStatus !== "ok" && (
          <button onClick={runAPITest} style={{background:"none",border:"1px solid #1e1e2c",borderRadius:6,color:"#374151",padding:"2px 8px",fontSize:".55rem",cursor:"pointer",fontWeight:700}}>
            Testar
          </button>
        )}
      </div>

      {/* Workout content */}
      {tab === "EX" && hasExtra ? (
        <>
          <WorkoutBlock tk="EX" overrideTreino={extraTreino} onComplete={handleComplete} />
          <button onClick={()=>{ setExtraTreino(null); setTab("A"); }}
            style={{width:"100%",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:11,padding:"10px",marginTop:8,cursor:"pointer",color:"#fca5a5",fontWeight:800,fontSize:".76rem"}}>
            Descartar Treino Extra
          </button>
        </>
      ) : (
        <WorkoutBlock tk={tab} onComplete={handleComplete} />
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

      {/* Eligibility banner */}
      {el.eligible && (
        <div style={{background:"rgba(59,130,246,.05)",border:"1px solid rgba(59,130,246,.18)",borderRadius:12,padding:"12px 14px",marginTop:10}}>
          <div style={{fontSize:".65rem",color:"#4b5563",marginBottom:8}}>
            {el.completed}/{el.possible} avulsos ({Math.round(el.pct*100)}%) — elegivel para atualizacao
          </div>
          <button onClick={()=>setShowFeedbackModal(true)} style={{
            width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            border:"none",borderRadius:10,color:"#fff",fontWeight:900,
            padding:"10px 16px",cursor:"pointer",fontSize:".82rem",
          }}>
            Gerar Treino do Proximo Mes
          </button>
        </div>
      )}

      {/* Extra workout CTA */}
      {!hasExtra && (
        <div style={{background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.15)",borderRadius:12,padding:"12px 14px",marginTop:10}}>
          <div style={{fontSize:".65rem",color:"#92400e",marginBottom:8,fontWeight:700}}>
            Quer treinar algo diferente hoje?
          </div>
          <button onClick={()=>setShowExtraModal(true)} style={{
            width:"100%",background:"linear-gradient(135deg,#f59e0b,#d97706)",
            border:"none",borderRadius:10,color:"#000",fontWeight:900,
            padding:"10px 16px",cursor:"pointer",fontSize:".82rem",
          }}>
            Gerar Treino Extra
          </button>
        </div>
      )}

      {/* Extra workout modal */}
      {showExtraModal && (
        <ExtraWorkoutModal
          onClose={()=>setShowExtraModal(false)}
          onApply={(treino) => { setExtraTreino(treino); setTab("EX"); }}
          currentTreinos={allTreinos}
          exDb={exDb}
        />
      )}
    </div>
  );
}
