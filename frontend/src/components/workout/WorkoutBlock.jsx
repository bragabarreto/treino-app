import { useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import ExCard from "../exercise/ExCard";

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const BLOCK_LABELS = ["I", "II", "III"];

export default function WorkoutBlock({ tk, onComplete }) {
  const { allTreinos, exDb, userImages, setDetailEx, logs, updateLog } = useApp();
  const t = allTreinos[tk];
  if (!t) return null;
  const color = t.color || "#3b82f6";

  const todayStr = getToday();
  const allExercises = t.blocos.flatMap(bl => bl.exercises);
  const doneCount = allExercises.filter(ex => {
    const log = logs[`${tk}-${ex.id}`] || {};
    return log.done && log.doneDate === todayStr;
  }).length;
  const total = allExercises.length;
  const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
  const isDone = pct === 100;

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
      {/* Progress card */}
      <div style={{
        background:"var(--s2)",
        border:`1px solid ${isDone ? "#22c55e44" : "var(--bd1)"}`,
        borderRadius:14,
        padding:"14px 16px",
        marginBottom:12,
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Top accent line */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent,${isDone?"#22c55e":color}66,transparent)`,
        }} />

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <span style={{fontSize:".58rem",fontWeight:800,color:"var(--t3)",letterSpacing:1.2,textTransform:"uppercase"}}>
            Progresso hoje
          </span>
          <span style={{
            fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.05rem",letterSpacing:2,
            color: isDone ? "#22c55e" : color,
            textShadow: isDone ? "0 0 10px #22c55e66" : `0 0 10px ${color}44`,
          }}>
            {doneCount}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{background:"var(--s1)",borderRadius:99,height:7,overflow:"hidden"}}>
          <div style={{
            width: pct + "%", height:"100%", borderRadius:99,
            background: isDone
              ? "linear-gradient(90deg,#22c55e,#4ade80)"
              : `linear-gradient(90deg,${color},${color}cc)`,
            transition:"width .5s cubic-bezier(.4,0,.2,1)",
            backgroundSize: isDone ? "auto" : "200% auto",
            animation: !isDone && pct > 0 ? "shimmer 2.5s linear infinite" : "none",
          }} />
        </div>

        {isDone && (
          <div style={{
            marginTop:9,fontSize:".65rem",color:"#4ade80",fontWeight:800,
            textAlign:"center",letterSpacing:.5,
            animation:"slideUp .3s cubic-bezier(.2,0,.2,1)",
          }}>
            ✓ Treino completo — marcado no calendário!
          </div>
        )}
      </div>

      {/* Blocks */}
      {t.blocos.map((bl, bi) => (
        <div key={bi} className="workout-block"
          style={{
            background:"var(--s2)",
            border:"1px solid var(--bd1)",
            borderRadius:14,
            marginBottom:9,
            overflow:"hidden",
          }}>
          {/* Block header */}
          <div style={{
            padding:"10px 14px",
            borderBottom:"1px solid var(--bd1)",
            display:"flex",alignItems:"center",gap:9,
            background:`linear-gradient(90deg,${color}0a,transparent)`,
          }}>
            <div style={{width:3,height:16,borderRadius:2,background:color,flexShrink:0,boxShadow:`0 0 6px ${color}66`}} />
            <span style={{
              background:`${color}18`,color,border:`1px solid ${color}30`,
              borderRadius:6,padding:"2px 9px",
              fontSize:".6rem",fontWeight:900,letterSpacing:1.5,
              fontFamily:"'Bebas Neue',sans-serif",
            }}>
              {BLOCK_LABELS[bi]}
            </span>
            <span style={{fontWeight:700,fontSize:".8rem",color:"var(--t2)"}}>{bl.nome}</span>
          </div>

          {bl.exercises.map((ex, ei) => (
            <ExCard key={ei} exId={ex.id} s={ex.s} r={ex.r} db={exDb} userImages={userImages}
              onOpen={setDetailEx} logKey={`${tk}-${ex.id}`} logs={logs} onLog={updateLog}
              accentColor={color} />
          ))}
        </div>
      ))}
    </>
  );
}
