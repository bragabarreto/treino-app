import { useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import ExCard from "../exercise/ExCard";

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export default function WorkoutBlock({ tk, onComplete, overrideTreino }) {
  const { allTreinos, exDb, userImages, setDetailEx, logs, updateLog } = useApp();
  const t = overrideTreino || allTreinos[tk];
  if (!t) return null;
  const color = t.color || "#3b82f6";

  const todayStr = getToday();
  const allExercises = t.blocos.flatMap(bl => bl.exercises);
  const doneCount = allExercises.filter(ex => {
    const log = logs[ex.id] || {};
    return log.done && log.doneDate === todayStr;
  }).length;
  const total = allExercises.length;
  const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;

  const completedRef = useRef(false);
  useEffect(() => {
    if (pct === 100 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(tk);
    } else if (pct < 100) {
      completedRef.current = false;
    }
  }, [pct, tk, onComplete]);

  return (
    <>
      {/* Overall progress bar */}
      <div style={{background:"#13131a",border:"1px solid #1e1e2c",borderRadius:12,padding:"12px 16px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <span style={{fontSize:".62rem",fontWeight:800,color:"#4b5563",letterSpacing:1,textTransform:"uppercase"}}>
            Progresso do treino de hoje
          </span>
          <span style={{
            fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:2,
            color: pct===100 ? "#22c55e" : color,
          }}>
            {doneCount}/{total}
          </span>
        </div>
        <div style={{background:"#111118",borderRadius:99,height:5,overflow:"hidden"}}>
          <div style={{
            width: pct + "%", height:"100%", borderRadius:99,
            background: pct===100 ? "#22c55e" : `linear-gradient(90deg,${color},${color}bb)`,
            transition:"width .4s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
        {pct === 100 && (
          <div style={{marginTop:8,fontSize:".68rem",color:"#4ade80",fontWeight:800,textAlign:"center"}}>
            ✓ Treino completo — marcado no calendário!
          </div>
        )}
      </div>

      {/* Blocks */}
      {t.blocos.map((bl, bi) => (
        <div key={bi} className="workout-block"
          style={{background:"#13131a",border:"1px solid #1e1e2c",borderRadius:13,marginBottom:8,overflow:"hidden"}}>
          <div style={{padding:"9px 14px",borderBottom:"1px solid #111118",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:3,height:14,borderRadius:2,background:color,flexShrink:0}} />
            <span style={{
              background:color+"18",color,border:`1px solid ${color}30`,
              borderRadius:5,padding:"2px 8px",fontSize:".62rem",fontWeight:900,letterSpacing:1,
            }}>
              {["I","II","III"][bi]}
            </span>
            <span style={{fontWeight:700,fontSize:".8rem",color:"#c9ced6"}}>{bl.nome}</span>
          </div>
          {bl.exercises.map((ex, ei) => (
            <ExCard key={ei} exId={ex.id} s={ex.s} r={ex.r} db={exDb} userImages={userImages}
              onOpen={setDetailEx} logKey={ex.id} logs={logs} onLog={updateLog} />
          ))}
        </div>
      ))}
    </>
  );
}
