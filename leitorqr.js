// Leitor de QR Code: câmera (BarcodeDetector, ou jsQR como alternativa) + colar o conteúdo.
// Só preenche o formulário DEPOIS que a pessoa vê os dados validados e confirma.
import { h, botao, banner, campo, cartao, muted, titulo2 } from './ui.js';
import { lerQr } from './qr.js';

const URL_JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';

function carregarJsQr() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = URL_JSQR;
    s.onload = () => ok(window.jsQR);
    s.onerror = () => falha(new Error('Não foi possível carregar o leitor alternativo de QR.'));
    document.head.append(s);
  });
}

/** esperado: 'rota' | 'veiculo'. aoConfirmar(dados) é chamado só após a confirmação. */
export function abrirLeitorQr({ esperado, aoConfirmar }) {
  const nome = esperado === 'rota' ? 'QR Code da rota' : 'QR Code do veículo';
  const fundo = h('div', { class: 'modal' });
  const corpo = h('div', { class: 'modal-corpo' });
  fundo.append(corpo);
  document.body.append(fundo);

  let fluxo = null;
  let ativo = true;

  const fechar = () => {
    ativo = false;
    fluxo?.getTracks().forEach((t) => t.stop());
    fundo.remove();
  };

  const avaliar = (bruto) => {
    const r = lerQr(bruto);
    if (r.ok && r.dados.tipo !== esperado) {
      return mostrar({ ok: false, erros: [`Este é um QR de ${r.dados.tipo === 'rota' ? 'rota' : 'veículo'}, mas o esperado é ${esperado === 'rota' ? 'rota' : 'veículo'}.`] });
    }
    return mostrar(r);
  };

  function mostrar(r) {
    fluxo?.getTracks().forEach((t) => t.stop());
    fluxo = null;
    corpo.replaceChildren(titulo2(nome));
    if (!r.ok) {
      corpo.append(...r.erros.map((e) => banner('error', e)), botao('Tentar novamente', { aoClicar: inicio }), botao('Fechar', { aoClicar: fechar }));
      return;
    }
    const linhas = Object.entries(r.dados).filter(([k]) => k !== 'tipo')
      .map(([k, v]) => h('div', {}, muted(k), h('div', {}, Array.isArray(v) ? v.join(', ') || '—' : String(v ?? '—'))));
    corpo.append(
      banner('success', 'QR válido. Confira os dados antes de usar.'),
      cartao(...linhas),
      ...r.avisos.map((a) => banner('warning', a)),
      botao('Usar estes dados', { variante: 'primary', aoClicar: () => { aoConfirmar(r.dados); fechar(); } }),
      botao('Ler outro', { aoClicar: inicio }),
      botao('Fechar', { aoClicar: fechar }),
    );
  }

  async function iniciarCamera(video, aviso) {
    if (!navigator.mediaDevices?.getUserMedia) {
      aviso.append(banner('warning', 'Este navegador não permite usar a câmera. Cole o conteúdo do QR abaixo.'));
      return;
    }
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch {
      aviso.append(banner('warning', 'Permissão da câmera negada ou indisponível. Cole o conteúdo do QR abaixo.'));
      return;
    }
    if (!ativo) { fluxo.getTracks().forEach((t) => t.stop()); return; }
    video.srcObject = fluxo;
    await video.play().catch(() => {});

    let detector = null;
    let jsqr = null;
    if ('BarcodeDetector' in window) {
      try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch { detector = null; }
    }
    if (!detector) {
      try { jsqr = await carregarJsQr(); } catch (e) { aviso.append(banner('warning', e.message)); return; }
    }
    const tela = document.createElement('canvas');
    const ctx = tela.getContext('2d', { willReadFrequently: true });
    const ler = async () => {
      if (!ativo || !fluxo) return;
      try {
        if (video.readyState >= 2) {
          if (detector) {
            const achados = await detector.detect(video);
            if (achados.length) return avaliar(achados[0].rawValue);
          } else {
            tela.width = video.videoWidth; tela.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, tela.width, tela.height);
            const code = jsqr(img.data, img.width, img.height);
            if (code?.data) return avaliar(code.data);
          }
        }
      } catch { /* tenta no próximo quadro */ }
      setTimeout(ler, 250);
    };
    ler();
  }

  function inicio() {
    const video = h('video', { class: 'video', playsinline: true, muted: true });
    const aviso = h('div');
    const colado = campo('Conteúdo do QR (colar para validar)', { multilinha: true });
    corpo.replaceChildren(
      titulo2(nome), video, aviso, muted('Aponte a câmera para o QR Code.'), colado,
      botao('Validar conteúdo colado', { aoClicar: () => { if (colado.input.value.trim()) avaliar(colado.input.value); } }),
      botao('Fechar', { aoClicar: fechar }),
    );
    iniciarCamera(video, aviso);
  }

  inicio();
}
