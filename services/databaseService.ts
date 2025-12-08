import { db, auth, isFirebaseConfigured } from "./firebaseConfig";
import * as Firestore from "firebase/firestore";
import * as Auth from "firebase/auth";

const { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  getDocs,
  setDoc,
  writeBatch
} = Firestore;

const { signInWithEmailAndPassword, signOut } = Auth;

// Collection References
const HOUSES_COL = "houses";
const ANNOUNCEMENTS_COL = "announcements";
const CASHFLOW_COL = "cashFlow";
const OFFICIALS_COL = "officials";
const RONDA_COL = "ronda";
const REPORTS_COL = "reports"; 
const LETTERS_COL = "letters"; 
const INVENTORY_COL = "inventory";
const UMKM_COL = "umkm"; 

// --- AUTH SERVICES ---
export const loginAdmin = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutAdmin = () => {
  return signOut(auth);
};

// --- UTILS ---

const deepSanitize = (data: any, seen = new WeakSet()): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data;
  }
  if (seen.has(data)) {
    return null;
  }
  seen.add(data);
  if (Array.isArray(data)) {
    return data.map(item => deepSanitize(item, seen));
  }
  if (data.nodeType || (data.nativeEvent && data.target)) {
    return undefined;
  }
  const clean: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && typeof value !== 'function') {
      clean[key] = deepSanitize(value, seen);
    }
  });
  return clean;
};

