# CLAUDE.md — treino-app

Aplicativo pessoal de musculação integrado com Claude AI para gerenciar treinos, exercícios, calendário e rotina semanal.

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
│   ├── context/AppContext.jsx   # Estado global (treinos, exercícios, calendário, rotina)
│   ├── data/
│   │   ├── exerciseDatabase.js  # Banco de 36+ exercícios com músculos, steps, dicas
│   │   ├── defaultTreinos.js    # Treinos padrão (A, B, PA, PB)
│   │   └── constants.js
│   ├── pages/
│   │   ├── TreinosPage.jsx      # Treinos A e B (atualizáveis por IA)
│   │   ├── PersonalPage.jsx     # Treinos PA e PB (fixos do personal trainer)
│   │   ├── ExerciciosPage.jsx   # Biblioteca de exercícios
│   │   ├── CalendarioPage.jsx   # Calendário de treinos realizados
│   │   └── RotinaPage.jsx       # Grade semanal por turno
│   └── components/
│       ├── Nav.jsx
│       ├── calendar/DayModal.jsx
│       ├── exercise/ExerciseModal.jsx
│       ├── exercise/AddExerciseModal.jsx
│       └── workout/FeedbackModal.jsx, UpdatePanel.jsx
├── backend/
│   └── server.js                # Express API (dev local)
├── api/
│   └── index.js                 # Vercel serverless function (produção)
├── package.json                 # Scripts raiz com concurrently
└── vercel.json                  # Config de deploy
```

## Comandos de desenvolvimento

```bash
npm run install:all   # Instala deps em todos os diretórios
npm run dev           # Inicia backend (3001) + frontend (5173) simultaneamente
npm run build         # Build do frontend para produção
npm run start         # Inicia apenas o backend
```

## Variáveis de ambiente

```bash
# backend/.env (desenvolvimento local)
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...         # Neon DB (opcional — app funciona offline sem ele)
PEXELS_API_KEY=...                    # Imagens de exercícios (opcional)
UNSPLASH_ACCESS_KEY=...               # Imagens de exercícios (opcional)
FRONTEND_ORIGIN=http://localhost:5173 # CORS
```

No Vercel, configurar as mesmas variáveis em Environment Variables.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check + status da API key |
| POST | `/api/ai` | Chamada Claude genérica |
| POST | `/api/ai/search` | Claude com web_search (busca de imagens) |
| POST | `/api/images/exercise` | Busca imagens via Pexels/Unsplash/Wger |
| POST | `/api/treinos/update` | Atualiza treinos A e B via IA com feedback |
| GET | `/api/calendar` | Lê marcações do calendário (Neon DB) |
| POST | `/api/calendar/mark` | Salva/remove marcação de dia |
| GET | `/api/user-data` | Lê dados do usuário (Neon DB) |
| POST | `/api/user-data` | Salva dado do usuário (upsert por key) |

## Modelos Claude utilizados

- **`claude-haiku-4-5-20251001`** — geração de termos de busca, chamadas genéricas (rápido e barato)
- **`claude-sonnet-4-6`** — atualização de treinos (tarefa complexa, precisa de maior capacidade)

## Lógica de treinos

- **A e B**: treinos atualizáveis pelo usuário via IA com feedback mensal
- **PA e PB**: treinos fixos do personal trainer — NUNCA alterar via IA
- A IA analisa PA/PB para garantir que A e B cubram grupos musculares complementares
- Estrutura de treino: 3 blocos × 3 exercícios, com `id` (do exerciseDatabase), `s` (séries), `r` (reps)

## Banco de exercícios

Definido em `frontend/src/data/exerciseDatabase.js`. Cada exercício tem:
```js
{
  name, category, muscles, equipment,
  description, steps: [], tips: []
}
```

## Estado global (AppContext)

O `AppContext.jsx` centraliza todo o estado da aplicação:
- `page` — página ativa (treinos | personal | calendario | exercicios | rotina)
- `allTreinos` — objeto com treinos A, B, PA, PB
- `exDb` — banco de exercícios (pode ter exercícios customizados adicionados pelo usuário)
- `userImages` / `userVideos` — mídia customizada por exercício
- `monthFeedback` — histórico de feedbacks mensais

Persistência: dados sincronizados com Neon DB via `/api/user-data`. Funciona em modo offline sem DATABASE_URL.
