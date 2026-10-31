import React, { useEffect, useState } from 'react';
import { useNav } from './navigation';
import { View } from 'react-native';
import { useProfile } from './AuthContext';
import { decide, getRequest } from './backupService';
import { canDecide } from './access';
import type { BackupRequest, DescontoCooperado } from './types';
import { Banner, Body, Card, Empty, Field, FilterChip, GlassButton, GlassHeader, H2, Label, Loading, Muted, Screen, wrap } from './ui';

export default function TelaAnalise({ id }: { id: string }) {
  const p = useProfile();
  const nav = useNav();
  const [r, setR] = useState<BackupRequest | null | undefined>(undefined);
  const [resultado, setResultado] = useState<'APROVADO' | 'RECUSADO' | null>(null);
  const [just, setJust] = useState('');
  const [desc, setDesc] = useState<DescontoCooperado>('NAO_DEFINIDO');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getRequest(String(id)).then(setR).catch((e) => { setError(e.message); setR(null); }); }, [id]);

  if (r === undefined) return <Loading />;
  if (!r || !canDecide(p, r)) {
    return <Screen><GlassHeader title="Análise" /><Empty title="Sem permissão para decidir" hint="Apenas o coordenador geral decide, nas bases autorizadas, e nunca sobre o próprio pedido." /></Screen>;
  }

  const submit = async () => {
    setError(null);
    if (!resultado) return setError('Escolha aprovar ou recusar.');
    if (!just.trim()) return setError('A justificativa é obrigatória.');
    if (desc === 'NAO_DEFINIDO') return setError('Registre a decisão sobre desconto de cooperado (sim ou não).');
    setBusy(true);
    try {
      await decide(p, r, { resultado, justificativa: just.trim(), descontoCooperado: desc });
      nav.replace({ name: 'detalhes', id: r.id });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <GlassHeader title="Análise e aprovação" subtitle={`${r.svc} · ${r.base} · ${r.dataBackup}`} />
      <Card>
        <H2>Resumo</H2>
        <Body>Rota {r.rotaNome ?? r.rotaId ?? '—'} · Contêiner {r.containerId ?? '—'}</Body>
        <Body>{r.qtdPacotes} pacotes · {r.qtdParadas} paradas</Body>
        <Muted>Motivo: {r.motivo}</Muted>
        <Muted>Solicitante: {r.solicitante.nome}</Muted>
      </Card>
      <Label>Decisão</Label>
      <View style={wrap}>
        <FilterChip label="Aprovar" active={resultado === 'APROVADO'} onPress={() => setResultado('APROVADO')} />
        <FilterChip label="Recusar" active={resultado === 'RECUSADO'} onPress={() => setResultado('RECUSADO')} />
      </View>
      <Field label="Justificativa" value={just} onChangeText={setJust} multiline />
      <Label>Desconto de cooperado</Label>
      <View style={wrap}>
        <FilterChip label="Haverá desconto" active={desc === 'SIM'} onPress={() => setDesc('SIM')} />
        <FilterChip label="Sem desconto" active={desc === 'NAO'} onPress={() => setDesc('NAO')} />
      </View>
      {error && <Banner kind="error">{error}</Banner>}
      <GlassButton label="Confirmar decisão" variant={resultado === 'RECUSADO' ? 'danger' : 'primary'} loading={busy} onPress={submit} />
    </Screen>
  );
}
