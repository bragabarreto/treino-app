import { useState, useEffect } from "react";

export default function AIImageSearchModal({ exId, exName, exDb: exDbProp, onSave, onClose }) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [terms, setTerms] = useState([]);
  const [nomeBR, setNomeBR] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);

  async function search() {
    setLoading(true); setError(""); setImages([]); setVideos([]); setSelected([]); setTerms([]); setNomeBR(""); setActiveVideo(null);
    try {
      const ex = exDbProp?.[exId] || {};
      const res = await fetch("/api/images/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exId, exName: ex.name || exName, muscles: ex.muscles || [], category: ex.category || "" })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);

      const imgs = (d.images || d.urls || []).map(i => typeof i === "string" ? { url: i, thumb: i, source: "web" } : i).filter(i => i.url);
      const vids = (d.videos || []).filter(v => v.videoId);

      if (!imgs.length && !vids.length) throw new Error("Nenhum resultado. Verifique GOOGLE_API_KEY e GOOGLE_CSE_ID no Vercel.");

      setImages(imgs);
      setVideos(vids);
      setTerms(d.terms || []);
      setNomeBR(d.nomeBR || "");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { search(); }, []);

  function toggle(url) {
    setSelected(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url]);
  }

  const Spinner = () => (
    <span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}} />
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:12}} onClick={onClose}>
      <div style={{background:"#13131a",border:"1px solid #60a5fa",borderRadius:20,width:"100%",maxWidth:600,maxHeight:"92vh",overflowY:"auto",padding:20}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.15rem",letterSpacing:3,color:"#60a5fa",margin:0}}>🔍 FOTOS & VÍDEOS — {nomeBR || exName}</h3>
            {terms.length > 0 && <p style={{fontSize:".62rem",color:"#6b7280",margin:"3px 0 0"}}>🇧🇷 {terms.slice(0,2).join(" · ")}</p>}
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"4px 10px",cursor:"pointer",flexShrink:0}}>✕</button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{textAlign:"center",padding:"36px 0",color:"#60a5fa"}}>
            <div style={{width:40,height:40,border:"3px solid rgba(59,130,246,.2)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 14px"}} />
            <p style={{fontSize:".85rem",margin:0,fontWeight:700}}>Buscando no Google Brasil…</p>
            <p style={{fontSize:".72rem",color:"#6b7280",margin:"5px 0 0"}}>Claude gera termos em português → sites brasileiros de musculação + YouTube</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <p style={{color:"#f87171",fontSize:".8rem",margin:0}}>{error}</p>
            <button onClick={search} style={{marginTop:8,background:"#3b82f6",border:"none",borderRadius:8,color:"#fff",padding:"6px 14px",fontSize:".75rem",fontWeight:800,cursor:"pointer"}}>Tentar novamente</button>
          </div>
        )}

        {/* ── FOTOS ── */}
        {images.length > 0 && !loading && (
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <p style={{fontSize:".72rem",fontWeight:900,letterSpacing:1.5,color:"#9ca3af",textTransform:"uppercase",margin:0}}>📸 Fotos — escolha a capa do exercício</p>
              <span style={{fontSize:".65rem",color:selected.length?"#22c55e":"#6b7280"}}>{selected.length} selecionada(s)</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
              {images.map((img, i) => {
                const isSel = selected.includes(img.url);
                return (
                  <div key={i} onClick={()=>toggle(img.url)}
                    style={{borderRadius:10,overflow:"hidden",border:`2px solid ${isSel?"#22c55e":"#1e1e2e"}`,cursor:"pointer",background:"#1a1a24",transition:"all .15s",transform:isSel?"scale(1.03)":"scale(1)",position:"relative"}}>
                    <img
                      src={img.thumb || img.url}
                      alt={`ex-${i}`}
                      style={{width:"100%",height:80,objectFit:"cover",display:"block"}}
                      onError={e=>{e.target.style.display="none";}}
                    />
                    {isSel && (
                      <div style={{position:"absolute",top:4,right:4,background:"#22c55e",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",fontWeight:900,color:"#000"}}>✓</div>
                    )}
                    <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.8))",padding:"4px 6px 3px"}}>
                      <span style={{fontSize:".48rem",color: img.source?.includes(".br") || img.source?.includes("musculacao") || img.source?.includes("hipertrofia") ? "#4ade80" : "#a3e635",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>🇧🇷 {img.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={()=>{ if(selected.length>0){ onSave(selected); onClose(); } }}
              disabled={!selected.length}
              style={{width:"100%",marginTop:10,padding:11,borderRadius:11,border:"none",background:selected.length?"#22c55e":"#1e1e2e",color:selected.length?"#000":"#6b7280",fontWeight:900,cursor:selected.length?"pointer":"not-allowed",fontSize:".84rem",transition:"all .2s"}}
            >
              {selected.length ? `✓ Definir ${selected.length === 1 ? "esta foto" : `${selected.length} fotos`} como capa` : "Selecione ao menos 1 foto"}
            </button>
          </div>
        )}

        {/* ── VÍDEOS ── */}
        {videos.length > 0 && !loading && (
          <div>
            <p style={{fontSize:".72rem",fontWeight:900,letterSpacing:1.5,color:"#9ca3af",textTransform:"uppercase",marginBottom:10}}>▶ Vídeos de Execução (YouTube)</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {videos.map((v, i) => (
                <div key={i} style={{background:"#1a1a24",border:"1px solid #2a2a3a",borderRadius:12,overflow:"hidden"}}>
                  {activeVideo === v.videoId ? (
                    <div>
                      <iframe
                        src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1`}
                        style={{width:"100%",height:220,border:"none",display:"block"}}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <button onClick={()=>setActiveVideo(null)} style={{width:"100%",background:"none",border:"none",borderTop:"1px solid #2a2a3a",color:"#6b7280",padding:"7px",fontSize:".72rem",cursor:"pointer"}}>✕ Fechar vídeo</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:8,cursor:"pointer"}} onClick={()=>setActiveVideo(v.videoId)}>
                      <div style={{position:"relative",flexShrink:0}}>
                        <img src={v.thumb} alt={v.title} style={{width:100,height:60,objectFit:"cover",borderRadius:8,display:"block"}} onError={e=>e.target.style.display="none"} />
                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <div style={{background:"rgba(239,68,68,.9)",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:".7rem",marginLeft:2}}>▶</span>
                          </div>
                        </div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:".75rem",fontWeight:700,color:"#f0f0f8",margin:0,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{v.title}</p>
                        <p style={{fontSize:".62rem",color:"#6b7280",margin:"3px 0 0"}}>{v.channel}</p>
                      </div>
                      <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{flexShrink:0,background:"none",border:"1px solid #3b3b4a",borderRadius:7,color:"#9ca3af",padding:"4px 8px",fontSize:".6rem",textDecoration:"none"}}>↗</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buscar novamente */}
        {!loading && (images.length > 0 || videos.length > 0) && (
          <button onClick={search} style={{width:"100%",marginTop:14,padding:9,borderRadius:10,border:"1px solid #2a2a3a",background:"none",color:"#6b7280",fontWeight:700,cursor:"pointer",fontSize:".78rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {loading ? <Spinner /> : "🔄"} Buscar novamente
          </button>
        )}
      </div>
    </div>
  );
}
