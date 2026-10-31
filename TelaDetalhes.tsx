import React, { useCallback, useEffect, useState } from 'react';
import { useNav } from './navigation';
import { View } from 'react-native';
import { useProfile } from './AuthContext';
import { cancelRequest, getRequest, moveToAnalysis } from './backupService';
import { canCancel, canDecide, canMoveToAnalysis, canViewRequest } from './access';
import { STATUS_LABEL } from './status';
import type { BackupRequest } from './types';
import { Banner, Body, Card, Empty, GlassButton, GlassHeader, H2, Loading, Muted, Screen, StatusBadge } from './ui';

const Item = ({ k, v }: { k: string; v?: string | number }) => (
  <View><Muted>{k}</Muted><Body>{v === undefined || v === '' ? '—' : String(v)}</Body></View>
);

export default function TelaDetalhes({ id }: { id: string }) {
  const p = useProfile();
  const nav = useNav();
  const [r, setR] = useState<BackupRequest | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setR(await getRequest(String(id))); } catch (e) { setError((e as Error).message); setR(null); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  if (r === undefined) return <Loading />;
  if (!r || !canViewRequest(p, r)) {
    return <Screen><GlassHeader title="Solicitação" />{error && <Banner kind="error">{error}</Banner>}<Empty title="Solicitação não encontrada" hint="Ela não existe ou você não tem acesso à base." /></Screen>;
  }

  return (
    <Screen>
      <GlassHeader title={`${r.svc} · ${r.rotaNome ?? r.rotaId ?? 'Rota'}`} subtitle={`${r.dataBackup} · ${r.base}`} right={<StatusBadge status={r.status} />} />
      {error && <Banner kind="error">{error}</Banner>}
      <Card>
        <H2>Dados da rota</H2>
        <Item k="SVC" v={r.svc} /><Item k="Rota" v={r.rotaNome ?? r.rotaId} /><Item k="Contêiner" v={r.containerId} />
        <Item k="Pacotes" v={r.qtdPacotes} /><Item k="Paradas" v={r.qtdParadas} />
      </Card>
      <Card>
        <H2>Motorista / veículo</H2>
        <Item k="Motorista" v={r.motoristaNome} /><Item k="Placa" v={r.veiculo?.placa} />
        <Item k="Transportadora" v={r.veiculo?.carrierName} /><Item k="ID no QR do veículo" v={r.veiculo?.qrId} />
      </Card>
      <Card><H2>Motivo</H2><Body>{r.motivo}</Body><Muted>Solicitado por {r.solicitante.nome}</Muted></Card>
      {r.decisao && (
        <Card>
          <H2>Decisão: {STATUS_LABEL[r.decisao.resultado]}</H2>
          <Item k="Justificativa" v={r.decisao.justificativa} />
          <Item k="Desconto de cooperado" v={r.decisao.descontoCooperado} />
          <Muted>{r.decisao.porNome} · {r.decisao.em}</Muted>
        </Card>
      )}
      <Card>
        <H2>Histórico</H2>
        {r.historico.map((h, i) => (
          <View key={i}><Body>{STATUS_LABEL[h.status]} · {h.porNome}</Body><Muted>{h.em}{h.observacao ? ` — ${h.observacao}` : ''}</Muted></View>
        ))}
      </Card>
      {canMoveToAnalysis(p, r) && <GlassButton label="Colocar em análise" loading={busy} onPress={() => act(() => moveToAnalysis(p, r))} />}
      {canDecide(p, r) && <GlassButton label="Analisar e decidir" variant="primary" onPress={() => nav.push({ name: 'analise', id: r.id })} />}
      {canCancel(p, r) && <GlassButton label="Cancelar solicitação" variant="danger" loading={busy} onPress={() => act(() => cancelRequest(p, r))} />}
    </Screen>
  );
}
