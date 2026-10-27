import { firebaseConfig } from './firebase-config.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const STATUS = { pending_payment: 'Aguardando pagamento', paid: 'Pago', preparing: 'Em preparo', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };
const setMsg = (el, t, k = '') => { el.textContent = t; el.className = 'msg ' + k; };

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('COLE')) {
  document.body.innerHTML = '<div class="adminwrap"><div class="card"><h2>Firebase ainda não configurado</h2><p>Preencha <code>firebase-config.js</code> (veja o README) e abra esta página de novo.</p></div></div>';
  throw new Error('Firebase não configurado');
}
const { auth, db, storage, A, F, S } = await import('./firebase-init.js');

let products = [], editing = null, photos = []; // photos: urls já salvas

A.onAuthStateChanged(auth, async u => {
  $('#btnOut').hidden = !u;
  $('#loginCard').hidden = !!u; $('#panel').hidden = true; $('#denied').hidden = true;
  if (!u) return;
  let ok = false;
  try { ok = (await F.getDoc(F.doc(db, 'admins', u.uid))).exists(); } catch { }
  if (!ok) { $('#uid').textContent = u.uid; $('#denied').hidden = false; return; }
  $('#panel').hidden = false; loadProducts(); loadOrders();
});
$('#btnOut').onclick = () => A.signOut(auth);
$('#loginForm').onsubmit = async e => {
  e.preventDefault(); setMsg($('#lMsg'), 'Aguarde…');
  try { await A.signInWithEmailAndPassword(auth, $('#lEmail').value.trim(), $('#lPass').value); setMsg($('#lMsg'), ''); }
  catch { setMsg($('#lMsg'), 'E-mail ou senha incorretos.', 'err'); }
};
document.querySelectorAll('.tabs [data-t]').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs [data-t]').forEach(x => x.classList.toggle('active', x === b));
  $('#tProducts').hidden = b.dataset.t !== 'products'; $('#tOrders').hidden = b.dataset.t !== 'orders';
  if (b.dataset.t === 'orders') loadOrders();
});

