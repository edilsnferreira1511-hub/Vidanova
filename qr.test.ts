import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQr } from './qr.ts';

const ROUTE = `{
"container_id": 15099960,
"facility_id": "SGO1",
"assignment": ">B11_AM1"
}`;

const VEHICLE = `{
"id": 6416984,
"carrier_id": 1070423464,
"carrier_name": "COOPMETRO",
"license_plate": "SDD-PQM0C92",
"vehicle_type_description": "Utilitários SDD",
"vehicle_type_id": 303,
"tracking_provider_ids": [
"508d2077-930c-4e13-8bd0-fe808b556ba6"
]
}`;

test('QR da rota: exemplo real, valores preservados', () => {
  const r = parseQr(ROUTE);
  assert.ok(r.ok);
  assert.deepEqual(r.ok && r.data, {
    kind: 'route',
    containerId: '15099960',
    svc: 'SGO1',
    rota: '>B11_AM1',
  });
});

test('QR do veículo: exemplo real, id NÃO tratado como motorista', () => {
  const r = parseQr(VEHICLE);
  assert.ok(r.ok);
  if (!r.ok || r.data.kind !== 'vehicle') return assert.fail();
  assert.equal(r.data.qrId, '6416984');
  assert.equal(r.data.carrierId, '1070423464');
  assert.equal(r.data.placa, 'SDD-PQM0C92');
  assert.equal(r.data.tipoVeiculoId, '303');
  assert.deepEqual(r.data.trackingProviderIds, ['508d2077-930c-4e13-8bd0-fe808b556ba6']);
  assert.ok(r.warnings.some((w) => w.includes('motorista')));
});

test('ids grandes não perdem precisão', () => {
  const r = parseQr('{"container_id": 9007199254740993, "facility_id":"X","assignment":"A"}');
  assert.ok(r.ok && r.data.kind === 'route' && r.data.containerId === '9007199254740993');
});

test('rejeita JSON inválido, objeto incompleto e formato desconhecido', () => {
  assert.equal(parseQr('não é json').ok, false);
  assert.equal(parseQr('[1,2]').ok, false);
  assert.equal(parseQr('{"container_id": 1}').ok, false);
  assert.equal(parseQr('{"foo": 1}').ok, false);
});

test('aviso quando a transportadora não é COOPMETRO', () => {
  const r = parseQr(VEHICLE.replace('"COOPMETRO"', '"OUTRA"'));
  assert.ok(r.ok && r.warnings.some((w) => w.includes('OUTRA')));
});
