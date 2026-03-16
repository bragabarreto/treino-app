import { useState } from "react";

export default function FeedbackModal({ onSubmit, onSkip }) {
  const [period, setPeriod] = useState("");
  const [health, setHealth] = useState("");
  const [goals, setGoals] = useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:16}}>
      <div style={{background:"#13131a",border:"1px solid #3b82f6",borderRadius:20,width:"100%",maxWidth:480,padding:24}}>
        <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:3,color:"#3b82f6",marginBottom:4}}>🎯 FIM DO MÊS</h3>
        <p style={{fontSize:".78rem",color:"#9ca3af",marginBottom:18}}>Compartilhe seu feedback para que a IA monte o melhor treino avulso do próximo mês.</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={{fontSize:".7rem",fontWeight:800,color:"#6b7280",letterSpacing:1,display:"block",marginBottom:5}}>COMO FOI O PERÍODO? (energia, recuperação, motivação)</label>
            <textarea value={period} onChange={e=>setPeriod(e.target.value)} rows={2} placeholder="Ex: Semana boa, energia alta, recuperei bem entre os treinos..." style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 12px",color:"#f0f0f8",fontSize:".82rem",resize:"none",outline:"none",boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:".7rem",fontWeight:800,color:"#6b7280",letterSpacing:1,display:"block",marginBottom:5}}>SAÚDE ATUAL (dores, lesões, limitações)</label>
            <textarea value={health} onChange={e=>setHealth(e.target.value)} rows={2} placeholder="Ex: Leve dor no joelho esquerdo, ombro direito ok..." style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 12px",color:"#f0f0f8",fontSize:".82rem",resize:"none",outline:"none",boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:".7rem",fontWeight:800,color:"#6b7280",letterSpacing:1,display:"block",marginBottom:5}}>OBJETIVOS PARA O PRÓXIMO MÊS</label>
            <textarea value={goals} onChange={e=>setGoals(e.target.value)} rows={2} placeholder="Ex: Focar mais em pernas, aumentar intensidade no core..." style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 12px",color:"#f0f0f8",fontSize:".82rem",resize:"none",outline:"none",boxSizing:"border-box"}} />
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:18}}>
          <button onClick={onSkip} style={{flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem"}}>Pular</button>
          <button onClick={()=>onSubmit({period,health,goals})} style={{flex:2,padding:11,borderRadius:11,border:"none",background:"#3b82f6",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".82rem"}}>✨ Gerar Treino do Mês</button>
        </div>
      </div>
    </div>
  );
}
