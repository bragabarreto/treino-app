// ─── AI CALL (básico) ─────────────────────────────────────────────────────────
export async function callAI(messages, maxTokens = 1000) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text;
}

// ─── AI CALL COM WEB SEARCH ───────────────────────────────────────────────────
export async function callAIWithSearch(messages) {
  const res = await fetch("/api/ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text;
}

// ─── MAPA DE TERMOS EM INGLÊS POR EXERCÍCIO ───────────────────────────────────
export const EXERCISE_SEARCH_TERMS = {
  "puxada-frontal-pronada":          ["lat pulldown exercise","lat pulldown gym"],
  "remada-unilateral-halter":        ["dumbbell row exercise","one arm dumbbell row"],
  "remada-alta-cabo":                ["upright row exercise","cable upright row"],
  "remada-curvada":                  ["bent over barbell row exercise","barbell row gym"],
  "desenvolvimento-arnold":          ["Arnold press exercise","dumbbell shoulder press arnold"],
  "elevacao-lateral":                ["lateral raise exercise","dumbbell lateral raise"],
  "extensao-ombros-rotacao":         ["external shoulder rotation exercise","shoulder rotator cuff"],
  "supino-plano-halteres":           ["dumbbell bench press exercise","flat bench dumbbell press"],
  "supino-inclinado-barra":          ["incline bench press exercise","incline barbell press gym"],
  "crucifixo-halteres":              ["dumbbell fly exercise","chest fly dumbbell bench"],
  "crucifixo-inclinado-cabo":        ["cable fly chest exercise","incline cable fly"],
  "apoio-de-frente":                 ["push up exercise","pushup form gym"],
  "triceps-corda-polia":             ["tricep pushdown cable exercise","rope tricep pushdown"],
  "triceps-maquina":                 ["tricep machine exercise","tricep extension machine gym"],
  "stiff-rdl":                       ["stiff leg deadlift exercise","Romanian deadlift form"],
  "terra-halteres":                  ["dumbbell deadlift exercise","deadlift dumbbell gym"],
  "hip-thrust":                      ["hip thrust exercise barbell","glute bridge barbell"],
  "avanco-reverso":                  ["reverse lunge exercise","dumbbell reverse lunge gym"],
  "agachamento-sumo-goblet":         ["sumo squat goblet exercise","goblet squat dumbbell"],
  "hack-squat":                      ["hack squat machine exercise","hack squat gym"],
  "leg-horizontal-unilateral":       ["leg press machine exercise","unilateral leg press"],
  "bulgaro-kb":                      ["Bulgarian split squat exercise","split squat dumbbell gym"],
  "elevacao-panturrilha-unilateral": ["calf raise exercise","standing calf raise single leg"],
  "panturrilha-leg":                 ["seated calf raise exercise","calf press leg press"],
  "rosca-direta-barra":              ["barbell curl exercise","bicep barbell curl gym"],
  "rosca-unilateral-polia-alta":     ["cable curl exercise","high cable bicep curl"],
  "abducao-quadril-maquina":         ["hip abduction machine exercise","glute abduction machine"],
  "copenhagen-banco":                ["Copenhagen plank exercise","adductor plank gym"],
  "pallof-press":                    ["Pallof press cable exercise","anti rotation core press"],
  "prancha-shoulder-tap":            ["shoulder tap plank exercise","plank tap core"],
  "prancha-alta":                    ["high plank exercise","straight arm plank gym"],
  "abdominal-remador":               ["sit up exercise","crunch ab exercise gym"],
  "rosca-direta-halter":             ["dumbbell bicep curl exercise","alternating dumbbell curl"],
};

// ─── BUSCA DE IMAGENS VIA API ─────────────────────────────────────────────────
export async function searchExerciseImages(exId, exDbRef) {
  const ex = exDbRef?.[exId] || {};
  const res = await fetch("/api/images/exercise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      exId,
      exName: ex.name || exId.replace(/-/g, " "),
      muscles: ex.muscles || [],
      category: ex.category || "",
    }),
  });
  const d = await res.json();
  return (d.urls || []).map(u => (typeof u === "string" ? u : u.url)).filter(Boolean);
}

// ─── CONNECTION TEST ──────────────────────────────────────────────────────────
export async function testAPIConnection() {
  const res = await fetch("/api/health");
  const d = await res.json();
  if (!d.apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor");
  return "CONECTADO";
}

// ─── USER DATA — persistência no banco (Neon) ─────────────────────────────────
// Salva um key-value no banco de dados do usuário
export async function saveUserDataToCloud(key, value) {
  try {
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch (e) {
    console.warn(`[api] Falha ao salvar "${key}" no banco:`, e.message);
  }
}

// Carrega todos os dados do usuário do banco
export async function loadUserDataFromCloud() {
  try {
    const res = await fetch("/api/user-data");
    const d = await res.json();
    return d.data || {};
  } catch (e) {
    console.warn("[api] Falha ao carregar dados do banco:", e.message);
    return {};
  }
}
