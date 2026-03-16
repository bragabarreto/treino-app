import { useState } from "react";
import { callAI } from "../../lib/api";
import { slugify } from "../../lib/helpers";

export default function AddExerciseModal({ initialData, onSave, onClose }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(() => initialData ? {
    name: initialData.name || "",
    category: initialData.category || "",
    equipment: initialData.equipment || "",
    muscles: (initialData.muscles || []).join(", "),
    description: initialData.description || "",
    steps: initialData.steps?.length ? [...initialData.steps] : ["", "", ""],
    tips: initialData.tips?.length ? [...initialData.tips] : ["", ""],
  } : {
    name: "", category: "", equipment: "", muscles: "",
    description: "", steps: ["", "", ""], tips: ["", ""],
  });
  const [aiLoading, setAiLoading] = useState(false);

  const set = (k, v) => setForm(p => ({...p, [k]: v}));

  async function fillWithAI() {
    if (!form.name.trim()) { alert("Digite o nome do exercício primeiro."); return; }
    setAiLoading(true);
    try {
      const txt = await callAI([{role:"user", content:`Você é personal trainer especialista. Para o exercício "${form.name}", responda APENAS com JSON válido (sem markdown): {"category":"categoria curta em português","equipment":"equipamento principal","muscles":["músculo1","músculo2","músculo3"],"description":"2-3 frases descritivas em português","steps":["passo 1","passo 2","passo 3","passo 4","passo 5"],"tips":["dica 1","dica 2","dica 3"]}`}]);
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s !== -1) {
        const p = JSON.parse(txt.slice(s, e+1));
        setForm(f => ({
          ...f,
          category: p.category || f.category,
          equipment: p.equipment || f.equipment,
          muscles: Array.isArray(p.muscles) ? p.muscles.join(", ") : (p.muscles || f.muscles),
          description: p.description || f.description,
          steps: p.steps?.filter(Boolean) || f.steps,
          tips: p.tips?.filter(Boolean) || f.tips,
        }));
      }
    } catch(err) { alert("Erro IA: " + err.message); }
    setAiLoading(false);
  }

  function handleSave() {
    if (!form.name.trim()) { alert("Nome do exercício é obrigatório."); return; }
    const id = initialData?.id || slugify(form.name);
    const muscles = form.muscles.split(",").map(m => m.trim()).filter(Boolean);
    const steps = form.steps.filter(Boolean);
    const tips = form.tips.filter(Boolean);
    onSave(id, { name: form.name.trim(), category: form.category, equipment: form.equipment, muscles, description: form.description, steps, tips, userAdded: true });
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:16}} onClick={onClose}>
      <div style={{background:"#13131a",border:"1px solid #22c55e44",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",padding:22}} onClick={e=>e.stopPropagation()}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",letterSpacing:3,color:"#22c55e",margin:0}}>{isEdit ? "✏️ EDITAR EXERCÍCIO" : "➕ NOVO EXERCÍCIO"}</h3>
          <button onClick={onClose} style={{background:"none",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"4px 10px",cursor:"pointer"}}>✕</button>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:".62rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase",display:"block",marginBottom:5}}>Nome do Exercício *</label>
          <div style={{display:"flex",gap:8}}>
            <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ex: Agachamento Livre" style={{flex:1,background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 13px",color:"#f0f0f8",fontSize:".88rem",outline:"none"}} />
            <button onClick={fillWithAI} disabled={aiLoading} style={{background:"rgba(59,130,246,.15)",border:"1px solid rgba(59,130,246,.3)",borderRadius:10,color:"#60a5fa",fontWeight:900,cursor:aiLoading?"not-allowed":"pointer",padding:"8px 12px",fontSize:".72rem",whiteSpace:"nowrap"}}>
              {aiLoading ? "⏳..." : "✨ IA"}
            </button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[["category","Categoria","Ex: Pernas"],["equipment","Equipamento","Ex: Halteres"]].map(([k,l,ph])=>(
            <div key={k}>
              <label style={{fontSize:".62rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase",display:"block",marginBottom:5}}>{l}</label>
              <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".82rem",outline:"none"}} />
            </div>
          ))}
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:".62rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase",display:"block",marginBottom:5}}>Músculos (separados por vírgula)</label>
          <input value={form.muscles} onChange={e=>set("muscles",e.target.value)} placeholder="Ex: Quadríceps, Glúteo, Isquiotibiais" style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".82rem",outline:"none"}} />
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:".62rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase",display:"block",marginBottom:5}}>Descrição</label>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Benefícios e características do exercício..." rows={3} style={{width:"100%",background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:10,padding:"9px 12px",color:"#f0f0f8",fontSize:".82rem",outline:"none",resize:"vertical",fontFamily:"DM Sans,sans-serif"}} />
        </div>

        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{fontSize:".62rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase"}}>Passos de Execução</label>
            <button onClick={()=>set("steps",[...form.steps,""])} style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:7,color:"#4ade80",padding:"3px 10px",fontSize:".65rem",fontWeight:800,cursor:"pointer"}}>+ passo</button>
          </div>
          {form.steps.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:6,marginBottom:5,alignItems:"center"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(59,130,246,.15)",border:"1px solid #3b82f6",color:"#60a5fa",fontSize:".65rem",fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
              <input value={s} onChange={e=>set("steps",form.steps.map((x,j)=>j===i?e.target.value:x))} placeholder={`Passo ${i+1}...`} style={{flex:1,background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,padding:"7px 10px",color:"#f0f0f8",fontSize:".8rem",outline:"none"}} />
              {form.steps.length > 1 && <button onClick={()=>set("steps",form.steps.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:".75rem",flexShrink:0}}>✕</button>}
            </div>
          ))}
        </div>

        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{fontSize:".62rem",fontWeight:900,letterSpacing:1.5,color:"#6b7280",textTransform:"uppercase"}}>Dicas</label>
            <button onClick={()=>set("tips",[...form.tips,""])} style={{background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.25)",borderRadius:7,color:"#fbbf24",padding:"3px 10px",fontSize:".65rem",fontWeight:800,cursor:"pointer"}}>+ dica</button>
          </div>
          {form.tips.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:6,marginBottom:5,alignItems:"center"}}>
              <span style={{flexShrink:0,fontSize:".85rem"}}>💡</span>
              <input value={t} onChange={e=>set("tips",form.tips.map((x,j)=>j===i?e.target.value:x))} placeholder={`Dica ${i+1}...`} style={{flex:1,background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,padding:"7px 10px",color:"#f0f0f8",fontSize:".8rem",outline:"none"}} />
              {form.tips.length > 1 && <button onClick={()=>set("tips",form.tips.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:".75rem",flexShrink:0}}>✕</button>}
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:11,borderRadius:11,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem"}}>Cancelar</button>
          <button onClick={handleSave} style={{flex:2,padding:11,borderRadius:11,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:".85rem"}}>
            {isEdit ? "💾 Salvar Alterações" : "➕ Adicionar ao Banco"}
          </button>
        </div>
      </div>
    </div>
  );
}
