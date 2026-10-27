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
const { auth, db, A, F } = await import('./firebase-init.js');

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
  $('#pThumbs').innerHTML = photos.map((u, i) => `<div><img src="${esc(u)}" alt="">${i === 0 ? '<small style="display:block;text-align:center;font-size:10px;color:var(--deep)">capa</small>' : `<button type="button" class="cover" data-cover="${i}" title="Tornar capa" style="right:auto;left:-6px;background:var(--deep)">★</button>`}<button type="button" data-rmimg="${i}">×</button></div>`).join('');
  const kb = Math.round(photos.reduce((n, u) => n + u.length, 0) / 1024);
  $('#pPhotoInfo').textContent = `${photos.length}/${MAX_PHOTOS} fotos · ${kb} KB de ${Math.round(MAX_TOTAL / 1024)} KB`;
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
$('#pThumbs').onclick = e => {
  const r = e.target.closest('[data-rmimg]'), c = e.target.closest('[data-cover]');
  if (r) { photos.splice(+r.dataset.rmimg, 1); renderThumbs(); }
  if (c) { const [x] = photos.splice(+c.dataset.cover, 1); photos.unshift(x); renderThumbs(); }
};

// As fotos viram TEXTO (base64) e ficam salvas dentro do próprio produto no Firestore.
// Limite do Firestore: 1 MB por documento, então reduzimos cada foto ao máximo possível sem estragar.
const MAX_PHOTOS = 4, MAX_TOTAL = 800 * 1024, MAX_EACH = 220 * 1024;
function toDataUrl(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let max = 900, q = 0.82, out = '';
      for (let i = 0; i < 8; i++) {
        const r = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL('image/jpeg', q);
        if (out.length <= MAX_EACH) return res(out);
        if (q > 0.55) q -= 0.1; else max = Math.round(max * 0.8);
      }
      rej(new Error('Não foi possível reduzir esta foto o suficiente. Tente outra.'));
    };
    img.onerror = () => rej(new Error('Arquivo de imagem inválido.')); img.src = url;
  });
}
$('#pFiles').onchange = async e => {
  const files = [...e.target.files]; e.target.value = ''; setMsg($('#pMsg'), 'Processando fotos…');
  try {
    for (const f of files) {
      if (photos.length >= MAX_PHOTOS) throw new Error(`Máximo de ${MAX_PHOTOS} fotos por produto.`);
      const d = await toDataUrl(f);
      if (photos.reduce((n, u) => n + u.length, 0) + d.length > MAX_TOTAL) throw new Error('As fotos deste produto ficaram pesadas demais. Remova alguma foto e tente de novo.');
      photos.push(d); renderThumbs();
    }
    setMsg($('#pMsg'), '');
  } catch (err) { setMsg($('#pMsg'), err.message, 'err'); }
};
$('#pForm').onsubmit = async e => {
  e.preventDefault(); const btn = $('#pSave'); btn.disabled = true; setMsg($('#pMsg'), 'Salvando…');
  try {
    const sizes = parseSizes($('#pSizes').value);
    if (!photos.length && !confirm('Este produto está sem foto. Salvar mesmo assim?')) { btn.disabled = false; setMsg($('#pMsg'), ''); return; }
    const data = {
      name: $('#pName').value.trim(), category: $('#pCat').value, price: Math.round(Number($('#pPrice').value) * 100) / 100,
      sizes, description: $('#pDesc').value.trim(), images: photos, active: $('#pActive').checked, updatedAt: F.serverTimestamp()
    };
    if (editing) await F.updateDoc(F.doc(db, 'products', editing), data);
    else await F.addDoc(F.collection(db, 'products'), { ...data, createdAt: F.serverTimestamp() });
    resetForm(); setMsg($('#pMsg'), 'Produto salvo ♡', 'ok'); loadProducts();
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
