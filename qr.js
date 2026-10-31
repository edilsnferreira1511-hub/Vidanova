// Interpreta os dois formatos de QR Code (rota e veículo) SEM preencher nada sozinho:
// devolve o resultado para a tela mostrar e a pessoa confirmar.

// Campos numéricos cujo texto original deve ser preservado (sem perda de precisão).
const CHAVES_ID = ['container_id', 'id', 'carrier_id', 'vehicle_type_id'];

function citarIds(texto) {
  const re = new RegExp(`("(?:${CHAVES_ID.join('|')})"\\s*:\\s*)(-?\\d+)(?=\\s*[,}\\r\\n])`, 'g');
  return texto.replace(re, '$1"$2"');
}

const txt = (v) => (typeof v === 'string' && v.length > 0 ? v : undefined);

export function lerQr(bruto) {
  let obj;
  try {
    const p = JSON.parse(citarIds(String(bruto).trim()));
    if (p === null || typeof p !== 'object' || Array.isArray(p)) {
      return { ok: false, erros: ['O conteúdo do QR não é um objeto JSON.'], bruto };
    }
    obj = p;
  } catch {
    return { ok: false, erros: ['O conteúdo do QR não é um JSON válido.'], bruto };
  }

  const ehRota = 'container_id' in obj || 'facility_id' in obj || 'assignment' in obj;
  const ehVeiculo = 'license_plate' in obj || 'carrier_id' in obj;
  const erros = [];

  if (ehRota && !ehVeiculo) {
    const containerId = txt(obj.container_id);
    const svc = txt(obj.facility_id);
    const rota = txt(obj.assignment);
    if (!containerId) erros.push('Campo "container_id" ausente ou vazio.');
    if (!svc) erros.push('Campo "facility_id" (SVC) ausente ou vazio.');
    if (!rota) erros.push('Campo "assignment" (rota) ausente ou vazio.');
    if (erros.length) return { ok: false, erros, bruto };
    return { ok: true, dados: { tipo: 'rota', containerId, svc, rota }, avisos: [], bruto };
  }

  if (ehVeiculo && !ehRota) {
    const qrId = txt(obj.id);
    const carrierId = txt(obj.carrier_id);
    const carrierName = txt(obj.carrier_name);
    const placa = txt(obj.license_plate);
    if (!placa) erros.push('Campo "license_plate" ausente ou vazio.');
    if (!carrierId) erros.push('Campo "carrier_id" ausente ou vazio.');
    if (!qrId) erros.push('Campo "id" ausente ou vazio.');
    if (erros.length) return { ok: false, erros, bruto };
    const avisos = [];
    if (carrierName && carrierName.toUpperCase() !== 'COOPMETRO') {
      avisos.push(`Transportadora "${carrierName}" é diferente de COOPMETRO.`);
    }
    avisos.push('O campo "id" do QR é do veículo/cadastro; não foi confirmado como ID do motorista.');
    const tracking = Array.isArray(obj.tracking_provider_ids)
      ? obj.tracking_provider_ids.filter((x) => typeof x === 'string')
      : [];
    return {
      ok: true,
      dados: {
        tipo: 'veiculo', qrId, carrierId, carrierName: carrierName ?? '', placa,
        tipoVeiculo: txt(obj.vehicle_type_description), tipoVeiculoId: txt(obj.vehicle_type_id),
        trackingProviderIds: tracking,
      },
      avisos,
      bruto,
    };
  }

  return {
    ok: false,
    erros: [ehRota && ehVeiculo ? 'O QR mistura campos de rota e de veículo.' : 'Formato de QR não reconhecido (esperado: rota ou veículo).'],
    bruto,
  };
}