/* ---------- Produtos ---------- */
const parseSizes = txt => {
  const out = {};
  for (const part of txt.split(',').map(s => s.trim()).filter(Boolean)) {
    const [k, n] = part.split(':').map(s => s.trim());
    if (!k || /[.\/\[\]#$*~]/.test(k)) throw new Error(`Tamanho inválido: "${part}". Não use . / [ ] # $ * ~`);
    const q = Number(n ?? 0); if (!Number.isInteger(q) || q < 0) throw new Error(`Estoque inválido em "${part}". Use o formato P:5`);
    out[k] = q;
  }
  if (!Object.keys(out).length) throw new Error('Informe ao menos um tamanho. Ex.: RN:3, P:5');
  return out;
};
const sizesToText = s => Object.entries(s || {}).map(([k, n]) => `${k}:${n}`).join(', ');

async function loadProducts() {
  const snap = await F.getDocs(F.collection(db, 'products'));
  products = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  $('#pList').innerHTML = products.map(p => `<div class="prow">
    ${p.images?.[0] ? `<img src="${esc(p.images[0])}" alt="">` : '<div style="width:64px;height:64px;background:var(--sand);border-radius:8px"></div>'}
    <div class="grow"><b>${esc(p.name)}</b> ${p.active ? '' : '<span class="badge">oculto</span>'}<br>${esc(p.category)} · ${money(p.price)}<br><small>${esc(sizesToText(p.sizes))}</small></div>
    <button data-edit="${p.id}">Editar</button><button class="danger" data-del="${p.id}">Excluir</button></div>`).join('') || '<p>Nenhum produto ainda. Cadastre o primeiro acima ♡</p>';
}
function renderThumbs() {
  $('#pThumbs').innerHTML = photos.map((u, i) => `<div><img src="${esc(u)}" alt=""><button type="button" data-rmimg="${i}">×</button></div>`).join('');
}
function resetForm() {
  editing = null; photos = []; $('#pForm').reset(); $('#pActive').checked = true; renderThumbs();
  $('#formTitle').textContent = 'Novo produto'; $('#pCancel').hidden = true; setMsg($('#pMsg'), '');
}
$('#pCancel').onclick = resetForm;
$('#pList').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.edit) {
    const p = products.find(x => x.id === b.dataset.edit); editing = p.id; photos = [...(p.images || [])];
    $('#pName').value = p.name; $('#pCat').value = p.category; $('#pPrice').value = p.price; $('#pSizes').value = sizesToText(p.sizes);
    $('#pDesc').value = p.description || ''; $('#pActive').checked = !!p.active; renderThumbs();
    $('#formTitle').textContent = 'Editar produto'; $('#pCancel').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (b.dataset.del && confirm('Excluir este produto definitivamente?')) { await F.deleteDoc(F.doc(db, 'products', b.dataset.del)); loadProducts(); }
};
$('#pThumbs').onclick = e => { const b = e.target.closest('[data-rmimg]'); if (b) { photos.splice(+b.dataset.rmimg, 1); renderThumbs(); } };

// reduz a foto antes de enviar (site mais rápido e menos espaço)
function shrink(file, max = 1200) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('Falha ao processar imagem')), 'image/jpeg', 0.85);
    };
    img.onerror = () => rej(new Error('Imagem inválida')); img.src = url;
  });
}
$('#pForm').onsubmit = async e => {
  e.preventDefault(); const btn = $('#pSave'); btn.disabled = true; setMsg($('#pMsg'), 'Salvando…');
  try {
    const sizes = parseSizes($('#pSizes').value);
    const urls = [...photos];
    for (const f of $('#pFiles').files) {
      const blob = await shrink(f);
      const r = S.ref(storage, `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
      await S.uploadBytes(r, blob, { contentType: 'image/jpeg' }); urls.push(await S.getDownloadURL(r));
    }
    const data = {
      name: $('#pName').value.trim(), category: $('#pCat').value, price: Math.round(Number($('#pPrice').value) * 100) / 100,
      sizes, description: $('#pDesc').value.trim(), images: urls, active: $('#pActive').checked, updatedAt: F.serverTimestamp()
    };
    if (editing) await F.updateDoc(F.doc(db, 'products', editing), data);
    else await F.addDoc(F.collection(db, 'products'), { ...data, createdAt: F.serverTimestamp() });
    resetForm(); setMsg($('#pMsg'), 'Produto salvo ♡', 'ok'); $('#pFiles').value = ''; loadProducts();
  } catch (err) { console.error(err); setMsg($('#pMsg'), err.message || 'Erro ao salvar.', 'err'); }
  finally { btn.disabled = false; }
};

/* ---------- Pedidos ---------- */
async function loadOrders() {
  const box = $('#oList'); box.textContent = 'Carregando…';
  try {
    const snap = await F.getDocs(F.query(F.collection(db, 'orders'), F.orderBy('createdAt', 'desc'), F.limit(100)));
    box.innerHTML = snap.docs.map(d => {
      const o = d.data(), c = o.customer || {};
      return `<div class="card"><b>Pedido #${d.id.slice(0, 6).toUpperCase()}</b> · ${money(o.totalCents / 100)} · ${o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString('pt-BR') : ''}
      <span class="badge ${esc(o.status)}">${esc(STATUS[o.status] || o.status)}</span>
      <p style="font-size:13px;line-height:1.6">${(o.items || []).map(i => `${i.qty}× ${esc(i.name)} (${esc(i.size)})`).join('<br>')}</p>
      <p style="font-size:13px;line-height:1.6"><b>${esc(c.name)}</b> · ${esc(c.phone)} · CPF ${esc(c.cpf)}<br>${esc(c.street)}, ${esc(c.number)} ${esc(c.complement)} — ${esc(c.district)}, ${esc(c.city)}/${esc(c.state)} · CEP ${esc(c.cep)}</p>
      <div class="grid2"><div><label>Status</label><select data-st="${d.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div><label>Código de rastreio</label><input data-tr="${d.id}" value="${esc(o.tracking || '')}"></div></div>
      <button class="smallbtn" data-saveo="${d.id}">Salvar pedido</button> <span class="msg" id="om-${d.id}"></span></div>`;
    }).join('') || '<p>Nenhum pedido ainda.</p>';
  } catch (err) { console.error(err); box.textContent = 'Não foi possível carregar os pedidos.'; }
}
$('#oList').onclick = async e => {
  const b = e.target.closest('[data-saveo]'); if (!b) return; const id = b.dataset.saveo, m = $('#om-' + id);
  try {
    await F.updateDoc(F.doc(db, 'orders', id), { status: document.querySelector(`[data-st="${id}"]`).value, tracking: document.querySelector(`[data-tr="${id}"]`).value.trim(), updatedAt: F.serverTimestamp() });
    setMsg(m, 'Salvo ✓', 'ok');
  } catch { setMsg(m, 'Erro ao salvar', 'err'); }
};
