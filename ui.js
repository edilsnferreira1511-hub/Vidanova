// Pequenos componentes de interface (sem framework). Todo texto entra como TEXTO, nunca como HTML.
import { ROTULO_STATUS, COR_STATUS } from './status.js';

export function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  anexar(el, filhos);
  return el;
}

function anexar(el, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f == null || f === false) continue;
    el.append(f.nodeType ? f : document.createTextNode(String(f)));
  }
}

export const fmt = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso ?? '—') : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export const logo = (tam = 44) => h('img', { src: 'icone-192.png', alt: 'COOPMETRO', class: 'logo', width: tam, height: tam });

export function cabecalho(titulo, sub, direita) {
  return h('header', { class: 'glass topo' }, logo(),
    h('div', { class: 'grow' }, h('div', { class: 'topo-titulo' }, titulo), sub ? h('div', { class: 'muted' }, sub) : null),
    direita);
}

/** Botão grande de vidro. Bloqueia cliques repetidos enquanto a ação roda. */
export function botao(rotulo, { aoClicar, variante = '', desabilitado = false } = {}) {
  const b = h('button', { class: `btn glass ${variante}`, type: 'button' }, rotulo);
  b.disabled = desabilitado;
  b.addEventListener('click', async () => {
    if (b.disabled) return;
    b.disabled = true;
    b.classList.add('carregando');
    try { await aoClicar?.(); } finally {
      if (b.isConnected) { b.disabled = desabilitado; b.classList.remove('carregando'); }
    }
  });
  return b;
}

export const cartao = (...filhos) => h('section', { class: 'cartao' }, ...filhos);
export const titulo2 = (t) => h('h2', { class: 'h2' }, t);
export const muted = (t) => h('div', { class: 'muted' }, t);
export const rotulo = (t) => h('div', { class: 'rotulo' }, t);
export const item = (k, v) => h('div', {}, h('div', { class: 'muted' }, k), h('div', {}, v === undefined || v === null || v === '' ? '—' : String(v)));

export function badge(status) {
  return h('span', { class: 'badge', style: `color:${COR_STATUS[status]};border-color:${COR_STATUS[status]}` },
    h('i', { style: `background:${COR_STATUS[status]}` }), ROTULO_STATUS[status] ?? status);
}

export function banner(tipo, msg) {
  return h('div', { class: `banner ${tipo}`, role: 'alert' }, msg);
}

export const carregando = (t = 'Carregando…') => h('div', { class: 'centro' }, h('div', { class: 'spinner' }), muted(t));
export const vazio = (t, dica) => h('div', { class: 'centro' }, titulo2(t), dica ? muted(dica) : null);

/** Campo de formulário. Devolve o elemento; o input fica em `.input`. */
export function campo(rot, { tipo = 'text', valor = '', multilinha = false, placeholder = '', modo, autocomplete, aoEnter } = {}) {
  const input = multilinha
    ? h('textarea', { rows: 4, placeholder })
    : h('input', { type: tipo, placeholder, inputmode: modo, autocomplete, autocapitalize: 'none' });
  input.value = valor;
  if (aoEnter) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') aoEnter(); });
  const el = h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, rot), input);
  el.input = input;
  return el;
}

/** Chips selecionáveis. `selecionados` é um array; devolve o elemento com `.valor()`. */
export function chips(opcoes, selecionados = [], { multiplo = false, aoMudar } = {}) {
  let sel = [...selecionados];
  const raiz = h('div', { class: 'chips' });
  const desenhar = () => {
    raiz.replaceChildren(...opcoes.map((o) => {
      const ativo = sel.includes(o.valor);
      const b = h('button', { type: 'button', class: `chip glass ${ativo ? 'ativo' : ''}`, 'aria-pressed': String(ativo) }, o.rotulo);
      b.addEventListener('click', () => {
        sel = multiplo ? (ativo ? sel.filter((x) => x !== o.valor) : [...sel, o.valor]) : [o.valor];
        desenhar();
        aoMudar?.(sel);
      });
      return b;
    }));
  };
  desenhar();
  raiz.valor = () => sel;
  return raiz;
}
