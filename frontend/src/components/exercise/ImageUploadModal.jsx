import { useState, useRef } from "react";
import { compressImage } from "../../lib/imageUtils";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const hasCloudinary = !!(CLOUD_NAME && UPLOAD_PRESET);

async function uploadToCloudinary(dataUrl) {
  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "treino-app");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Cloudinary upload falhou");
  const d = await res.json();
  return d.secure_url;
}

export default function ImageUploadModal({ exId, exName, currentImages, onSave, onClose }) {
  const [imgs, setImgs] = useState(currentImages || []);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(""); // "compressing" | "uploading" | ""
  const fileRef = useRef();

  async function processFiles(files) {
    setStatus("compressing");
    const results = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const dataUrl = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(f);
      });
      const compressed = await compressImage(dataUrl);

      if (hasCloudinary) {
        try {
          setStatus("uploading");
          const url = await uploadToCloudinary(compressed);
          results.push(url);
        } catch {
          // Cloudinary falhou → fallback para base64 local
          results.push(compressed);
        }
      } else {
        results.push(compressed);
      }
    }
    setImgs(p => [...p, ...results]);
    setStatus("");
  }

  const busy = status !== "";
  const statusMsg = status === "compressing"
    ? "⏳ Comprimindo..."
    : status === "uploading"
    ? "☁️ Enviando para a nuvem..."
    : null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:16}} onClick={onClose}>
      <div style={{background:"#13131a",border:"1px solid #f59e0b",borderRadius:20,width:"100%",maxWidth:480,padding:24}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",letterSpacing:3,color:"#f59e0b"}}>📷 IMAGENS — {exName}</h3>
          <button onClick={onClose} style={{background:"none",border:"1px solid #2a2a3a",borderRadius:8,color:"#6b7280",padding:"4px 10px",cursor:"pointer"}}>✕</button>
        </div>

        {/* Cloud status badge */}
        <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:6,fontSize:".62rem",fontWeight:800}}>
          {hasCloudinary ? (
            <><span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block"}} /><span style={{color:"#4ade80"}}>Cloudinary ativo — fotos salvas na nuvem</span></>
          ) : (
            <><span style={{width:7,height:7,borderRadius:"50%",background:"#f59e0b",display:"inline-block"}} /><span style={{color:"#fbbf24"}}>Modo local — configure Cloudinary para salvar na nuvem</span></>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);processFiles(e.dataTransfer.files);}}
          onClick={()=>fileRef.current.click()}
          style={{border:`2px dashed ${dragging?"#f59e0b":"#2a2a3a"}`,borderRadius:14,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:dragging?"rgba(245,158,11,.08)":"#1a1a24",transition:"all .2s",marginBottom:16}}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>processFiles(e.target.files)} />
          <div style={{fontSize:"2rem",marginBottom:8}}>🖼️</div>
          <p style={{fontSize:".82rem",color:"#9ca3af",margin:0}}>Arraste imagens aqui ou clique para selecionar</p>
          <p style={{fontSize:".68rem",color:"#6b7280",margin:"4px 0 0"}}>JPG, PNG, WEBP — múltiplos arquivos aceitos</p>
        </div>

        {/* Preview grid */}
        {imgs.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16,maxHeight:200,overflowY:"auto"}}>
            {imgs.map((src,i) => (
              <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid #2a2a3a"}}>
                <img src={src} alt={`img${i}`} style={{width:"100%",height:80,objectFit:"cover",display:"block"}} />
                <button onClick={()=>setImgs(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:3,right:3,background:"rgba(239,68,68,.8)",border:"none",borderRadius:"50%",width:20,height:20,color:"#fff",fontSize:".6rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                {i<2 && <div style={{position:"absolute",bottom:3,left:3,background:"rgba(245,158,11,.9)",borderRadius:4,padding:"1px 6px",fontSize:".55rem",fontWeight:900,color:"#000"}}>ATIVA</div>}
                {src.startsWith("https://res.cloudinary.com") && (
                  <div style={{position:"absolute",top:3,left:3,background:"rgba(34,197,94,.9)",borderRadius:4,padding:"1px 5px",fontSize:".5rem",fontWeight:900,color:"#000"}}>☁</div>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{fontSize:".68rem",color:"#6b7280",marginBottom:12}}>As 2 primeiras imagens são exibidas como principais.</p>

        {statusMsg && <p style={{fontSize:".75rem",color:"#f59e0b",textAlign:"center",marginBottom:8}}>{statusMsg}</p>}

        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:10,border:"1px solid #2a2a3a",background:"#1a1a24",color:"#6b7280",fontWeight:800,cursor:"pointer",fontSize:".82rem"}}>Cancelar</button>
          <button onClick={()=>{onSave(imgs);onClose();}} disabled={busy}
            style={{flex:2,padding:10,borderRadius:10,border:"none",background:busy?"#6b7280":"#f59e0b",color:"#000",fontWeight:900,cursor:busy?"not-allowed":"pointer",fontSize:".82rem"}}>
            {busy ? statusMsg : "💾 Salvar Imagens"}
          </button>
        </div>
      </div>
    </div>
  );
}
