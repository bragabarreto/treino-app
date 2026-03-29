import { useState, useEffect, useRef } from "react";
import { getImagesForEx } from "../../lib/imageUtils";
import { extractYTId } from "../../lib/helpers";
import { callAI, searchExerciseImages } from "../../lib/api";
import ImageUploadModal from "./ImageUploadModal";
import AIImageSearchModal from "./AIImageSearchModal";
import AddExerciseModal from "./AddExerciseModal";

export default function ExerciseModal({ exId, db, userImages, userVideos, onClose, onUpdateEx, onSaveImages, onSaveVideo, onDeleteEx }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [imgError, setImgError] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [webImgs, setWebImgs] = useState(null);
  const [autoSearching, setAutoSearching] = useState(false);
  const [showYTInput, setShowYTInput] = useState(false);
  const [ytInput, setYtInput] = useState(userVideos?.[exId] || "");
  const autoSearchDone = useRef(false);

  const ex = db[exId];
  if (!ex) return null;

  const hasUserImgs = userImages?.[exId]?.length > 0;
  const hasDbImgs = ex.images?.length > 0;
  const imgs = hasUserImgs ? userImages[exId] : (webImgs || getImagesForEx(exId, userImages, db));

  // Auto-enrich: buscar imagens reais automaticamente quando não há userImages
  useEffect(() => {
    if (hasUserImgs || autoSearchDone.current) return;
    autoSearchDone.current = true;
    setAutoSearching(true);
    searchExerciseImages(exId, db)
      .then(urls => {
        if (urls?.length) {
          onSaveImages(exId, urls);
        }
      })
      .catch(() => {})
      .finally(() => setAutoSearching(false));
  }, [exId]);

  // videoId: prefer user-linked video, then fallback to database videoId
  const userVideoUrl = userVideos?.[exId];
  const dbVideoId = ex.videoId;
  const activeVideoId = userVideoUrl ? extractYTId(userVideoUrl) : dbVideoId;

  async function enrichWithAI() {
    setAiLoading(true);
    try {
      const txt = await callAI([{role:"user",content:`Você é personal trainer especialista. Para o exercício "${ex.name}", responda APENAS com JSON válido (sem markdown, sem texto antes ou depois): {"description":"2-3 frases sobre benefícios","steps":["passo 1","passo 2","passo 3","passo 4","passo 5"],"tips":["dica 1","dica 2","dica 3"]}`}]);
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s !== -1) {
        const parsed = JSON.parse(txt.slice(s, e+1));
        onUpdateEx(exId, {...ex, ...parsed});
      }
    } catch(err) {
      console.error("enrichWithAI error:", err.message);
      alert("Erro IA: " + err.message);
    }
    setAiLoading(false);
  }

  const name = ex.name || exId.replace(/-/g," ");

  return (
    <>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:16}} onClick={onClose}>
        <div style={{background:"#13131a",border:"1px solid #2a2a3a",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"93vh",overflowY:"auto",padding:22}} onClick={e=>e.stopPropagation()}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:8}}>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:3,color:"#f0f0f8",flex:1,lineHeight:1.2}}>{name}</h2>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              <button onClick={()=>setShowEdit(true)} title="Editar exercício" style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:8,color:"#4ade80",padding:"5px 10px",cursor:"pointer",fontSize:".72rem",fontWeight:800}}>✏️</button>
              {onDeleteEx && <button onClick={()=>{if(window.confirm(`Remover "${name}" do banco?`)){onDeleteEx(exId);onClose();}}} title="Remover do banco" style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:8,color:"#f87171",padding:"5px 10px",cursor:"pointer",fontSize:".72rem"}}>🗑</button>}
              <button onClick={onClose} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"5px 11px",cursor:"pointer"}}>✕</button>
            </div>
          </div>

          {/* IMAGE VIEWER */}
          <div style={{marginBottom:18,position:"relative"}}>
            <div style={{position:"relative",borderRadius:14,overflow:"hidden",background:"#1a1a24",border:"1px solid #2a2a3a",height:200}}>
              {!imgError[imgIdx] ? (
                <img
                  key={`${exId}-${imgIdx}`}
                  src={imgs[imgIdx]}
                  alt={`${name} - ${imgIdx+1}`}
                  style={{width:"100%",height:200,objectFit:"cover",display:"block"}}
                  onError={()=>setImgError(p=>({...p,[imgIdx]:true}))}
                />
              ) : (
                <div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#4b5563",gap:8}}>
                  <span style={{fontSize:"3rem"}}>🏋️</span>
                  <span style={{fontSize:".72rem",color:"#6b7280"}}>Imagem não disponível</span>
                </div>
              )}
              {/* Nav arrows */}
              {imgs.length > 1 && (
                <>
                  <button onClick={()=>{setImgIdx(p=>(p-1+imgs.length)%imgs.length);setImgError({});}} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                  <button onClick={()=>{setImgIdx(p=>(p+1)%imgs.length);setImgError({});}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                </>
              )}
              {/* Badge */}
              <div style={{position:"absolute",top:8,left:8,display:"flex",gap:5}}>
                {hasUserImgs && <span style={{background:"rgba(245,158,11,.9)",color:"#000",borderRadius:6,padding:"2px 7px",fontSize:".58rem",fontWeight:900}}>📷 SUAS FOTOS</span>}
                {!hasUserImgs && hasDbImgs && <span style={{background:"rgba(34,197,94,.85)",color:"#000",borderRadius:6,padding:"2px 7px",fontSize:".58rem",fontWeight:900}}>📷 FOTO REAL</span>}
                {!hasUserImgs && !hasDbImgs && webImgs && <span style={{background:"rgba(59,130,246,.85)",color:"#fff",borderRadius:6,padding:"2px 7px",fontSize:".58rem",fontWeight:900}}>🔍 WEB</span>}
                {autoSearching && <span style={{background:"rgba(59,130,246,.85)",color:"#fff",borderRadius:6,padding:"2px 7px",fontSize:".58rem",fontWeight:900}}>🔍 Buscando fotos...</span>}
                {imgs.length > 0 && <span style={{background:"rgba(0,0,0,.7)",color:"rgba(255,255,255,.8)",borderRadius:6,padding:"2px 7px",fontSize:".58rem"}}>{imgIdx+1}/{imgs.length}</span>}
              </div>
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div style={{display:"flex",gap:6,marginTop:8,overflowX:"auto",paddingBottom:4}}>
                {imgs.map((src,i) => (
                  <div key={i} onClick={()=>{setImgIdx(i);setImgError({});}} style={{flexShrink:0,width:52,height:38,borderRadius:7,overflow:"hidden",border:`2px solid ${imgIdx===i?"#3b82f6":"#2a2a3a"}`,cursor:"pointer",background:"#1a1a24"}}>
                    <img src={src} alt="" style={{width:52,height:38,objectFit:"cover"}} onError={e=>e.target.style.display="none"} />
                  </div>
                ))}
              </div>
            )}

            {/* Image actions */}
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <button onClick={()=>setShowUpload(true)} style={{flex:1,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:9,padding:"7px 8px",color:"#f59e0b",fontWeight:800,cursor:"pointer",fontSize:".7rem"}}>📁 Upload</button>
              <button onClick={()=>setShowAISearch(true)} style={{flex:1,background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.3)",borderRadius:9,padding:"7px 8px",color:"#60a5fa",fontWeight:800,cursor:"pointer",fontSize:".7rem"}}>🤖 Buscar IA</button>
              {hasUserImgs && <button onClick={()=>onSaveImages(exId,[])} style={{flex:1,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:9,padding:"7px 8px",color:"#f87171",fontWeight:800,cursor:"pointer",fontSize:".7rem"}}>🗑 Reset</button>}
            </div>

            {/* YouTube video — user link or database videoId */}
            <div style={{marginTop:10}}>
              {activeVideoId ? (
                <div style={{borderRadius:12,overflow:"hidden",background:"#1a1a24",border:"1px solid #2a2a3a"}}>
                  {dbVideoId && !userVideoUrl && (
                    <div style={{padding:"5px 10px",background:"rgba(239,68,68,.07)",borderBottom:"1px solid #2a2a3a"}}>
                      <span style={{fontSize:".58rem",color:"#f87171",fontWeight:700}}>▶ Vídeo do banco de exercícios</span>
                    </div>
                  )}
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideoId}`}
                    style={{width:"100%",height:180,border:"none",display:"block"}}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div style={{display:"flex",gap:6,padding:8}}>
                    <button onClick={()=>{setShowYTInput(true);setYtInput(userVideoUrl||"");}} style={{flex:1,background:"none",border:"1px solid #2a2a3a",borderRadius:8,color:"#9ca3af",padding:"5px 8px",fontSize:".68rem",cursor:"pointer",fontWeight:700}}>✏️ {userVideoUrl ? "Alterar link" : "Vincular meu vídeo"}</button>
                    {userVideoUrl && <button onClick={()=>onSaveVideo(exId,"")} style={{flex:1,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,color:"#f87171",padding:"5px 8px",fontSize:".68rem",cursor:"pointer",fontWeight:700}}>🗑 Remover</button>}
                  </div>
                </div>
              ) : !showYTInput ? (
                <button onClick={()=>setShowYTInput(true)} style={{width:"100%",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:9,padding:"7px 8px",color:"#f87171",fontWeight:800,cursor:"pointer",fontSize:".7rem"}}>▶ Vincular vídeo YouTube</button>
              ) : null}
              {showYTInput && (
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  <input
                    autoFocus
                    value={ytInput}
                    onChange={e=>setYtInput(e.target.value)}
                    placeholder="Cole o link do YouTube aqui..."
                    style={{flex:1,background:"#1a1a24",border:"1px solid #ef4444",borderRadius:9,padding:"8px 11px",color:"#f0f0f8",fontSize:".78rem",outline:"none"}}
                  />
                  <button onClick={()=>{if(ytInput.trim()){onSaveVideo(exId,ytInput.trim());}setShowYTInput(false);}} style={{background:"#ef4444",border:"none",borderRadius:9,color:"#fff",padding:"8px 14px",fontWeight:900,cursor:"pointer",fontSize:".78rem"}}>✓</button>
                  <button onClick={()=>setShowYTInput(false)} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:9,color:"#6b7280",padding:"8px 10px",fontWeight:700,cursor:"pointer",fontSize:".78rem"}}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {[{c:"#f97316",v:ex.category},{c:"#06b6d4",v:ex.equipment},...(ex.muscles||[]).map(m=>({c:"#a855f7",v:m}))].filter(b=>b.v).map((b,i)=>(
              <span key={i} style={{background:b.c+"22",color:b.c,border:`1px solid ${b.c}44`,borderRadius:6,padding:"3px 9px",fontSize:".62rem",fontWeight:800}}>{b.v}</span>
            ))}
          </div>

          <p style={{fontSize:".83rem",color:"#d1d5db",lineHeight:1.75,marginBottom:16}}>{ex.description}</p>

          {/* Steps */}
          {ex.steps?.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:2,color:"#6b7280",textTransform:"uppercase",marginBottom:10}}>📋 Execução Passo a Passo</div>
              {ex.steps.map((s,i) => (
                <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(59,130,246,.15)",border:"1px solid #3b82f6",color:"#60a5fa",fontSize:".68rem",fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
                  <span style={{fontSize:".82rem",color:"#e5e7eb",lineHeight:1.6}}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {ex.tips?.length > 0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:".58rem",fontWeight:900,letterSpacing:2,color:"#6b7280",textTransform:"uppercase",marginBottom:10}}>💡 Dicas Importantes</div>
              {ex.tips.map((t,i) => (
                <div key={i} style={{background:"rgba(251,191,36,.07)",border:"1px solid rgba(251,191,36,.2)",borderRadius:9,padding:"9px 12px",fontSize:".78rem",color:"#fcd34d",marginBottom:7,lineHeight:1.55}}>💡 {t}</div>
              ))}
            </div>
          )}

          {/* AI enrich button */}
          {(!ex.steps || ex.steps.length === 0) && !aiLoading && (
            <button onClick={enrichWithAI} style={{width:"100%",background:"rgba(59,130,246,.15)",border:"1px solid rgba(59,130,246,.3)",borderRadius:12,padding:"11px",color:"#60a5fa",fontWeight:900,cursor:"pointer",fontSize:".82rem"}}>
              ✨ Carregar detalhes com IA
            </button>
          )}
          {aiLoading && (
            <div style={{display:"flex",alignItems:"center",gap:10,color:"#60a5fa",fontSize:".8rem"}}>
              <div style={{width:18,height:18,border:"2px solid rgba(59,130,246,.3)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin .7s linear infinite"}} />
              Carregando com IA...
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <ImageUploadModal
          exId={exId}
          exName={name}
          currentImages={userImages?.[exId] || []}
          onSave={imgs => { onSaveImages(exId, imgs); setWebImgs(null); }}
          onClose={() => setShowUpload(false)}
        />
      )}
      {showAISearch && (
        <AIImageSearchModal
          exId={exId}
          exName={name}
          exDb={db}
          onSave={urls => { onSaveImages(exId, [...(userImages?.[exId]||[]), ...urls]); setWebImgs(null); }}
          onClose={() => setShowAISearch(false)}
        />
      )}
      {showEdit && (
        <AddExerciseModal
          initialData={{...ex, id: exId}}
          onSave={(id, data) => onUpdateEx(id, data)}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
