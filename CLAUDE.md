# CLAUDE.md — treino-app

Aplicativo pessoal de musculacao integrado com Claude AI para gerenciar treinos, exercicios, calendario e rotina semanal.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite (porta 5173) |
| Backend local | Express + Node.js (porta 3001) |
| API serverless | Vercel Functions (`/api/`) |
| Banco de dados | Neon (PostgreSQL serverless) |
| IA | Claude via Anthropic SDK |
| Deploy | Vercel (`treino-app-chi.vercel.app`) |

## Estrutura do projeto

```
treino-app/
├── frontend/src/
│   ├── App.jsx                  # Shell principal, roteamento por estado
│   ├── context/AppContext.jsx   # Estado global (treinos, exercicios, calendario, rotina)
│   ├── data/
│   │   ├── exerciseDatabase.js  # Banco de 80+ exercicios com musculos, steps, dicas
│   │   ├── defaultTreinos.js    # Treinos padrao (A, B, PA, PB)
│   │   └── constants.js
│   ├── pages/
│   │   ├── TreinosPage.jsx      # Treinos A, B e Extra (avulsos, atualizaveis por IA)
│   │   ├── PersonalPage.jsx     # Treinos PA e PB (editaveis manualmente)
│   │   ├── ExerciciosPage.jsx   # Biblioteca de exercicios
│   │   ├── CalendarioPage.jsx   # Calendario de treinos realizados
│   │   └── RotinaPage.jsx       # Grade semanal por turno
│   └── components/
│       ├── Nav.jsx
│       ├── calendar/DayModal.jsx
│       ├── exercise/ExerciseModal.jsx, AddExerciseModal.jsx
│       └── workout/
│           ├── WorkoutBlock.jsx          # Renderiza treino com progresso e logs
│           ├── ExCard.jsx                # Card de exercicio com done/carga/obs
│           ├── FeedbackModal.jsx         # Feedback mensal para IA
│           ├── UpdatePanel.jsx           # Geracao de A/B via IA
│           ├── EditPersonalWorkoutModal.jsx  # Edicao manual de PA/PB
│           └── ExtraWorkoutModal.jsx     # Geracao de treino extra ad-hoc
├── backend/
│   └── server.js                # Express API (dev local)
├── api/
│   └── index.js                 # Vercel serverless function (producao)
├── package.json                 # Scripts raiz com concurrently
└── vercel.json                  # Config de deploy
```

## Comandos de desenvolvimento

```bash
npm run install:all   # Instala deps em todos os diretorios
npm run dev           # Inicia backend (3001) + frontend (5173) simultaneamente
npm run build         # Build do frontend para producao
npm run start         # Inicia apenas o backend
```

## Variaveis de ambiente

```bash
# backend/.env (desenvolvimento local)
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...         # Neon DB (opcional — app funciona offline sem ele)
GOOGLE_API_KEY=...                    # Google Custom Search + YouTube (imagens/videos)
GOOGLE_CSE_ID=...                     # Google Custom Search Engine ID
FRONTEND_ORIGIN=http://localhost:5173 # CORS
```

No Vercel, configurar as mesmas variaveis em Environment Variables.

## Endpoints da API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/health` | Health check + status da API key |
| POST | `/api/ai` | Chamada Claude generica |
| POST | `/api/ai/search` | Claude com web_search (busca de imagens) |
| POST | `/api/images/exercise` | Busca imagens via Google + YouTube (PT-BR) |
| POST | `/api/treinos/update` | Atualiza treinos A e B via IA com feedback |
| POST | `/api/treinos/extra` | Gera treino extra ad-hoc via IA |
| GET | `/api/calendar` | Le marcacoes do calendario (Neon DB) |
| POST | `/api/calendar/mark` | Salva/remove marcacao de dia |
| GET | `/api/user-data` | Le dados do usuario (Neon DB) |
| POST | `/api/user-data` | Salva dado do usuario (upsert por key) |

