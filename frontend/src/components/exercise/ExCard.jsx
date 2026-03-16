import { useState } from "react";
import { getImagesForEx } from "../../lib/imageUtils";

export default function ExCard({ exId, s, r, db, userImages, onOpen, logKey, logs, onLog }) {
  const ex = db[exId];
  const name = ex?.name || exId.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase());
  const log = logs[logKey] || {};
  const imgs = getImagesForEx(exId, userImages, db);
  const [thumbErr, setThumbErr] = useState(false);
  const hasUserImgs = userImages?.[exId]?.length > 0;

  return (
    <div className="ex-card" style={{borderBottom:"1px solid #1a1a24",padding:"12px 16px",transition:"background .15s",cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.background="#1a1a24"} onMouseOut={e=>e.currentTarget.style.background=""}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        {/* Thumbnail */}
        <div onClick={()=>onOpen(exId)} style={{width:56,height:56,borderRadius:11,background:"#1a1a24",border:`2px solid ${hasUserImgs?"#f59e0b":"#2a2a3a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0,cursor:"pointer",overflow:"hidden",position:"relative"}}>
          {!thumbErr ? (
            <img src={imgs[0]} alt={name} style={{width:56,height:56,objectFit:"cover"}} onError={()=>setThumbErr(true)} />
          ) : (
            <span>💪</span>
          )}
          {hasUserImgs && <div style={{position:"absolute",bottom:2,right:2,width:12,height:12,background:"#f59e0b",borderRadius:"50%",border:"2px solid #13131a"}} title="Imagem personalizada" />}
        </div>

        <div style={{flex:1}}>
          <div onClick={()=>onOpen(exId)} style={{fontWeight:800,fontSize:".88rem",cursor:"pointer",color:"#60a5fa",marginBottom:6,lineHeight:1.3}}>{name} →</div>
          <div style={{marginBottom:7}}>
            <span style={{background:"rgba(59,130,246,.12)",color:"#60a5fa",border:"1px solid rgba(59,130,246,.25)",borderRadius:6,padding:"2px 8px",fontSize:".62rem",fontWeight:800,marginRight:4}}>{s} séries</span>
            <span style={{background:"rgba(34,197,94,.12)",color:"#4ade80",border:"1px solid rgba(34,197,94,.25)",borderRadius:6,padding:"2px 8px",fontSize:".62rem",fontWeight:800,marginRight:4}}>{r} reps</span>
            {ex?.muscles?.[0] && <span style={{background:"rgba(249,115,22,.12)",color:"#fb923c",border:"1px solid rgba(249,115,22,.25)",borderRadius:6,padding:"2px 8px",fontSize:".62rem",fontWeight:800}}>{ex.muscles[0]}</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:5}}>
            <input placeholder="Carga (kg)" value={log.carga||""} onChange={e=>onLog(logKey,{...log,carga:e.target.value})} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,padding:"6px 10px",color:"#f0f0f8",fontSize:".73rem",outline:"none"}} />
            <input placeholder="Tempo / Pausa" value={log.tempo||""} onChange={e=>onLog(logKey,{...log,tempo:e.target.value})} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,padding:"6px 10px",color:"#f0f0f8",fontSize:".73rem",outline:"none"}} />
          </div>
          <input placeholder="Observações…" value={log.obs||""} onChange={e=>onLog(logKey,{...log,obs:e.target.value})} style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,padding:"6px 10px",color:"#f0f0f8",fontSize:".73rem",outline:"none"}} />
          {(log.carga||log.tempo||log.obs) && <div style={{marginTop:5,fontSize:".65rem",color:"#22c55e"}}>✅ Dados salvos</div>}
        </div>
      </div>
    </div>
  );
}
