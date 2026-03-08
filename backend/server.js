import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

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

// ─── BUSCA DE IMAGENS DE EXERCÍCIO ──────────────────────────────────────────
// Usa Claude com web_search para encontrar URLs diretas de imagens
app.post("/api/images/exercise", async (req, res) => {
  const { exId, exName, searchTerms } = req.body;

  if (!exName) {
    return res.status(400).json({ error: "Campo 'exName' obrigatório" });
  }

  const primary = searchTerms?.[0] || exName + " exercise gym";
  const secondary = searchTerms?.[1] || primary;

  const prompt = `Search for exercise photos: "${primary}" and "${secondary}".

Find direct image URLs (.jpg, .jpeg, .png, .webp) from these reliable sources:
- upload.wikimedia.org (Wikimedia Commons direct image files)
- muscleandstrength.com
- verywellfit.com
- acefitness.org
- menshealth.com

Return ONLY a JSON object, no markdown, no text outside JSON:
{"urls":["https://upload.wikimedia.org/...jpg","https://...jpg","https://...png"]}

Rules:
- URLs must end in .jpg, .jpeg, .png, or .webp (direct image files only)
- Must show real people or quality anatomical illustrations performing the exercise
- NO animated gifs, NO SVG, NO page URLs (only direct image file URLs)
- Return 4-6 URLs`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    });

    const txt = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const s = txt.indexOf("{");
    const e = txt.lastIndexOf("}");
    if (s === -1) return res.json({ urls: [] });

    const parsed = JSON.parse(txt.slice(s, e + 1));
    const urls = (parsed.urls || []).filter(
      (u) =>
        typeof u === "string" &&
        u.startsWith("http") &&
        u.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)
    );

    res.json({ urls });
  } catch (err) {
    console.error("[/api/images/exercise]", err.message);
    res.status(500).json({ error: err.message, urls: [] });
  }
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
- Mantenha a estrutura de blocos (blocos com nome e exercises)
- Cada exercise tem: id (do banco de exercícios), s (séries, string), r (repetições, string)
- Use IDs exatos do banco de exercícios fornecido
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

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log(`   API Key configurada: ${!!process.env.ANTHROPIC_API_KEY}`);
});
