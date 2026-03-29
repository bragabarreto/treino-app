// ─── Função para obter imagens de um exercício ───────────────────────────────
// Prioridade: 1. userImages (upload manual) → 2. exDb.images (YouTube thumbnails) → 3. Picsum fallback
export function getImagesForEx(exId, userImages, exDb) {
  // 1. Foto carregada pelo usuário (máxima prioridade)
  if (userImages?.[exId]?.length) return userImages[exId];

  // 2. Imagens do banco de exercícios (YouTube thumbnails do videoId verificado)
  if (exDb?.[exId]?.images?.length) return exDb[exId].images;

  // 3. YouTube thumbnail direto do videoId (se images[] não existe mas videoId sim)
  if (exDb?.[exId]?.videoId) {
    const vid = exDb[exId].videoId;
    return [
      `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
    ];
  }

  // 4. Picsum fallback (ultimo recurso)
  const seed = Math.abs(exId.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  return [
    `https://picsum.photos/seed/${seed}/600/400`,
    `https://picsum.photos/seed/${seed + 1}/600/400`,
  ];
}

// ─── Compressão de imagem (para upload do usuário) ────────────────────────────
export function compressImage(dataUrl, maxPx = 800, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback sem compressão
    img.src = dataUrl;
  });
}
