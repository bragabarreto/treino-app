// ─── UNSPLASH IDs por exercício (banco original de 36) ───────────────────────
// IDs de fotos Unsplash estáveis para os exercícios originais
const UNSPLASH_IMGS = {
  "puxada-frontal-pronada":         ["1571019614242-c5c5dee9f50b","1541534741976-14e5300c3a48"],
  "remada-unilateral-halter":       ["1530822847-3a7b654f5adf","1571019613469-5c14a2e4f380"],
  "remada-curvada":                 ["1530822847-3a7b654f5adf","1571019613515-c34916b18a5f"],
  "remada-alta-cabo":               ["1534438327276-14e5300c3a48","1581009146145-b5ef050c2e1e"],
  "desenvolvimento-arnold":         ["1550259032-0c53f78aba0c","1571019613492-e8da1d8ef6f0"],
  "elevacao-lateral":               ["1571019613492-e8da1d8ef6f0","1550259032-0c53f78aba0c"],
  "extensao-ombros-rotacao":        ["1550259032-0c53f78aba0c","1534438327276-14e5300c3a48"],
  "supino-plano-halteres":          ["1571019613454-235e8f7d4452","1567013206394-e9b945f52b03"],
  "supino-inclinado-barra":         ["1571019613454-235e8f7d4452","1567013206394-e9b945f52b03"],
  "crucifixo-halteres":             ["1571019613454-235e8f7d4452","1581009146145-b5ef050c2e1e"],
  "crucifixo-inclinado-cabo":       ["1571019613454-235e8f7d4452","1534438327276-14e5300c3a48"],
  "apoio-de-frente":                ["1571019614169-b6e6b99f1476","1567013193785-67ec4b7c2d30"],
  "triceps-corda-polia":            ["1530822847-3a7b654f5adf","1534438327276-14e5300c3a48"],
  "triceps-maquina":                ["1530822847-3a7b654f5adf","1571019613515-c34916b18a5f"],
  "hip-thrust":                     ["1567401893705-394f0b73e7f7","1571019614242-c5c5dee9f50b"],
  "avanco-reverso":                 ["1571019614169-b6e6b99f1476","1567401893705-394f0b73e7f7"],
  "agachamento-sumo-goblet":        ["1567954970-88c8a48befb3","1571019614169-b6e6b99f1476"],
  "hack-squat":                     ["1567954970-88c8a48befb3","1567401893705-394f0b73e7f7"],
  "leg-horizontal-unilateral":      ["1567401893705-394f0b73e7f7","1571019614242-c5c5dee9f50b"],
  "stiff-rdl":                      ["1571019613469-5c14a2e4f380","1530822847-3a7b654f5adf"],
  "terra-halteres":                 ["1571019613469-5c14a2e4f380","1567954970-88c8a48befb3"],
  "elevacao-panturrilha-unilateral":["1571019613576-3ef8b0a5e1de","1571019614169-b6e6b99f1476"],
  "panturrilha-leg":                ["1571019613576-3ef8b0a5e1de","1567401893705-394f0b73e7f7"],
  "rosca-direta-barra":             ["1581009146145-b5ef050c2e1e","1534438327276-14e5300c3a48"],
  "rosca-unilateral-polia-alta":    ["1581009146145-b5ef050c2e1e","1550259032-0c53f78aba0c"],
  "abducao-quadril-maquina":        ["1571019614242-c5c5dee9f50b","1567401893705-394f0b73e7f7"],
  "copenhagen-banco":               ["1571019614169-b6e6b99f1476","1567954970-88c8a48befb3"],
  "pallof-press":                   ["1534438327276-14e5300c3a48","1581009146145-b5ef050c2e1e"],
  "prancha-shoulder-tap":           ["1571019614169-b6e6b99f1476","1567013193785-67ec4b7c2d30"],
  "prancha-alta":                   ["1571019614169-b6e6b99f1476","1534438327276-14e5300c3a48"],
  "abdominal-remador":              ["1571019614169-b6e6b99f1476","1567013193785-67ec4b7c2d30"],
  "rosca-direta-halter":            ["1581009146145-b5ef050c2e1e","1530822847-3a7b654f5adf"],
};

// ─── Função para obter imagens de um exercício ───────────────────────────────
// Prioridade: 1. userImages (upload manual) → 2. ex.images (banco novo) → 3. UNSPLASH_IMGS → 4. Picsum
export function getImagesForEx(exId, userImages, exDb) {
  // 1. Foto carregada pelo usuário (máxima prioridade)
  if (userImages?.[exId]?.length) return userImages[exId];

  // 2. Imagens do novo banco de exercícios (URLs Unsplash diretas)
  if (exDb?.[exId]?.images?.length) return exDb[exId].images;

  // 3. UNSPLASH_IMGS do banco original (banco de 36)
  const ids = UNSPLASH_IMGS[exId];
  if (ids) return ids.map(id => `https://images.unsplash.com/photo-${id}?w=600&h=400&fit=crop&q=85`);

  // 4. Picsum fallback
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
