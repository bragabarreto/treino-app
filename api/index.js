// Vercel Serverless Function — todas as rotas /api/*
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

function json(res, data, status = 200) {
  res.status(status).json(data);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const path = req.url.replace(/^\/api/, "").split("?")[0];

  // ─── GET /api/health ────────────────────────────────────────────────────
  if (req.method === "GET" && path === "/health") {
    return json(res, { status: "ok", apiKey: !!process.env.ANTHROPIC_API_KEY });
  }

  // ─── POST /api/ai ────────────────────────────────────────────────────────
  if (req.method === "POST" && path === "/ai") {
    const { messages, max_tokens = 1500, model = "claude-haiku-4-5-20251001" } = req.body;
    if (!messages) return json(res, { error: "messages obrigatório" }, 400);
    try {
      const r = await anthropic.messages.create({ model, max_tokens, messages });
      const text = r.content.filter(b => b.type === "text").map(b => b.text).join("");
      return json(res, { text });
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // ─── POST /api/ai/search ─────────────────────────────────────────────────
  if (req.method === "POST" && path === "/ai/search") {
    const { messages, max_tokens = 1500, model = "claude-haiku-4-5-20251001" } = req.body;
    if (!messages) return json(res, { error: "messages obrigatório" }, 400);
    try {
      const r = await anthropic.messages.create({
        model, max_tokens,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      });
      const text = r.content.filter(b => b.type === "text").map(b => b.text).join("");
      return json(res, { text });
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // ─── BUSCA DE IMAGENS — Pexels + Unsplash + Wger fallback ───────────────────
  if (req.method === "POST" && path === "/images/exercise") {
    const { exId, exName, muscles = [], category = "" } = req.body;
    if (!exName) return json(res, { error: "exName obrigatório" }, 400);

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

    return json(res, { urls: allUrls.slice(0, 6), terms: searchTerms });
  }

  // ─── POST /api/treinos/update ─────────────────────────────────────────────
  if (req.method === "POST" && path === "/treinos/update") {
    const { currentTreinos, feedback, exerciseDb, model = "claude-sonnet-4-6" } = req.body;
    if (!currentTreinos || !exerciseDb) return json(res, { error: "campos obrigatórios" }, 400);
    const availableExercises = Object.entries(exerciseDb)
      .map(([id, ex]) => `${id}: ${ex.name} (${ex.category}, ${(ex.muscles || []).join(", ")})`)
      .join("\n");
    const prompt = `Você é personal trainer especialista em periodização.

TREINOS ATUAIS (JSON):
${JSON.stringify(currentTreinos, null, 2)}

EXERCÍCIOS DISPONÍVEIS:
${availableExercises}

SOLICITAÇÃO: ${feedback || "Otimize os treinos mantendo volume e progressão adequados."}

Retorne APENAS JSON com esta estrutura:
{"justificativa":"Explicação das mudanças...","treinos":{...mesmo formato de ALL_TREINOS...}}`;
    try {
      const r = await anthropic.messages.create({
        model, max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      const txt = r.content.filter(b => b.type === "text").map(b => b.text).join("");
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s === -1) return json(res, { text: txt, parsed: null });
      try {
        return json(res, { text: txt, parsed: JSON.parse(txt.slice(s, e + 1)) });
      } catch {
        return json(res, { text: txt, parsed: null });
      }
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // GET /api/calendar — fetch all marks
  if (req.method === "GET" && path === "/calendar") {
    const sql = await getDb();
    if (!sql) return json(res, { marks: {}, offline: true });
    try {
      const rows = await sql`SELECT date_key, marks FROM calendar_marks WHERE user_id = 'default'`;
      const marks = {};
      rows.forEach(r => { marks[r.date_key] = r.marks; });
      return json(res, { marks });
    } catch(e) {
      return json(res, { marks: {}, error: e.message });
    }
  }

  // POST /api/calendar/mark — save a mark
  if (req.method === "POST" && (path === "/calendar/mark" || path === "/calendar")) {
    const { dateKey, marks } = req.body;
    if (!dateKey) return json(res, { error: "dateKey obrigatório" }, 400);
    const sql = await getDb();
    if (!sql) return json(res, { ok: true, offline: true });
    try {
      if (!marks || marks.length === 0) {
        await sql`DELETE FROM calendar_marks WHERE user_id = 'default' AND date_key = ${dateKey}`;
      } else {
        await sql`INSERT INTO calendar_marks (user_id, date_key, marks) VALUES ('default', ${dateKey}, ${marks})
          ON CONFLICT (user_id, date_key) DO UPDATE SET marks = ${marks}, updated_at = NOW()`;
      }
      return json(res, { ok: true });
    } catch(e) {
      return json(res, { ok: false, error: e.message });
    }
  }

  return json(res, { error: "Rota não encontrada" }, 404);
}
