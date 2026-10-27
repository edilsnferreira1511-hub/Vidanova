const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = admin.firestore;

const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const REGION = 'southamerica-east1';
const SHIPPING_CENTS = 0; // frete fixo em centavos (0 = frete grátis / combinado à parte)
const MP_API = 'https://api.mercadopago.com';

const onlyDigits = s => String(s ?? '').replace(/\D/g, '');
const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);

function validCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const n of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(cpf[i]) * (n + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(cpf[n])) return false;
  }
  return true;
}

/**
 * Cria o pedido e o pagamento Pix.
 * O preço é SEMPRE lido do banco (nunca do navegador), para ninguém alterar o valor.
 */
exports.createOrder = onCall({ region: REGION, secrets: [MP_ACCESS_TOKEN], cors: true }, async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Entre na sua conta para finalizar o pedido.');
  const uid = req.auth.uid;
  const email = req.auth.token.email;
  if (!email) throw new HttpsError('failed-precondition', 'Sua conta precisa ter um e-mail.');

  const { items, customer: c = {} } = req.data || {};
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) throw new HttpsError('invalid-argument', 'Sacola inválida.');

  const customer = {
    name: str(c.name), cpf: onlyDigits(c.cpf), phone: onlyDigits(c.phone), cep: onlyDigits(c.cep),
    street: str(c.street), number: str(c.number, 20), complement: str(c.complement, 60),
    district: str(c.district, 80), city: str(c.city, 80), state: str(c.state, 2).toUpperCase()
  };
  if (customer.name.length < 3 || !validCpf(customer.cpf) || customer.phone.length < 10 || customer.cep.length !== 8 ||
    !customer.street || !customer.number || !customer.district || !customer.city || customer.state.length !== 2) {
    throw new HttpsError('invalid-argument', 'Confira seus dados: nome, CPF válido, WhatsApp e endereço completo.');
  }

  // agrupa por produto+tamanho
  const wanted = new Map();
  for (const it of items) {
    const qty = Number(it.qty), id = str(it.id, 60), size = str(it.size, 20);
    if (!id || !size || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new HttpsError('invalid-argument', 'Item inválido na sacola.');
    const key = `${id}|${size}`;
    wanted.set(key, { id, size, qty: (wanted.get(key)?.qty || 0) + qty });
  }
  const ids = [...new Set([...wanted.values()].map(w => w.id))];
  const docs = await db.getAll(...ids.map(id => db.collection('products').doc(id)));
  const byId = new Map(docs.filter(d => d.exists).map(d => [d.id, d.data()]));

  const orderItems = []; let subtotal = 0;
  for (const w of wanted.values()) {
    const p = byId.get(w.id);
    if (!p || !p.active) throw new HttpsError('failed-precondition', 'Um dos produtos não está mais disponível. Atualize a página.');
    if (Number(p.sizes?.[w.size] ?? 0) < w.qty) throw new HttpsError('failed-precondition', `Estoque insuficiente: ${p.name} (${w.size}).`);
    const unitCents = Math.round(Number(p.price) * 100);
    subtotal += unitCents * w.qty;
    orderItems.push({ productId: w.id, name: p.name, size: w.size, qty: w.qty, unitCents });
  }
  const totalCents = subtotal + SHIPPING_CENTS;
  if (totalCents < 100) throw new HttpsError('failed-precondition', 'Valor mínimo do pedido: R$ 1,00.');

  const orderRef = db.collection('orders').doc();
  await orderRef.set({
    userId: uid, email, customer, items: orderItems, subtotalCents: subtotal, shippingCents: SHIPPING_CENTS, totalCents,
    status: 'pending_payment', createdAt: FieldValue.serverTimestamp()
  });

  const [first, ...rest] = customer.name.split(' ');
  const project = process.env.GCLOUD_PROJECT;
  let payment;
  try {
    const r = await fetch(`${MP_API}/v1/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': orderRef.id },
      body: JSON.stringify({
        transaction_amount: totalCents / 100,
        description: `Pedido VIAL KIDS #${orderRef.id.slice(0, 6).toUpperCase()}`,
        payment_method_id: 'pix',
        external_reference: orderRef.id,
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('Z', '-00:00'),
        notification_url: `https://${REGION}-${project}.cloudfunctions.net/mpWebhook`,
        payer: { email, first_name: first, last_name: rest.join(' ') || first, identification: { type: 'CPF', number: customer.cpf } }
      })
    });
    payment = await r.json();
    if (!r.ok) { console.error('Mercado Pago erro', r.status, JSON.stringify(payment)); throw new Error('mp'); }
  } catch (e) {
    await orderRef.update({ status: 'cancelled', cancelReason: 'falha ao criar Pix', updatedAt: FieldValue.serverTimestamp() });
    throw new HttpsError('internal', 'Não foi possível gerar o Pix agora. Tente novamente em instantes.');
  }

  const td = payment.point_of_interaction?.transaction_data || {};
  await orderRef.update({ paymentId: String(payment.id), updatedAt: FieldValue.serverTimestamp() });
  return { orderId: orderRef.id, totalCents, qrCode: td.qr_code, qrCodeBase64: td.qr_code_base64 };
});

/**
 * Webhook do Mercado Pago: confirma o pagamento consultando a API do próprio Mercado Pago
 * (não confia no corpo da notificação), baixa o estoque e marca o pedido como pago.
 */
exports.mpWebhook = onRequest({ region: REGION, secrets: [MP_ACCESS_TOKEN] }, async (req, res) => {
  try {
    const type = req.body?.type || req.query.type || req.query.topic;
    const paymentId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (type !== 'payment' || !paymentId) return res.status(200).send('ignorado');

    const r = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}` } });
    if (!r.ok) { console.error('Consulta MP falhou', r.status); return res.status(500).send('erro'); }
    const pay = await r.json();
    const orderRef = db.collection('orders').doc(String(pay.external_reference || 'x'));

    await db.runTransaction(async tx => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) return;
      const o = snap.data();
      if (String(o.paymentId) !== String(pay.id)) return;
      if (o.status !== 'pending_payment') return; // já processado

      if (pay.status === 'approved') {
        if (Math.round(Number(pay.transaction_amount) * 100) !== o.totalCents) { console.error('Valor divergente', orderRef.id); return; }
        const prodRefs = [...new Set(o.items.map(i => i.productId))].map(id => db.collection('products').doc(id));
        const prods = await Promise.all(prodRefs.map(ref => tx.get(ref)));
        for (const i of o.items) {
          const p = prods.find(d => d.id === i.productId);
          if (p?.exists) tx.update(p.ref, { [`sizes.${i.size}`]: FieldValue.increment(-i.qty) });
        }
        tx.update(orderRef, { status: 'paid', paidAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      } else if (['cancelled', 'rejected', 'expired'].includes(pay.status)) {
        tx.update(orderRef, { status: 'cancelled', cancelReason: `pagamento ${pay.status}`, updatedAt: FieldValue.serverTimestamp() });
      }
    });
    res.status(200).send('ok');
  } catch (e) { console.error(e); res.status(500).send('erro'); }
});
