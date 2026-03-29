import { useApp } from "../../context/AppContext";
import { MESES, DIAS_PT } from "../../data/constants";

export default function DayModal() {
  const { calY, calM, marks, setMarks, dayModal, setDayModal, dayOpts, setDayOpts, saveMarkToCloud } = useApp();
  if (!dayModal) return null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",padding:16}} onClick={()=>setDayModal(null)}>
      <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:20,padding:24,width:"100%",maxWidth:360}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",letterSpacing:3,marginBottom:8}}>
          {DIAS_PT[new Date(calY,calM,dayModal).getDay()]} {dayModal} — {MESES[calM].slice(0,3)}
        </h3>
        <p style={{fontSize:".7rem",color:"#6b7280",marginBottom:12}}>Selecione todos os treinos realizados:</p>
        {[["A","Treino Avulso A","#3b82f6"],["B","Treino Avulso B","#22c55e"],["PA","Personal — Treino A","#a855f7"],["PB","Personal — Treino B","#ec4899"],["EX","Treino Extra","#f59e0b"],["miss","Nao treinei hoje","#ef4444"]].map(([k,l,c]) => (
          <div key={k}
            onClick={()=>{if(k==="miss")setDayOpts({A:false,B:false,PA:false,PB:false,EX:false,miss:!dayOpts.miss});else setDayOpts(p=>({...p,miss:false,[k]:!p[k]}));}}
            style={{padding:"11px 14px",borderRadius:11,background:dayOpts[k]?c+"22":"#1a1a24",border:`2px solid ${dayOpts[k]?c:"#2a2a3a"}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,marginBottom:8,transition:"all .2s"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:dayOpts[k]?c:"transparent",border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {dayOpts[k]&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
            </div>
            <span style={{fontWeight:700,fontSize:".84rem"}}>{l}</span>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={()=>setDayModal(null)} style={{flex:1,padding:11,borderRadius:11,border:"none",background:"#1a1a24",color:"#6b7280",fontWeight:900,cursor:"pointer"}}>Cancelar</button>
          <button
            onClick={()=>{const k=`${calY}-${calM}-${dayModal}`;const nm={...marks};delete nm[k];setMarks(nm);saveMarkToCloud(k,[]);setDayModal(null);}}
            style={{flex:1,padding:11,borderRadius:11,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.1)",color:"#f87171",fontWeight:900,cursor:"pointer"}}>
            Limpar
          </button>
          <button
            onClick={()=>{
              const k=`${calY}-${calM}-${dayModal}`;
              const chosen=[];
              if(dayOpts.miss)chosen.push("miss");
              else["A","B","PA","PB","EX"].forEach(t=>{if(dayOpts[t])chosen.push(t);});
              if(!chosen.length){const nm={...marks};delete nm[k];setMarks(nm);saveMarkToCloud(k,[]);}
              else{setMarks(p=>({...p,[k]:chosen}));saveMarkToCloud(k,chosen);}
              setDayModal(null);
            }}
            style={{flex:1,padding:11,borderRadius:11,border:"none",background:"#3b82f6",color:"#fff",fontWeight:900,cursor:"pointer"}}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
