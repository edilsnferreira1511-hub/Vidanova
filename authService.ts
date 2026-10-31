import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';

// Somente LOGIN com contas já existentes. Não há cadastro, troca de senha nem criação de conta aqui.
// Senhas nunca são guardadas pelo app (o SDK mantém apenas a sessão/token).

/** CONFIRMAR: o XPT autentica por e-mail+senha ou por "usuário" convertido em e-mail? */
export function toAuthEmail(identifier: string): string {
  const id = identifier.trim();
  if (id.includes('@')) return id;
  throw new Error(
    'Informe o e-mail de acesso. A conversão de "usuário" para e-mail depende de como o XPT autentica (a confirmar).'
  );
}

export async function login(identifier: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, toAuthEmail(identifier), password);
  return cred.user;
}

export const logout = () => signOut(auth);

export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Usuário ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique a internet.';
    default:
      return (err as Error)?.message || 'Não foi possível entrar.';
  }
}
