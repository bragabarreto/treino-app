import { useState } from "react";
import { getImagesForEx } from "../../lib/imageUtils";

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export default function ExCard({ exId, s, r, db, userImages, onOpen, logKey, logs, onLog }) {
  const ex = db[exId];
  const name = ex?.name || exId.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase());
  const log = logs[logKey] || {};
  const imgs = getImagesForEx(exId, userImages, db);
  const [thumbErr, setThumbErr] = useState(false);
  const hasUserImgs = userImages?.[exId]?.length > 0;
  const todayStr = getToday();
  const isDone = log.done && log.doneDate === todayStr;

  function toggleDone(e) {
    e.stopPropagation();
    onLog(logKey, { ...log, done: !isDone, doneDate: todayStr });
  }

  return (
    <div className="ex-card"
      style={{
        borderBottom: "1px solid #13131a",
        padding: "11px 14px",
        transition: "background .15s",
        background: isDone ? "rgba(34,197,94,.04)" : "",
      }}
      onMouseOver={e=>e.currentTarget.style.background=isDone?"rgba(34,197,94,.07)":"#1a1a24"}
      onMouseOut={e=>e.currentTarget.style.background=isDone?"rgba(34,197,94,.04)":""}
    >
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>

        {/* Thumbnail */}
        <div onClick={()=>onOpen(exId)} style={{
          width:46,height:46,borderRadius:9,background:"#111118",
          border:`2px solid ${hasUserImgs?"#f59e0b":isDone?"rgba(34,197,94,.3)":"#222230"}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"1.1rem",flexShrink:0,cursor:"pointer",overflow:"hidden",position:"relative",
          opacity: isDone ? 0.75 : 1,
        }}>
          {!thumbErr
            ? <img src={imgs[0]} alt={name} style={{width:46,height:46,objectFit:"cover"}} onError={()=>setThumbErr(true)} />
            : <span>💪</span>
          }
          {hasUserImgs && <div style={{position:"absolute",bottom:2,right:2,width:9,height:9,background:"#f59e0b",borderRadius:"50%",border:"2px solid #13131a"}} />}
        </div>

        <div style={{flex:1,minWidth:0}}>
          {/* Name row + done button */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <div onClick={()=>onOpen(exId)} style={{
              flex:1,fontWeight:800,fontSize:".83rem",cursor:"pointer",lineHeight:1.3,
              color: isDone ? "#4ade80" : "#60a5fa",
              textDecoration: isDone ? "line-through" : "none",
              opacity: isDone ? 0.75 : 1,
            }}>{name}</div>

            {/* Done toggle */}
            <button onClick={toggleDone} title={isDone ? "Desmarcar" : "Marcar como feito"} style={{
              flexShrink:0,width:28,height:28,borderRadius:"50%",
              border:`2px solid ${isDone?"#22c55e":"#2a2a3a"}`,
              background: isDone ? "rgba(34,197,94,.2)" : "transparent",
              color: isDone ? "#4ade80" : "#374151",
              fontSize:".85rem",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .2s",fontWeight:900,
            }}>
              {isDone ? "✓" : "○"}
            </button>
          </div>

          {/* Badges */}
          <div style={{marginBottom:6,display:"flex",flexWrap:"wrap",gap:3}}>
            <span style={{background:"rgba(59,130,246,.1)",color:"#60a5fa",border:"1px solid rgba(59,130,246,.15)",borderRadius:5,padding:"1px 7px",fontSize:".58rem",fontWeight:800}}>{s} séries</span>
            <span style={{background:"rgba(34,197,94,.1)",color:"#4ade80",border:"1px solid rgba(34,197,94,.15)",borderRadius:5,padding:"1px 7px",fontSize:".58rem",fontWeight:800}}>{r} reps</span>
            {ex?.muscles?.[0] && <span style={{background:"rgba(249,115,22,.1)",color:"#fb923c",border:"1px solid rgba(249,115,22,.15)",borderRadius:5,padding:"1px 7px",fontSize:".58rem",fontWeight:800}}>{ex.muscles[0]}</span>}
          </div>

          {/* Log inputs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:4}}>
            <input placeholder="Carga (kg)" value={log.carga||""} onChange={e=>onLog(logKey,{...log,carga:e.target.value})}
              style={{background:"#111118",border:"1px solid #1e1e2c",borderRadius:7,padding:"5px 9px",color:"#f0f0f8",fontSize:".7rem",outline:"none"}} />
            <input placeholder="Pausa (s)" value={log.tempo||""} onChange={e=>onLog(logKey,{...log,tempo:e.target.value})}
              style={{background:"#111118",border:"1px solid #1e1e2c",borderRadius:7,padding:"5px 9px",color:"#f0f0f8",fontSize:".7rem",outline:"none"}} />
          </div>
          <input placeholder="Observações…" value={log.obs||""} onChange={e=>onLog(logKey,{...log,obs:e.target.value})}
            style={{width:"100%",background:"#111118",border:"1px solid #1e1e2c",borderRadius:7,padding:"5px 9px",color:"#f0f0f8",fontSize:".7rem",outline:"none"}} />
        </div>
      </div>
    </div>
  );
}
