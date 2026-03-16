import { useApp } from "../context/AppContext";

export default function PersonalPage() {
  const {
    plogs, setPlogs, pInput, setPInput, pType, setPType,
    fotoData, setFotoData, pLoading, pResult, fileRef, savePersonalLog,
  } = useApp();

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#6b7280",textTransform:"uppercase",marginBottom:14}}>👨‍💼 Treinos do Personal</div>

      {/* Fixed workout cards */}
      {[
        ["Personal — Treino A","#a855f7","BI\n1. Supino inclinado barra — 3x12\n2. Terra c/ 2 halteres — 3x12\n3. Apoio de frente — 3x(máx.)\nBII\n1. Agachamento Hack — 3x12\n2. Crucifixo c/ halteres (banco reto) — 3x12\n3. Copenhagen banco — 3x10/10\nBIII\n1. Tríceps máquina — 3x15\n2. Prancha Bola — 3x15\n3. 3 Saltos horizontais unil. — 3x4/4"],
        ["Personal — Treino B","#ec4899","BI\n1. Búlgaro kb — 3x10/10\n2. Barra c/ apoio — 3x12\n3. Prancha alta — 3x40\"\nBII\n1. Leg horizontal unil. — 3x12/12\n2. Remada curvada — 3x12/12\n3. Panturrilha leg — 3x20\nBIII\n1. Extensão ombros c/ rotação — 3x12/12\n2. Abdução quadril máquina — 3x12\n3. Rosca unil. (Polia alta) — 3x12/12"],
      ].map(([title,color,content])=>(
        <div key={title} style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:14,padding:16,marginBottom:12}}>
          <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:"3px 11px",fontSize:".65rem",fontWeight:900,display:"inline-block",marginBottom:10}}>{title}</span>
          <pre style={{fontSize:".78rem",color:"#f0f0f8",lineHeight:1.8,background:"#1a1a24",borderRadius:10,padding:12,whiteSpace:"pre-wrap",fontFamily:"monospace"}}>{content}</pre>
        </div>
      ))}

      {/* New log form */}
      <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:14,padding:16,marginBottom:14}}>
        <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#6b7280",textTransform:"uppercase",marginBottom:10}}>➕ Novo Registro</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[["text","📝 Texto"],["foto","📷 Foto"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPType(k)}
              style={{flex:1,padding:8,borderRadius:10,cursor:"pointer",background:pType===k?"rgba(59,130,246,.15)":"#1a1a24",border:`2px solid ${pType===k?"#3b82f6":"#2a2a3a"}`,color:pType===k?"#60a5fa":"#6b7280",fontWeight:800,fontSize:".75rem"}}>{l}
            </button>
          ))}
        </div>
        {pType==="foto" && (
          <div>
            <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",background:"#1a1a24",border:"2px dashed #2a2a3a",borderRadius:11,padding:16,cursor:"pointer",fontSize:".82rem",color:"#6b7280",marginBottom:8}}>
              <input type="file" accept="image/*" ref={fileRef} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setFotoData(ev.target.result);r.readAsDataURL(f);}} style={{display:"none"}} />
              📷 Escolher foto
            </label>
            {fotoData && <img src={fotoData} style={{width:"100%",borderRadius:11,marginBottom:8,maxHeight:180,objectFit:"cover"}} alt="preview" />}
          </div>
        )}
        <textarea value={pInput} onChange={e=>setPInput(e.target.value)}
          placeholder={pType==="text"?"Cole o treino aqui...":"Observações..."}
          style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:11,padding:"10px 13px",color:"#f0f0f8",fontSize:".82rem",resize:"vertical",minHeight:90,outline:"none",fontFamily:"DM Sans,sans-serif",marginBottom:8}} />
        <button onClick={savePersonalLog}
          style={{width:"100%",background:"#3b82f6",color:"#fff",border:"none",borderRadius:11,padding:10,fontWeight:900,fontSize:".85rem",cursor:"pointer"}}>
          💾 Salvar e Analisar
        </button>
        {pLoading && <div style={{display:"flex",alignItems:"center",gap:10,color:"#60a5fa",fontSize:".8rem",padding:"12px 0"}}><div style={{width:18,height:18,border:"2px solid rgba(59,130,246,.3)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin .7s linear infinite"}} />Processando com IA...</div>}
        {pResult && <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:14,marginTop:10,fontSize:".8rem",color:"#a7f3d0",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{pResult}</div>}
      </div>

      {/* History */}
      <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#6b7280",textTransform:"uppercase",marginBottom:10}}>📁 Histórico</div>
      {!plogs.length ? <p style={{color:"#6b7280",fontSize:".8rem"}}>Nenhum registro ainda.</p> : plogs.map(l => (
        <div key={l.id} style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:13,padding:14,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{background:l.type==="text"?"rgba(59,130,246,.15)":"rgba(34,197,94,.15)",color:l.type==="text"?"#60a5fa":"#4ade80",border:`1px solid ${l.type==="text"?"rgba(59,130,246,.3)":"rgba(34,197,94,.3)"}`,borderRadius:20,padding:"2px 9px",fontSize:".62rem",fontWeight:900}}>{l.type==="text"?"📝":"📷"} {l.date}</span>
            <button onClick={()=>setPlogs(p=>p.filter(x=>x.id!==l.id))} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:".75rem"}}>🗑</button>
          </div>
          {l.foto && <img src={l.foto} style={{width:"100%",borderRadius:8,marginBottom:8,maxHeight:160,objectFit:"cover"}} alt="treino" />}
          <p style={{fontSize:".78rem",color:"#e5e7eb",lineHeight:1.6,marginBottom:l.analysis?8:0}}>{l.content}</p>
          {l.analysis && <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)",borderRadius:8,padding:"10px 12px",fontSize:".74rem",color:"#a7f3d0",lineHeight:1.6}}>{l.analysis}</div>}
        </div>
      ))}
    </div>
  );
}
