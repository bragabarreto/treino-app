import { useState, useEffect } from "react";
import { getImagesForEx } from "../../lib/imageUtils";

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export default function ExCard({ exId, s, r, db, userImages, onOpen, logKey, logs, onLog, accentColor }) {
  const ex = db[exId];
  const name = ex?.name || exId.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase());
  const log = logs[logKey] || {};
  const imgs = getImagesForEx(exId, userImages, db);
  const [imgIdx, setImgIdx] = useState(0);
  const hasUserImgs = userImages?.[exId]?.length > 0;
  const todayStr = getToday();
  const isDone = log.done && log.doneDate === todayStr;
  const color = accentColor || "#3b82f6";

  const img0 = imgs[0];
  useEffect(() => setImgIdx(0), [exId, img0]);

  function handleImgError() {
    if (imgIdx < imgs.length - 1) {
      setImgIdx(i => i + 1);
    } else {
      setImgIdx(-1);
    }
  }

  function toggleDone(e) {
    e.stopPropagation();
    onLog(logKey, { ...log, done: !isDone, doneDate: todayStr });
  }

  const inputStyle = {
    background:"var(--s1)",
    border:"1px solid var(--bd1)",
    borderRadius:8,
    padding:"6px 10px",
    color:"var(--t1)",
    fontSize:".68rem",
    outline:"none",
    width:"100%",
    transition:"border-color .15s",
  };

  return (
    <div className="ex-card"
      style={{
        borderBottom: "1px solid var(--bd1)",
        padding: "12px 14px",
        background: isDone ? "rgba(34,197,94,.05)" : "",
        borderLeft: isDone ? "2px solid #22c55e55" : "2px solid transparent",
        transition:"background .15s, border-color .2s",
      }}
      onMouseOver={e=>e.currentTarget.style.background=isDone?"rgba(34,197,94,.08)":"rgba(255,255,255,.018)"}
      onMouseOut={e=>e.currentTarget.style.background=isDone?"rgba(34,197,94,.05)":""}
    >
      <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>

        {/* Thumbnail */}
        <div onClick={()=>onOpen(exId)} style={{
          width:48,height:48,borderRadius:10,background:"var(--s1)",
          border:`2px solid ${hasUserImgs?"#f59e0b55":isDone?"#22c55e44":"var(--bd2)"}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"1.1rem",flexShrink:0,cursor:"pointer",overflow:"hidden",position:"relative",
          opacity: isDone ? 0.7 : 1,
          transition:"opacity .2s",
        }}>
          {imgIdx >= 0
            ? <img
                key={imgs[imgIdx]}
                src={imgs[imgIdx]}
                alt={name}
                style={{width:48,height:48,objectFit:"cover"}}
                onError={handleImgError}
              />
            : <span>💪</span>
          }
          {hasUserImgs && (
            <div style={{
              position:"absolute",bottom:2,right:2,
              width:8,height:8,
              background:"#f59e0b",borderRadius:"50%",
              border:"1.5px solid var(--s2)",
            }} />
          )}
        </div>

        <div style={{flex:1,minWidth:0}}>
          {/* Name row + done button */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <div onClick={()=>onOpen(exId)} style={{
              flex:1,fontWeight:800,fontSize:".82rem",cursor:"pointer",lineHeight:1.3,
              color: isDone ? "#4ade80" : color,
              textDecoration: isDone ? "line-through" : "none",
              opacity: isDone ? 0.7 : 1,
              transition:"color .2s, opacity .2s",
            }}>{name}</div>

            <button onClick={toggleDone} className="done-btn"
              title={isDone ? "Desmarcar" : "Marcar como feito"} style={{
              flexShrink:0,width:28,height:28,borderRadius:"50%",
              border:`2px solid ${isDone?"#22c55e":"var(--bd2)"}`,
              background: isDone ? "rgba(34,197,94,.22)" : "transparent",
              color: isDone ? "#4ade80" : "var(--t3)",
              fontSize:".85rem",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontWeight:900,
              boxShadow: isDone ? "0 0 8px rgba(34,197,94,.3)" : "none",
            }}>
              {isDone ? "✓" : "○"}
            </button>
          </div>

          {/* Badges */}
          <div style={{marginBottom:7,display:"flex",flexWrap:"wrap",gap:4}}>
            <span style={{
              background:"rgba(59,130,246,.12)",color:"#60a5fa",
              border:"1px solid rgba(59,130,246,.18)",
              borderRadius:6,padding:"2px 8px",fontSize:".57rem",fontWeight:800,
            }}>{s} séries</span>
            <span style={{
              background:"rgba(34,197,94,.12)",color:"#4ade80",
              border:"1px solid rgba(34,197,94,.18)",
              borderRadius:6,padding:"2px 8px",fontSize:".57rem",fontWeight:800,
            }}>{r} reps</span>
            {ex?.muscles?.[0] && (
              <span style={{
                background:"rgba(249,115,22,.1)",color:"#fb923c",
                border:"1px solid rgba(249,115,22,.15)",
                borderRadius:6,padding:"2px 8px",fontSize:".57rem",fontWeight:800,
              }}>{ex.muscles[0]}</span>
            )}
          </div>

          {/* Log inputs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:5}}>
            <input
              placeholder="Carga (kg)"
              value={log.carga||""}
              onChange={e=>onLog(logKey,{...log,carga:e.target.value})}
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=color+"66"}
              onBlur={e=>e.target.style.borderColor="var(--bd1)"}
            />
            <input
              placeholder="Pausa (s)"
              value={log.tempo||""}
              onChange={e=>onLog(logKey,{...log,tempo:e.target.value})}
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=color+"66"}
              onBlur={e=>e.target.style.borderColor="var(--bd1)"}
            />
          </div>
          <input
            placeholder="Observações…"
            value={log.obs||""}
            onChange={e=>onLog(logKey,{...log,obs:e.target.value})}
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor=color+"66"}
            onBlur={e=>e.target.style.borderColor="var(--bd1)"}
          />
        </div>
      </div>
    </div>
  );
}
