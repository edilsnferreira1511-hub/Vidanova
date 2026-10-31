/**
 * ESPELHO FIRESTORE -> GOOGLE PLANILHAS (Google Apps Script). NÃO TESTADO.
 *
 * Modelo: o Firebase é a fonte oficial. Este script (rodando FORA do app, com gatilho de tempo) LÊ
 * a coleção `backup_requests` via API REST do Firestore e faz UPSERT de linhas (chave = coluna ID).
 * Nenhuma credencial vai para o aplicativo. Veja PLANILHAS.md para permissões e passo a passo.
 *
 * Propriedades do script (Configurações do projeto > Propriedades do script) — NUNCA no código:
 *   SA_CLIENT_EMAIL, SA_PRIVATE_KEY   (conta de serviço com leitura no Firestore)
 */
const PROJECT_ID = 'coopmetro-xpt';
const COLLECTION = 'backup_requests';
const SPREADSHEET_ID = '1BNPI9u4uN_xu88zoccJbgu5-SAnYatqhn_52gZlgxwI';
const SHEET_NAME = 'Página1';

// Mantido em sincronia com sheetRow.ts (há um teste que compara os dois).
const COLUMNS = ['ID', 'Data do backup', 'SVC', 'Base (XPT)', 'Rota', 'Contêiner', 'Placa', 'Motorista', 'Pacotes', 'Paradas', 'Motivo', 'Solicitante', 'Status', 'Decisão', 'Justificativa', 'Desconto cooperado', 'Criado em', 'Atualizado em'];

const STATUS_LABEL = { PENDENTE: 'Pendente', EM_ANALISE: 'Em análise', APROVADO: 'Aprovado', RECUSADO: 'Recusado', CANCELADO: 'Cancelado' };

function syncAll() {
  const docs = fetchAllRequests_();
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  ensureHeader_(sheet);
  const last = sheet.getLastRow();
  const ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const index = {};
  ids.forEach(function (id, i) { index[id] = i + 2; });

  const toAppend = [];
  docs.forEach(function (d) {
    const row = toRow_(d);
    if (index[d.id]) sheet.getRange(index[d.id], 1, 1, COLUMNS.length).setValues([row]);
    else toAppend.push(row);
  });
  if (toAppend.length) sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, COLUMNS.length).setValues(toAppend);
  Logger.log('Sincronizado: %s atualizados/existentes, %s novos', docs.length - toAppend.length, toAppend.length);
}

function ensureHeader_(sheet) {
  const cur = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  if (cur.join('|') !== COLUMNS.join('|')) sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
}

function toRow_(r) {
  const hist = r.historico || [];
  const last = hist.length ? hist[hist.length - 1] : null;
  const dec = r.decisao || {};
  const veic = r.veiculo || {};
  return [
    r.id, r.dataBackup || '', r.svc || '', r.base || '', r.rotaNome || r.rotaId || '', r.containerId || '',
    veic.placa || '', r.motoristaNome || '', String(r.qtdPacotes), String(r.qtdParadas), r.motivo || '',
    (r.solicitante || {}).nome || '', STATUS_LABEL[r.status] || r.status, dec.resultado || '',
    dec.justificativa || '', dec.descontoCooperado || '', r.criadoEm || '', (last && last.em) || r.criadoEm || '',
  ];
}

function fetchAllRequests_() {
  const token = getAccessToken_();
  const base = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/' + COLLECTION;
  const out = [];
  let pageToken = '';
  do {
    const url = base + '?pageSize=300' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Firestore ' + res.getResponseCode() + ': ' + res.getContentText());
    const body = JSON.parse(res.getContentText());
    (body.documents || []).forEach(function (d) {
      const o = fromFields_(d.fields || {});
      o.id = d.name.split('/').pop();
      out.push(o);
    });
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return out;
}

function fromValue_(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue_);
  if ('mapValue' in v) return fromFields_(v.mapValue.fields || {});
  return null;
}
function fromFields_(f) { const o = {}; Object.keys(f).forEach(function (k) { o[k] = fromValue_(f[k]); }); return o; }

function getAccessToken_() {
  const props = PropertiesService.getScriptProperties();
  const email = props.getProperty('SA_CLIENT_EMAIL');
  const key = (props.getProperty('SA_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Defina SA_CLIENT_EMAIL e SA_PRIVATE_KEY nas propriedades do script.');
  const now = Math.floor(Date.now() / 1000);
  const header = b64_(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64_(JSON.stringify({
    iss: email, scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(header + '.' + claim, key));
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: header + '.' + claim + '.' + sig },
  });
  if (res.getResponseCode() !== 200) throw new Error('Token ' + res.getResponseCode() + ': ' + res.getContentText());
  return JSON.parse(res.getContentText()).access_token;
}
function b64_(s) { return Utilities.base64EncodeWebSafe(s).replace(/=+$/, ''); }

/** Cria o gatilho de tempo (a cada 5 min). Executar uma vez, manualmente, após testar syncAll. */
function installTrigger() {
  ScriptApp.newTrigger('syncAll').timeBased().everyMinutes(5).create();
}
