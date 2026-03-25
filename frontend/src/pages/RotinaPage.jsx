import { useApp } from "../context/AppContext";
import { DIAS_FULL } from "../data/constants";

const TURNO_CONFIG = [
  { label:"Manhã",  icon:"☀️",  color:"#f59e0b" },
  { label:"Tarde",  icon:"🌤️", color:"#3b82f6" },
  { label:"Noite",  icon:"🌙",  color:"#a855f7" },
];

// Fins de semana têm cor diferente no cabeçalho
const DAY_COLOR = [
  "#ef4444", // Dom
  "#3b82f6", // Seg
  "#22c55e", // Ter
  "#f59e0b", // Qua
  "#a855f7", // Qui
  "#ec4899", // Sex
  "#ef4444", // Sáb
];

export default function RotinaPage() {
  const { rotina, setRotina, addRT, setAddRT, addRI, setAddRI } = useApp();

  return (
    <div style={{animation:"slideUp .35s cubic-bezier(.2,0,.2,1)"}}>
      <div style={{
        fontSize:".55rem",fontWeight:900,letterSpacing:3,
        color:"var(--t3)",textTransform:"uppercase",marginBottom:16,
        display:"flex",alignItems:"center",gap:6,
      }}>
        <span style={{fontSize:"1rem"}}>📋</span> Rotina Semanal
      </div>

      {[0,1,2,3,4,5,6].map(i => {
        const dayColor = DAY_COLOR[i];
        return (
          <div key={i} style={{
            background:"var(--s2)",
            border:"1px solid var(--bd1)",
            borderRadius:15,
            marginBottom:10,
            overflow:"hidden",
          }}>
            {/* Day header */}
            <div style={{
              padding:"10px 16px",
              background:`linear-gradient(90deg,${dayColor}12,transparent)`,
              borderBottom:"1px solid var(--bd1)",
              display:"flex",alignItems:"center",gap:8,
            }}>
              <div style={{width:3,height:14,borderRadius:2,background:dayColor,flexShrink:0,boxShadow:`0 0 6px ${dayColor}66`}} />
              <span style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:"1.05rem",letterSpacing:2.5,
                color:"var(--t1)",
              }}>{DIAS_FULL[i]}</span>
            </div>

            {/* Turnos */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
              {rotina[i].map((turno,ti) => {
                const tc = TURNO_CONFIG[ti];
                return (
                  <div key={ti} style={{
                    borderRight:ti<2?"1px solid var(--bd1)":"none",
                    padding:"10px 10px",
                  }}>
                    {/* Turno header */}
                    <div style={{
                      fontSize:".5rem",fontWeight:900,letterSpacing:1.5,
                      color:tc.color,textTransform:"uppercase",marginBottom:7,
                      display:"flex",alignItems:"center",gap:3,
                    }}>
                      <span style={{fontSize:".75rem"}}>{tc.icon}</span>
                      <span>{tc.label}</span>
                    </div>

                    {turno.a.map((a,ai) => (
                      <div key={ai} style={{
                        display:"flex",alignItems:"center",gap:4,
                        background:"var(--s3)",
                        border:"1px solid var(--bd1)",
                        borderRadius:8,padding:"4px 8px",
                        fontSize:".68rem",fontWeight:600,
                        marginBottom:4,
                        color:"var(--t2)",
                      }}>
                        <span style={{flex:1}}>{a}</span>
                        <button
                          onClick={()=>setRotina(p=>{const n=JSON.parse(JSON.stringify(p));n[i][ti].a.splice(ai,1);return n;})}
                          style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:".6rem",padding:"0 2px",lineHeight:1}}>✕</button>
                      </div>
                    ))}

                    {addRT?.day===i && addRT?.turno===ti ? (
                      <div style={{display:"flex",gap:3}}>
                        <input autoFocus value={addRI} onChange={e=>setAddRI(e.target.value)}
                          onKeyDown={e=>{
                            if(e.key==="Enter"&&addRI.trim()){setRotina(p=>{const n=JSON.parse(JSON.stringify(p));n[i][ti].a.push(addRI.trim());return n;});setAddRI("");setAddRT(null);}
                            if(e.key==="Escape")setAddRT(null);
                          }}
                          placeholder="…"
                          style={{flex:1,background:"var(--s1)",border:`1px solid ${tc.color}55`,borderRadius:8,padding:"4px 8px",color:"var(--t1)",fontSize:".68rem",outline:"none"}} />
                        <button
                          onClick={()=>{if(addRI.trim()){setRotina(p=>{const n=JSON.parse(JSON.stringify(p));n[i][ti].a.push(addRI.trim());return n;});setAddRI("");setAddRT(null);}}}
                          style={{background:tc.color,border:"none",borderRadius:8,color:"#fff",padding:"4px 9px",cursor:"pointer",fontSize:".7rem"}}>✓</button>
                      </div>
                    ) : (
                      <button onClick={()=>{setAddRT({day:i,turno:ti});setAddRI("");}}
                        style={{
                          background:"none",
                          border:`1px dashed var(--bd2)`,
                          borderRadius:8,padding:"4px 8px",
                          fontSize:".6rem",color:"var(--t3)",
                          width:"100%",textAlign:"left",cursor:"pointer",
                          transition:"border-color .15s, color .15s",
                        }}
                        onMouseOver={e=>{e.target.style.borderColor=tc.color+"55";e.target.style.color=tc.color;}}
                        onMouseOut={e=>{e.target.style.borderColor="var(--bd2)";e.target.style.color="var(--t3)";}}>+ Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
