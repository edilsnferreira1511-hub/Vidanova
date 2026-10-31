import React from 'react';
import { useNav } from './navigation';
import { useProfile } from './AuthContext';
import { useFilters } from './FiltersContext';
import { useRequests } from './useRequests';
import { RequestCard } from './RequestCard';
import { Banner, Empty, GlassButton, GlassHeader, Loading, Muted, Screen } from './ui';

export default function Solicitacoes() {
  const p = useProfile();
  const nav = useNav();
  const { filters } = useFilters();
  const { rows, loading, error, reload } = useRequests(p, filters);
  const active = Object.values(filters).some((v) => (Array.isArray(v) ? v.length : !!v));

  return (
    <Screen>
      <GlassHeader title="Solicitações" subtitle={active ? 'Filtros ativos' : 'Bases autorizadas'} />
      <GlassButton label={active ? 'Filtros (ativos)' : 'Filtros'} onPress={() => nav.push({ name: 'filtros' })} />
      {loading ? <Loading /> : error ? (
        <>
          <Banner kind="error">{error}</Banner>
          <GlassButton label="Tentar de novo" onPress={reload} />
        </>
      ) : rows.length === 0 ? (
        <Empty title="Nenhuma solicitação" hint="Não há registros para os filtros e bases autorizadas." />
      ) : (
        <>
          <Muted>{rows.length} registro(s)</Muted>
          {rows.map((r) => <RequestCard key={r.id} r={r} />)}
        </>
      )}
    </Screen>
  );
}
