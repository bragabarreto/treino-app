// ─── LocalStorage keys ────────────────────────────────────────────────────────
// NÃO MUDAR estes nomes — dados do usuário já existem nessas chaves
export const STORAGE_KEYS = {
  marks:    "tm7-marks",
  logs:     "tm7-logs",
  exdb:     "tm7-exdb",
  imgs:     "tm7-imgs",
  videos:   "tm7-videos",
  rotina:   "tm7-rotina",
  plogs:    "tm7-plogs",
  treinos:  "tm7-treinos",
  feedback: "tm7-feedback",
};

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
export const LS = {
  get: (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      // Quota exceeded — tenta limpar imagens antigas se for esse o problema
      if (e.name === "QuotaExceededError" || e.code === 22) {
        console.warn(`[LS] Quota excedida ao salvar "${k}". Dados não persistidos.`);
        // Para imagens: tenta salvar só as 3 mais recentes
        if (k === STORAGE_KEYS.imgs && typeof v === "object") {
          try {
            const keys = Object.keys(v);
            const reduced = {};
            keys.slice(-3).forEach(id => { reduced[id] = (v[id] || []).slice(0, 1); });
            localStorage.setItem(k, JSON.stringify(reduced));
          } catch (_) {}
        }
      }
    }
  },
};
