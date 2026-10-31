// Leitura central de configuração. Nada é inventado: se faltar valor, o app informa o que falta.
const e = process.env;

export const firebaseConfig = {
  apiKey: e.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: e.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: e.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: e.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: e.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: e.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const collections = {
  /** Coleção de usuários/perfis do XPT. DESCONHECIDA até o código do XPT ser fornecido. */
  users: e.EXPO_PUBLIC_XPT_USERS_COLLECTION ?? '',
  backups: e.EXPO_PUBLIC_BACKUP_COLLECTION || 'backup_requests',
};

export function missingConfig(): string[] {
  const miss: string[] = [];
  for (const [k, v] of Object.entries(firebaseConfig)) if (!v) miss.push(`Firebase: ${k}`);
  if (!collections.users) miss.push('Coleção de usuários do XPT (EXPO_PUBLIC_XPT_USERS_COLLECTION)');
  return miss;
}
