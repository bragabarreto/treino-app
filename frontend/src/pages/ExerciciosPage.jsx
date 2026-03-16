import { useState } from "react";
import { useApp } from "../context/AppContext";
import { getImagesForEx } from "../lib/imageUtils";
import { CATEGORIES } from "../data/exerciseDatabase";

const CATEGORY_COLORS = {
  "Peito":"#ef4444","Costas":"#3b82f6","Costas/Ombros":"#6366f1","Costas/Peito":"#8b5cf6",
  "Ombros":"#06b6d4","Bíceps":"#10b981","Tríceps":"#f59e0b","Pernas":"#f97316",
  "Cadeia Posterior":"#ec4899","Glúteo":"#a855f7","Adutores":"#e879f9",
  "Panturrilha":"#84cc16","Core":"#22c55e","Funcional":"#14b8a6","Antebraço":"#fb923c",
};

export default function ExerciciosPage() {
  const { exDb, userImages, userVideos, setDetailEx, searchQ, setSearchQ, setShowAddEx } = useApp();
  const [catFilter, setCatFilter] = useState("Todos");

  const filteredExs = Object.entries(exDb).filter(([id, ex]) => {
    const matchCat = catFilter === "Todos" || ex.category === catFilter;
    const matchQ = !searchQ ||
      ex.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
      (ex.muscles || []).join(" ").toLowerCase().includes(searchQ.toLowerCase()) ||
      (ex.category || "").toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  // Collect categories actually present in the DB
  const availableCats = ["Todos", ...CATEGORIES.filter(c => Object.values(exDb).some(e => e.category === c))];

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8}}>
        <div>
          <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:3,color:"#6b7280",textTransform:"uppercase",marginBottom:3}}>{filteredExs.length} exercícios no banco</div>
          <div style={{fontSize:".6rem",color:"#f59e0b",display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#f59e0b",display:"inline-block"}} />
            Laranja = imagem personalizada
          </div>
        </div>
        <button onClick={()=>setShowAddEx(true)}
          style={{background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:11,color:"#fff",fontWeight:900,padding:"9px 14px",cursor:"pointer",fontSize:".78rem",letterSpacing:.5,whiteSpace:"nowrap",boxShadow:"0 4px 12px rgba(34,197,94,.25)"}}>
          ➕ Novo Exercício
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="🔍 Buscar por nome, músculo ou categoria..."
        value={searchQ} onChange={e=>setSearchQ(e.target.value)}
        style={{width:"100%",background:"#13131a",border:"1px solid #2a2a3a",borderRadius:12,padding:"11px 14px",color:"#f0f0f8",fontSize:".85rem",outline:"none",marginBottom:10}} />

      {/* Category filter chips */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {availableCats.map(cat => {
          const active = catFilter === cat;
          const color = cat === "Todos" ? "#6b7280" : (CATEGORY_COLORS[cat] || "#6b7280");
          return (
            <button key={cat} onClick={()=>setCatFilter(cat)}
              style={{padding:"4px 11px",borderRadius:20,fontSize:".62rem",fontWeight:800,cursor:"pointer",transition:"all .15s",
                background:active ? color+"33" : "transparent",
                border:`1px solid ${active ? color : "#2a2a3a"}`,
                color:active ? color : "#6b7280"}}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
        {filteredExs.map(([id, ex]) => {
          const imgs = getImagesForEx(id, userImages, exDb);
          const hasUserImg = userImages?.[id]?.length > 0;
          const hasVideo = !!userVideos?.[id] || !!ex.videoId;
          const isUserAdded = !!ex.userAdded;
          const borderColor = isUserAdded ? "#22c55e44" : (hasUserImg ? "#f59e0b44" : "#2a2a3a");
          return (
            <div key={id} onClick={()=>setDetailEx(id)}
              style={{background:"#13131a",border:`1px solid ${borderColor}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"border-color .2s,transform .15s",position:"relative"}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=isUserAdded?"#22c55e":hasUserImg?"#f59e0b":"#3b82f6";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=borderColor;e.currentTarget.style.transform="translateY(0)";}}>
              {/* Badges */}
              <div style={{position:"absolute",top:6,right:6,zIndex:2,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                {isUserAdded && <span style={{background:"rgba(34,197,94,.9)",borderRadius:5,padding:"1px 5px",fontSize:".5rem",fontWeight:900,color:"#000"}}>MEU</span>}
                {hasUserImg && <span style={{background:"rgba(245,158,11,.9)",borderRadius:5,padding:"1px 5px",fontSize:".5rem",fontWeight:900,color:"#000"}}>📷</span>}
                {hasVideo && <span style={{background:"rgba(239,68,68,.85)",borderRadius:5,padding:"1px 5px",fontSize:".5rem",fontWeight:900,color:"#fff"}}>▶</span>}
              </div>
              {/* Images — hover swaps to second image via CSS transition */}
              <div className="ex-img-wrap"
                style={{height:90,position:"relative",background:"#1a1a24",overflow:"hidden"}}>
                {imgs.length > 0 ? (
                  <>
                    <img src={imgs[0]} alt={ex.name}
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"opacity .3s"}}
                      onError={e=>e.target.style.display="none"} />
                    {imgs[1] && (
                      <img src={imgs[1]} alt={ex.name}
                        className="ex-img-hover"
                        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0,transition:"opacity .3s"}}
                        onError={e=>e.target.style.display="none"} />
                    )}
                  </>
                ) : (
                  <div style={{height:90,display:"flex",alignItems:"center",justifyContent:"center",color:"#2a2a3a",fontSize:"2rem"}}>🏋️</div>
                )}
              </div>
              <div style={{padding:10}}>
                <div style={{fontWeight:800,fontSize:".82rem",marginBottom:4,lineHeight:1.3}}>{ex.name}</div>
                <div style={{marginBottom:4}}>
                  <span style={{background:`${CATEGORY_COLORS[ex.category]||"#6b7280"}22`,color:CATEGORY_COLORS[ex.category]||"#6b7280",border:`1px solid ${CATEGORY_COLORS[ex.category]||"#6b7280"}44`,borderRadius:6,padding:"2px 7px",fontSize:".58rem",fontWeight:800,marginRight:3}}>{ex.category}</span>
                </div>
                <div style={{fontSize:".64rem",color:"#6b7280",lineHeight:1.4}}>{(ex.muscles||[]).join(" · ")}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
