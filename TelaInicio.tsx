import React from 'react';
import { useNav } from './navigation';
import { useProfile } from './AuthContext';
import { useFilters } from './FiltersContext';
import { useRequests } from './useRequests';
import { Banner, Body, Card, GlassButton, GlassHeader, H2, Loading, Muted, Screen } from './ui';

export default function Home() {
  const p = useProfile();
  const nav = useNav();
  const { filters } = useFilters();
  const { rows, loading, error } = useRequests(p, filters);

  const pend = rows.filter((r) => r.status === 'PENDENTE' || r.status === 'EM_ANALISE').length;

  return (
    <Screen>
      <GlassHeader title={`Olá, ${p.nome.split(' ')[0]}`} subtitle={p.bases.join(' · ') || 'Sem base vinculada'} />
      {p.bases.length === 0 && <Banner kind="warning">Seu usuário não tem base vinculada. Fale com o administrador.</Banner>}
      <GlassButton label="Nova solicitação de backup" variant="primary" onPress={() => nav.push({ name: 'nova' })} />
      <GlassButton label="Ver solicitações da minha base" onPress={() => nav.push({ name: 'solicitacoes' })} />
      <Card>
        <H2>Em andamento</H2>
        {loading ? <Loading /> : error ? <Banner kind="error">{error}</Banner> : (
          <>
            <Body style={{ fontSize: 32, fontWeight: '800' }}>{pend}</Body>
            <Muted>solicitações aguardando decisão</Muted>
          </>
        )}
      </Card>
    </Screen>
  );
}
