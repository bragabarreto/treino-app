# 🏋️ Treino App — IA

Aplicativo de treinos integrado com Claude IA para:
- **Imagens ilustrativas** dos exercícios (busca automática via Claude web_search)
- **Atualização de treinos** por IA baseada em feedback do usuário
- Calendário de treinos com marcação e estatísticas
- Banco de 36+ exercícios com instruções detalhadas
- Rotina semanal personalizável

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Backend (local) | Express + Node.js |
| API Serverless | Vercel Functions |
| IA | Claude (Anthropic SDK) |

## Configuração local

### 1. Clonar e instalar

```bash
git clone https://github.com/SEU_USUARIO/treino-app.git
cd treino-app
npm run install:all
```

### 2. Configurar API Key

```bash
# backend/.env
cp backend/.env.example backend/.env
# Adicione sua chave: ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## Deploy no Vercel

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Configure a variável de ambiente: `ANTHROPIC_API_KEY=sk-ant-...`
3. Vercel detecta automaticamente o `vercel.json`

## Funcionalidades

### Treinos
- 4 programas: A (Segunda), B (Quarta), Personal A e Personal B
- Atualização inteligente via IA com feedback personalizado

### Exercícios
- 36 exercícios com músculos, descrição, passo a passo e dicas
- Imagens ilustrativas via Claude IA + busca web
- Upload de fotos personalizadas

### Calendário
- Registro diário de treinos realizados
- Estatísticas de frequência e meta mensal

### Rotina
- Grade semanal com turnos (manhã/tarde/noite)
- Edição livre de atividades por turno
