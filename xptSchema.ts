import type { Role } from './types';

// ADAPTADOR com a estrutura de usuários do XPT. NADA aqui foi confirmado:
// o código-fonte/estrutura do Firestore do XPT não foi fornecido. Preencher após inspecionar um
// documento de usuário real (ver PENDENCIAS.md, item 2).
export const xptUserFields = {
  nome: 'TODO_CAMPO_NOME',
  cargo: 'TODO_CAMPO_CARGO', // string ou array
  bases: 'TODO_CAMPO_BASES', // array de bases vinculadas
  todasAsBases: 'TODO_CAMPO_ACESSO_TOTAL', // opcional
};

// Valores de cargo do XPT -> papéis deste app. A CONFIRMAR; cargo não mapeado => sem acesso.
export const xptRoleMap: Record<string, Role> = {
  // exemplo de formato (NÃO confirmado): 'Despachante': 'despachante',
};
