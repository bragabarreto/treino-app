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

  // ─── BUSCA DE IMAGENS E VÍDEOS — Google Custom Search + YouTube ─────────────
  if (req.method === "POST" && path === "/images/exercise") {
    const { exId, exName, muscles = [], category = "" } = req.body;
    if (!exName) return json(res, { error: "exName obrigatório" }, 400);

    const GKEY = process.env.GOOGLE_API_KEY;
    const GCSE = process.env.GOOGLE_CSE_ID;

    // 1. Claude gera termos de busca precisos em inglês
    let searchTerms = [];
    try {
      const termResp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `You are a fitness expert. Translate this exercise to precise English search terms for Google Image Search.

Exercise (Portuguese): "${exName}"
Primary muscles: ${muscles.slice(0,3).join(", ")}
Category: ${category}

Rules:
- Terms must refer to a REAL gym exercise with equipment/technique
- Include the equipment type when relevant (barbell, dumbbell, cable, machine, etc.)
- Include "exercise" or "gym" or "how to" in each term
- Terms must be specific enough to find photos of PEOPLE PERFORMING this exact movement

Return ONLY a JSON object:
{
  "imageTerms": ["<most specific term for image search>", "<alternative term>"],
  "videoTerm": "<best term for YouTube search of this exercise tutorial>"
}`
        }]
      });
      const txt = termResp.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s !== -1) {
        const parsed = JSON.parse(txt.slice(s, e+1));
        searchTerms = parsed.imageTerms || [];
        if (parsed.videoTerm) searchTerms._videoTerm = parsed.videoTerm;
      }
    } catch(_) {}
    if (!searchTerms.length) searchTerms = [exName + " exercise gym", exName + " how to gym"];

    const images = [];
    const videos = [];

    // 2. Google Custom Search API — imagens
    if (GKEY && GCSE) {
      for (const term of searchTerms.slice(0,2)) {
        if (images.length >= 8) break;
        try {
          const url = `https://www.googleapis.com/customsearch/v1?key=${GKEY}&cx=${GCSE}&searchType=image&q=${encodeURIComponent(term)}&num=8&imgType=photo&imgSize=large&safe=active&rights=cc_publicdomain,cc_attribute,cc_sharealike`;
          const r = await fetch(url);
          const d = await r.json();
          (d.items || []).forEach(item => {
            if (images.length < 12) {
              images.push({
                url: item.link,
                thumb: item.image?.thumbnailLink || item.link,
                source: "Google",
                title: item.title,
              });
            }
          });
        } catch(_) {}
      }
    }

    // 3. YouTube Data API v3 — vídeos de demonstração
    if (GKEY) {
      const videoQuery = searchTerms._videoTerm || (searchTerms[0] + " tutorial");
      try {
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${GKEY}&q=${encodeURIComponent(videoQuery)}&type=video&part=snippet&maxResults=6&videoEmbeddable=true&videoDuration=medium&relevanceLanguage=pt&order=relevance`;
        const yr = await fetch(ytUrl);
        const yd = await yr.json();
        (yd.items || []).forEach(item => {
          videos.push({
            videoId: item.id?.videoId,
            title: item.snippet?.title,
            channel: item.snippet?.channelTitle,
            thumb: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
          });
        });
      } catch(_) {}
    }

    // 4. Wger fallback para imagens se Google não configurado
    if (images.length < 2) {
      try {
        const wQuery = searchTerms[0] || exName;
        const wr = await fetch(`https://wger.de/api/v2/exercise/?format=json&language=2&term=${encodeURIComponent(wQuery)}&limit=5`);
        const wd = await wr.json();
        for (const ex of (wd.results||[]).slice(0,3)) {
          if (ex.id) {
            const imgr = await fetch(`https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${ex.id}`);
            const imgd = await imgr.json();
            (imgd.results||[]).forEach(img => images.push({ url: img.image, thumb: img.image, source: "Wger" }));
          }
        }
      } catch(_) {}
    }

    return json(res, {
      images: images.slice(0, 9),
      videos: videos.filter(v => v.videoId).slice(0, 6),
      terms: searchTerms,
      // Backward compat: urls field para código legado
      urls: images.slice(0, 6).map(i => ({ url: i.url, thumb: i.thumb, source: i.source })),
    });
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
