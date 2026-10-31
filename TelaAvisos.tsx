import React, { useMemo } from 'react';
import { useNav } from './navigation';
import { useProfile } from './AuthContext';
import { useRequests } from './useRequests';
import { hasRole } from './access';
import { STATUS_LABEL } from './status';
import { Banner, Body, Card, Empty, GlassHeader, Loading, Muted, Screen } from './ui';

// Sem coleção de notificações (não definida). Os avisos são DERIVADOS do histórico das solicitações visíveis.
// Push/notificações em tempo real ficam para uma etapa futura (depende de FCM e autorização).
export default function Notificacoes() {
  const p = useProfile();
  const nav = useNav();
  const { rows, loading, error } = useRequests(p, {});

  const items = useMemo(() => {
    const reviewer = hasRole(p, 'supervisor') || hasRole(p, 'coordenador_geral');
    return rows.flatMap((r) => {
      const last = r.historico[r.historico.length - 1];
      if (!last) return [];
      if (reviewer && (r.status === 'PENDENTE' || r.status === 'EM_ANALISE'))
        return [{ id: r.id, em: last.em, text: `${r.base} · ${r.svc}: aguardando decisão (${STATUS_LABEL[r.status]})` }];
      if (!reviewer && r.solicitante.uid === p.uid && last.porUid !== p.uid)
        return [{ id: r.id, em: last.em, text: `Sua solicitação de ${r.dataBackup} (${r.svc}) foi ${STATUS_LABEL[r.status].toLowerCase()}` }];
      return [];
    }).sort((a, b) => b.em.localeCompare(a.em));
  }, [rows, p]);

  return (
    <Screen>
      <GlassHeader title="Avisos" subtitle="Atualizações das suas solicitações" />
      {loading ? <Loading /> : error ? <Banner kind="error">{error}</Banner> : items.length === 0 ? (
        <Empty title="Sem avisos" hint="Nada novo por enquanto." />
      ) : items.map((n) => (
        <Card key={n.id + n.em} onPress={() => nav.push({ name: 'detalhes', id: n.id })}>
          <Body>{n.text}</Body><Muted>{n.em}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