## Modelos Claude utilizados

- **`claude-haiku-4-5-20251001`** — geracao de termos de busca, chamadas genericas (rapido e barato)
- **`claude-sonnet-4-6`** — atualizacao de treinos e treino extra (tarefa complexa)

## Logica de treinos

### Tipos de treino
- **A e B**: treinos avulsos atualizaveis pelo usuario via IA com feedback mensal
- **PA e PB**: treinos do personal trainer — editaveis manualmente via `EditPersonalWorkoutModal`, NUNCA alterados por IA
- **Extra (EX)**: treino ad-hoc gerado por IA sob demanda, valido apenas para o dia atual

### Regras de complementaridade
- A IA extrai dinamicamente os musculos de PA/PB (`extractMuscleGroups`) e injeta no prompt
- A e B DEVEM trabalhar grupos musculares DIFERENTES dos de PA/PB
- A e B tambem devem ser diferentes entre si
- Treino Extra evita exercicios ja presentes em A/B/PA/PB

### Estrutura de treino
```js
{
  label: "Nome do treino",
  color: "#hex",
  dia: "Seg/Qua/Ter/Sex",
  blocos: [
    {
      nome: "Bloco I — Descricao",
      exercises: [
        { id: "exercicio-id", s: "3", r: "12" }  // s=series, r=reps
      ]
    }
  ]
}
```

### Treinos atuais do personal (PA/PB)
**PA** (Ter/Sex): Peito (supino incl., crucifixo, apoio), Cadeia Posterior (terra), Quad (hack), Adutores (copenhagen), Triceps (maquina), Core (prancha bola), Potencia (saltos horiz.)
**PB** (Ter/Sex): Gluteo (bulgaro, abducao), Costas (barra apoio, remada curvada), Pernas (leg press), Panturrilha (panturrilha leg), Ombros (extensao rotacao), Biceps (rosca polia), Core (prancha alta)

## Banco de exercicios

Definido em `frontend/src/data/exerciseDatabase.js`. 217 exercicios (94 originais + 123 focados em joelho, quadril, tornozelo, core, lombar, mobilidade, alongamento, pliometria e agilidade para futebol e volei de praia). Videos YouTube verificados via oEmbed; imagens de sites especializados (ACE Fitness, Physio-pedia, SportsInjuryClinic, Hipertrofia.org) + thumbnails YouTube. Cada exercicio tem:
```js
{
  name, category, muscles, equipment,
  description, steps: [], tips: [],
  videoId, images: []
}
```

## Estado global (AppContext)

O `AppContext.jsx` centraliza todo o estado da aplicacao:
- `page` — pagina ativa (treinos | personal | calendario | exercicios | rotina)
- `allTreinos` — objeto com treinos A, B, PA, PB
- `extraTreino` — treino extra ad-hoc (expira diariamente)
- `exDb` — banco de exercicios (pode ter exercicios customizados)
- `userImages` / `userVideos` — midia customizada por exercicio
- `monthFeedback` — historico de feedbacks mensais
- `logs` — logs de execucao por exercicio (carga, tempo, obs, done)
- `marks` — marcacoes do calendario (A, B, PA, PB, EX, miss)
- `rotina` — grade semanal por turno

Persistencia: localStorage + Neon DB via `/api/user-data`. Funciona offline sem DATABASE_URL.

## Calendario

Marcas possiveis por dia: A, B, PA, PB, EX, miss
- Cores: A=#3b82f6, B=#22c55e, PA=#a855f7, PB=#ec4899, EX=#f59e0b, miss=#ef4444
- Treinos concluidos (100% exercicios marcados) sao automaticamente registrados no calendario
- Usuario pode editar marcas manualmente via DayModal

---

# Karpathy Guidelines (diretrizes de comportamento)

<!-- Fonte: https://github.com/multica-ai/andrej-karpathy-skills (CLAUDE.md, MIT) -->

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
