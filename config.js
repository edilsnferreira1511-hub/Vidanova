// ============================================================================
// CONFIGURAÇÃO — este é o ÚNICO arquivo que você precisa editar.
// Os valores do Firebase abaixo são os do projeto COOPMETRO XPT que você forneceu. São identificadores
// públicos de cliente (não são segredos): quem protege os dados são as regras do Firestore.
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

// Coleção própria das solicitações (separada das coleções logísticas do XPT).
export const COLECAO_BACKUPS = 'backup_requests';

// ---- A CONFIRMAR com a estrutura real do XPT (ver PENDENCIAS.md, item A2) ----
// Nada abaixo foi confirmado: o código/estrutura do Firestore do XPT não foi fornecido.
export const COLECAO_USUARIOS = ''; // nome da coleção de usuários/perfis do XPT

export const CAMPOS_USUARIO = {
  nome: '', //          campo com o nome da pessoa
  cargo: '', //         campo com o cargo (texto ou lista)
  bases: '', //         campo com as bases vinculadas (lista)
  todasAsBases: '', //  (opcional) campo true/false de acesso a todas as bases
};

// Cargo do XPT -> papel deste app. Cargo não mapeado => sem acesso.
// Exemplo de formato (NÃO confirmado):  'Despachante': 'despachante',
export const MAPA_CARGOS = {
  // 'NOME_DO_CARGO_NO_XPT': 'despachante' | 'supervisor' | 'coordenador_geral' | 'administrador',
};

/** Lista do que ainda falta configurar (mostrada na tela de login). */
export function configPendente() {
  const falta = [];
  if (!COLECAO_USUARIOS) falta.push('coleção de usuários do XPT');
  if (!CAMPOS_USUARIO.cargo || !CAMPOS_USUARIO.bases || !CAMPOS_USUARIO.nome) falta.push('campos de nome/cargo/bases');
  if (Object.keys(MAPA_CARGOS).length === 0) falta.push('mapa de cargos');
  return falta;
}
