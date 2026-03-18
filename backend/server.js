import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

// Neon DB client (only if DATABASE_URL is set)
let dbClient = null;
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (!dbClient) {
    const { neon } = await import("@neondatabase/serverless");
    dbClient = neon(process.env.DATABASE_URL);
  }
  return dbClient;
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── HEALTH CHECK ───────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({ status: "ok", apiKey: hasKey });
});

// ─── BASIC CLAUDE CALL ──────────────────────────────────────────────────────
app.post("/api/ai", async (req, res) => {
  const { messages, max_tokens = 1500, model = "claude-haiku-4-5-20251001" } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Campo 'messages' obrigatório (array)" });
  }

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    res.json({ text });
  } catch (err) {
    console.error("[/api/ai]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CLAUDE CALL COM WEB SEARCH (para busca de imagens) ─────────────────────
app.post("/api/ai/search", async (req, res) => {
  const { messages, max_tokens = 1500, model = "claude-haiku-4-5-20251001" } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Campo 'messages' obrigatório (array)" });
  }

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    res.json({ text });
  } catch (err) {
    console.error("[/api/ai/search]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── BUSCA DE IMAGENS — Pexels + Unsplash + Wger fallback ───────────────────
app.post("/api/images/exercise", async (req, res) => {
  const { exId, exName, muscles = [], category = "" } = req.body;

  if (!exName) {
    return res.status(400).json({ error: "Campo 'exName' obrigatório" });
  }

  // 1. Gera termos de busca em inglês via Claude
  let searchTerms = [];
  try {
    const termResp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Exercise name in Portuguese: "${exName}". Muscles: ${muscles.join(", ")}. Category: ${category}.
Return ONLY a JSON array with 3 English search terms for finding photos of people performing this exercise in a gym:
["term 1","term 2","term 3"]
Terms should be specific and include body part + movement type. Example: ["lat pulldown exercise","cable pulldown gym","pull down back exercise"]`
      }]
    });
    const termTxt = termResp.content.filter(b=>b.type==="text").map(b=>b.text).join("");
    const s = termTxt.indexOf("["), e = termTxt.lastIndexOf("]");
    if (s !== -1) searchTerms = JSON.parse(termTxt.slice(s, e+1));
  } catch(e) {
    searchTerms = [exName + " exercise", exName + " gym form"];
  }

  const allUrls = [];

  // 2. Pexels API
  if (process.env.PEXELS_API_KEY) {
    for (const term of searchTerms.slice(0,2)) {
      try {
        const pr = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=4&orientation=landscape`, {
          headers: { Authorization: process.env.PEXELS_API_KEY }
        });
        const pd = await pr.json();
        (pd.photos||[]).forEach(p => allUrls.push({ url: p.src.large || p.src.original, thumb: p.src.small, source: "Pexels" }));
      } catch {}
      if (allUrls.length >= 4) break;
    }
  }

  // 3. Unsplash API
  if (allUrls.length < 4 && process.env.UNSPLASH_ACCESS_KEY) {
    for (const term of searchTerms.slice(0,2)) {
      try {
        const ur = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=4&orientation=landscape`, {
          headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
        });
        const ud = await ur.json();
        (ud.results||[]).forEach(p => allUrls.push({ url: p.urls.regular, thumb: p.urls.thumb, source: "Unsplash" }));
      } catch {}
      if (allUrls.length >= 4) break;
    }
  }

  // 4. Wger exercise database (no key needed, exercise-specific images)
  if (allUrls.length < 2) {
    try {
      const wQuery = searchTerms[0] || exName;
      const wr = await fetch(`https://wger.de/api/v2/exercise/?format=json&language=2&term=${encodeURIComponent(wQuery)}&limit=5`);
      const wd = await wr.json();
      for (const ex of (wd.results||[]).slice(0,3)) {
        if (ex.id) {
          const imgr = await fetch(`https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${ex.id}`);
          const imgd = await imgr.json();
          (imgd.results||[]).forEach(img => allUrls.push({ url: img.image, thumb: img.image, source: "Wger" }));
        }
      }
    } catch {}
  }

  console.log(`[/api/images/exercise] ${exName}: ${allUrls.length} imagens encontradas`);
  res.json({ urls: allUrls.slice(0, 6), terms: searchTerms });
});

// ─── ATUALIZAÇÃO DE TREINOS COM IA ──────────────────────────────────────────
app.post("/api/treinos/update", async (req, res) => {
  const { currentTreinos, feedback, exerciseDb, model = "claude-sonnet-4-6" } = req.body;

  if (!currentTreinos || !exerciseDb) {
    return res.status(400).json({ error: "Campos 'currentTreinos' e 'exerciseDb' obrigatórios" });
  }

  const availableExercises = Object.entries(exerciseDb)
    .map(([id, ex]) => `${id}: ${ex.name} (${ex.category}, ${(ex.muscles || []).join(", ")})`)
    .join("\n");

  const prompt = `Você é um personal trainer especialista em periodização e planejamento de treinos.

TREINOS ATUAIS (JSON):
${JSON.stringify(currentTreinos, null, 2)}

EXERCÍCIOS DISPONÍVEIS NO BANCO:
${availableExercises}

SOLICITAÇÃO DO USUÁRIO:
${feedback || "Otimize os treinos mantendo o volume e progressão adequados."}

INSTRUÇÕES:
- Retorne APENAS o JSON dos treinos atualizados, no mesmo formato do input
- Atualize SOMENTE os treinos A e B (avulsos). NUNCA altere PA ou PB (são treinos fixos do personal trainer)
- Os treinos A e B devem trabalhar grupos musculares DIFERENTES e COMPLEMENTARES aos de PA e PB
- Analise PA e PB para identificar os grupos já trabalhados pelo personal e EVITE repeti-los em A e B
- Cada treino deve ter 3 blocos com 3 exercícios cada
- A e B devem ser diferentes entre si — jamais repita o mesmo grupo muscular primário nos dois
- Mantenha a estrutura de blocos (blocos com nome e exercises)
- Cada exercise tem: id (do banco de exercícios), s (séries, string), r (repetições, string)
- Use IDs exatos do banco de exercícios fornecido
- Incorpore o feedback do usuário, especialmente dificuldades e necessidades reportadas
- Justifique brevemente as mudanças em um campo "justificativa" no JSON retornado
- Não inclua markdown, apenas JSON puro

Formato de resposta:
{
  "justificativa": "Explicação das mudanças...",
  "treinos": { ... mesmo formato de ALL_TREINOS ... }
}`;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const txt = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const s = txt.indexOf("{");
    const e = txt.lastIndexOf("}");
    if (s === -1) return res.json({ text: txt, parsed: null });

    try {
      const parsed = JSON.parse(txt.slice(s, e + 1));
      res.json({ text: txt, parsed });
    } catch {
      res.json({ text: txt, parsed: null });
    }
  } catch (err) {
    console.error("[/api/treinos/update]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CALENDAR — GET /api/calendar ────────────────────────────────────────────
app.get("/api/calendar", async (_req, res) => {
  const sql = await getDb();
  if (!sql) return res.json({ marks: {}, offline: true });
  try {
    const rows = await sql`SELECT date_key, marks FROM calendar_marks WHERE user_id = 'default'`;
    const marks = {};
    rows.forEach(r => { marks[r.date_key] = r.marks; });
    res.json({ marks });
  } catch(e) {
    console.error("[/api/calendar GET]", e.message);
    res.json({ marks: {}, error: e.message });
  }
});

// ─── CALENDAR — POST /api/calendar/mark ──────────────────────────────────────
app.post("/api/calendar/mark", async (req, res) => {
  const { dateKey, marks } = req.body;
  if (!dateKey) return res.status(400).json({ error: "dateKey obrigatório" });
  const sql = await getDb();
  if (!sql) return res.json({ ok: true, offline: true });
  try {
    if (!marks || marks.length === 0) {
      await sql`DELETE FROM calendar_marks WHERE user_id = 'default' AND date_key = ${dateKey}`;
    } else {
      await sql`INSERT INTO calendar_marks (user_id, date_key, marks) VALUES ('default', ${dateKey}, ${marks})
        ON CONFLICT (user_id, date_key) DO UPDATE SET marks = ${marks}, updated_at = NOW()`;
    }
    res.json({ ok: true });
  } catch(e) {
    console.error("[/api/calendar/mark]", e.message);
    res.json({ ok: false, error: e.message });
  }
});


// ─── USER DATA — GET /api/user-data ──────────────────────────────────────────
// Carrega todos os dados do usuário do banco
app.get("/api/user-data", async (_req, res) => {
  const sql = await getDb();
  if (!sql) return res.json({ data: {}, offline: true });
  try {
    const rows = await sql`SELECT data_key, data_value FROM user_data WHERE user_id = 'default'`;
    const data = {};
    rows.forEach(r => { data[r.data_key] = r.data_value; });
    res.json({ data });
  } catch (e) {
    console.error("[/api/user-data GET]", e.message);
    res.json({ data: {}, error: e.message });
  }
});

// ─── USER DATA — POST /api/user-data ─────────────────────────────────────────
// Salva/atualiza um dado do usuário no banco (upsert)
app.post("/api/user-data", async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Campo key obrigatório" });
  const sql = await getDb();
  if (!sql) return res.json({ ok: true, offline: true });
  try {
    const jsonValue = JSON.stringify(value);
    await sql`
      INSERT INTO user_data (user_id, data_key, data_value)
      VALUES ('default', ${key}, ${jsonValue}::jsonb)
      ON CONFLICT (user_id, data_key)
      DO UPDATE SET data_value = ${jsonValue}::jsonb, updated_at = NOW()
    `;
    res.json({ ok: true });
  } catch (e) {
    console.error("[/api/user-data POST]", e.message);
    res.json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log(`   API Key configurada: ${!!process.env.ANTHROPIC_API_KEY}`);
  console.log(`   Neon DB configurado: ${!!process.env.DATABASE_URL}`);
});
