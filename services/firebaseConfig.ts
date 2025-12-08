import { initializeApp as _initializeApp } from "firebase/app";
import * as firebaseApp from "firebase/app";

import { getFirestore as _getFirestore } from "firebase/firestore";
import * as firebaseFirestore from "firebase/firestore";

import { getAuth as _getAuth } from "firebase/auth";
import * as firebaseAuth from "firebase/auth";

// Use destructuring from namespace imports to ensure compatibility
const { initializeApp } = firebaseApp;
const { getFirestore } = firebaseFirestore;
const { getAuth } = firebaseAuth;

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

// Mode Produksi Aktif
export const isFirebaseConfigured = true;

console.log("✅ Aplikasi Online: Terhubung ke", firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);