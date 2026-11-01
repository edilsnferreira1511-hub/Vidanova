import {
  h, cabecalho, botao, cartao, titulo2, muted, rotulo, item, badge, banner, carregando, vazio, campo, chips, fmt,
} from './ui.js';
import { ROTULO_STATUS, TODOS_STATUS } from './status.js';
import {
  temCargo, podeVer, podeDecidir, podeColocarEmAnalise, podeCancelar, podeGerirAcessos,
} from './acesso.js';
import * as api from './servicos.js';
import { abrirLeitorQr } from './leitorqr.js';
import { configPendente, VERSAO_APP } from './config.js';

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ROTULO_CARGO = { despachante: 'Despachante', supervisor: 'Supervisor', coordenador_geral: 'Coordenador geral', administrador: 'Administrador' };

// ---------------------------------------------------------------- login
export function telaLogin(ctx) {
  const email = campo('E-mail de acesso', { tipo: 'email', autocomplete: 'username', modo: 'email' });
  const senha = campo('Senha', { tipo: 'password', autocomplete: 'current-password', aoEnter: () => entrar.click() });
  const erro = h('div');
  const entrar = botao('Entrar', {
    variante: 'primary',
    aoClicar: async () => {
      erro.replaceChildren();
      if (!email.input.value.trim() || !senha.input.value) return erro.append(banner('error', 'Informe e-mail e senha.'));
      try { await api.login(email.input.value, senha.input.value); } catch (e) { erro.append(banner('error', api.mensagemErroAuth(e))); }
    },
  });
  const falta = configPendente();
  return h('main', { class: 'tela login' },
    h('div', { class: 'login-marca' }, h('img', { src: 'icone-192.png', alt: 'COOPMETRO', width: 112, height: 112, class: 'logo grande' }),
      h('h1', { class: 'h1' }, 'COOPMETRO BACKUP'), muted('Use o mesmo acesso do COOPMETRO XPT')),
    falta.length ? banner('warning', `Configuração pendente em config.js: ${falta.join('; ')}.`) : null,
    email, senha, erro, entrar);
}

export function telaSemAcesso(ctx, motivo) {
  return h('main', { class: 'tela' }, h('h1', { class: 'h1' }, 'Sem acesso'), banner('error', motivo), botao('Sair', { aoClicar: api.sair }));
}

// ---------------------------------------------------------------- lista reutilizável
function cartaoSolicitacao(ctx, r) {
  const el = h('button', { class: 'cartao clicavel', type: 'button' },
    h('div', { class: 'linha entre' }, h('strong', {}, `${r.dataBackup} · ${ctx.nomeBase(r.xptId)}`), badge(r.status)),
    muted(`SVC ${r.svc} · Rota ${r.rotaNome ?? r.rotaId ?? '—'}`),
    muted(`${r.qtdPacotes} pacotes · ${r.qtdParadas} paradas · ${r.solicitante.nome}`));
  el.addEventListener('click', () => ctx.ir(`#/solicitacao/${encodeURIComponent(r.id)}`));
  return el;
}

async function carregarLista(ctx, filtros, alvo, { aoCarregar } = {}) {
  alvo.replaceChildren(carregando());
  try {
    const linhas = await api.listarSolicitacoes(ctx.perfil, filtros);
    alvo.replaceChildren();
    aoCarregar?.(linhas);
    return linhas;
  } catch (e) {
    alvo.replaceChildren(banner('error', e.message || 'Não foi possível carregar as solicitações.'),
      botao('Tentar de novo', { aoClicar: () => carregarLista(ctx, filtros, alvo, { aoCarregar }) }));
    return null;
  }
}

// ---------------------------------------------------------------- início (despachante)
export function telaInicio(ctx) {
  const p = ctx.perfil;
  const caixa = h('div');
  const raiz = h('main', { class: 'tela' },
    cabecalho(`Olá, ${p.nome.split(' ')[0]}`, p.bases.map(ctx.nomeBase).join(' · ') || 'Sem base vinculada'),
    p.bases.length === 0 ? banner('warning', 'Seu usuário não tem base vinculada. Fale com o administrador.') : null,
    botao('Nova solicitação de backup', { variante: 'primary', aoClicar: () => ctx.ir('#/nova') }),
    botao('Ver solicitações da minha base', { aoClicar: () => ctx.ir('#/solicitacoes') }),
    cartao(titulo2('Em andamento'), caixa));
  carregarLista(ctx, ctx.filtros, caixa, {
    aoCarregar: (linhas) => {
      const n = linhas.filter((r) => r.status === 'PENDENTE' || r.status === 'EM_ANALISE').length;
      caixa.append(h('div', { class: 'numero' }, String(n)), muted('solicitações aguardando decisão'));
    },
  });
  return raiz;
}

