// Vercel Serverless Function — todas as rotas /api/*
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  // ─── POST /api/images/exercise ───────────────────────────────────────────
  if (req.method === "POST" && path === "/images/exercise") {
    const { exId, exName, searchTerms } = req.body;
    if (!exName) return json(res, { error: "exName obrigatório" }, 400);
    const primary = searchTerms?.[0] || exName + " exercise gym";
    const secondary = searchTerms?.[1] || primary;
    const prompt = `Search for exercise demonstration photos: "${primary}" and "${secondary}".

Find direct image URLs (.jpg, .jpeg, .png, .webp) from reliable fitness sources like upload.wikimedia.org, muscleandstrength.com, verywellfit.com, acefitness.org.

Return ONLY JSON: {"urls":["https://...jpg","https://...png"]}

Rules: URLs must end in .jpg/.jpeg/.png/.webp, show real people performing the exercise, 4-6 URLs.`;
    try {
      const r = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      });
      const txt = r.content.filter(b => b.type === "text").map(b => b.text).join("");
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s === -1) return json(res, { urls: [] });
      const parsed = JSON.parse(txt.slice(s, e + 1));
      const urls = (parsed.urls || []).filter(u =>
        typeof u === "string" && u.startsWith("http") && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)
      );
      return json(res, { urls });
    } catch (e) {
      return json(res, { error: e.message, urls: [] }, 500);
    }
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

  return json(res, { error: "Rota não encontrada" }, 404);
}
