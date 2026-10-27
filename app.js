import { firebaseConfig } from './firebase-config.js';

const DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('COLE');
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const STATUS = { pending_payment: 'Aguardando pagamento', paid: 'Pago', preparing: 'Em preparo', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };

const DEMO_PRODUCTS = [
  { id: 'd1', name: 'Conjuntinho aconchego', category: 'RN', price: 89.9, sizes: { RN: 5, P: 5 }, images: ['cat-rn.jpg'] },
  { id: 'd2', name: 'Macacão verde sálvia', category: 'Bebês', price: 79.9, sizes: { M: 4, G: 4 }, images: ['cat-bebes.jpg'] },
  { id: 'd3', name: 'Conjunto delicado', category: 'Infantil', price: 109.9, sizes: { '2': 3, '4': 3 }, images: ['cat-infantil.jpg'] },
  { id: 'd4', name: 'Primeiros momentos', category: 'RN', price: 69.9, sizes: { RN: 5 }, images: ['cat-rn.jpg'] },
  { id: 'd5', name: 'Essenciais do bebê', category: 'Bebês', price: 99.9, sizes: { P: 4, M: 4 }, images: ['cat-bebes.jpg'] },
  { id: 'd6', name: 'Passeio especial', category: 'Infantil', price: 119.9, sizes: { '4': 3, '6': 3 }, images: ['cat-infantil.jpg'] }
];

let fb = null, products = [], active = 'Todos', user = null, isAdmin = false, unsubOrder = null;
let cart = [];
try { cart = JSON.parse(localStorage.getItem('vk_cart') || '[]'); } catch { cart = []; }

const saveCart = () => { try { localStorage.setItem('vk_cart', JSON.stringify(cart)); } catch { } $('#count').textContent = cart.reduce((n, i) => n + i.qty, 0); };
const findProduct = id => products.find(p => p.id === id);
const stockOf = (p, size) => Number(p?.sizes?.[size] ?? 0);
const totalStock = p => Object.values(p.sizes || {}).reduce((a, b) => a + Number(b || 0), 0);
const cartTotal = () => cart.reduce((t, i) => t + (findProduct(i.id)?.price || 0) * i.qty, 0);
const setMsg = (el, text, kind = '') => { el.textContent = text; el.className = 'msg ' + kind; };