// --- GENERIC SUBSCRIBE ---
export const subscribeToCollection = (colName: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, colName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to ${colName}:`, error);
  });
};

// --- 1. HOUSES (WARGA) ---
export const addHouse = async (houseData: any) => {
  try {
    const cleanData = deepSanitize(houseData);
    if (!cleanData) return;

    if (cleanData.id) {
       await setDoc(doc(db, HOUSES_COL, cleanData.id), cleanData);
    } else {
       await addDoc(collection(db, HOUSES_COL), cleanData);
    }
  } catch (e) { console.error("Error adding house: ", e); }
};

export const updateHouseData = async (id: string, updates: any) => {
    try {
      const houseRef = doc(db, HOUSES_COL, id);
      await updateDoc(houseRef, deepSanitize(updates));
    } catch (e) { console.error("Error updating house:", e); }
};

export const deleteHouseFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, HOUSES_COL, id)); } catch (e) { console.error("Error deleting house:", e); }
};

export const batchUpdateHouses = async (housesData: any[]) => {
  try {
    console.log(`Mulai import ${housesData.length} data warga...`);
    const MAX_BATCH_SIZE = 400; 
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    for (const house of housesData) {
       const cleanData = deepSanitize(house);
       if (!cleanData || !cleanData.id) continue;
       
       const ref = doc(db, HOUSES_COL, cleanData.id);
       batch.set(ref, cleanData, { merge: true });
       
       operationCount++;
       if (operationCount >= MAX_BATCH_SIZE) await commitBatch();
    }

    if (operationCount > 0) {
      await batch.commit();
    }
    console.log("Import data warga selesai.");
    return true;
  } catch (e) {
    console.error("Gagal melakukan batch update:", e);
    throw e;
  }
};

export const resetHouseData = async (newHouses: any[]) => {
  try {
    console.log("Mulai migrasi data warga...");
    const snapshot = await getDocs(collection(db, HOUSES_COL));
    
    const MAX_BATCH_SIZE = 400; 
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;
      if (operationCount >= MAX_BATCH_SIZE) await commitBatch();
    }

    for (const house of newHouses) {
       const cleanData = deepSanitize(house);
       if (!cleanData) continue;
       
       const ref = doc(db, HOUSES_COL, house.id); 
       batch.set(ref, cleanData);
       
       operationCount++;
       if (operationCount >= MAX_BATCH_SIZE) await commitBatch();
    }

    if (operationCount > 0) {
      await batch.commit();
    }
    console.log("Migrasi data warga selesai.");
  } catch (e) {
    console.error("Gagal melakukan reset data:", e);
    throw e;
  }
};

// --- 2. ANNOUNCEMENTS ---
export const addAnnouncementToDb = async (announcement: any) => {
  try {
    const { id, ...data } = announcement; 
    await addDoc(collection(db, ANNOUNCEMENTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding announcement:", e); }
};

export const deleteAnnouncementFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, ANNOUNCEMENTS_COL, id)); } catch (e) { console.error("Error deleting announcement:", e); }
};

// --- 3. CASHFLOW ---
export const addTransactionToDb = async (transaction: any) => {
  try {
    const { id, ...data } = transaction;
    await addDoc(collection(db, CASHFLOW_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding transaction:", e); }
};

export const updateTransactionInDb = async (id: string, updates: any) => {
  try { await updateDoc(doc(db, CASHFLOW_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating transaction:", e); }
};

export const deleteTransactionFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, CASHFLOW_COL, id)); } catch (e) { console.error("Error deleting transaction:", e); }
};

// --- 4. OFFICIALS ---
export const addOfficialToDb = async (official: any) => {
  try {
    const { id, ...data } = official;
    await addDoc(collection(db, OFFICIALS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding official:", e); }
};

export const updateOfficialInDb = async (id: string, updates: any) => {
  try { await updateDoc(doc(db, OFFICIALS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating official:", e); }
};

export const deleteOfficialFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, OFFICIALS_COL, id)); } catch (e) { console.error("Error deleting official:", e); }
};

// --- 5. REPORTS ---
export const addReportToDb = async (report: any) => {
  try {
    const { id, ...data } = report;
    await addDoc(collection(db, REPORTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding report:", e); }
};

export const updateReportStatus = async (id: string, status: string) => {
  try {
    await updateDoc(doc(db, REPORTS_COL, id), { status });
  } catch (e) { console.error("Error updating report:", e); }
};

export const deleteReportFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, REPORTS_COL, id)); } catch (e) { console.error("Error deleting report:", e); }
};

// --- 6. LETTERS ---
export const addLetterToDb = async (letter: any) => {
  try {
    const { id, ...data } = letter;
    await addDoc(collection(db, LETTERS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding letter:", e); }
};

export const updateLetterStatus = async (id: string, status: string) => {
  try { await updateDoc(doc(db, LETTERS_COL, id), { status }); } catch (e) { console.error("Error updating letter:", e); }
};

export const deleteLetterFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, LETTERS_COL, id)); } catch (e) { console.error("Error deleting letter:", e); }
};

// --- 7. INVENTORY ---
export const addInventoryToDb = async (item: any) => {
    try {
        const { id, ...data } = item;
        await addDoc(collection(db, INVENTORY_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding inventory:", e); }
};

export const updateInventoryInDb = async (id: string, updates: any) => {
    try { await updateDoc(doc(db, INVENTORY_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating inventory:", e); }
};

export const deleteInventoryFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, INVENTORY_COL, id)); } catch (e) { console.error("Error deleting inventory:", e); }
};

// --- 8. RONDA ---
export const updateRondaSchedule = async (id: string, members: string[]) => {
    try {
        await updateDoc(doc(db, RONDA_COL, id), { members });
    } catch (e) { console.error("Error updating ronda:", e); }
};

// --- 9. UMKM ---
export const addUMKMToDb = async (umkm: any) => {
  try {
    const { id, ...data } = umkm;
    await addDoc(collection(db, UMKM_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding UMKM:", e); }
};

export const updateUMKMInDb = async (id: string, updates: any) => {
  try { await updateDoc(doc(db, UMKM_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating UMKM:", e); }
};

export const deleteUMKMFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, UMKM_COL, id)); } catch (e) { console.error("Error deleting UMKM:", e); }
};


// --- SEEDING & AUTO-MIGRATION ---
export const seedDatabase = async (initialData: any) => {
    try {
      const housesSnap = await getDocs(collection(db, HOUSES_COL));
      
      const hasOldData = housesSnap.docs.some(doc => {
          const data = doc.data();
          return ['C1', 'C2', 'C3', 'C4'].includes(data.block);
      });

      if (housesSnap.empty || hasOldData) {
          console.log("Sinkronisasi data awal (Seeding)...");
          await resetHouseData(initialData.houses);
      }

      const officialsSnap = await getDocs(collection(db, OFFICIALS_COL));
      if (officialsSnap.empty && initialData.officials.length > 0) {
          for (const o of initialData.officials) {
            const { id, ...data } = o;
            await addDoc(collection(db, OFFICIALS_COL), deepSanitize(data));
          }
      }
      
      const rondaSnap = await getDocs(collection(db, RONDA_COL));
      if (rondaSnap.empty && initialData.ronda.length > 0) {
          for (const r of initialData.ronda) {
             const { id, ...data } = r;
             await addDoc(collection(db, RONDA_COL), deepSanitize(data));
          }
      }
      
      const inventorySnap = await getDocs(collection(db, INVENTORY_COL));
      if (inventorySnap.empty && initialData.inventory.length > 0) {
          for (const i of initialData.inventory) {
             const { id, ...data } = i;
             await addDoc(collection(db, INVENTORY_COL), deepSanitize(data));
          }
      }

      const umkmSnap = await getDocs(collection(db, UMKM_COL));
      if (umkmSnap.empty && initialData.umkm && initialData.umkm.length > 0) {
          for (const u of initialData.umkm) {
             const { id, ...data } = u;
             await addDoc(collection(db, UMKM_COL), deepSanitize(data));
          }
      }
      
      // Seed Data Dummy untuk Laporan & Transaksi agar tidak kosong
      const reportsSnap = await getDocs(collection(db, REPORTS_COL));
      if (reportsSnap.empty && initialData.reports && initialData.reports.length > 0) {
          for (const r of initialData.reports) {
              const { id, ...data } = r;
              await addDoc(collection(db, REPORTS_COL), deepSanitize(data));
          }
      }

      const cashSnap = await getDocs(collection(db, CASHFLOW_COL));
      if (cashSnap.empty && initialData.cashFlow && initialData.cashFlow.length > 0) {
          for (const c of initialData.cashFlow) {
              const { id, ...data } = c;
              await addDoc(collection(db, CASHFLOW_COL), deepSanitize(data));
          }
      }

    } catch (e) {
      console.error("Seeding/Migration failed:", e);
    }
};