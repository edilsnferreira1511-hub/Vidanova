import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authErrorMessage, login as doLogin, logout as doLogout, watchAuth } from './authService';
import { loadProfile } from './profileService';
import { isFirebaseConfigured } from './firebase';
import { missingConfig } from './env';
import type { UserProfile } from './types';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'noProfile'; reason: string } // autenticou, mas sem perfil/cargo autorizado
  | { status: 'ready'; profile: UserProfile };

interface Ctx {
  state: AuthState;
  configMissing: string[];
  signIn: (identifier: string, password: string) => Promise<string | null>; // devolve mensagem de erro
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const configMissing = useMemo(missingConfig, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setState({ status: 'signedOut' });
      return;
    }
    return watchAuth(async (user) => {
      if (!user) return setState({ status: 'signedOut' });
      setState({ status: 'loading' });
      try {
        const profile = await loadProfile(user.uid, user.email ?? undefined);
        if (!profile) return setState({ status: 'noProfile', reason: 'Seu usuário não tem perfil cadastrado no sistema.' });
        if (profile.cargos.length === 0)
          return setState({ status: 'noProfile', reason: 'Seu cargo não tem acesso ao COOPMETRO BACKUP.' });
        setState({ status: 'ready', profile });
      } catch (e) {
        setState({ status: 'noProfile', reason: (e as Error).message || 'Falha ao carregar o perfil.' });
      }
    });
  }, []);

  const signIn = useCallback(async (id: string, pw: string) => {
    try {
      await doLogin(id, pw);
      return null;
    } catch (e) {
      return authErrorMessage(e);
    }
  }, []);

  const value = useMemo(() => ({ state, configMissing, signIn, signOut: doLogout }), [state, configMissing, signIn]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}

/** Perfil garantido; use somente dentro das telas autenticadas. */
export function useProfile(): UserProfile {
  const { state } = useAuth();
  if (state.status !== 'ready') throw new Error('Perfil indisponível');
  return state.profile;
}