/* ---------- Produtos ---------- */
function renderFilters() {
  $('#filters').innerHTML = ['Todos', 'RN', 'Bebês', 'Infantil'].map(x => `<button class="${active === x ? 'active' : ''}" data-cat="${x}">${x}</button>`).join('');
}
function renderProducts() {
  renderFilters();
  const q = $('#search').value.trim().toLowerCase();
  const list = products.filter(p => (active === 'Todos' || p.category === active) && p.name.toLowerCase().includes(q));
  $('#products').innerHTML = list.map(p => {
    const sizes = Object.entries(p.sizes || {}).filter(([, n]) => Number(n) > 0);
    const out = sizes.length === 0;
    const img = p.images?.[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy" data-pid="${esc(p.id)}" data-i="0" ${p.images.length > 1 ? 'style="cursor:pointer" title="Toque para ver mais fotos"' : ''}>` : '<div class="noimg">♡</div>';
    return `<article class="product">${img}<div class="body">
      <h3>${esc(p.name)}</h3><p>${esc(p.category)}</p><div class="price">${money(p.price)}</div>
      ${out ? '' : `<select id="size-${esc(p.id)}" aria-label="Tamanho">${sizes.map(([s]) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>`}
      <button data-add="${esc(p.id)}" ${out ? 'disabled' : ''}>${out ? 'Esgotado' : 'Adicionar à sacola'}</button></div></article>`;
  }).join('') || '<p style="grid-column:1/-1;text-align:center">Nenhuma peça encontrada.</p>';
}
function setCategory(cat, scroll = true) {
  active = cat; $('#search').value = ''; renderProducts();
  if (scroll) $('#colecao').scrollIntoView({ behavior: 'smooth' });
}
async function loadProducts() {
  if (DEMO) { products = DEMO_PRODUCTS; $('#demoBanner').hidden = false; renderProducts(); renderCart(); return; }
  try {
    const { db, F } = fb;
    const snap = await F.getDocs(F.query(F.collection(db, 'products'), F.where('active', '==', true)));
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) { console.error(e); products = []; }
  // remove da sacola itens que não existem mais
  cart = cart.filter(i => findProduct(i.id) && stockOf(findProduct(i.id), i.size) > 0);
  saveCart(); renderProducts(); renderCart();
}

/* ---------- Sacola ---------- */
function addToCart(id) {
  const p = findProduct(id); if (!p) return;
  const size = $(`#size-${CSS.escape(id)}`)?.value; if (!size) return;
  const item = cart.find(i => i.id === id && i.size === size);
  const have = item ? item.qty : 0;
  if (have + 1 > stockOf(p, size)) { alert('Você já colocou todo o estoque disponível deste tamanho.'); return; }
  if (item) item.qty++; else cart.push({ id, size, qty: 1 });
  saveCart(); openCart();
}
function renderCart() {
  $('#cartitems').innerHTML = cart.length ? cart.map((i, k) => {
    const p = findProduct(i.id); if (!p) return '';
    return `<div class="cartitem"><div>${esc(p.name)}<small>Tam. ${esc(i.size)} · ${money(p.price)}</small>
      <div class="qty"><button data-dec="${k}" aria-label="Menos">−</button>${i.qty}<button data-inc="${k}" aria-label="Mais">+</button></div></div>
      <button data-rem="${k}">Remover</button></div>`;
  }).join('') : '<p>Sua sacolinha está vazia.</p>';
  $('#cartTotal').textContent = money(cartTotal());
  $('#count').textContent = cart.reduce((n, i) => n + i.qty, 0);
}
function changeQty(k, d) {
  const i = cart[k], p = findProduct(i.id); if (!p) return;
  const nq = i.qty + d;
  if (nq <= 0) cart.splice(k, 1);
  else if (nq > stockOf(p, i.size)) { alert('Estoque máximo atingido para este tamanho.'); return; }
  else i.qty = nq;
  saveCart(); renderCart();
}
function openCart() { renderCart(); $('#overlay').classList.add('show'); $('#drawer').classList.add('show'); }
function closeCart() { $('#overlay').classList.remove('show'); $('#drawer').classList.remove('show'); }

/* ---------- Conta ---------- */
let authMode = 'login', pendingCheckout = false;
function setAuthMode(m) {
  authMode = m;
  document.querySelectorAll('#authDlg .tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === m));
  $('#nameWrap').hidden = m !== 'signup';
  $('#authSubmit').textContent = m === 'signup' ? 'Criar conta' : 'Entrar';
  $('#authPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  setMsg($('#authMsg'), '');
}
const authErr = e => ({
  'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.', 'auth/email-already-in-use': 'Este e-mail já tem cadastro. Tente entrar.',
  'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.', 'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.', 'auth/popup-closed-by-user': 'Login cancelado.'
}[e.code] || 'Não foi possível concluir. Tente novamente.');

async function onAuth(u) {
  user = u; isAdmin = false;
  if (u) {
    try { isAdmin = (await fb.F.getDoc(fb.F.doc(fb.db, 'admins', u.uid))).exists(); } catch { }
    if ($('#authDlg').open) $('#authDlg').close();
    if (pendingCheckout) { pendingCheckout = false; openCheckout(); }
  }
}
function openAccount() {
  if (DEMO) return alert('Modo demonstração: configure o Firebase para ativar contas de clientes (veja o README).');
  if (!user) { setAuthMode('login'); return $('#authDlg').showModal(); }
  $('#accEmail').textContent = user.email;
  $('#adminLink').style.display = isAdmin ? 'block' : 'none';
  $('#accountDlg').showModal(); loadMyOrders();
}
async function loadMyOrders() {
  const box = $('#myOrders'); box.textContent = 'Carregando…';
  try {
    const { db, F } = fb;
    const snap = await F.getDocs(F.query(F.collection(db, 'orders'), F.where('userId', '==', user.uid)));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    box.innerHTML = list.length ? list.map(o => `<div class="orderbox"><b>Pedido #${esc(o.id.slice(0, 6).toUpperCase())}</b> · ${money(o.totalCents / 100)}
      <span class="badge ${esc(o.status)}">${esc(STATUS[o.status] || o.status)}</span><br>
      ${(o.items || []).map(i => `${i.qty}× ${esc(i.name)} (${esc(i.size)})`).join('<br>')}
      ${o.tracking ? `<br>Rastreio: <b>${esc(o.tracking)}</b>` : ''}</div>`).join('') : '<p style="font-size:13px">Você ainda não fez pedidos.</p>';
  } catch (e) { console.error(e); box.textContent = 'Não foi possível carregar seus pedidos.'; }
}

/* ---------- Checkout ---------- */
function startCheckout() {
  if (!cart.length) return alert('Sua sacolinha está vazia.');
  if (DEMO) return alert('Modo demonstração: configure o Firebase e o Mercado Pago para ativar o checkout (veja o README).');
  if (!user) { closeCart(); pendingCheckout = true; setAuthMode('signup'); setMsg($('#authMsg'), 'Entre ou crie sua conta para finalizar o pedido.'); return $('#authDlg').showModal(); }
  openCheckout();
}
async function openCheckout() {
  closeCart();
  $('#ckTotal').textContent = money(cartTotal());
  setMsg($('#ckMsg'), '');
  const f = $('#checkoutForm');
  try { // pré-preenche com dados salvos
    const s = await fb.F.getDoc(fb.F.doc(fb.db, 'users', user.uid));
    if (s.exists()) for (const [k, v] of Object.entries(s.data())) if (f.elements[k] && !f.elements[k].value) f.elements[k].value = v;
  } catch { }
  if (!f.elements.name.value && user.displayName) f.elements.name.value = user.displayName;
  $('#checkoutDlg').showModal();
}
async function submitCheckout(e) {
  e.preventDefault();
  const f = e.target, v = Object.fromEntries(new FormData(f));
  const btn = $('#ckSubmit'); btn.disabled = true; setMsg($('#ckMsg'), 'Gerando seu Pix…');
  try {
    const { db, F, functions, FN } = fb;
    const customer = {
      name: v.name.trim(), cpf: v.cpf.replace(/\D/g, ''), phone: v.phone.replace(/\D/g, ''), cep: v.cep.replace(/\D/g, ''),
      street: v.street.trim(), number: v.number.trim(), complement: v.complement.trim(), district: v.district.trim(),
      city: v.city.trim(), state: v.state.trim().toUpperCase()
    };
    const res = await FN.httpsCallable(functions, 'createOrder')({ items: cart.map(({ id, size, qty }) => ({ id, size, qty })), customer });
    const d = res.data;
    F.setDoc(F.doc(db, 'users', user.uid), { ...customer, email: user.email }, { merge: true }).catch(() => { });
    cart = []; saveCart(); renderCart();
    $('#checkoutDlg').close();
    showPix(d);
  } catch (err) {
    console.error(err); setMsg($('#ckMsg'), err.message || 'Não foi possível gerar o Pix.', 'err');
  } finally { btn.disabled = false; }
}
function showPix(d) {
  $('#pixTitle').textContent = 'Pague com Pix'; $('#pixQrWrap').hidden = false; $('#btnCopyPix').hidden = false; $('#pixCode').hidden = false;
  $('#pixInfo').textContent = `Pedido #${d.orderId.slice(0, 6).toUpperCase()} · ${money(d.totalCents / 100)}. Escaneie o QR Code ou copie o código no app do seu banco.`;
  $('#pixQr').src = 'data:image/png;base64,' + d.qrCodeBase64; $('#pixCode').value = d.qrCode;
  setMsg($('#pixMsg'), 'Aguardando pagamento…');
  $('#pixDlg').showModal();
  if (unsubOrder) unsubOrder();
  const { db, F } = fb;
  unsubOrder = F.onSnapshot(F.doc(db, 'orders', d.orderId), s => {
    const st = s.data()?.status;
    if (st && st !== 'pending_payment' && st !== 'cancelled') {
      $('#pixTitle').textContent = 'Pagamento confirmado ♡'; $('#pixInfo').textContent = 'Obrigada pela compra! Vamos preparar tudo com carinho.';
      $('#pixQrWrap').hidden = true; $('#btnCopyPix').hidden = true; $('#pixCode').hidden = true; setMsg($('#pixMsg'), 'Você pode acompanhar em Minha conta › Meus pedidos.', 'ok');
      unsubOrder(); unsubOrder = null;
    } else if (st === 'cancelled') { setMsg($('#pixMsg'), 'Este pedido foi cancelado ou o Pix expirou.', 'err'); }
  });
}

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  const im = e.target.closest('img[data-pid]');
  if (im) { const p = findProduct(im.dataset.pid); if (p?.images?.length > 1) { const n = (+im.dataset.i + 1) % p.images.length; im.dataset.i = n; im.src = p.images[n]; } return; }
  const t = e.target.closest('button, a'); if (!t) return;
  if (t.dataset.cat !== undefined && !t.closest('#authDlg')) return setCategory(t.dataset.cat, !t.closest('#filters'));
  if (t.dataset.add) return addToCart(t.dataset.add);
  if (t.dataset.inc) return changeQty(+t.dataset.inc, 1);
  if (t.dataset.dec) return changeQty(+t.dataset.dec, -1);
  if (t.dataset.rem) { cart.splice(+t.dataset.rem, 1); saveCart(); return renderCart(); }
  if (t.dataset.close !== undefined) return t.closest('dialog').close();
  if (t.dataset.tab) return setAuthMode(t.dataset.tab);
});
$('#btnSearch').onclick = () => { $('#searchbox').classList.toggle('show'); $('#search').focus(); };
$('#search').oninput = renderProducts;
$('#btnAccount').onclick = openAccount;
$('#btnCart').onclick = openCart;
$('#closeCart').onclick = closeCart; $('#overlay').onclick = closeCart;
$('#btnColecao').onclick = () => $('#colecao').scrollIntoView({ behavior: 'smooth' });
$('#btnCheckout').onclick = startCheckout;
$('#checkoutForm').onsubmit = submitCheckout;
$('#btnCopyPix').onclick = async () => { try { await navigator.clipboard.writeText($('#pixCode').value); setMsg($('#pixMsg'), 'Código copiado! Cole no app do seu banco.', 'ok'); } catch { $('#pixCode').select(); } };
$('#btnLogout').onclick = async () => { await fb.A.signOut(fb.auth); $('#accountDlg').close(); };
$('#checkoutForm').elements.cep.addEventListener('blur', async e => {
  const cep = e.target.value.replace(/\D/g, ''); if (cep.length !== 8) return;
  try {
    const d = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json(); if (d.erro) return;
    const f = $('#checkoutForm').elements;
    f.street.value ||= d.logradouro || ''; f.district.value ||= d.bairro || ''; f.city.value ||= d.localidade || ''; f.state.value ||= d.uf || '';
  } catch { }
});
$('#authForm').onsubmit = async e => {
  e.preventDefault(); const { auth, A } = fb, msg = $('#authMsg'); setMsg(msg, 'Aguarde…');
  try {
    if (authMode === 'signup') {
      const c = await A.createUserWithEmailAndPassword(auth, $('#authEmail').value.trim(), $('#authPass').value);
      if ($('#authName').value.trim()) await A.updateProfile(c.user, { displayName: $('#authName').value.trim() });
    } else await A.signInWithEmailAndPassword(auth, $('#authEmail').value.trim(), $('#authPass').value);
    setMsg(msg, '');
  } catch (err) { setMsg(msg, authErr(err), 'err'); }
};
$('#btnGoogle').onclick = async () => { try { await fb.A.signInWithPopup(fb.auth, new fb.A.GoogleAuthProvider()); } catch (err) { setMsg($('#authMsg'), authErr(err), 'err'); } };
$('#btnReset').onclick = async () => {
  const email = $('#authEmail').value.trim(); if (!email) return setMsg($('#authMsg'), 'Digite seu e-mail acima primeiro.', 'err');
  try { await fb.A.sendPasswordResetEmail(fb.auth, email); setMsg($('#authMsg'), 'Enviamos um link para redefinir sua senha.', 'ok'); } catch (err) { setMsg($('#authMsg'), authErr(err), 'err'); }
};
$('#authDlg').addEventListener('close', () => { if (!user) pendingCheckout = false; });

/* ---------- Início ---------- */
(async function init() {
  saveCart(); renderFilters();
  if (!DEMO) {
    try {
      fb = await import('./firebase-init.js');
      fb.A.onAuthStateChanged(fb.auth, onAuth);
    } catch (e) {
      console.error(e);
      $('#products').innerHTML = '<p style="grid-column:1/-1;text-align:center">Não foi possível carregar a loja agora. Verifique sua conexão e recarregue a página.</p>';
      return;
    }
  }
  await loadProducts();
})();
