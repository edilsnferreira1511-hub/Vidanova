// Converte o documento de usuário do XPT (env/producao/users/{uid}) no perfil do app.
// Módulo puro (sem Firebase) para poder ser testado.
import { CAMPOS_USUARIO, MAPA_CARGOS, CARGOS_TODAS_AS_BASES } from './config.js';

export function mapearUsuarioXpt(uid, bruto, email) {
  const role = typeof bruto[CAMPOS_USUARIO.cargo] === 'string' ? bruto[CAMPOS_USUARIO.cargo] : '';
  const inativo = bruto[CAMPOS_USUARIO.ativo] !== true; // só `true` libera; ausente ou false bloqueia
  const papel = MAPA_CARGOS[role];
  const basesBruto = bruto[CAMPOS_USUARIO.bases];
  const bases = Array.isArray(basesBruto) ? basesBruto.map(String) : [];
  return {
    uid,
    email: email ?? (typeof bruto.email === 'string' ? bruto.email : undefined),
    nome: String(bruto[CAMPOS_USUARIO.nome] ?? email ?? uid),
    cargoOriginal: role,
    cargos: !inativo && papel ? [papel] : [],
    inativo,
    bases,
    todasAsBases: CARGOS_TODAS_AS_BASES.includes(role),
  };
}
