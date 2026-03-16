import { useApp } from "../../context/AppContext";
import ExCard from "../exercise/ExCard";

export default function WorkoutBlock({ tk }) {
  const { allTreinos, exDb, userImages, setDetailEx, logs, updateLog } = useApp();
  const t = allTreinos[tk];
  if (!t) return null;
  const color = t.color || "#3b82f6";

  return t.blocos.map((bl, bi) => (
    <div key={bi} className="workout-block"
      style={{background:"linear-gradient(135deg,#13131a,#0f0f18)",border:"1px solid #1e1e2c",
        borderRadius:16,marginBottom:12,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.2)"}}>
      <div style={{padding:"12px 16px",background:"rgba(255,255,255,.03)",borderBottom:"1px solid #1e1e2c",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:18,borderRadius:2,background:color,flexShrink:0}} />
        <span style={{background:color,color:color==="#22c55e"?"#0a2a14":"#fff",borderRadius:5,padding:"2px 9px",fontSize:".7rem",fontWeight:900,fontFamily:"Bebas Neue,sans-serif",letterSpacing:1}}>
          Bloco {["I","II","III"][bi]}
        </span>
        <span style={{fontWeight:800,fontSize:".85rem"}}>{bl.nome}</span>
      </div>
      {bl.exercises.map((ex, ei) => (
        <ExCard key={ei} exId={ex.id} s={ex.s} r={ex.r} db={exDb} userImages={userImages}
          onOpen={setDetailEx} logKey={`${tk}-${ex.id}`} logs={logs} onLog={updateLog} />
      ))}
    </div>
  ));
}
