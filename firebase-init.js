import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import * as A from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import * as F from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import * as S from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import * as FN from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js';
import { firebaseConfig, REGION } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = A.getAuth(app);
export const db = F.getFirestore(app);
export const storage = S.getStorage(app);
export const functions = FN.getFunctions(app, REGION);
export { A, F, S, FN };
