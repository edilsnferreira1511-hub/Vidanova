import { ROTULO_STATUS } from './status.js';

// Colunas PADRÃO propostas. A planilha informada estava sem cabeçalhos legíveis;
// confirmar com o responsável antes de ligar o espelho (PLANILHAS.md).
// Mantidas em sincronia com o Code.gs (há um teste que compara os dois).
export const COLUNAS = [
  'ID', 'Data do backup', 'SVC', 'Base (XPT)', 'Rota', 'Contêiner', 'Placa', 'Motorista', 'Pacotes', 'Paradas',
  'Motivo', 'Solicitante', 'Status', 'Decisão', 'Justificativa', 'Desconto cooperado', 'Criado em', 'Atualizado em',
];

export function paraLinha(r) {
  const ultimo = r.historico[r.historico.length - 1];
  return [
    r.id, r.dataBackup, r.svc, r.base, r.rotaNome ?? r.rotaId ?? '', r.containerId ?? '', r.veiculo?.placa ?? '',
    r.motoristaNome ?? '', String(r.qtdPacotes), String(r.qtdParadas), r.motivo, r.solicitante.nome,
    ROTULO_STATUS[r.status], r.decisao?.resultado ?? '', r.decisao?.justificativa ?? '',
    r.decisao?.descontoCooperado ?? '', r.criadoEm, ultimo?.em ?? r.criadoEm,
  ];
}
