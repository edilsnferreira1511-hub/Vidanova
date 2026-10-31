// Acesso ao Firebase EXISTENTE do COOPMETRO XPT (Auth + Firestore). Sem Analytics, sem criar contas.
// ATENÇÃO: nada daqui foi testado contra o Firebase real. A autorização aqui é conveniência;
// a proteção real tem de estar nas regras do Firestore (firestore.rules.proposed).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit,
  serverTimestamp, arrayUnion,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
  FIREBASE_CONFIG, COLECAO_BACKUPS, COLECAO_USUARIOS, CAMPOS_USUARIO, MAPA_CARGOS,
} from './config.js';
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
export function mapearUsuarioXpt(uid, bruto, email) {
  const cargoBruto = bruto[CAMPOS_USUARIO.cargo];
  const lista = Array.isArray(cargoBruto) ? cargoBruto : cargoBruto ? [cargoBruto] : [];
  const cargos = [...new Set(lista.map((c) => MAPA_CARGOS[String(c)]).filter(Boolean))];
  const basesBruto = bruto[CAMPOS_USUARIO.bases];
  const bases = Array.isArray(basesBruto) ? basesBruto.map(String) : basesBruto ? [String(basesBruto)] : [];
  return {
    uid, email,
    nome: String(bruto[CAMPOS_USUARIO.nome] ?? email ?? uid),
    cargos, bases,
    todasAsBases: CAMPOS_USUARIO.todasAsBases ? bruto[CAMPOS_USUARIO.todasAsBases] === true : false,
  };
}

export async function carregarPerfil(uid, email) {
  if (!COLECAO_USUARIOS) throw new Error('Coleção de usuários do XPT não configurada (config.js).');
  const snap = await getDoc(doc(db, COLECAO_USUARIOS, uid));
  if (!snap.exists()) return null;
  return mapearUsuarioXpt(uid, snap.data(), email);
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
  const restr = [];
  if (bases) restr.push(where('base', 'in', bases.slice(0, 30)));
  // Pode exigir índice composto no Firestore (o console mostra o link). Não criado nesta etapa.
  const snap = await getDocs(query(col(), ...restr, orderBy('criadoEm', 'desc'), limit(200)));
  let linhas = snap.docs.map((d) => deDoc(d.id, d.data()));
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
