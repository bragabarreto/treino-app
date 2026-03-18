export const ALL_TREINOS = {
  // ── TREINO A AVULSO (Segunda) ──────────────────────────────────────────────
  // Foco: Costas + Ombros + Cadeia Posterior + Bíceps + Core
  // Complementa Personal B (que faz Glúteo/Quad + Costas/Remada + Ombros + Bíceps nas Ter/Sex)
  A: { label:"Treino A Avulso", color:"#3b82f6", dia:"Segunda", blocos:[
    { nome:"Bloco I — Costas + Explosão", exercises:[
      {id:"puxada-frontal-pronada", s:"4", r:"10"},
      {id:"remada-unilateral-halter", s:"3", r:"12/12"},
      {id:"remada-alta-cabo", s:"3", r:"12"},
    ]},
    { nome:"Bloco II — Ombros + Cadeia Posterior", exercises:[
      {id:"desenvolvimento-arnold", s:"3", r:"12"},
      {id:"elevacao-lateral", s:"3", r:"15"},
      {id:"stiff-rdl", s:"4", r:"10"},
    ]},
    { nome:"Bloco III — Bíceps + Panturrilha + Core", exercises:[
      {id:"rosca-direta-barra", s:"3", r:"12"},
      {id:"elevacao-panturrilha-unilateral", s:"4", r:"15/15"},
      {id:"pallof-press", s:"3", r:"12/12"},
    ]},
  ]},

  // ── TREINO B AVULSO (Quarta) ───────────────────────────────────────────────
  // Foco: Peito + Tríceps + Isquiotibiais + Core + Panturrilha
  // EVITA: Glúteo (Personal B — Búlgaro, Leg Press), Costas (Personal B — Remada, Treino A)
  // Complementa Personal A (mais volume de peito, tríceps diferente da máquina)
  B: { label:"Treino B Avulso", color:"#22c55e", dia:"Quarta", blocos:[
    { nome:"Bloco I — Peito + Tríceps", exercises:[
      {id:"supino-plano-halteres", s:"4", r:"10"},
      {id:"flexao-diamante", s:"3", r:"12"},
      {id:"triceps-frances-halter", s:"3", r:"12"},
    ]},
    { nome:"Bloco II — Isquiotibiais + Posterior", exercises:[
      {id:"mesa-flexora", s:"4", r:"12"},
      {id:"avanco-reverso", s:"3", r:"10/10"},
      {id:"cadeira-flexora", s:"3", r:"12"},
    ]},
    { nome:"Bloco III — Core + Panturrilha", exercises:[
      {id:"russian-twist", s:"3", r:"20"},
      {id:"prancha-lateral", s:"3", r:"30s/30s"},
      {id:"panturrilha-sentado", s:"4", r:"20"},
    ]},
  ]},

  // ── PERSONAL — TREINO A (Terça/Sexta) ─────────────────────────────────────
  // Conforme treino do personal trainer
  PA: { label:"Personal — Treino A", color:"#a855f7", dia:"Ter/Sex", blocos:[
    { nome:"Bloco I — Peito + Posterior", exercises:[
      {id:"supino-inclinado-barra", s:"3", r:"12"},
      {id:"terra-halteres", s:"3", r:"12"},
      {id:"apoio-de-frente", s:"3", r:"máx."},
    ]},
    { nome:"Bloco II — Quadríceps + Peito + Adutores", exercises:[
      {id:"hack-squat", s:"3", r:"12"},
      {id:"crucifixo-halteres", s:"3", r:"12"},
      {id:"copenhagen-banco", s:"3", r:"10/10"},
    ]},
    { nome:"Bloco III — Tríceps + Core + Potência", exercises:[
      {id:"triceps-maquina", s:"3", r:"15"},
      {id:"prancha-alta", s:"3", r:"15"},
    ]},
  ]},

  // ── PERSONAL — TREINO B (Terça/Sexta) ─────────────────────────────────────
  // Conforme treino do personal trainer
  PB: { label:"Personal — Treino B", color:"#ec4899", dia:"Ter/Sex", blocos:[
    { nome:"Bloco I — Glúteo + Costas + Core", exercises:[
      {id:"bulgaro-kb", s:"3", r:"10/10"},
      {id:"remada-curvada", s:"3", r:"12"},
      {id:"prancha-alta", s:"3", r:"40s"},
    ]},
    { nome:"Bloco II — Pernas + Costas + Panturrilha", exercises:[
      {id:"leg-horizontal-unilateral", s:"3", r:"12/12"},
      {id:"remada-curvada", s:"3", r:"12/12"},
      {id:"panturrilha-leg", s:"3", r:"20"},
    ]},
    { nome:"Bloco III — Ombros + Glúteo + Bíceps", exercises:[
      {id:"extensao-ombros-rotacao", s:"3", r:"12/12"},
      {id:"abducao-quadril-maquina", s:"3", r:"12"},
      {id:"rosca-unilateral-polia-alta", s:"3", r:"12/12"},
    ]},
  ]},
};
