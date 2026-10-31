export const ROTULO_STATUS = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
};

export const COR_STATUS = {
  PENDENTE: 'var(--warn)',
  EM_ANALISE: 'var(--info)',
  APROVADO: 'var(--ok)',
  RECUSADO: 'var(--danger)',
  CANCELADO: 'var(--muted)',
};

export const TODOS_STATUS = ['PENDENTE', 'EM_ANALISE', 'APROVADO', 'RECUSADO', 'CANCELADO'];

// Transições estruturalmente válidas (quem pode executá-las está em acesso.js).
export const TRANSICOES = {
  PENDENTE: ['EM_ANALISE', 'APROVADO', 'RECUSADO', 'CANCELADO'],
  EM_ANALISE: ['APROVADO', 'RECUSADO'],
  APROVADO: [],
  RECUSADO: [],
  CANCELADO: [],
};

export const transicaoValida = (de, para) => TRANSICOES[de]?.includes(para) ?? false;
