// ============================================================================
// CONFIGURAÇÃO do COOPMETRO BACKUP.
// Os valores do Firebase abaixo são os do projeto COOPMETRO XPT. São identificadores públicos de
// cliente (não são segredos): quem protege os dados são as regras do Firestore.
// NUNCA coloque aqui senha, chave de serviço ou token.
// ============================================================================

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDgoBTBCZbdIj7hi6-bCbvMtxW-k9weeqg',
  authDomain: 'coopmetro-xpt.firebaseapp.com',
  projectId: 'coopmetro-xpt',
  storageBucket: 'coopmetro-xpt.firebasestorage.app',
  messagingSenderId: '830962789514',
  appId: '1:830962789514:web:6d52394cc08f9a72115173',
  measurementId: 'G-CKXJZCV6R0',
};

// ---- Caminhos no Firestore do XPT (informados pelo responsável) ----
export const COLECAO_USUARIOS = 'env/producao/users'; //            documento = UID do Authentication
export const COLECAO_BASES = 'env/producao/xpts'; //                id da base -> { name, active }
// Coleção PRÓPRIA das solicitações. Não é a subcoleção "backups" que já existe no XPT.
export const COLECAO_BACKUPS = 'env/producao/backup_requests';

// ---- Campos do documento de usuário ----
export const CAMPOS_USUARIO = {
  nome: 'name', //    texto
  cargo: 'role', //   texto, UM único cargo
  bases: 'xptIds', // lista de ids de bases
  ativo: 'active', // false => acesso bloqueado
};

// Valor gravado em `role` no XPT -> papel deste app.
// Cargo que não está aqui NÃO tem acesso (falha fechada).
export const MAPA_CARGOS = {
  despacho: 'despachante',
  supervisor: 'supervisor',
  coord_geral: 'coordenador_geral',
  administrador: 'administrador',
  admin_sistema: 'administrador',
  // coord_base: A DEFINIR (ver PENDENCIAS.md). motorista: sem acesso a este sistema.
};

// Pelo cadastro do XPT, estes cargos enxergam todas as bases (mesmo com xptIds vazio).
export const CARGOS_TODAS_AS_BASES = ['admin_sistema', 'administrador', 'coord_geral'];

/** Lista do que ainda falta configurar (mostrada na tela de login). */
export function configPendente() {
  const falta = [];
  if (!COLECAO_USUARIOS) falta.push('coleção de usuários');
  if (!CAMPOS_USUARIO.cargo || !CAMPOS_USUARIO.bases || !CAMPOS_USUARIO.nome) falta.push('campos de nome/cargo/bases');
  if (Object.keys(MAPA_CARGOS).length === 0) falta.push('mapa de cargos');
  return falta;
}
