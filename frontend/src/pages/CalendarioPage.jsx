import { useApp } from "../context/AppContext";
import { MESES, DIAS_PT } from "../data/constants";

export default function CalendarioPage() {
  const { calY, setCalY, calM, setCalM, marks, setMarks, syncStatus, saveMarkToCloud, getStats, dayStyle, setDayModal, setDayOpts } = useApp();
  const stats = getStats();

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      {/* Stats row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
        {[
          [stats.feitosAvulso,"Avulsos Feitos","#3b82f6"],
          [stats.posAvulso,"Avulsos Possíveis","#6b7280"],
          [stats.pct+"%","Meta Avulso",stats.pct>=100?"#22c55e":stats.pct>=50?"#fbbf24":"#ef4444"],
        ].map(([v,l,c],i)=>(
          <div key={i} style={{background:"#13131a",border:`1px solid ${i===2?c+"44":"#2a2a3a"}`,borderRadius:13,padding:14,textAlign:"center"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.8rem",letterSpacing:2,color:c}}>{v}</div>
            <div style={{fontSize:".58rem",fontWeight:800,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",lineHeight:1.3}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{background:"#1a1a24",borderRadius:99,height:7,overflow:"hidden",marginBottom:8}}>
        <div style={{width:Math.min(stats.pct,100)+"%",height:"100%",background:`linear-gradient(90deg,${stats.pct>=50?"#3b82f6":"#ef4444"},${stats.pct>=100?"#22c55e":"#3b82f6"})`,borderRadius:99,transition:"width .7s"}} />
      </div>

      {/* Stats row 2 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          [stats.feitosPersonal,"Sessões Personal","#a855f7"],
          [stats.feitosTotal,"Total de Treinos","#f59e0b"],
        ].map(([v,l,c],i)=>(
          <div key={i} style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.6rem",letterSpacing:2,color:c,minWidth:36}}>{v}</div>
            <div style={{fontSize:".6rem",fontWeight:800,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",lineHeight:1.3}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:16,padding:18}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={()=>{let m=calM-1,y=calY;if(m<0){m=11;y--;}setCalM(m);setCalY(y);}} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,color:"#f0f0f8",padding:"5px 13px",cursor:"pointer",fontSize:"1rem"}}>‹</button>
          <div style={{textAlign:"center"}}>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:3,margin:0}}>{MESES[calM]} {calY}</h2>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:".6rem",color:syncStatus==="synced"?"#22c55e":syncStatus==="offline"?"#ef4444":"#f59e0b",marginTop:3}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}} />
              {syncStatus==="synced"?"Sincronizado":syncStatus==="offline"?"Offline":"Sincronizando..."}
            </div>
          </div>
          <button onClick={()=>{let m=calM+1,y=calY;if(m>11){m=0;y++;}setCalM(m);setCalY(y);}} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,color:"#f0f0f8",padding:"5px 13px",cursor:"pointer",fontSize:"1rem"}}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
          {DIAS_PT.map(d=><div key={d} style={{textAlign:"center",fontSize:".52rem",fontWeight:900,letterSpacing:1,color:"#6b7280",padding:"4px 0",textTransform:"uppercase"}}>{d}</div>)}
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
                  onClick={()=>{setDayOpts({A:mk.includes("A"),B:mk.includes("B"),PA:mk.includes("PA"),PB:mk.includes("PB"),EX:mk.includes("EX"),miss:mk.includes("miss")});setDayModal(d);}}
                  style={{aspectRatio:"1",borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`1px solid ${isT?"#3b82f6":bd}`,background:bg,transition:"all .15s",fontSize:".68rem",fontWeight:700}}>
                  <span style={{color:isT?"#60a5fa":"#f0f0f8"}}>{d}</span>
                  {lbl&&<span style={{fontSize:".42rem",color:"#fbbf24",lineHeight:1,marginTop:1}}>{lbl}</span>}
                </div>
              );
            }
            return cells;
          })()}
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
          {[["#3b82f6","Avulso A"],["#22c55e","Avulso B"],["#fbbf24","A+B"],["#a855f7","Personal"],["#f59e0b","Extra"],["#f97316","Misto"],["#ef4444","Faltou"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:".62rem",color:"#6b7280"}}><div style={{width:9,height:9,borderRadius:3,background:c+"66",border:`1px solid ${c}`}}/>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
