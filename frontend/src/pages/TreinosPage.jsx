import { useState } from "react";
import { useApp } from "../context/AppContext";
import WorkoutBlock from "../components/workout/WorkoutBlock";

const TABS = [
  ["A",  "Avulso A",   "Seg", "#3b82f6"],
  ["B",  "Avulso B",   "Qua", "#22c55e"],
  ["PA", "Personal A", "Ter", "#a855f7"],
  ["PB", "Personal B", "Sex", "#ec4899"],
];

const LABELS = { A:"Treino A Avulso", B:"Treino B Avulso", PA:"Personal A", PB:"Personal B" };

export default function TreinosPage() {
  const { tab, setTab, apiStatus, runAPITest, getAvulsoEligibility, setShowFeedbackModal, markWorkoutComplete } = useApp();
  const [toast, setToast] = useState(null);

  const el = getAvulsoEligibility();

  function handleComplete(tk) {
    markWorkoutComplete(tk);
    setToast(`${LABELS[tk]} marcado no calendário!`);
    setTimeout(() => setToast(null), 4000);
  }

  const activeColor = TABS.find(([k]) => k === tab)?.[3] || "#3b82f6";

  return (
    <div style={{animation:"slideUp .35s cubic-bezier(.2,0,.2,1)"}}>

      {/* Tab selector */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
        {TABS.map(([k, l, d, c]) => {
          const active = tab === k;
          return (
            <button key={k} onClick={()=>setTab(k)} style={{
              background: active
                ? `linear-gradient(145deg,${c}22,${c}0e)`
                : "var(--s2)",
              border: `1px solid ${active ? c+"55" : "var(--bd1)"}`,
              borderRadius: 13,
              padding: "10px 4px 9px",
              cursor: "pointer",
              textAlign: "center",
              transition: "all .2s cubic-bezier(.4,0,.2,1)",
              boxShadow: active ? `0 0 18px ${c}1a, 0 1px 0 ${c}22 inset` : "none",
              position:"relative",
              overflow:"hidden",
            }}>
              {active && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:1,
                  background:`linear-gradient(90deg,transparent,${c}88,transparent)`,
                }} />
              )}
              <span style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:".92rem", letterSpacing:2,
                display:"block",
                color: active ? c : "var(--t3)",
                textShadow: active ? `0 0 12px ${c}66` : "none",
              }}>{l}</span>
              <span style={{
                fontSize:".48rem",
                color: active ? c+"bb" : "var(--t4)",
                fontWeight:800, letterSpacing:1,
              }}>{d}</span>
            </button>
          );
        })}
      </div>

      {/* API status */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5,marginBottom:10}}>
        <div style={{
          width:5,height:5,borderRadius:"50%",
          background:apiStatus==="ok"?"#22c55e":apiStatus==="error"?"#ef4444":"var(--t4)",
          boxShadow:apiStatus==="ok"?"0 0 5px #22c55e88":apiStatus==="error"?"0 0 5px #ef444488":"none",
        }} />
        <span style={{fontSize:".56rem",color:"var(--t3)",fontWeight:700}}>
          {apiStatus==="ok" ? "IA ativa" : apiStatus==="error" ? "IA offline" : "Claude IA"}
        </span>
        {apiStatus !== "ok" && (
          <button onClick={runAPITest} style={{
            background:"none",border:"1px solid var(--bd2)",borderRadius:6,
            color:"var(--t3)",padding:"2px 8px",fontSize:".54rem",cursor:"pointer",fontWeight:700,
          }}>
            Testar
          </button>
        )}
      </div>

      <WorkoutBlock tk={tab} onComplete={handleComplete} />

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:92,left:"50%",transform:"translateX(-50%)",
          background:"rgba(7,7,13,.95)",border:`1px solid ${activeColor}44`,
          borderRadius:14,padding:"10px 22px",
          color:"#4ade80",fontSize:".78rem",fontWeight:800,
          zIndex:200,backdropFilter:"blur(20px)",
          animation:"slideUp .3s cubic-bezier(.2,0,.2,1)",whiteSpace:"nowrap",
          boxShadow:`0 8px 32px rgba(34,197,94,.18), 0 0 0 1px ${activeColor}22`,
        }}>
          🎉 {toast}
        </div>
      )}

      {/* Eligibility banner */}
      {el.eligible && (
        <div style={{
          background:"rgba(59,130,246,.06)",
          border:"1px solid rgba(59,130,246,.2)",
          borderRadius:14,padding:"14px 16px",marginTop:12,
          position:"relative",overflow:"hidden",
        }}>
          <div style={{
            position:"absolute",top:0,left:0,right:0,height:1,
            background:"linear-gradient(90deg,transparent,rgba(59,130,246,.4),transparent)",
          }} />
          <div style={{fontSize:".6rem",color:"var(--t3)",marginBottom:10,fontWeight:600}}>
            {el.completed}/{el.possible} avulsos ({Math.round(el.pct*100)}%) — elegível para atualização
          </div>
          <button onClick={()=>setShowFeedbackModal(true)} style={{
            width:"100%",
            background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            border:"none",borderRadius:11,color:"#fff",fontWeight:900,
            padding:"11px 16px",cursor:"pointer",fontSize:".82rem",
            boxShadow:"0 4px 16px rgba(99,102,241,.3)",
            letterSpacing:".3px",
          }}>
            ✨ Gerar Treino do Próximo Mês
          </button>
        </div>
      )}
    </div>
  );
}
