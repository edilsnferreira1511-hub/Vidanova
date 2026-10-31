// Regras de autorização no app. NÃO substituem as regras do Firestore (firestore.rules.proposed).
// Itens "REGRA A CONFIRMAR" dependem de definição do responsável pelo projeto.
// Perfil: { uid, nome, email, cargos: [...], bases: [...], todasAsBases?: boolean }

export const temCargo = (p, cargo) => p.cargos.includes(cargo);

export const podeAcessarBase = (p, base) => p.todasAsBases === true || p.bases.includes(base);

export const podeCriar = (p, base) => temCargo(p, 'despachante') && podeAcessarBase(p, base);

export const podeVer = (p, r) =>
  podeAcessarBase(p, r.base) &&
  (temCargo(p, 'despachante') || temCargo(p, 'supervisor') || temCargo(p, 'coordenador_geral'));

/** Bases consultáveis: lista ou 'TODAS' (só com acesso total cadastrado). Nunca presumido. */
export const basesVisiveis = (p) => (p.todasAsBases ? 'TODAS' : [...p.bases]);

/** Só o coordenador geral decide, nas bases autorizadas, e nunca sobre o próprio pedido. */
export const podeDecidir = (p, r) =>
  temCargo(p, 'coordenador_geral') &&
  podeAcessarBase(p, r.base) &&
  r.solicitante.uid !== p.uid &&
  (r.status === 'PENDENTE' || r.status === 'EM_ANALISE');

/** REGRA A CONFIRMAR: supervisor/coordenador só movem PENDENTE -> EM_ANALISE. */
export const podeColocarEmAnalise = (p, r) =>
  (temCargo(p, 'supervisor') || temCargo(p, 'coordenador_geral')) &&
  podeAcessarBase(p, r.base) &&
  r.status === 'PENDENTE';

/** O solicitante cancela enquanto estiver PENDENTE. */
export const podeCancelar = (p, r) => r.solicitante.uid === p.uid && r.status === 'PENDENTE';

/** Abas liberadas. Cargo não reconhecido => só o perfil. */
export function abasPermitidas(p) {
  const abas = [];
  const desp = temCargo(p, 'despachante');
  const revisor = temCargo(p, 'supervisor') || temCargo(p, 'coordenador_geral');
  if (desp) abas.push('inicio', 'nova');
  if (desp || revisor) abas.push('solicitacoes');
  if (revisor) abas.push('painel');
  if (abas.length) abas.push('notificacoes');
  abas.push('perfil');
  return abas;
}

/** Administrador não ganha acesso a solicitações por padrão (REGRA A CONFIRMAR). */
export const podeGerirAcessos = (p) => temCargo(p, 'administrador');
