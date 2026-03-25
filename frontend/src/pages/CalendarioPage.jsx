import { useApp } from "../context/AppContext";
import { MESES, DIAS_PT } from "../data/constants";

export default function CalendarioPage() {
  const { calY, setCalY, calM, setCalM, marks, setMarks, syncStatus, saveMarkToCloud, getStats, dayStyle, setDayModal, setDayOpts } = useApp();
  const stats = getStats();

  const goalColor = stats.pct >= 100 ? "#22c55e" : stats.pct >= 50 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{animation:"slideUp .35s cubic-bezier(.2,0,.2,1)"}}>

      {/* Stats row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
        {[
          [stats.feitosAvulso, "Avulsos Feitos",   "#3b82f6"],
          [stats.posAvulso,    "Possíveis",         "var(--t3)"],
          [stats.pct+"%",      "Meta Avulso",       goalColor],
        ].map(([v,l,c],i) => (
          <div key={i} style={{
            background:"var(--s2)",
            border:`1px solid ${i===2 ? goalColor+"44" : "var(--bd1)"}`,
            borderRadius:14,
            padding:"14px 10px",
            textAlign:"center",
            position:"relative",overflow:"hidden",
          }}>
            {i === 2 && (
              <div style={{
                position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,${goalColor}88,transparent)`,
              }} />
            )}
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:"2rem",letterSpacing:2,
              color:c,
              textShadow: i===2 ? `0 0 16px ${goalColor}55` : "none",
              lineHeight:1,
            }}>{v}</div>
            <div style={{
              fontSize:".55rem",fontWeight:800,
              color:"var(--t3)",letterSpacing:1.2,
              textTransform:"uppercase",lineHeight:1.4,
              marginTop:4,
            }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{background:"var(--s1)",borderRadius:99,height:8,overflow:"hidden",marginBottom:8}}>
        <div style={{
          width:Math.min(stats.pct,100)+"%",height:"100%",
          background:`linear-gradient(90deg,${stats.pct>=50?"#3b82f6":"#ef4444"},${stats.pct>=100?"#22c55e":"#3b82f6"})`,
          borderRadius:99,
          transition:"width .7s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>

      {/* Stats row 2 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          [stats.feitosPersonal,"Sessões Personal","#a855f7"],
          [stats.feitosTotal,   "Total de Treinos","#f59e0b"],
        ].map(([v,l,c],i) => (
          <div key={i} style={{
            background:"var(--s2)",border:"1px solid var(--bd1)",
            borderRadius:14,padding:"12px 14px",
            display:"flex",alignItems:"center",gap:12,
          }}>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:"1.8rem",letterSpacing:2,
              color:c,minWidth:36,lineHeight:1,
              textShadow:`0 0 14px ${c}44`,
            }}>{v}</div>
            <div style={{fontSize:".58rem",fontWeight:800,color:"var(--t3)",letterSpacing:1,textTransform:"uppercase",lineHeight:1.4}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{
        background:"var(--s2)",
        border:"1px solid var(--bd1)",
        borderRadius:18,
        padding:18,
        position:"relative",overflow:"hidden",
      }}>
        {/* Top accent */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:1,
          background:"linear-gradient(90deg,transparent,rgba(34,197,94,.3),transparent)",
        }} />

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={()=>{let m=calM-1,y=calY;if(m<0){m=11;y--;}setCalM(m);setCalY(y);}} style={{
            background:"var(--s3)",border:"1px solid var(--bd2)",
            borderRadius:9,color:"var(--t1)",
            padding:"6px 14px",cursor:"pointer",fontSize:"1rem",
            transition:"background .15s",
          }}>‹</button>

          <div style={{textAlign:"center"}}>
            <h2 style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:"1.5rem",letterSpacing:4,
              margin:0,color:"var(--t1)",
            }}>{MESES[calM]} {calY}</h2>
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              fontSize:".56rem",
              color:syncStatus==="synced"?"#22c55e":syncStatus==="offline"?"#ef4444":"#f59e0b",
              marginTop:4,
            }}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"currentColor",
                boxShadow:syncStatus==="synced"?"0 0 4px #22c55e":"none",
                animation:syncStatus==="syncing"?"glowPulse 1.2s infinite":"none",
              }} />
              {syncStatus==="synced"?"Sincronizado":syncStatus==="offline"?"Offline":"Sincronizando…"}
            </div>
          </div>

          <button onClick={()=>{let m=calM+1,y=calY;if(m>11){m=0;y++;}setCalM(m);setCalY(y);}} style={{
            background:"var(--s3)",border:"1px solid var(--bd2)",
            borderRadius:9,color:"var(--t1)",
            padding:"6px 14px",cursor:"pointer",fontSize:"1rem",
            transition:"background .15s",
          }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
          {DIAS_PT.map(d=>(
            <div key={d} style={{
              textAlign:"center",fontSize:".5rem",fontWeight:900,
              letterSpacing:1.2,color:"var(--t3)",
              padding:"3px 0",textTransform:"uppercase",
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
          {(()=>{
            const first=new Date(calY,calM,1).getDay();
            const days=new Date(calY,calM+1,0).getDate();
            const today=new Date();
            const cells=[];
            for(let i=0;i<first;i++) cells.push(<div key={"e"+i}/>);
            for(let d=1;d<=days;d++){
              const k=`${calY}-${calM}-${d}`;
              const mk=marks[k]||[];
              const isT=today.getFullYear()===calY&&today.getMonth()===calM&&today.getDate()===d;
              const {bg,bd}=dayStyle(mk);
              const lbl=mk.includes("miss")?"✗":mk.filter(x=>x!=="miss").join("+");
              cells.push(
                <div key={d}
                  onClick={()=>{setDayOpts({A:mk.includes("A"),B:mk.includes("B"),PA:mk.includes("PA"),PB:mk.includes("PB"),miss:mk.includes("miss")});setDayModal(d);}}
                  style={{
                    aspectRatio:"1",borderRadius:9,
                    display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center",
                    cursor:"pointer",
                    border:`1px solid ${isT?"#3b82f6":bd}`,
                    background:isT?`${bg||"transparent"}`:bg,
                    transition:"all .15s",
                    fontSize:".66rem",fontWeight:700,
                    boxShadow: isT ? "0 0 0 1px #3b82f6" : "none",
                  }}>
                  <span style={{
                    color:isT?"#60a5fa":"var(--t1)",
                    fontWeight:isT?900:700,
                  }}>{d}</span>
                  {lbl&&<span style={{fontSize:".4rem",color:"#fbbf24",lineHeight:1,marginTop:1}}>{lbl}</span>}
                </div>
              );
            }
            return cells;
          })()}
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
          {[["#3b82f6","Avulso A"],["#22c55e","Avulso B"],["#fbbf24","A+B"],["#a855f7","Personal"],["#f97316","Misto"],["#ef4444","Faltou"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:".58rem",color:"var(--t3)"}}>
              <div style={{width:8,height:8,borderRadius:3,background:c+"55",border:`1px solid ${c}`}}/>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
