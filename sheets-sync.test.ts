import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SHEET_COLUMNS } from './sheetRow.ts';

// Guarda contra divergência entre o cabeçalho do app e o do Apps Script.
test('colunas do Code.gs == SHEET_COLUMNS', () => {
  const src = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
  const m = src.match(/const COLUMNS = (\[.*?\]);/s);
  assert.ok(m, 'COLUMNS não encontrado no Code.gs');
  const cols = JSON.parse(m![1].replace(/'/g, '"'));
  assert.deepEqual(cols, [...SHEET_COLUMNS]);
});

test('Code.gs não contém credenciais embutidas', () => {
  const src = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
  assert.equal(/BEGIN PRIVATE KEY|AIza[0-9A-Za-z_-]{20,}/.test(src), false);
});
