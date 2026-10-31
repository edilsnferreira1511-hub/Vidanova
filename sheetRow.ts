import type { BackupRequest } from './types';
import { STATUS_LABEL } from './status';

// Colunas PADRÃO propostas. A planilha informada estava sem cabeçalhos legíveis;
// confirmar/ajustar com o responsável antes de ligar a escrita (PENDENCIAS.md).
// A primeira coluna (ID) é a chave de upsert usada pelo Apps Script.
export const SHEET_COLUMNS = [
  'ID',
  'Data do backup',
  'SVC',
  'Base (XPT)',
  'Rota',
  'Contêiner',
  'Placa',
  'Motorista',
  'Pacotes',
  'Paradas',
  'Motivo',
  'Solicitante',
  'Status',
  'Decisão',
  'Justificativa',
  'Desconto cooperado',
  'Criado em',
  'Atualizado em',
] as const;

/** Linha da planilha derivada do registro oficial (Firestore). */
export function toSheetRow(r: BackupRequest): string[] {
  const ultimo = r.historico[r.historico.length - 1];
  return [
    r.id,
    r.dataBackup,
    r.svc,
    r.base,
    r.rotaNome ?? r.rotaId ?? '',
    r.containerId ?? '',
    r.veiculo?.placa ?? '',
    r.motoristaNome ?? '',
    String(r.qtdPacotes),
    String(r.qtdParadas),
    r.motivo,
    r.solicitante.nome,
    STATUS_LABEL[r.status],
    r.decisao?.resultado ?? '',
    r.decisao?.justificativa ?? '',
    r.decisao?.descontoCooperado ?? '',
    r.criadoEm,
    ultimo?.em ?? r.criadoEm,
  ];
}
