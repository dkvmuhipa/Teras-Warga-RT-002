
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- KONFIGURASI FIREBASE ---
// Project: TerasWarga (teras-warga)
const firebaseConfig = {
  apiKey: "AIzaSyCeNdStL8oM7KHx8w69-0tJHE_qUDo1CyE",
  authDomain: "teras-warga.firebaseapp.com",
  projectId: "teras-warga",
  storageBucket: "teras-warga.firebasestorage.app",
  messagingSenderId: "710981295516",
  appId: "1:710981295516:web:97bee73b641bf9d247bc59"
};

// Logika Deteksi: Jika projectId masih default/paste, berarti belum disetting
const isPlaceholder = (value: string | undefined) => 
  !value || value.includes("PASTE_") || value.includes("ISI_");

export const isFirebaseConfigured = !isPlaceholder(firebaseConfig.projectId);

if (!isFirebaseConfigured) {
  console.warn("⚠️ Firebase belum dikonfigurasi. Aplikasi berjalan dalam DEMO MODE (Data statis).");
} else {
  console.log("✅ Firebase Terhubung:", firebaseConfig.projectId);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
