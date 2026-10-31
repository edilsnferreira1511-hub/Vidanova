import {
  addDoc, arrayUnion, collection, doc, getDoc, getDocs, limit, orderBy, query,
  serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { collections } from './env';
import { canCreateRequest, canDecide, canMoveToAnalysis, canCancel, viewableBases } from './access';
import type {
  BackupRequest, DescontoCooperado, RequestStatus, StatusHistoryEntry, UserProfile,
} from './types';

// ATENÇÃO: nenhuma função daqui foi testada contra o Firebase real (sem acesso/credenciais nesta etapa).
// A autorização aqui é só conveniência; a proteção real tem de estar nas regras do Firestore.

const col = () => collection(db, collections.backups);
const nowIso = () => new Date().toISOString();

export type NewRequestInput = Omit<
  BackupRequest, 'id' | 'status' | 'solicitante' | 'criadoEm' | 'historico' | 'decisao'
>;

const fromDoc = (id: string, data: Record<string, unknown>): BackupRequest =>
  ({ ...(data as object), id } as BackupRequest);

export async function createRequest(p: UserProfile, input: NewRequestInput): Promise<string> {
  if (!canCreateRequest(p, input.base)) throw new Error('Sem permissão para solicitar backup nesta base.');
  const entry: StatusHistoryEntry = { status: 'PENDENTE', porUid: p.uid, porNome: p.nome, em: nowIso() };
  const ref = await addDoc(col(), {
    ...input,
    solicitante: { uid: p.uid, nome: p.nome },
    status: 'PENDENTE' as RequestStatus,
    criadoEm: entry.em,
    criadoEmServidor: serverTimestamp(), // horário oficial (o ISO do cliente é só informativo)
    historico: [entry],
  });
  return ref.id;
}

export interface ListFilters { bases?: string[]; status?: RequestStatus[]; de?: string; ate?: string }

export async function listRequests(p: UserProfile, f: ListFilters = {}): Promise<BackupRequest[]> {
  const allowed = viewableBases(p);
  let bases = f.bases?.length ? f.bases : allowed === 'ALL' ? undefined : allowed;
  if (allowed !== 'ALL' && bases) bases = bases.filter((b) => allowed.includes(b));
  if (allowed !== 'ALL' && (!bases || bases.length === 0)) return [];
  const cs = [];
  if (bases) cs.push(where('base', 'in', bases.slice(0, 30)));
  // Pode exigir índice composto no Firestore (o console fornece o link). Não criado nesta etapa.
  const snap = await getDocs(query(col(), ...cs, orderBy('criadoEm', 'desc'), limit(200)));
  let rows = snap.docs.map((d) => fromDoc(d.id, d.data()));
  if (f.status?.length) rows = rows.filter((r) => f.status!.includes(r.status));
  if (f.de) rows = rows.filter((r) => r.dataBackup >= f.de!);
  if (f.ate) rows = rows.filter((r) => r.dataBackup <= f.ate!);
  return rows;
}

export async function getRequest(id: string): Promise<BackupRequest | null> {
  const s = await getDoc(doc(db, collections.backups, id));
  return s.exists() ? fromDoc(s.id, s.data()) : null;
}

export async function moveToAnalysis(p: UserProfile, r: BackupRequest) {
  if (!canMoveToAnalysis(p, r)) throw new Error('Sem permissão para colocar em análise.');
  const entry: StatusHistoryEntry = { status: 'EM_ANALISE', porUid: p.uid, porNome: p.nome, em: nowIso() };
  await updateDoc(doc(db, collections.backups, r.id), { status: 'EM_ANALISE', historico: arrayUnion(entry) });
}

export async function decide(
  p: UserProfile, r: BackupRequest,
  d: { resultado: 'APROVADO' | 'RECUSADO'; justificativa: string; descontoCooperado: DescontoCooperado },
) {
  if (!canDecide(p, r)) throw new Error('Sem permissão para decidir esta solicitação.');
  if (!d.justificativa.trim()) throw new Error('Informe a justificativa.');
  const em = nowIso();
  const entry: StatusHistoryEntry = {
    status: d.resultado, porUid: p.uid, porNome: p.nome, em, observacao: d.justificativa,
  };
  await updateDoc(doc(db, collections.backups, r.id), {
    status: d.resultado,
    decisao: { ...d, porUid: p.uid, porNome: p.nome, em },
    historico: arrayUnion(entry),
  });
}

export async function cancelRequest(p: UserProfile, r: BackupRequest) {
  if (!canCancel(p, r)) throw new Error('Só o solicitante cancela, e apenas enquanto pendente.');
  const entry: StatusHistoryEntry = { status: 'CANCELADO', porUid: p.uid, porNome: p.nome, em: nowIso() };
  await updateDoc(doc(db, collections.backups, r.id), { status: 'CANCELADO', historico: arrayUnion(entry) });
}
