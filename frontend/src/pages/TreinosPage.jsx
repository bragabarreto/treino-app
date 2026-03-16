import { useApp } from "../context/AppContext";
import WorkoutBlock from "../components/workout/WorkoutBlock";

export default function TreinosPage() {
  const { tab, setTab, apiStatus, apiMsg, runAPITest, getAvulsoEligibility, setShowFeedbackModal } = useApp();

  const el = getAvulsoEligibility();

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      {/* API Status Bar */}
      <div style={{background:"#13131a",border:`1px solid ${apiStatus==="ok"?"rgba(34,197,94,.3)":apiStatus==="error"?"rgba(239,68,68,.3)":"#2a2a3a"}`,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:apiStatus==="ok"?"#22c55e":apiStatus==="error"?"#ef4444":apiStatus==="testing"?"#f59e0b":"#6b7280"}} />
          <span style={{fontSize:".72rem",flex:1,color:apiStatus==="ok"?"#4ade80":apiStatus==="error"?"#f87171":apiStatus==="testing"?"#fbbf24":"#9ca3af",lineHeight:1.4}}>
            {!apiStatus && "Claude IA: clique para testar"}
            {apiStatus==="testing" && "Conectando ao Claude…"}
            {apiStatus==="ok" && `✓ Claude IA ativa — "${apiMsg}"`}
            {apiStatus==="error" && `✗ ${apiMsg}`}
          </span>
          <button onClick={runAPITest} disabled={apiStatus==="testing"}
            style={{background:apiStatus==="ok"?"rgba(34,197,94,.15)":"rgba(59,130,246,.15)",border:`1px solid ${apiStatus==="ok"?"rgba(34,197,94,.3)":"rgba(59,130,246,.3)"}`,borderRadius:7,color:apiStatus==="ok"?"#4ade80":"#60a5fa",padding:"4px 12px",fontSize:".68rem",fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
            {apiStatus==="testing"?"…":apiStatus==="ok"?"✓ OK":"Testar IA"}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{textAlign:"center",padding:"22px 0 16px"}}>
        <div style={{fontSize:"2.8rem",marginBottom:8,filter:"drop-shadow(0 0 16px rgba(59,130,246,.6))"}}>💪</div>
        <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(1.8rem,5vw,2.8rem)",letterSpacing:5,lineHeight:1}}>
          MEUS <span style={{WebkitTextStroke:"1.5px rgba(255,255,255,.25)",color:"transparent"}}>TREINOS</span>
        </h1>
        <p style={{color:"#6b7280",fontSize:".7rem",fontWeight:700,letterSpacing:2,textTransform:"uppercase",margin:"6px 0 12px"}}>Avulsos · Complementares ao Personal</p>
      </div>

      {/* Tab selector */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
        {[["A","Avulso A","Seg","#3b82f6"],["B","Avulso B","Qua","#22c55e"],["PA","Personal A","Ter","#a855f7"],["PB","Personal B","Sex","#ec4899"]].map(([k,l,d,c])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{background:tab===k?`linear-gradient(135deg,${c}33,${c}11)`:"transparent",border:`1px solid ${tab===k?c+"66":"#2a2a3a"}`,borderRadius:12,padding:"10px 4px",cursor:"pointer",textAlign:"center",transition:"all .2s",boxShadow:tab===k?`0 0 12px ${c}22`:"none"}}>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:".95rem",letterSpacing:2,display:"block",color:tab===k?"#f0f0f8":"#6b7280"}}>{l}</span>
            <span style={{fontSize:".55rem",color:"rgba(255,255,255,.4)",fontWeight:700}}>{d}</span>
          </button>
        ))}
      </div>

      <WorkoutBlock tk={tab} />

      {/* Eligibility banner */}
      {el.eligible && (
        <div style={{background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.25)",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:".7rem",color:"#9ca3af",marginBottom:6}}>
            ✅ {el.completed}/{el.possible} treinos avulsos ({Math.round(el.pct*100)}%) — elegível para atualização!
          </div>
          <button onClick={()=>setShowFeedbackModal(true)}
            style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:10,color:"#fff",fontWeight:900,padding:"11px 16px",cursor:"pointer",fontSize:".85rem",letterSpacing:.5}}>
            ✨ Gerar Treino Avulso do Próximo Mês
          </button>
        </div>
      )}
    </div>
  );
}
