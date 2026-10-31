import test from 'node:test';
import assert from 'node:assert/strict';
import type { BackupRequest, UserProfile } from './types.ts';
import {
  allowedRoutes,
  canAccessBase,
  canCancel,
  canCreateRequest,
  canDecide,
  nextStatuses,
  viewableBases,
} from './access.ts';
import { isValidTransition } from './status.ts';
import { toSheetRow, SHEET_COLUMNS } from './sheetRow.ts';

const user = (over: Partial<UserProfile>): UserProfile => ({
  uid: 'u1',
  nome: 'Teste',
  cargos: [],
  bases: [],
  ...over,
});

const req = (over: Partial<BackupRequest> = {}): BackupRequest => ({
  id: 'r1',
  dataBackup: '2026-10-31',
  svc: 'SGO1',
  base: 'BASE_A',
  qtdPacotes: 10,
  qtdParadas: 3,
  motivo: 'teste',
  solicitante: { uid: 'u-disp', nome: 'Disp' },
  status: 'PENDENTE',
  criadoEm: '2026-10-31T12:00:00.000Z',
  historico: [],
  ...over,
});

test('mesmo cargo não implica acesso a todas as bases', () => {
  const a = user({ cargos: ['coordenador_geral'], bases: ['BASE_A'] });
  assert.equal(canAccessBase(a, 'BASE_A'), true);
  assert.equal(canAccessBase(a, 'BASE_B'), false);
  assert.deepEqual(viewableBases(a), ['BASE_A']);
  assert.equal(viewableBases(user({ todasAsBases: true })), 'ALL');
});

test('despachante só cria na própria base', () => {
  const d = user({ cargos: ['despachante'], bases: ['BASE_A'] });
  assert.equal(canCreateRequest(d, 'BASE_A'), true);
  assert.equal(canCreateRequest(d, 'BASE_B'), false);
  assert.equal(canCreateRequest(user({ cargos: ['supervisor'], bases: ['BASE_A'] }), 'BASE_A'), false);
});

test('despachante não decide; coordenador decide, exceto a própria solicitação', () => {
  const d = user({ uid: 'u-disp', cargos: ['despachante'], bases: ['BASE_A'] });
  const c = user({ uid: 'u-coord', cargos: ['coordenador_geral'], bases: ['BASE_A'] });
  assert.equal(canDecide(d, req()), false);
  assert.equal(canDecide(c, req()), true);
  assert.equal(canDecide(c, req({ solicitante: { uid: 'u-coord', nome: 'x' } })), false);
  assert.equal(canDecide(c, req({ base: 'BASE_B' })), false);
  assert.equal(canDecide(c, req({ status: 'APROVADO' })), false);
});

test('coordenador que também é despachante não aprova o próprio pedido', () => {
  const both = user({ uid: 'u-x', cargos: ['despachante', 'coordenador_geral'], bases: ['BASE_A'] });
  assert.equal(canDecide(both, req({ solicitante: { uid: 'u-x', nome: 'x' } })), false);
});

test('cancelamento só pelo solicitante e só pendente', () => {
  const d = user({ uid: 'u-disp', cargos: ['despachante'], bases: ['BASE_A'] });
  assert.equal(canCancel(d, req()), true);
  assert.equal(canCancel(d, req({ status: 'EM_ANALISE' })), false);
  assert.equal(canCancel(user({ uid: 'outro' }), req()), false);
});

test('nextStatuses e rotas por perfil', () => {
  const s = user({ cargos: ['supervisor'], bases: ['BASE_A'] });
  assert.deepEqual(nextStatuses(s, req()), ['EM_ANALISE']);
  assert.deepEqual(allowedRoutes(user({ cargos: ['despachante'] })), [
    'inicio', 'nova', 'solicitacoes', 'notificacoes', 'perfil',
  ]);
  assert.deepEqual(allowedRoutes(user({})), ['perfil']);
});

test('transições de status', () => {
  assert.equal(isValidTransition('PENDENTE', 'APROVADO'), true);
  assert.equal(isValidTransition('APROVADO', 'RECUSADO'), false);
});

test('linha da planilha tem o mesmo número de colunas do cabeçalho', () => {
  assert.equal(toSheetRow(req()).length, SHEET_COLUMNS.length);
});
