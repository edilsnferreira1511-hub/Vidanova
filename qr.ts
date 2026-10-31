import type { QrParseResult, RouteQr, VehicleQr } from './types';

// Chaves numéricas cujo texto original deve ser preservado (evita perda de precisão e mudanças de formato).
const NUMERIC_ID_KEYS = ['container_id', 'id', 'carrier_id', 'vehicle_type_id'];

function quoteNumericIds(text: string): string {
  const keys = NUMERIC_ID_KEYS.join('|');
  const re = new RegExp(`("(?:${keys})"\\s*:\\s*)(-?\\d+)(?=\\s*[,}\\r\\n])`, 'g');
  return text.replace(re, '$1"$2"');
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined;

/**
 * Interpreta o conteúdo de um QR Code (rota ou veículo) SEM preencher nada por conta própria:
 * devolve o resultado para a tela exibir e o usuário confirmar antes de usar.
 */
export function parseQr(raw: string): QrParseResult {
  const errors: string[] = [];
  let obj: Record<string, unknown>;
  try {
    const parsed = JSON.parse(quoteNumericIds(raw.trim()));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, errors: ['O conteúdo do QR não é um objeto JSON.'], raw };
    }
    obj = parsed as Record<string, unknown>;
  } catch {
    return { ok: false, errors: ['O conteúdo do QR não é um JSON válido.'], raw };
  }

  const isRoute = 'container_id' in obj || 'facility_id' in obj || 'assignment' in obj;
  const isVehicle = 'license_plate' in obj || 'carrier_id' in obj;

  if (isRoute && !isVehicle) {
    const containerId = str(obj.container_id);
    const svc = str(obj.facility_id);
    const rota = str(obj.assignment);
    if (!containerId) errors.push('Campo "container_id" ausente ou vazio.');
    if (!svc) errors.push('Campo "facility_id" (SVC) ausente ou vazio.');
    if (!rota) errors.push('Campo "assignment" (rota) ausente ou vazio.');
    if (errors.length) return { ok: false, errors, raw };
    const data: RouteQr = { kind: 'route', containerId: containerId!, svc: svc!, rota: rota! };
    return { ok: true, data, warnings: [], raw };
  }

  if (isVehicle && !isRoute) {
    const warnings: string[] = [];
    const qrId = str(obj.id);
    const carrierId = str(obj.carrier_id);
    const carrierName = str(obj.carrier_name);
    const placa = str(obj.license_plate);
    if (!placa) errors.push('Campo "license_plate" ausente ou vazio.');
    if (!carrierId) errors.push('Campo "carrier_id" ausente ou vazio.');
    if (!qrId) errors.push('Campo "id" ausente ou vazio.');
    if (errors.length) return { ok: false, errors, raw };
    if (carrierName && carrierName.toUpperCase() !== 'COOPMETRO') {
      warnings.push(`Transportadora "${carrierName}" é diferente de COOPMETRO.`);
    }
    warnings.push('O campo "id" do QR é do veículo/cadastro; não foi confirmado como ID do motorista.');
    const tracking = Array.isArray(obj.tracking_provider_ids)
      ? obj.tracking_provider_ids.filter((x): x is string => typeof x === 'string')
      : [];
    const data: VehicleQr = {
      kind: 'vehicle',
      qrId: qrId!,
      carrierId: carrierId!,
      carrierName: carrierName ?? '',
      placa: placa!,
      tipoVeiculo: str(obj.vehicle_type_description),
      tipoVeiculoId: str(obj.vehicle_type_id),
      trackingProviderIds: tracking,
    };
    return { ok: true, data, warnings, raw };
  }

  return {
    ok: false,
    errors: [
      isRoute && isVehicle
        ? 'O QR mistura campos de rota e de veículo.'
        : 'Formato de QR não reconhecido (esperado: rota ou veículo).',
    ],
    raw,
  };
}
