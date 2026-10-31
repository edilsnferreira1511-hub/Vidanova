import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { collections } from './env';
import { xptRoleMap, xptUserFields } from './xptSchema';
import type { Role, UserProfile } from './types';

/** Converte o documento de usuário do XPT no perfil do app. Cargo desconhecido => ignorado (sem acesso). */
export function mapXptUser(uid: string, raw: Record<string, unknown>, email?: string): UserProfile {
  const cargoRaw = raw[xptUserFields.cargo];
  const cargoList = Array.isArray(cargoRaw) ? cargoRaw : cargoRaw ? [cargoRaw] : [];
  const cargos = cargoList
    .map((c) => xptRoleMap[String(c)])
    .filter((r): r is Role => Boolean(r));
  const basesRaw = raw[xptUserFields.bases];
  const bases = Array.isArray(basesRaw) ? basesRaw.map(String) : basesRaw ? [String(basesRaw)] : [];
  return {
    uid,
    email,
    nome: String(raw[xptUserFields.nome] ?? email ?? uid),
    cargos: [...new Set(cargos)],
    bases,
    todasAsBases: raw[xptUserFields.todasAsBases] === true,
  };
}

/** Lê o perfil AUTORIZADO pelo UID. O usuário não escolhe cargo nem base. */
export async function loadProfile(uid: string, email?: string): Promise<UserProfile | null> {
  if (!collections.users) throw new Error('Coleção de usuários do XPT não configurada.');
  const snap = await getDoc(doc(db, collections.users, uid));
  if (!snap.exists()) return null;
  return mapXptUser(uid, snap.data(), email);
}
