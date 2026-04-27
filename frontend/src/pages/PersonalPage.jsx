import { useState } from "react";
import { useApp } from "../context/AppContext";
import ManagePersonalModal from "../components/workout/ManagePersonalModal";
import PersonalFeedbackFlowModal from "../components/workout/PersonalFeedbackFlowModal";

const P_COLORS = { PA:"#a855f7", PB:"#ec4899", PC:"#06b6d4", PD:"#f59e0b", PE:"#10b981", PF:"#f97316" };
const getPColor = (k, t) => t?.color || P_COLORS[k] || "#a855f7";

const ROMAN = ["I","II","III","IV","V"];

export default function PersonalPage() {
  const {
    allTreinos, setAllTreinos, exDb,
    plogs, setPlogs, pInput, setPInput, pType, setPType,
    fotoData, setFotoData, pLoading, pResult, fileRef, savePersonalLog,
    workoutHistory, archiveWorkout,
  } = useApp();

  const [showManage, setShowManage] = useState(false);
  const [showFeedbackFlow, setShowFeedbackFlow] = useState(false);
  const [pendingPersonalWorkouts, setPendingPersonalWorkouts] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Treinos do personal em ordem (PA, PB, PC...)
  const personalEntries = Object.entries(allTreinos)
    .filter(([k]) => k.startsWith("P"))
    .sort(([a], [b]) => a.localeCompare(b));

  function handleManageSave(newWorkouts, hasChanges) {
    if (!hasChanges) { setShowManage(false); return; }

    // Arquiva treinos do personal antes de substituir
    const currentPersonal = personalEntries.reduce((obj, [k, t]) => { obj[k] = t; return obj; }, {});
    archiveWorkout("personal", currentPersonal);

    // Aplica novos treinos do personal — remove P* antigos e insere novos
    setAllTreinos(prev => {
      const withoutPersonal = Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("P")));
      const marked = Object.fromEntries(
        Object.entries(newWorkouts).map(([k, t]) => [k, { ...t, _edited: true }])
      );
      return { ...withoutPersonal, ...marked };
    });

    setShowManage(false);
    // Guarda cópia dos novos treinos para o fluxo de feedback
    setPendingPersonalWorkouts(newWorkouts);
    setShowFeedbackFlow(true);
  }

  function handleApplyAvulsos(newAvulsoTreinos) {
    setAllTreinos(prev => ({
      ...prev,
      ...newAvulsoTreinos,
    }));
    setPendingPersonalWorkouts(null);
  }

  const historyPersonal = workoutHistory.filter(e => e.type === "personal");

  return (
    <div style={{ animation:"fadeIn .3s ease" }}>

      {/* Header + botão gerenciar */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div style={{ fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#4b5563",textTransform:"uppercase" }}>
          Treinos do Personal
        </div>
        <button onClick={() => setShowManage(true)}
          style={{ background:"rgba(168,85,247,.1)",border:"1px solid rgba(168,85,247,.3)",borderRadius:10,color:"#a855f7",padding:"6px 12px",cursor:"pointer",fontSize:".68rem",fontWeight:800 }}>
          Gerenciar
        </button>
      </div>

      {/* Cards dos treinos do personal (dinâmico — todos P*) */}
      {personalEntries.length === 0 && (
        <div style={{ background:"#13131a",border:"1px dashed #1e1e2c",borderRadius:13,padding:24,textAlign:"center",marginBottom:14 }}>
          <p style={{ color:"#4b5563",fontSize:".78rem" }}>Nenhum treino do personal cadastrado.</p>
          <button onClick={() => setShowManage(true)}
            style={{ marginTop:10,background:"#a855f7",border:"none",borderRadius:10,color:"#fff",padding:"8px 18px",cursor:"pointer",fontSize:".76rem",fontWeight:800 }}>
            Adicionar Treino
          </button>
        </div>
      )}
      {personalEntries.map(([tk, t]) => {
        const color = getPColor(tk, t);
        return (
          <div key={tk} style={{ background:"#13131a",border:"1px solid #1e1e2c",borderRadius:13,padding:14,marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:20,padding:"3px 11px",fontSize:".62rem",fontWeight:900 }}>
                  {tk}
                </span>
                <span style={{ color:"#c9ced6",fontWeight:700,fontSize:".78rem" }}>{t.label}</span>
                {t.dia && <span style={{ color:"#4b5563",fontSize:".65rem" }}>{t.dia}</span>}
              </div>
            </div>
            {t.blocos?.map((bl, bi) => (
              <div key={bi} style={{ marginBottom: bi < t.blocos.length-1 ? 10 : 0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
                  <span style={{ background:`${color}15`,color,border:`1px solid ${color}25`,borderRadius:4,padding:"1px 7px",fontSize:".6rem",fontWeight:900 }}>
                    B{ROMAN[bi] || bi+1}
                  </span>
                  {bl.nome && <span style={{ fontSize:".72rem",color:"#6b7280",fontWeight:700 }}>{bl.nome}</span>}
                </div>
                <div style={{ paddingLeft:6 }}>
                  {bl.exercises?.map((ex, ei) => {
                    const exData = exDb[ex.id];
                    const name = exData?.name || ex.id.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase());
                    return (
                      <div key={ei} style={{
                        fontSize:".77rem",color:"#c9ced6",lineHeight:1.7,
                        display:"flex",justifyContent:"space-between",alignItems:"baseline",
                        borderBottom: ei < bl.exercises.length-1 ? "1px solid #111118" : "none",
                        padding:"2px 0",
                      }}>
                        <span>{ei+1}. {name}</span>
                        <span style={{ fontSize:".65rem",color:"#4b5563",fontWeight:700,whiteSpace:"nowrap",marginLeft:8 }}>
                          {ex.s}×{ex.r}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Novo registro */}
      <div style={{ background:"#13131a",border:"1px solid #1e1e2c",borderRadius:13,padding:14,marginBottom:14 }}>
        <div style={{ fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#4b5563",textTransform:"uppercase",marginBottom:10 }}>Novo Registro</div>
        <div style={{ display:"flex",gap:6,marginBottom:10 }}>
          {[["text","📝 Texto"],["foto","📷 Foto"]].map(([k,l]) => (
            <button key={k} onClick={() => setPType(k)} style={{
              flex:1,padding:"8px",borderRadius:9,cursor:"pointer",
              background: pType===k ? "rgba(59,130,246,.12)" : "#111118",
              border: `1px solid ${pType===k ? "#3b82f655" : "#1e1e2c"}`,
              color: pType===k ? "#60a5fa" : "#4b5563",fontWeight:800,fontSize:".72rem",
            }}>{l}</button>
          ))}
        </div>
        {pType==="foto" && (
          <div>
            <label style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",background:"#111118",border:"1px dashed #1e1e2c",borderRadius:10,padding:14,cursor:"pointer",fontSize:".78rem",color:"#4b5563",marginBottom:8 }}>
              <input type="file" accept="image/*" ref={fileRef}
                onChange={e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setFotoData(ev.target.result); r.readAsDataURL(f); }}
                style={{ display:"none" }} />
              📷 Escolher foto
            </label>
            {fotoData && <img src={fotoData} style={{ width:"100%",borderRadius:10,marginBottom:8,maxHeight:180,objectFit:"cover" }} alt="preview" />}
          </div>
        )}
        <textarea value={pInput} onChange={e => setPInput(e.target.value)}
          placeholder={pType==="text" ? "Cole o treino aqui..." : "Observações..."}
          style={{ width:"100%",background:"#111118",border:"1px solid #1e1e2c",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".8rem",resize:"vertical",minHeight:80,outline:"none",fontFamily:"DM Sans,sans-serif",marginBottom:8 }} />
        <button onClick={savePersonalLog}
          style={{ width:"100%",background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,padding:10,fontWeight:900,fontSize:".82rem",cursor:"pointer" }}>
          💾 Salvar e Analisar
        </button>
        {pLoading && (
          <div style={{ display:"flex",alignItems:"center",gap:10,color:"#60a5fa",fontSize:".78rem",padding:"10px 0" }}>
            <div style={{ width:16,height:16,border:"2px solid rgba(59,130,246,.3)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin .7s linear infinite" }} />
            Processando com IA...
          </div>
        )}
        {pResult && (
          <div style={{ background:"rgba(34,197,94,.05)",border:"1px solid rgba(34,197,94,.18)",borderRadius:11,padding:12,marginTop:8,fontSize:".78rem",color:"#a7f3d0",lineHeight:1.7,whiteSpace:"pre-wrap" }}>
            {pResult}
          </div>
        )}
      </div>

      {/* Histórico de registros */}
      <div style={{ fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#4b5563",textTransform:"uppercase",marginBottom:10 }}>
        Histórico de Registros
      </div>
      {!plogs.length
        ? <p style={{ color:"#4b5563",fontSize:".78rem" }}>Nenhum registro ainda.</p>
        : plogs.map(l => (
          <div key={l.id} style={{ background:"#13131a",border:"1px solid #1e1e2c",borderRadius:12,padding:12,marginBottom:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{
                background: l.type==="text" ? "rgba(59,130,246,.12)" : "rgba(34,197,94,.12)",
                color: l.type==="text" ? "#60a5fa" : "#4ade80",
                border: `1px solid ${l.type==="text" ? "rgba(59,130,246,.25)" : "rgba(34,197,94,.25)"}`,
                borderRadius:20,padding:"2px 9px",fontSize:".6rem",fontWeight:900,
              }}>{l.type==="text" ? "📝" : "📷"} {l.date}</span>
              <button onClick={() => setPlogs(p => p.filter(x => x.id !== l.id))}
                style={{ background:"none",border:"none",color:"#374151",cursor:"pointer",fontSize:".72rem" }}>🗑</button>
            </div>
            {l.foto && <img src={l.foto} style={{ width:"100%",borderRadius:8,marginBottom:8,maxHeight:160,objectFit:"cover" }} alt="treino" />}
            <p style={{ fontSize:".76rem",color:"#c9ced6",lineHeight:1.6,marginBottom:l.analysis ? 6 : 0 }}>{l.content}</p>
            {l.analysis && (
              <div style={{ background:"rgba(34,197,94,.04)",border:"1px solid rgba(34,197,94,.12)",borderRadius:8,padding:"9px 11px",fontSize:".72rem",color:"#a7f3d0",lineHeight:1.6 }}>
                {l.analysis}
              </div>
            )}
          </div>
        ))
      }

      {/* Treinos arquivados */}
      {historyPersonal.length > 0 && (
        <div style={{ marginTop:16 }}>
          <button onClick={() => setShowHistory(h => !h)}
            style={{ width:"100%",background:"transparent",border:"1px solid #1e1e2c",borderRadius:11,padding:"10px 14px",cursor:"pointer",color:"#374151",fontSize:".65rem",fontWeight:800,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span>TREINOS ARQUIVADOS ({historyPersonal.length})</span>
            <span>{showHistory ? "▲" : "▼"}</span>
          </button>
          {showHistory && historyPersonal.map(entry => (
            <div key={entry.id} style={{ background:"#13131a",border:"1px solid #1e1e2c",borderRadius:12,padding:12,marginTop:6 }}>
              <div style={{ fontSize:".6rem",color:"#374151",fontWeight:700,marginBottom:8 }}>Arquivado em {entry.date}</div>
              {Object.entries(entry.data || {}).map(([k, t]) => {
                const color = getPColor(k, t);
                return (
                  <div key={k} style={{ marginBottom:8 }}>
                    <span style={{ background:`${color}12`,color,border:`1px solid ${color}25`,borderRadius:20,padding:"2px 9px",fontSize:".6rem",fontWeight:900 }}>
                      {k}
                    </span>
                    <span style={{ color:"#4b5563",fontSize:".7rem",marginLeft:8 }}>{t.label}</span>
                    {t.dia && <span style={{ color:"#374151",fontSize:".65rem",marginLeft:6 }}>{t.dia}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {showManage && (
        <ManagePersonalModal
          allTreinos={allTreinos}
          exDb={exDb}
          onSave={handleManageSave}
          onClose={() => setShowManage(false)}
        />
      )}
      {showFeedbackFlow && (
        <PersonalFeedbackFlowModal
          personalTreinos={pendingPersonalWorkouts || personalEntries.reduce((o,[k,t]) => { o[k]=t; return o; }, {})}
          onApply={handleApplyAvulsos}
          onClose={() => { setShowFeedbackFlow(false); setPendingPersonalWorkouts(null); }}
        />
      )}
    </div>
  );
}
