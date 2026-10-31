import React, { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './AuthContext';
import { FiltersProvider } from './FiltersContext';
import { NavProvider, useNav } from './navigation';
import { allowedRoutes, type AppRoute } from './access';
import type { UserProfile } from './types';
import { GlassTabBar } from './GlassTabBar';
import { Banner, GlassButton, H1, Loading, Screen } from './ui';
import { colors } from './theme';
import TelaLogin from './TelaLogin';
import TelaInicio from './TelaInicio';
import TelaNova from './TelaNova';
import TelaSolicitacoes from './TelaSolicitacoes';
import TelaDetalhes from './TelaDetalhes';
import TelaAnalise from './TelaAnalise';
import TelaPainel from './TelaPainel';
import TelaAvisos from './TelaAvisos';
import TelaFiltros from './TelaFiltros';
import TelaPerfil from './TelaPerfil';

function CurrentScreen({ allowed }: { allowed: AppRoute[] }) {
  const { current } = useNav();
  switch (current.name) {
    case 'detalhes': return <TelaDetalhes id={current.id} />;
    case 'analise': return <TelaAnalise id={current.id} />;
    case 'filtros': return <TelaFiltros />;
  }
  // Aba não liberada para o perfil => cai no perfil (a segurança real está nas regras do Firestore).
  if (!allowed.includes(current.name)) return <TelaPerfil />;
  switch (current.name) {
    case 'inicio': return <TelaInicio />;
    case 'nova': return <TelaNova />;
    case 'solicitacoes': return <TelaSolicitacoes />;
    case 'painel': return <TelaPainel />;
    case 'notificacoes': return <TelaAvisos />;
    default: return <TelaPerfil />;
  }
}

function Shell({ profile }: { profile: UserProfile }) {
  const nav = useNav();
  const allowed = allowedRoutes(profile);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nav.canGoBack) { nav.back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [nav]);

  const n = nav.current.name;
  const active: AppRoute = n === 'detalhes' || n === 'analise' ? 'solicitacoes' : n === 'filtros' ? 'solicitacoes' : n;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <CurrentScreen allowed={allowed} />
      {n !== 'filtros' && <GlassTabBar routes={allowed} active={active} onSelect={nav.goTab} />}
    </View>
  );
}

function Gate() {
  const { state, signOut } = useAuth();
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'signedOut') return <TelaLogin />;
  if (state.status === 'noProfile') {
    return (
      <Screen bottomBar={false}>
        <H1>Sem acesso</H1>
        <Banner kind="error">{state.reason}</Banner>
        <GlassButton label="Sair" onPress={signOut} />
      </Screen>
    );
  }
  const allowed = allowedRoutes(state.profile);
  const initial: AppRoute = allowed.includes('inicio') ? 'inicio' : allowed.includes('painel') ? 'painel' : 'perfil';
  return (
    <NavProvider key={state.profile.uid} initial={initial}>
      <Shell profile={state.profile} />
    </NavProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FiltersProvider>
          <StatusBar style="light" />
          <Gate />
        </FiltersProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
