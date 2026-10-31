// Modelo de domínio do COOPMETRO BACKUP.
// Nomes de campos em camelCase/português. AJUSTAR ao padrão real do XPT
// quando o código-fonte/estrutura do Firestore for fornecido (ver PENDENCIAS.md).

export type Role = 'despachante' | 'supervisor' | 'coordenador_geral' | 'administrador';

export type RequestStatus = 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'RECUSADO' | 'CANCELADO';

/** Perfil já normalizado a partir do cadastro existente no Firebase do XPT. */
export interface UserProfile {
  uid: string;
  nome: string;
  email?: string;
  cargos: Role[];
  /** Bases (XPT) às quais ESTE usuário está efetivamente vinculado/autorizado. */
  bases: string[];
  /** Só true se o cadastro conceder acesso explícito a todas as bases. Nunca presumido. */
  todasAsBases?: boolean;
}

export interface RouteQr {
  kind: 'route';
  /** Valores preservados exatamente como recebidos (ids numéricos viram string com o mesmo texto). */
  containerId: string;
  svc: string; // facility_id
  rota: string; // assignment
}

export interface VehicleQr {
  kind: 'vehicle';
  /** "id" do QR. NÃO confirmado como identificador do motorista. */
  qrId: string;
  carrierId: string;
  carrierName: string;
  placa: string;
  tipoVeiculo?: string;
  tipoVeiculoId?: string;
  trackingProviderIds: string[];
}

export type QrParseResult =
  | { ok: true; data: RouteQr | VehicleQr; warnings: string[]; raw: string }
  | { ok: false; errors: string[]; raw: string };

export interface StatusHistoryEntry {
  status: RequestStatus;
  porUid: string;
  porNome: string;
  /** ISO 8601 (o servidor deve gravar o horário oficial; ver backupService). */
  em: string;
  observacao?: string;
}

export type DescontoCooperado = 'NAO_DEFINIDO' | 'SIM' | 'NAO';

export interface BackupRequest {
  id: string;
  dataBackup: string; // YYYY-MM-DD
  svc: string;
  base: string; // base solicitante (XPT)
  rotaId?: string;
  rotaNome?: string;
  containerId?: string;
  veiculo?: Omit<VehicleQr, 'kind'>;
  motoristaNome?: string;
  qtdPacotes: number;
  qtdParadas: number;
  motivo: string;
  execucao?: { observacoes?: string; iniciadoEm?: string; concluidoEm?: string };
  solicitante: { uid: string; nome: string };
  status: RequestStatus;
  decisao?: {
    resultado: 'APROVADO' | 'RECUSADO';
    justificativa: string;
    descontoCooperado: DescontoCooperado;
    porUid: string;
    porNome: string;
    em: string;
  };
  criadoEm: string;
  historico: StatusHistoryEntry[];
}
