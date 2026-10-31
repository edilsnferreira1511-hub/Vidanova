import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, missingConfig } from './env';

// Usa o projeto Firebase EXISTENTE do XPT (config vinda de variáveis de ambiente).
// Não cria projeto nem segundo mecanismo de autenticação. Analytics não é usado.
export const isFirebaseConfigured = () => missingConfig().filter((m) => m.startsWith('Firebase')).length === 0;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);

function makeAuth() {
  if (Platform.OS === 'web') return getAuth(app);
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app); // já inicializado (ex.: fast refresh)
  }
}

export const auth = makeAuth();
export const db = getFirestore(app);
