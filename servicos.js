// Acesso ao Firebase EXISTENTE do COOPMETRO XPT (Auth + Firestore). Sem Analytics, sem criar contas.
// ATENÇÃO: nada daqui foi testado contra o Firebase real. A autorização aqui é conveniência;
// a proteção real tem de estar nas regras do Firestore (firestore.rules.proposed).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, limit,
  serverTimestamp, arrayUnion,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { FIREBASE_CONFIG, COLECAO_BACKUPS, COLECAO_USUARIOS, COLECAO_BASES } from './config.js';
import { mapearUsuarioXpt } from './perfil.js';
import { podeCriar, podeDecidir, podeColocarEmAnalise, podeCancelar, basesVisiveis } from './acesso.js';

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const agora = () => new Date().toISOString();

// ---------- Autenticação (somente login com contas existentes) ----------
export const login = (email, senha) => signInWithEmailAndPassword(auth, email.trim(), senha);
export const sair = () => signOut(auth);
export const observarAuth = (cb) => onAuthStateChanged(auth, cb);

export function mensagemErroAuth(err) {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Usuário ou senha incorretos.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'auth/network-request-failed': return 'Sem conexão. Verifique a internet.';
    case 'auth/unauthorized-domain': return 'Este endereço do site não está autorizado no Firebase (Authentication > Configurações > Domínios autorizados).';
    default: return err?.message || 'Não foi possível entrar.';
  }
}

// ---------- Perfil autorizado (o usuário não escolhe cargo nem base) ----------
// Lê env/producao/users/{uid}. As regras do XPT só deixam cada pessoa ler o PRÓPRIO documento.
export async function carregarPerfil(uid, email) {
  const snap = await getDoc(doc(db, COLECAO_USUARIOS, uid));
  if (!snap.exists()) return null;
  return mapearUsuarioXpt(uid, snap.data(), email);
}

/** Nomes das bases (id -> {nome, ativo}). Melhor esforço: se as regras negarem, o app mostra só o id. */
export async function carregarBases() {
  try {
    const snap = await getDocs(collection(db, COLECAO_BASES));
    const mapa = {};
    snap.forEach((d) => { const x = d.data(); mapa[d.id] = { nome: typeof x.name === 'string' ? x.name : d.id, ativo: x.active !== false }; });
    return mapa;
  } catch { return {}; }
}

// ---------- Solicitações de backup ----------
const col = () => collection(db, COLECAO_BACKUPS);
const deDoc = (id, dados) => ({ ...dados, id });

export async function criarSolicitacao(p, dados) {
  if (!podeCriar(p, dados.base)) throw new Error('Sem permissão para solicitar backup nesta base.');
  const entrada = { status: 'PENDENTE', porUid: p.uid, porNome: p.nome, em: agora() };
  const ref = await addDoc(col(), {
    ...dados,
    solicitante: { uid: p.uid, nome: p.nome },
    status: 'PENDENTE',
    criadoEm: entrada.em,
    criadoEmServidor: serverTimestamp(), // horário oficial (o ISO do cliente é informativo)
    historico: [entrada],
  });
  return ref.id;
}

export async function listarSolicitacoes(p, f = {}) {
  const permitidas = basesVisiveis(p);
  let bases = f.bases?.length ? f.bases : permitidas === 'TODAS' ? undefined : permitidas;
  if (permitidas !== 'TODAS' && bases) bases = bases.filter((b) => permitidas.includes(b));
  if (permitidas !== 'TODAS' && (!bases || bases.length === 0)) return [];
  // Uma consulta por base (where ==): é o formato que as regras do Firestore conseguem validar com segurança,
  // e dispensa índice composto. Sem `bases` (só quem tem acesso a todas) lê a coleção inteira.
  const consultas = bases ? bases.map((b) => query(col(), where('base', '==', b), limit(500))) : [query(col(), limit(500))];
  const snaps = await Promise.all(consultas.map((q) => getDocs(q)));
  let linhas = snaps.flatMap((s) => s.docs.map((d) => deDoc(d.id, d.data())));
  linhas.sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
  if (f.status?.length) linhas = linhas.filter((r) => f.status.includes(r.status));
  if (f.de) linhas = linhas.filter((r) => r.dataBackup >= f.de);
  if (f.ate) linhas = linhas.filter((r) => r.dataBackup <= f.ate);
  return linhas;
}

export async function obterSolicitacao(id) {
  const s = await getDoc(doc(db, COLECAO_BACKUPS, id));
  return s.exists() ? deDoc(s.id, s.data()) : null;
}

export async function colocarEmAnalise(p, r) {
  if (!podeColocarEmAnalise(p, r)) throw new Error('Sem permissão para colocar em análise.');
  const entrada = { status: 'EM_ANALISE', porUid: p.uid, porNome: p.nome, em: agora() };
  await updateDoc(doc(db, COLECAO_BACKUPS, r.id), { status: 'EM_ANALISE', historico: arrayUnion(entrada) });
}

export async function decidir(p, r, { resultado, justificativa, descontoCooperado }) {
  if (!podeDecidir(p, r)) throw new Error('Sem permissão para decidir esta solicitação.');
  if (!justificativa.trim()) throw new Error('Informe a justificativa.');
  const em = agora();
  const entrada = { status: resultado, porUid: p.uid, porNome: p.nome, em, observacao: justificativa };
  await updateDoc(doc(db, COLECAO_BACKUPS, r.id), {
    status: resultado,
    decisao: { resultado, justificativa, descontoCooperado, porUid: p.uid, porNome: p.nome, em },
    historico: arrayUnion(entrada),
  });
}

export async function cancelar(p, r) {
  if (!podeCancelar(p, r)) throw new Error('Só o solicitante cancela, e apenas enquanto pendente.');
  const entrada = { status: 'CANCELADO', porUid: p.uid, porNome: p.nome, em: agora() };
  await updateDoc(doc(db, COLECAO_BACKUPS, r.id), { status: 'CANCELADO', historico: arrayUnion(entrada) });
}
