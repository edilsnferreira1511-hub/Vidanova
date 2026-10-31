import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AppRoute } from './access';

// Navegação simples em estado (sem Expo Router), para manter todos os arquivos numa pasta só.
export type Screen =
  | { name: AppRoute | 'filtros' }
  | { name: 'detalhes'; id: string }
  | { name: 'analise'; id: string };

interface Nav {
  current: Screen;
  canGoBack: boolean;
  push: (s: Screen) => void;
  replace: (s: Screen) => void;
  back: () => void;
  goTab: (tab: AppRoute) => void;
}

const C = createContext<Nav | null>(null);

export function NavProvider({ initial, children }: { initial: AppRoute; children: React.ReactNode }) {
  const [stack, setStack] = useState<Screen[]>([{ name: initial }]);

  const push = useCallback((s: Screen) => setStack((st) => [...st, s]), []);
  const replace = useCallback((s: Screen) => setStack((st) => [...st.slice(0, -1), s]), []);
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), []);
  const goTab = useCallback((tab: AppRoute) => setStack([{ name: tab }]), []);

  const value = useMemo<Nav>(
    () => ({ current: stack[stack.length - 1], canGoBack: stack.length > 1, push, replace, back, goTab }),
    [stack, push, replace, back, goTab],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useNav(): Nav {
  const c = useContext(C);
  if (!c) throw new Error('useNav fora do NavProvider');
  return c;
}
