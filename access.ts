import type { BackupRequest, RequestStatus, Role, UserProfile } from './types';

// Regras de autorização no app. NÃO substituem as regras do Firestore (ver firestore.rules.proposed).
// Pontos marcados "REGRA A CONFIRMAR" dependem de definição do responsável pelo projeto.

export const hasRole = (p: UserProfile, role: Role) => p.cargos.includes(role);

export function canAccessBase(p: UserProfile, base: string): boolean {
  return p.todasAsBases === true || p.bases.includes(base);
}

export const canCreateRequest = (p: UserProfile, base: string) =>
  hasRole(p, 'despachante') && canAccessBase(p, base);

export const canViewRequest = (p: UserProfile, r: Pick<BackupRequest, 'base'>) =>
  canAccessBase(p, r.base) &&
  (hasRole(p, 'despachante') || hasRole(p, 'supervisor') || hasRole(p, 'coordenador_geral'));

/** Bases que o usuário pode consultar (usado para montar a consulta; as regras do Firestore reforçam). */
export function viewableBases(p: UserProfile): string[] | 'ALL' {
  return p.todasAsBases ? 'ALL' : [...p.bases];
}

/** Apenas coordenador geral decide; nunca sobre a própria solicitação. */
export function canDecide(p: UserProfile, r: Pick<BackupRequest, 'base' | 'solicitante' | 'status'>): boolean {
  return (
    hasRole(p, 'coordenador_geral') &&
    canAccessBase(p, r.base) &&
    r.solicitante.uid !== p.uid &&
    (r.status === 'PENDENTE' || r.status === 'EM_ANALISE')
  );
}

/** REGRA A CONFIRMAR: supervisor pode apenas mover PENDENTE -> EM_ANALISE. */
export function canMoveToAnalysis(p: UserProfile, r: Pick<BackupRequest, 'base' | 'status'>): boolean {
  return (
    (hasRole(p, 'supervisor') || hasRole(p, 'coordenador_geral')) &&
    canAccessBase(p, r.base) &&
    r.status === 'PENDENTE'
  );
}

/** Solicitante pode cancelar enquanto ainda estiver PENDENTE. */
export const canCancel = (p: UserProfile, r: Pick<BackupRequest, 'solicitante' | 'status'>) =>
  r.solicitante.uid === p.uid && r.status === 'PENDENTE';

export function nextStatuses(p: UserProfile, r: BackupRequest): RequestStatus[] {
  const out: RequestStatus[] = [];
  if (canMoveToAnalysis(p, r)) out.push('EM_ANALISE');
  if (canDecide(p, r)) out.push('APROVADO', 'RECUSADO');
  if (canCancel(p, r)) out.push('CANCELADO');
  return out;
}

export type AppRoute = 'inicio' | 'nova' | 'solicitacoes' | 'painel' | 'notificacoes' | 'perfil';

/** Abas liberadas para o perfil. Quem não tem cargo reconhecido só vê o perfil. */
export function allowedRoutes(p: UserProfile): AppRoute[] {
  const routes: AppRoute[] = [];
  const dispatcher = hasRole(p, 'despachante');
  const reviewer = hasRole(p, 'supervisor') || hasRole(p, 'coordenador_geral');
  if (dispatcher) routes.push('inicio', 'nova');
  if (dispatcher || reviewer) routes.push('solicitacoes');
  if (reviewer) routes.push('painel');
  if (routes.length) routes.push('notificacoes');
  routes.push('perfil');
  return routes;
}

/** Administrador não ganha acesso a dados de solicitações por padrão (REGRA A CONFIRMAR). */
export const canManageAccess = (p: UserProfile) => hasRole(p, 'administrador');
