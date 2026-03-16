-- Migration 001: Cria tabela user_data para persistência de dados do usuário
-- Execute este SQL no painel do Neon (https://console.neon.tech)

-- Tabela existente (já deve existir no banco):
-- CREATE TABLE IF NOT EXISTS calendar_marks (
--   user_id TEXT NOT NULL DEFAULT 'default',
--   date_key TEXT NOT NULL,
--   marks TEXT[] NOT NULL DEFAULT '{}',
--   updated_at TIMESTAMP DEFAULT NOW(),
--   PRIMARY KEY (user_id, date_key)
-- );

-- Nova tabela para todos os dados do usuário (exercícios, treinos, logs, rotina, etc.)
CREATE TABLE IF NOT EXISTS user_data (
  user_id    TEXT      NOT NULL DEFAULT 'default',
  data_key   TEXT      NOT NULL,
  data_value JSONB,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, data_key)
);

-- Dados que serão armazenados (data_key → conteúdo):
--   exdb      → customizações do banco de exercícios (exercícios adicionados/editados pelo usuário)
--   videos    → URLs de vídeos por exercício { exId: "url" }
--   treinos   → planos de treino A/B/PA/PB personalizados
--   feedback  → histórico de feedback mensal
--   rotina    → agenda semanal (7 dias × 3 turnos)
--   plogs     → diário pessoal (texto + fotos)
--   logs      → registros de desempenho por exercício (carga, séries, obs)
--
-- NOTA: tm7-imgs (fotos base64 dos exercícios) NÃO é armazenado no banco
--       por ser muito grande — fica apenas no localStorage do navegador.
