import type { RequestStatus } from './types';

export const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
};

export const FINAL_STATUSES: RequestStatus[] = ['APROVADO', 'RECUSADO', 'CANCELADO'];

/** Transições estruturalmente válidas (quem pode executá-las está em permissions/access.ts). */
export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDENTE: ['EM_ANALISE', 'APROVADO', 'RECUSADO', 'CANCELADO'],
  EM_ANALISE: ['APROVADO', 'RECUSADO'],
  APROVADO: [],
  RECUSADO: [],
  CANCELADO: [],
};

export const isValidTransition = (from: RequestStatus, to: RequestStatus) =>
  VALID_TRANSITIONS[from].includes(to);
