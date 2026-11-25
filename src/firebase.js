import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
// Storage se inicia solo cuando se usa: así la app funciona aunque Storage aún no esté activado.
export const getStorageSvc = () => getStorage(app);
const auth = getAuth(app);

// Igual que el ERP: sesión anónima en segundo plano (las reglas piden request.auth != null).
// Todas las lecturas/escrituras esperan a esta promesa.
export const authReady = signInAnonymously(auth).catch((e) => {
  console.error("Error de autenticación silenciosa:", e);
});
