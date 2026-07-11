import { initializeApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence, enableIndexedDbPersistence } from "firebase/firestore";
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
  
  // Enable offline persistence for RT offline support
  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
          console.warn("Firestore persistence failed-precondition (multiple tabs).");
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the features required to enable persistence
          enableIndexedDbPersistence(db).catch(innerErr => {
            console.warn("Firestore persistence single-tab fell back and failed:", innerErr);
          });
        }
      });
  }

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
