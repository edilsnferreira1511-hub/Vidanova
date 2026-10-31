import React from 'react';
import { View } from 'react-native';
import { useAuth, useProfile } from './AuthContext';
import { glassIsNative } from './GlassSurface';
import { sheetsMirrorState } from './sheetsService';
import { canManageAccess } from './access';
import { Banner, Body, Card, GlassButton, GlassHeader, H2, Muted, Screen } from './ui';

const ROLE_LABEL = { despachante: 'Despachante', supervisor: 'Supervisor', coordenador_geral: 'Coordenador geral', administrador: 'Administrador' } as const;

export default function Perfil() {
  const p = useProfile();
  const { signOut } = useAuth();
  return (
    <Screen>
      <GlassHeader title={p.nome} subtitle={p.email} />
      <Card>
        <H2>Acesso</H2>
        <View><Muted>Cargos</Muted><Body>{p.cargos.map((c) => ROLE_LABEL[c]).join(', ')}</Body></View>
        <View><Muted>Bases vinculadas</Muted><Body>{p.todasAsBases ? 'Todas (acesso total cadastrado)' : p.bases.join(', ') || 'Nenhuma'}</Body></View>
        <Muted>Cargo e base vêm do cadastro do sistema e não podem ser alterados aqui.</Muted>
      </Card>
      {canManageAccess(p) && (
        <Banner kind="info">Gestão de acessos: definição de regras pendente (ver PENDENCIAS.md).</Banner>
      )}
      <Card>
        <H2>Sistema</H2>
        <Muted>Efeito de vidro: {glassIsNative ? 'nativo (Liquid Glass)' : 'alternativa visual'}</Muted>
        <Muted>Espelho Google Planilhas: {sheetsMirrorState() === 'NAO_CONFIGURADO' ? 'não configurado' : 'ativo'}</Muted>
      </Card>
      <GlassButton label="Sair" variant="danger" onPress={signOut} />
    </Screen>
  );
}
