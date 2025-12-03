
import { db, isFirebaseConfigured } from "./firebaseConfig";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  getDocs,
  setDoc
} from "firebase/firestore";

// Collection References
const HOUSES_COL = "houses";
const ANNOUNCEMENTS_COL = "announcements";
const CASHFLOW_COL = "cashFlow";
const OFFICIALS_COL = "officials";
const RONDA_COL = "ronda";

// --- UTILS ---
// Firestore throws error if a field is undefined. We must sanitize it.
const sanitize = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
};

// --- GENERIC SUBSCRIBE FUNCTION ---
export const subscribeToCollection = (colName: string, callback: (data: any[]) => void) => {
  if (!isFirebaseConfigured) return () => {}; // Do nothing in Demo Mode

  const q = query(collection(db, colName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to ${colName}:`, error);
  });
};

// --- CRUD OPERATIONS ---

// 1. HOUSES (WARGA)
export const addHouse = async (houseData: any) => {
  if (!isFirebaseConfigured) return;
  try {
    const cleanData = sanitize(houseData);
    if (cleanData.id) {
       await setDoc(doc(db, HOUSES_COL, cleanData.id), cleanData);
    } else {
       await addDoc(collection(db, HOUSES_COL), cleanData);
    }
  } catch (e) {
    console.error("Error adding house: ", e);
  }
};

export const updateHouseStatus = async (id: string, updates: any) => {
    if (!isFirebaseConfigured) return;
    try {
      const houseRef = doc(db, HOUSES_COL, id);
      await updateDoc(houseRef, sanitize(updates));
    } catch (e) {
      console.error("Error updating house:", e);
    }
};

// 2. ANNOUNCEMENTS
export const addAnnouncementToDb = async (announcement: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan ke database."); return; }
  try {
    const { id, ...data } = announcement; 
    await addDoc(collection(db, ANNOUNCEMENTS_COL), sanitize(data));
  } catch (e) {
    console.error("Error adding announcement:", e);
  }
};

export const deleteAnnouncementFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, ANNOUNCEMENTS_COL, id));
  } catch (e) {
    console.error("Error deleting announcement:", e);
  }
};

// 3. CASHFLOW (KEUANGAN)
export const addTransactionToDb = async (transaction: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan ke database."); return; }
  try {
    const { id, ...data } = transaction;
    await addDoc(collection(db, CASHFLOW_COL), sanitize(data));
  } catch (e) {
    console.error("Error adding transaction:", e);
  }
};

export const deleteTransactionFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, CASHFLOW_COL, id));
  } catch (e) {
    console.error("Error deleting transaction:", e);
  }
};

// 4. OFFICIALS (PENGURUS)
export const addOfficialToDb = async (official: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan ke database."); return; }
  try {
    const { id, ...data } = official;
    await addDoc(collection(db, OFFICIALS_COL), sanitize(data));
  } catch (e) {
    console.error("Error adding official:", e);
  }
};

export const updateOfficialInDb = async (id: string, updates: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan ke database."); return; }
  try {
    await updateDoc(doc(db, OFFICIALS_COL, id), sanitize(updates));
  } catch (e) {
    console.error("Error updating official:", e);
  }
};

export const deleteOfficialFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, OFFICIALS_COL, id));
  } catch (e) {
    console.error("Error deleting official:", e);
  }
};

// 5. SEEDING (Digunakan sekali untuk mengisi database awal jika kosong)
export const seedDatabase = async (initialData: any) => {
    if (!isFirebaseConfigured) return; // Skip seeding in demo mode

    try {
      const housesSnap = await getDocs(collection(db, HOUSES_COL));
      if (housesSnap.empty && initialData.houses.length > 0) {
          console.log("Seeding Houses...");
          for (const h of initialData.houses) {
            await addHouse(h);
          }
      }

      const officialsSnap = await getDocs(collection(db, OFFICIALS_COL));
      if (officialsSnap.empty && initialData.officials.length > 0) {
          console.log("Seeding Officials...");
          for (const o of initialData.officials) {
            await addOfficialToDb(o);
          }
      }
      
      const rondaSnap = await getDocs(collection(db, RONDA_COL));
      if (rondaSnap.empty && initialData.ronda.length > 0) {
          console.log("Seeding Ronda...");
          for (const r of initialData.ronda) {
            await addDoc(collection(db, RONDA_COL), sanitize(r));
          }
      }
    } catch (e) {
      console.error("Seeding failed (Check your Firebase Config / Permission):", e);
    }
};
