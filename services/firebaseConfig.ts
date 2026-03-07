import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- KONFIGURASI FIREBASE ---
// Project: TerasWarga (teras-warga)
const firebaseConfig = {
  apiKey: "AIzaSyCeNdStL8oM7KHx8w69-0tJHE_qUDo1CyE",
  authDomain: "teras-warga.firebaseapp.com",
  projectId: "teras-warga",
  storageBucket: "teras-warga.firebasestorage.app",
  messagingSenderId: "710981295516",
  appId: "1:710981295516:web:97bee73b"
};

// Initialize Firebase
let app: any;
let db: any;
let auth: any;
let storage: any;
let isFirebaseConfigured = false;

try {
  // Using modular imports directly via namespace to avoid export errors
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  isFirebaseConfigured = true;
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { app, db, auth, storage, isFirebaseConfigured };