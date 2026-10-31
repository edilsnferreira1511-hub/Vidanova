// Ponto de entrada: autenticação, perfil, rotas (hash) e barra de navegação de vidro.
import * as api from './servicos.js';
import { h, carregando } from './ui.js';
import { abasPermitidas } from './acesso.js';
import {
  telaLogin, telaSemAcesso, telaInicio, telaNova, telaSolicitacoes, telaDetalhes, telaAnalise,
  telaPainel, telaAvisos, telaFiltros, telaPerfil,
} from './telas.js';

const raiz = document.getElementById('app');
const ROTULO = { inicio: 'Início', nova: 'Nova', solicitacoes: 'Pedidos', painel: 'Painel', notificacoes: 'Avisos', perfil: 'Perfil' };
const ICONE = { inicio: '⌂', nova: '＋', solicitacoes: '☰', painel: '◧', notificacoes: '🔔', perfil: '☺' };
const HASH_ABA = { inicio: '#/', nova: '#/nova', solicitacoes: '#/solicitacoes', painel: '#/painel', notificacoes: '#/avisos', perfil: '#/perfil' };

let estado = { fase: 'carregando', perfil: null, motivo: '' };
let filtros = {};
let nomesBases = {};
let sessao = 0; // invalida respostas atrasadas de uma sessão anterior

const ctx = {
  get perfil() { return estado.perfil; },
  get filtros() { return filtros; },
  nomeBase(id) { return nomesBases[id]?.nome ?? id; },
  basesConhecidas() { return Object.entries(nomesBases).filter(([, v]) => v.ativo).map(([id, v]) => ({ valor: id, rotulo: v.nome })); },
  definirFiltros(f) { filtros = f; },
  ir(hash) { if (location.hash === hash) desenhar(); else location.hash = hash; },
  voltar() { if (history.length > 1) history.back(); else location.hash = '#/'; },
};

function abaDoHash(partes) {
  const [a] = partes;
  if (!a) return 'inicio';
  if (a === 'avisos') return 'notificacoes';
  if (['nova', 'solicitacoes', 'painel', 'perfil'].includes(a)) return a;
  if (a === 'solicitacao' || a === 'analise' || a === 'filtros') return 'solicitacoes';
  return 'inicio';
}

function barra(abas, ativa) {
  const nav = h('nav', { class: 'glass tabbar', 'aria-label': 'Navegação principal' });
  for (const a of abas) {
    const b = h('button', { type: 'button', class: `tab ${a === ativa ? 'ativa' : ''}`, 'aria-current': a === ativa ? 'page' : null },
      h('span', { class: 'tab-icone', 'aria-hidden': 'true' }, ICONE[a]), h('span', { class: 'tab-rotulo' }, ROTULO[a]));
    b.addEventListener('click', () => { location.hash = HASH_ABA[a]; });
    nav.append(b);
  }
  return nav;
}

function desenhar() {
  if (estado.fase === 'carregando') return raiz.replaceChildren(carregando());
  if (estado.fase === 'deslogado') return raiz.replaceChildren(telaLogin(ctx));
  if (estado.fase === 'semAcesso') return raiz.replaceChildren(telaSemAcesso(ctx, estado.motivo));

  const abas = abasPermitidas(estado.perfil);
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let aba = abaDoHash(partes);
  let tela;
  const [a, id] = partes;
  if (a === 'solicitacao' && id) tela = telaDetalhes(ctx, id);
  else if (a === 'analise' && id) tela = telaAnalise(ctx, id);
  else if (a === 'filtros') tela = telaFiltros(ctx);
  else {
    // Aba não liberada => volta para uma liberada (a segurança real está nas regras do Firestore).
    if (!abas.includes(aba)) { aba = abas.includes('inicio') ? 'inicio' : abas.includes('painel') ? 'painel' : 'perfil'; }
    tela = { inicio: telaInicio, nova: telaNova, solicitacoes: telaSolicitacoes, painel: telaPainel, notificacoes: telaAvisos, perfil: telaPerfil }[aba](ctx);
  }
  raiz.replaceChildren(tela, barra(abas, aba));
  window.scrollTo(0, 0);
}

api.observarAuth(async (user) => {
  const minha = ++sessao;
  filtros = {};
  if (!user) { estado = { fase: 'deslogado' }; location.hash = ''; return desenhar(); }
  estado = { fase: 'carregando' };
  desenhar();
  try {
    const perfil = await api.carregarPerfil(user.uid, user.email ?? undefined);
    if (minha !== sessao) return;
    if (!perfil) estado = { fase: 'semAcesso', motivo: 'Seu usuário não tem cadastro no sistema (env/producao/users).' };
    else if (perfil.inativo) estado = { fase: 'semAcesso', motivo: 'Seu usuário está inativo. Fale com o administrador.' };
    else if (perfil.cargos.length === 0) estado = { fase: 'semAcesso', motivo: `Seu cargo${perfil.cargoOriginal ? ` (${perfil.cargoOriginal})` : ''} não tem acesso ao COOPMETRO BACKUP.` };
    else {
      nomesBases = await api.carregarBases();
      if (minha !== sessao) return;
      estado = { fase: 'pronto', perfil };
    }
  } catch (e) {
    if (minha !== sessao) return;
    estado = { fase: 'semAcesso', motivo: e.message || 'Falha ao carregar o perfil.' };
  }
  desenhar();
});

window.addEventListener('hashchange', desenhar);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* sem service worker o app funciona igual, só não instala offline */ });
}
