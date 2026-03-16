import { useState } from "react";

export default function UpdatePanel({ onClose, feedbackData, currentTreinos, exDb: exDbProp, onApply }) {
  const [mode, setMode] = useState("auto");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function generate() {
    setLoading(true); setResult("");
    try {
      const feedbackStr = feedbackData
        ? `Período: ${feedbackData.period || "não informado"}. Saúde: ${feedbackData.health || "não informado"}. Objetivos: ${feedbackData.goals || "não informado"}.`
        : (mode === "custom" ? feedback : "Otimize os treinos mantendo volume e progressão adequados.");
      const res = await fetch("/api/treinos/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTreinos: currentTreinos || {},
          feedback: feedbackStr,
          exerciseDb: exDbProp || {},
        }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      const parsed = d.parsed;
      if (parsed?.treinos?.A && parsed?.treinos?.B && onApply) {
        onApply({ A: parsed.treinos.A, B: parsed.treinos.B });
        setResult((parsed.justificativa || "") + "\n\n✅ Treinos A e B atualizados com sucesso!");
      } else {
        setResult(d.text || "Treino gerado (sem estrutura JSON válida para aplicar automaticamente).");
      }
    } catch(e) { setResult("Erro: " + e.message); }
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:16}} onClick={onClose}>
      <div style={{background:"#13131a",border:"1px solid #3b82f6",borderRadius:22,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",padding:24}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:3,color:"#60a5fa"}}>🔄 ATUALIZAR TREINOS</h2>
          <button onClick={onClose} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"4px 10px",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["auto","🤖 Automático"],["custom","✏️ Personalizado"]].map(([k,l])=>(
            <button key={k} onClick={()=>setMode(k)} style={{flex:1,padding:"10px",borderRadius:11,cursor:"pointer",background:mode===k?"rgba(59,130,246,.15)":"#1a1a24",border:`2px solid ${mode===k?"#3b82f6":"#2a2a3a"}`,color:mode===k?"#60a5fa":"#6b7280",fontWeight:800,fontSize:".78rem"}}>{l}</button>
          ))}
        </div>
        {mode==="custom" && (
          <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Descreva: grupos musculares preferidos, exercícios que gostou, objetivos, limitações…" style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:11,padding:"10px 13px",color:"#f0f0f8",fontSize:".82rem",resize:"vertical",minHeight:90,outline:"none",marginBottom:10,fontFamily:"DM Sans,sans-serif"}} />
        )}
        <button onClick={generate} disabled={loading} style={{width:"100%",background:loading?"#1e3a8a":"#3b82f6",color:"#fff",border:"none",borderRadius:11,padding:"12px",fontWeight:900,fontSize:".88rem",cursor:loading?"not-allowed":"pointer",marginBottom:14}}>
          {loading ? "⏳ Gerando…" : "✨ Gerar Nova Planilha com IA"}
        </button>
        {loading && <div style={{display:"flex",alignItems:"center",gap:10,color:"#60a5fa",fontSize:".8rem",marginBottom:14}}><div style={{width:18,height:18,border:"2px solid rgba(59,130,246,.3)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin .7s linear infinite"}} />Processando…</div>}
        {result && (
          <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:16,fontSize:".8rem",color:"#a7f3d0",lineHeight:1.8,whiteSpace:"pre-wrap"}}>
            <div style={{fontSize:".6rem",fontWeight:900,letterSpacing:2,color:"#22c55e",textTransform:"uppercase",marginBottom:10}}>✅ Nova Planilha Gerada</div>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
