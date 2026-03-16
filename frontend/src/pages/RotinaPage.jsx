import { useApp } from "../context/AppContext";
import { DIAS_FULL } from "../data/constants";

export default function RotinaPage() {
  const { rotina, setRotina, addRT, setAddRT, addRI, setAddRI } = useApp();

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#6b7280",textTransform:"uppercase",marginBottom:14}}>📋 Rotina Semanal</div>
      {[0,1,2,3,4,5,6].map(i => (
        <div key={i} style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:14,marginBottom:10,overflow:"hidden"}}>
          <div style={{padding:"10px 16px",background:"#1a1a24",borderBottom:"1px solid #2a2a3a"}}>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.05rem",letterSpacing:2}}>{DIAS_FULL[i]}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
            {rotina[i].map((turno,ti) => (
              <div key={ti} style={{borderRight:ti<2?"1px solid #2a2a3a":"none",padding:"10px 10px"}}>
                <div style={{fontSize:".54rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase",marginBottom:7}}>{["☀️ M","🌤️ T","🌙 N"][ti]}</div>
                {turno.a.map((a,ai) => (
                  <div key={ai} style={{display:"flex",alignItems:"center",gap:4,background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:7,padding:"4px 7px",fontSize:".7rem",fontWeight:600,marginBottom:4}}>
                    <span style={{flex:1}}>{a}</span>
                    <button onClick={()=>setRotina(p=>{const n=JSON.parse(JSON.stringify(p));n[i][ti].a.splice(ai,1);return n;})} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:".65rem"}}>✕</button>
                  </div>
                ))}
                {addRT?.day===i&&addRT?.turno===ti ? (
                  <div style={{display:"flex",gap:3}}>
                    <input autoFocus value={addRI} onChange={e=>setAddRI(e.target.value)}
                      onKeyDown={e=>{
                        if(e.key==="Enter"&&addRI.trim()){setRotina(p=>{const n=JSON.parse(JSON.stringify(p));n[i][ti].a.push(addRI.trim());return n;});setAddRI("");setAddRT(null);}
                        if(e.key==="Escape")setAddRT(null);
                      }}
                      placeholder="..."
                      style={{flex:1,background:"#1a1a24",border:"1px solid #3b82f6",borderRadius:7,padding:"4px 7px",color:"#f0f0f8",fontSize:".7rem",outline:"none"}} />
                    <button
                      onClick={()=>{if(addRI.trim()){setRotina(p=>{const n=JSON.parse(JSON.stringify(p));n[i][ti].a.push(addRI.trim());return n;});setAddRI("");setAddRT(null);}}}
                      style={{background:"#3b82f6",border:"none",borderRadius:7,color:"#fff",padding:"4px 8px",cursor:"pointer",fontSize:".7rem"}}>✓</button>
                  </div>
                ) : (
                  <button onClick={()=>{setAddRT({day:i,turno:ti});setAddRI("");}}
                    style={{background:"none",border:"1px dashed #2a2a3a",borderRadius:7,padding:"4px 7px",fontSize:".63rem",color:"#6b7280",width:"100%",textAlign:"left",cursor:"pointer"}}>+ Add</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
