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

  // ─── BUSCA DE IMAGENS E VÍDEOS — Google (PT-BR) + YouTube Brasil ────────────
  if (req.method === "POST" && path === "/images/exercise") {
    const { exId, exName, muscles = [], category = "" } = req.body;
    if (!exName) return json(res, { error: "exName obrigatório" }, 400);

    const GKEY = process.env.GOOGLE_API_KEY;
    const GCSE = process.env.GOOGLE_CSE_ID;

    // Sites brasileiros e especializados em musculação/fitness
    const SITES_BR = [
      "musculacao.net",
      "hipertrofia.org",
      "treinoeperformance.com.br",
      "dicasdemusculacao.net",
      "gironoticias.com.br",
      "vigorefit.com.br",
      "educacaofisica.com.br",
      "bodybuilding.com.br",
      "umcorpoperfeito.com.br",
      "atleta.com.br",
    ];
    const siteFilter = SITES_BR.map(s => `site:${s}`).join(" OR ");

    // 1. Claude gera terminologia brasileira precisa para o exercício
    let termos = { imagem: [], youtube: "" };
    try {
      const termResp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Você é especialista em musculação e fitness brasileiro.

Exercício: "${exName}"
Músculos: ${muscles.slice(0,3).join(", ")}
Categoria: ${category}

Sua tarefa: gerar termos de busca em PORTUGUÊS BRASILEIRO que um brasileiro usaria para procurar FOTOS e VÍDEOS deste exercício em sites de musculação.

Regras:
- Use o nome popular brasileiro do exercício (como é chamado nas academias do Brasil)
- Inclua palavras como: execução, como fazer, musculação, treino, técnica
- Os termos de imagem devem encontrar FOTOS DE PESSOAS fazendo o exercício
- O termo do YouTube deve encontrar VÍDEOS TUTORIAIS em português

Retorne APENAS JSON válido:
{
  "nomeBR": "nome como é chamado nas academias brasileiras",
  "termosImagem": [
    "nomeBR musculação execução",
    "nomeBR como fazer técnica"
  ],
  "terminoYoutube": "como fazer nomeBR musculação execução correta"
}`
        }]
      });
      const txt = termResp.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const s = txt.indexOf("{"), e2 = txt.lastIndexOf("}");
      if (s !== -1) {
        const p = JSON.parse(txt.slice(s, e2+1));
        termos.imagem = p.termosImagem || [];
        termos.youtube = p.terminoYoutube || "";
        termos.nomeBR = p.nomeBR || exName;
      }
    } catch(_) {}
    // Fallback se Claude falhar
    if (!termos.imagem.length) {
      termos.imagem = [`${exName} musculação execução`, `${exName} como fazer academia`];
      termos.youtube = `como fazer ${exName} musculação`;
      termos.nomeBR = exName;
    }

    const images = [];
    const videos = [];

    // Função auxiliar para busca no Google Images
    async function googleImageSearch(query, extraParams = "") {
      if (!GKEY || !GCSE) return;
      try {
        // gl=br → resultados do Brasil | hl=pt-BR → interface português | SEM restrição de licença CC
        const url = `https://www.googleapis.com/customsearch/v1?key=${GKEY}&cx=${GCSE}&searchType=image&q=${encodeURIComponent(query)}&num=8&imgType=photo&safe=active&gl=br&hl=pt-BR${extraParams}`;
        const r = await fetch(url);
        const d = await r.json();
        (d.items || []).forEach(item => {
          // Evitar duplicatas por URL
          if (!images.find(i => i.url === item.link) && images.length < 12) {
            images.push({
              url: item.link,
              thumb: item.image?.thumbnailLink || item.link,
              source: item.displayLink || "Google",
              title: item.title,
            });
          }
        });
      } catch(_) {}
    }

    // 2. PASSO 1: Busca nos sites especializados brasileiros
    const termoPrincipal = termos.imagem[0] || exName;
    await googleImageSearch(`${termoPrincipal} (${siteFilter})`);

    // 3. PASSO 2: Se poucos resultados, busca ampla no Brasil (gl=br)
    if (images.length < 5) {
      await googleImageSearch(termoPrincipal);
    }

    // 4. PASSO 3: Termo alternativo, ainda no Brasil
    if (images.length < 6 && termos.imagem[1]) {
      await googleImageSearch(termos.imagem[1]);
    }

    // 5. YouTube — busca em português com foco no Brasil
    if (GKEY) {
      const ytQuery = termos.youtube || `como fazer ${exName} musculação`;
      try {
        // regionCode=BR → vídeos brasileiros | relevanceLanguage=pt → prioriza português
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${GKEY}&q=${encodeURIComponent(ytQuery)}&type=video&part=snippet&maxResults=6&videoEmbeddable=true&relevanceLanguage=pt&regionCode=BR&order=relevance`;
        const yr = await fetch(ytUrl);
        const yd = await yr.json();
        (yd.items || []).forEach(item => {
          if (item.id?.videoId) {
            videos.push({
              videoId: item.id.videoId,
              title: item.snippet?.title,
              channel: item.snippet?.channelTitle,
              thumb: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            });
          }
        });
        // Se poucos resultados BR, busca sem regionCode
        if (videos.length < 3) {
          const ytUrl2 = `https://www.googleapis.com/youtube/v3/search?key=${GKEY}&q=${encodeURIComponent(ytQuery)}&type=video&part=snippet&maxResults=6&videoEmbeddable=true&relevanceLanguage=pt&order=relevance`;
          const yr2 = await fetch(ytUrl2);
          const yd2 = await yr2.json();
          (yd2.items || []).forEach(item => {
            if (item.id?.videoId && !videos.find(v => v.videoId === item.id.videoId)) {
              videos.push({
                videoId: item.id.videoId,
                title: item.snippet?.title,
                channel: item.snippet?.channelTitle,
                thumb: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
              });
            }
          });
        }
      } catch(_) {}
    }

    return json(res, {
      images: images.slice(0, 9),
      videos: videos.slice(0, 6),
      terms: termos.imagem,
      nomeBR: termos.nomeBR,
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

  // GET /api/user-data — carrega todos os dados do usuário
  if (req.method === "GET" && path === "/user-data") {
    const sql = await getDb();
    if (!sql) return json(res, { data: {}, offline: true });
    try {
      const rows = await sql`SELECT data_key, data_value FROM user_data WHERE user_id = 'default'`;
      const data = {};
      rows.forEach(r => { data[r.data_key] = r.data_value; });
      return json(res, { data });
    } catch (e) {
      return json(res, { data: {}, error: e.message });
    }
  }

  // POST /api/user-data — salva/atualiza dado do usuário (upsert)
  if (req.method === "POST" && path === "/user-data") {
    const { key, value } = req.body;
    if (!key) return json(res, { error: "Campo key obrigatório" }, 400);
    const sql = await getDb();
    if (!sql) return json(res, { ok: true, offline: true });
    try {
      const jsonValue = JSON.stringify(value);
      await sql`
        INSERT INTO user_data (user_id, data_key, data_value)
        VALUES ('default', ${key}, ${jsonValue}::jsonb)
        ON CONFLICT (user_id, data_key)
        DO UPDATE SET data_value = ${jsonValue}::jsonb, updated_at = NOW()
      `;
      return json(res, { ok: true });
    } catch (e) {
      return json(res, { ok: false, error: e.message });
    }
  }

  return json(res, { error: "Rota não encontrada" }, 404);
}
