import React from 'react';
import { useNav } from './navigation';
import { View } from 'react-native';
import { useProfile } from './AuthContext';
import { useFilters } from './FiltersContext';
import { useRequests } from './useRequests';
import { RequestCard } from './RequestCard';
import { STATUS_LABEL } from './status';
import { statusColor } from './theme';
import type { RequestStatus } from './types';
import { Banner, Body, Card, Empty, GlassButton, GlassHeader, H2, Loading, Muted, Screen, row } from './ui';

const ORDER: RequestStatus[] = ['PENDENTE', 'EM_ANALISE', 'APROVADO', 'RECUSADO'];

export default function Painel() {
  const p = useProfile();
  const nav = useNav();
  const { filters } = useFilters();
  const { rows, loading, error, reload } = useRequests(p, filters);
  const pend = rows.filter((r) => r.status === 'PENDENTE' || r.status === 'EM_ANALISE');

  return (
    <Screen>
      <GlassHeader title="Painel" subtitle="Bases autorizadas para o seu perfil" />
      <GlassButton label="Filtros por base, período e status" onPress={() => nav.push({ name: 'filtros' })} />
      {loading ? <Loading /> : error ? (
        <><Banner kind="error">{error}</Banner><GlassButton label="Tentar de novo" onPress={reload} /></>
      ) : (
        <>
          <View style={[row, { flexWrap: 'wrap' }]}>
            {ORDER.map((s) => (
              <Card key={s} style={{ flexBasis: '47%', flexGrow: 1 }}>
                <Body style={{ fontSize: 30, fontWeight: '800', color: statusColor[s] }}>{rows.filter((r) => r.status === s).length}</Body>
                <Muted>{STATUS_LABEL[s]}</Muted>
              </Card>
            ))}
          </View>
          <H2>Pendências</H2>
          {pend.length === 0 ? <Empty title="Nada pendente" /> : pend.map((r) => <RequestCard key={r.id} r={r} />)}
        </>
      )}
    </Screen>
  );
}
