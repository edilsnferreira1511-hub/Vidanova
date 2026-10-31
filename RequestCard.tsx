import React from 'react';
import { View } from 'react-native';
import { useNav } from './navigation';
import { Body, Card, Muted, StatusBadge, row } from './ui';
import type { BackupRequest } from './types';

export function RequestCard({ r }: { r: BackupRequest }) {
  const nav = useNav();
  return (
    <Card onPress={() => nav.push({ name: 'detalhes', id: r.id })}>
      <View style={[row, { justifyContent: 'space-between' }]}>
        <Body style={{ fontWeight: '700' }}>{r.dataBackup} · {r.base}</Body>
        <StatusBadge status={r.status} />
      </View>
      <Muted>SVC {r.svc} · Rota {r.rotaNome ?? r.rotaId ?? '—'}</Muted>
      <Muted>{r.qtdPacotes} pacotes · {r.qtdParadas} paradas · {r.solicitante.nome}</Muted>
    </Card>
  );
}
