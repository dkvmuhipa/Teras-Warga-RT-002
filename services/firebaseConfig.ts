import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseAppletConfig from "../firebase-applet-config.json";

// --- KONFIGURASI FIREBASE ---
// Project: TerasWarga (teras-warga)
const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId
};

// Initialize Firebase
let app: any;
let db: any;
let auth: any;
let messaging: any = null;
let isFirebaseConfigured = false;

try {
  // Using modular imports directly via namespace to avoid export errors
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Messaging only works in browser and if supported
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
      }
    }).catch(err => {
      console.warn("Firebase Messaging support check failed:", err);
    });
  }
  
  isFirebaseConfigured = true;
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { app, db, auth, messaging, isFirebaseConfigured };