// ---------------------------------------------------------------- nova solicitação
export function telaNova(ctx) {
  const p = ctx.perfil;
  const estado = { rota: null, veiculo: null, base: p.bases.length === 1 ? p.bases[0] : '' };
  const resumoRota = h('div');
  const resumoVeic = h('div');
  const erro = h('div');

  const pintar = () => {
    resumoRota.replaceChildren(estado.rota
      ? h('div', {}, h('div', {}, `SVC ${estado.rota.svc} · Rota ${estado.rota.rota}`), muted(`Contêiner ${estado.rota.containerId}`))
      : muted('Nenhuma rota lida.'));
    resumoVeic.replaceChildren(estado.veiculo
      ? h('div', {}, h('div', {}, `Placa ${estado.veiculo.placa} · ${estado.veiculo.tipoVeiculo ?? 'tipo n/d'}`),
        muted(`${estado.veiculo.carrierName} · ID no QR ${estado.veiculo.qrId}`))
      : muted('Opcional: leia o QR do veículo.'));
  };
  pintar();

  const seletorBase = p.bases.length
    ? chips(p.bases.map((b) => ({ valor: b, rotulo: ctx.nomeBase(b) })), estado.base ? [estado.base] : [], { aoMudar: ([b]) => { estado.base = b; } })
    : banner('warning', 'Nenhuma base vinculada ao seu usuário.');
  const data = campo('Data do backup', { tipo: 'date', valor: hoje() });
  const motorista = campo('Nome do motorista');
  const pacotes = campo('Quantidade de pacotes', { tipo: 'number', modo: 'numeric' });
  const paradas = campo('Quantidade de paradas', { tipo: 'number', modo: 'numeric' });
  const motivo = campo('Motivo da solicitação', { multilinha: true });

  const enviar = botao('Enviar solicitação', {
    variante: 'primary',
    aoClicar: async () => {
      erro.replaceChildren();
      const falha = (m) => erro.append(banner('error', m));
      if (!estado.base) return falha('Escolha a base solicitante.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.input.value)) return falha('Data inválida.');
      if (!estado.rota) return falha('Leia o QR Code da rota.');
      const np = Number(pacotes.input.value), nd = Number(paradas.input.value);
      if (!pacotes.input.value || !paradas.input.value || !Number.isInteger(np) || np < 0 || !Number.isInteger(nd) || nd < 0) return falha('Pacotes e paradas devem ser números inteiros.');
      if (!motivo.input.value.trim()) return falha('Informe o motivo.');
      let veiculo;
      if (estado.veiculo) { const { tipo, ...resto } = estado.veiculo; veiculo = resto; }
      const dados = {
        dataBackup: data.input.value, svc: estado.rota.svc, xptId: estado.base, rotaId: estado.rota.rota,
        rotaNome: estado.rota.rota, containerId: estado.rota.containerId,
        qtdPacotes: np, qtdParadas: nd, motivo: motivo.input.value.trim(),
      };
      if (veiculo) dados.veiculo = veiculo;
      if (motorista.input.value.trim()) dados.motoristaNome = motorista.input.value.trim();
      try {
        const id = await api.criarSolicitacao(p, dados);
        ctx.ir(`#/solicitacao/${encodeURIComponent(id)}`);
      } catch (e) {
        const recusado = String(e.message).includes('servidor recusou');
        falha((e.message || 'Não foi possível enviar a solicitação.')
          + (recusado ? ` [Detalhe técnico — versão ${VERSAO_APP}; cargo: ${p.cargoOriginal}; base escolhida: ${estado.base}; bases do usuário: ${p.bases.join(', ') || 'nenhuma'}; uid: ${p.uid}]` : ''));
      }
    },
  });

  return h('main', { class: 'tela' },
    cabecalho('Nova solicitação', 'Pagamento de backup'),
    cartao(rotulo('Base solicitante'), seletorBase, muted('Somente as bases vinculadas ao seu usuário.')),
    data,
    cartao(rotulo('Rota'), resumoRota,
      botao('Ler QR Code da rota', { aoClicar: () => abrirLeitorQr({ esperado: 'rota', aoConfirmar: (d) => { estado.rota = d; pintar(); } }) })),
    cartao(rotulo('Veículo / motorista'), resumoVeic,
      botao('Ler QR Code do veículo', { aoClicar: () => abrirLeitorQr({ esperado: 'veiculo', aoConfirmar: (d) => { estado.veiculo = d; pintar(); } }) }),
      motorista),
    pacotes, paradas, motivo, erro, enviar);
}

// ---------------------------------------------------------------- lista de solicitações
export function telaSolicitacoes(ctx) {
  const ativo = Object.values(ctx.filtros).some((v) => (Array.isArray(v) ? v.length : !!v));
  const caixa = h('div', { class: 'pilha' });
  const raiz = h('main', { class: 'tela' },
    cabecalho('Solicitações', ativo ? 'Filtros ativos' : 'Bases autorizadas'),
    botao(ativo ? 'Filtros (ativos)' : 'Filtros', { aoClicar: () => ctx.ir('#/filtros') }),
    caixa);
  carregarLista(ctx, ctx.filtros, caixa, {
    aoCarregar: (linhas) => {
      if (!linhas.length) return caixa.append(vazio('Nenhuma solicitação', 'Não há registros para os filtros e bases autorizadas.'));
      caixa.append(muted(`${linhas.length} registro(s)`), ...linhas.map((r) => cartaoSolicitacao(ctx, r)));
    },
  });
  return raiz;
}

// ---------------------------------------------------------------- detalhes
export function telaDetalhes(ctx, id) {
  const raiz = h('main', { class: 'tela' }, carregando());
  const carregar = async () => {
    let r;
    try { r = await api.obterSolicitacao(id); } catch (e) {
      return raiz.replaceChildren(cabecalho('Solicitação'), banner('error', e.message || 'Falha ao carregar.'));
    }
    if (!r || !podeVer(ctx.perfil, r)) {
      return raiz.replaceChildren(cabecalho('Solicitação'), vazio('Solicitação não encontrada', 'Ela não existe ou você não tem acesso à base.'),
        botao('Voltar', { aoClicar: () => ctx.ir('#/solicitacoes') }));
    }
    const p = ctx.perfil;
    const erro = h('div');
    const agir = (fn) => async () => { erro.replaceChildren(); try { await fn(); await carregar(); } catch (e) { erro.append(banner('error', e.message)); } };
    const v = r.veiculo ?? {};
    raiz.replaceChildren(
      cabecalho(`${r.svc} · ${r.rotaNome ?? r.rotaId ?? 'Rota'}`, `${r.dataBackup} · ${ctx.nomeBase(r.xptId)}`, badge(r.status)),
      erro,
      cartao(titulo2('Dados da rota'), item('SVC', r.svc), item('Rota', r.rotaNome ?? r.rotaId), item('Contêiner', r.containerId),
        item('Pacotes', r.qtdPacotes), item('Paradas', r.qtdParadas)),
      cartao(titulo2('Motorista / veículo'), item('Motorista', r.motoristaNome), item('Placa', v.placa),
        item('Transportadora', v.carrierName), item('ID no QR do veículo', v.qrId)),
      cartao(titulo2('Motivo'), h('div', {}, r.motivo), muted(`Solicitado por ${r.solicitante.nome}`)),
      r.decisao ? cartao(titulo2(`Decisão: ${ROTULO_STATUS[r.decisao.resultado]}`), item('Justificativa', r.decisao.justificativa),
        item('Desconto de cooperado', r.decisao.descontoCooperado === 'SIM' ? 'Haverá desconto' : r.decisao.descontoCooperado === 'NAO' ? 'Sem desconto' : r.decisao.descontoCooperado),
        muted(`${r.decisao.porNome} · ${fmt(r.decisao.em)}`)) : null,
      cartao(titulo2('Histórico'), ...r.historico.map((e) => h('div', {}, h('div', {}, `${ROTULO_STATUS[e.status]} · ${e.porNome}`),
        muted(`${fmt(e.em)}${e.observacao ? ` — ${e.observacao}` : ''}`)))),
      podeColocarEmAnalise(p, r) ? botao('Colocar em análise', { aoClicar: agir(() => api.colocarEmAnalise(p, r)) }) : null,
      podeDecidir(p, r) ? botao('Analisar e decidir', { variante: 'primary', aoClicar: () => ctx.ir(`#/analise/${encodeURIComponent(r.id)}`) }) : null,
      podeCancelar(p, r) ? botao('Cancelar solicitação', { variante: 'danger', aoClicar: agir(() => api.cancelar(p, r)) }) : null);
  };
  carregar();
  return raiz;
}

// ---------------------------------------------------------------- análise e aprovação
export function telaAnalise(ctx, id) {
  const raiz = h('main', { class: 'tela' }, carregando());
  api.obterSolicitacao(id).then((r) => {
    const p = ctx.perfil;
    if (!r || !podeDecidir(p, r)) {
      return raiz.replaceChildren(cabecalho('Análise'), vazio('Sem permissão para decidir',
        'Apenas o coordenador geral decide, nas bases autorizadas, e nunca sobre o próprio pedido.'),
      botao('Voltar', { aoClicar: () => ctx.ir('#/solicitacoes') }));
    }
    let resultado = null; let desconto = null;
    const just = campo('Justificativa', { multilinha: true });
    const erro = h('div');
    const decisao = chips([{ valor: 'APROVADO', rotulo: 'Aprovar' }, { valor: 'RECUSADO', rotulo: 'Recusar' }], [], { aoMudar: ([v]) => { resultado = v; } });
    const desc = chips([{ valor: 'SIM', rotulo: 'Haverá desconto' }, { valor: 'NAO', rotulo: 'Sem desconto' }], [], { aoMudar: ([v]) => { desconto = v; } });
    raiz.replaceChildren(
      cabecalho('Análise e aprovação', `${r.svc} · ${ctx.nomeBase(r.xptId)} · ${r.dataBackup}`),
      cartao(titulo2('Resumo'), h('div', {}, `Rota ${r.rotaNome ?? r.rotaId ?? '—'} · Contêiner ${r.containerId ?? '—'}`),
        h('div', {}, `${r.qtdPacotes} pacotes · ${r.qtdParadas} paradas`), muted(`Motivo: ${r.motivo}`), muted(`Solicitante: ${r.solicitante.nome}`)),
      rotulo('Decisão'), decisao, just, rotulo('Desconto de cooperado'), desc, erro,
      botao('Confirmar decisão', {
        variante: 'primary',
        aoClicar: async () => {
          erro.replaceChildren();
          const falha = (m) => erro.append(banner('error', m));
          if (!resultado) return falha('Escolha aprovar ou recusar.');
          if (!just.input.value.trim()) return falha('A justificativa é obrigatória.');
          if (!desconto) return falha('Registre a decisão sobre desconto de cooperado (sim ou não).');
          try {
            await api.decidir(p, r, { resultado, justificativa: just.input.value.trim(), descontoCooperado: desconto });
            ctx.ir(`#/solicitacao/${encodeURIComponent(r.id)}`);
          } catch (e) { falha(e.message); }
        },
      }),
      botao('Voltar', { aoClicar: () => ctx.voltar() }));
  }).catch((e) => raiz.replaceChildren(cabecalho('Análise'), banner('error', e.message)));
  return raiz;
}

// ---------------------------------------------------------------- painel (supervisor / coordenador)
export function telaPainel(ctx) {
  const caixa = h('div', { class: 'pilha' });
  const raiz = h('main', { class: 'tela' },
    cabecalho('Painel', 'Bases autorizadas para o seu perfil'),
    botao('Filtros por base, período e status', { aoClicar: () => ctx.ir('#/filtros') }), caixa);
  carregarLista(ctx, ctx.filtros, caixa, {
    aoCarregar: (linhas) => {
      const grade = h('div', { class: 'grade' }, ...['PENDENTE', 'EM_ANALISE', 'APROVADO', 'RECUSADO'].map((s) =>
        cartao(h('div', { class: 'numero', style: `color:var(--${{ PENDENTE: 'warn', EM_ANALISE: 'info', APROVADO: 'ok', RECUSADO: 'danger' }[s]})` },
          String(linhas.filter((r) => r.status === s).length)), muted(ROTULO_STATUS[s]))));
      const pend = linhas.filter((r) => r.status === 'PENDENTE' || r.status === 'EM_ANALISE');
      caixa.append(grade, titulo2('Pendências'), ...(pend.length ? pend.map((r) => cartaoSolicitacao(ctx, r)) : [vazio('Nada pendente')]));
    },
  });
  return raiz;
}

// ---------------------------------------------------------------- avisos (derivados do histórico)
export function telaAvisos(ctx) {
  const p = ctx.perfil;
  const caixa = h('div', { class: 'pilha' });
  const raiz = h('main', { class: 'tela' }, cabecalho('Avisos', 'Atualizações das suas solicitações'), caixa);
  carregarLista(ctx, {}, caixa, {
    aoCarregar: (linhas) => {
      const revisor = temCargo(p, 'supervisor') || temCargo(p, 'coordenador_geral');
      const avisos = linhas.flatMap((r) => {
        const ult = r.historico[r.historico.length - 1];
        if (!ult) return [];
        if (revisor && (r.status === 'PENDENTE' || r.status === 'EM_ANALISE')) return [{ id: r.id, em: ult.em, texto: `${ctx.nomeBase(r.xptId)} · ${r.svc}: aguardando decisão (${ROTULO_STATUS[r.status]})` }];
        if (!revisor && r.solicitante.uid === p.uid && ult.porUid !== p.uid) return [{ id: r.id, em: ult.em, texto: `Sua solicitação de ${r.dataBackup} (${r.svc}) foi ${ROTULO_STATUS[r.status].toLowerCase()}` }];
        return [];
      }).sort((a, b) => String(b.em).localeCompare(String(a.em)));
      if (!avisos.length) return caixa.append(vazio('Sem avisos', 'Nada novo por enquanto.'));
      caixa.append(...avisos.map((a) => {
        const el = h('button', { class: 'cartao clicavel', type: 'button' }, h('div', {}, a.texto), muted(fmt(a.em)));
        el.addEventListener('click', () => ctx.ir(`#/solicitacao/${encodeURIComponent(a.id)}`));
        return el;
      }));
    },
  });
  return raiz;
}

// ---------------------------------------------------------------- filtros
export function telaFiltros(ctx) {
  const p = ctx.perfil;
  const f = { ...ctx.filtros };
  const opcoesBases = p.todasAsBases ? ctx.basesConhecidas() : p.bases.map((b) => ({ valor: b, rotulo: ctx.nomeBase(b) }));
  const baseUi = opcoesBases.length
    ? chips(opcoesBases, f.bases ?? [], { multiplo: true, aoMudar: (v) => { f.bases = v; } })
    : campo('Base (id)', { valor: f.bases?.[0] ?? '' });
  const status = chips(TODOS_STATUS.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] })), f.status ?? [], { multiplo: true, aoMudar: (v) => { f.status = v; } });
  const de = campo('De', { tipo: 'date', valor: f.de ?? '' });
  const ate = campo('Até', { tipo: 'date', valor: f.ate ?? '' });
  return h('main', { class: 'tela' }, cabecalho('Filtros'), rotulo('Base'), baseUi,
    muted('A lista é limitada às bases autorizadas. A segurança real está nas regras do servidor.'),
    rotulo('Status'), status, de, ate,
    botao('Aplicar', {
      variante: 'primary',
      aoClicar: () => {
        const novo = { bases: f.bases?.length ? f.bases : undefined, status: f.status?.length ? f.status : undefined, de: de.input.value || undefined, ate: ate.input.value || undefined };
        if (baseUi.input?.value.trim()) novo.bases = [baseUi.input.value.trim()];
        ctx.definirFiltros(novo);
        ctx.voltar();
      },
    }),
    botao('Limpar', { aoClicar: () => { ctx.definirFiltros({}); ctx.voltar(); } }),
    botao('Voltar', { aoClicar: () => ctx.voltar() }));
}

// ---------------------------------------------------------------- perfil
export function telaPerfil(ctx) {
  const p = ctx.perfil;
  return h('main', { class: 'tela' },
    cabecalho(p.nome, p.email),
    cartao(titulo2('Acesso'), item('Cargos', p.cargos.map((c) => ROTULO_CARGO[c]).join(', ')),
      item('Cargo no XPT', p.cargoOriginal), item('Bases vinculadas', p.todasAsBases ? 'Todas (pelo cargo)' : p.bases.map(ctx.nomeBase).join(', ') || 'Nenhuma'),
      muted('Cargo e base vêm do cadastro do sistema e não podem ser alterados aqui.')),
    podeGerirAcessos(p) ? banner('info', 'Gestão de acessos: definição de regras pendente (ver PENDENCIAS.md).') : null,
    cartao(titulo2('Sistema'), item('Versão do app', VERSAO_APP), muted('Espelho Google Planilhas: não configurado')),
    botao('Sair', { variante: 'danger', aoClicar: api.sair }));
}
