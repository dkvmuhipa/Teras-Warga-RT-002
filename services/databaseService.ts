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
  setDoc,
  writeBatch
} from "firebase/firestore";

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

// --- UTILS ---

/**
 * Membersihkan objek secara rekursif agar aman untuk disimpan ke Firestore/JSON.
 * Menghapus fungsi, DOM nodes, dan menangani referensi circular.
 */
const deepSanitize = (data: any, seen = new WeakSet()): any => {
  // 1. Handle Primitive / Null / Undefined
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // 2. Handle Dates (Firestore supports Date objects directly)
  if (data instanceof Date) {
    return data;
  }

  // 3. Handle Circular References
  if (seen.has(data)) {
    return null; // Putus siklus circular
  }
  seen.add(data);

  // 4. Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => deepSanitize(item, seen));
  }

  // 5. Block DOM Nodes / React Events (Common source of "circular structure" errors)
  if (data.nodeType || (data.nativeEvent && data.target)) {
    return undefined;
  }

  // 6. Handle Plain Objects
  const clean: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    // Filter out functions and undefined
    if (value !== undefined && typeof value !== 'function') {
      clean[key] = deepSanitize(value, seen);
    }
  });

  return clean;
};

// --- GENERIC SUBSCRIBE ---
export const subscribeToCollection = (colName: string, callback: (data: any[]) => void) => {
  if (!isFirebaseConfigured) return () => {};

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

// --- 1. HOUSES (WARGA) ---
export const addHouse = async (houseData: any) => {
  if (!isFirebaseConfigured) return;
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
    if (!isFirebaseConfigured) return;
    try {
      const houseRef = doc(db, HOUSES_COL, id);
      await updateDoc(houseRef, deepSanitize(updates));
    } catch (e) { console.error("Error updating house:", e); }
};

export const resetHouseData = async (newHouses: any[]) => {
  if (!isFirebaseConfigured) return;
  try {
    console.log("Starting database reset...");
    
    // 1. Get all existing house documents
    const snapshot = await getDocs(collection(db, HOUSES_COL));
    
    // 2. Delete in batches (Firestore batch limit is 500)
    const batchSize = 400; 
    let batch = writeBatch(db);
    let count = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      count++;
      if (count >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
    console.log("Old data cleared.");

    // 3. Add new houses
    let addedCount = 0;
    for (const house of newHouses) {
       // We use deepSanitize here to ensure safety
       await addHouse(house);
       addedCount++;
    }
    console.log(`Successfully re-seeded ${addedCount} houses.`);
    
  } catch (e) {
    console.error("Error resetting house data:", e);
    throw e;
  }
};

// --- 2. ANNOUNCEMENTS ---
export const addAnnouncementToDb = async (announcement: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
  try {
    const { id, ...data } = announcement; 
    await addDoc(collection(db, ANNOUNCEMENTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding announcement:", e); }
};

export const deleteAnnouncementFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try { await deleteDoc(doc(db, ANNOUNCEMENTS_COL, id)); } catch (e) { console.error("Error deleting announcement:", e); }
};

// --- 3. CASHFLOW ---
export const addTransactionToDb = async (transaction: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
  try {
    const { id, ...data } = transaction;
    await addDoc(collection(db, CASHFLOW_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding transaction:", e); }
};

export const deleteTransactionFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try { await deleteDoc(doc(db, CASHFLOW_COL, id)); } catch (e) { console.error("Error deleting transaction:", e); }
};

// --- 4. OFFICIALS ---
export const addOfficialToDb = async (official: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
  try {
    const { id, ...data } = official;
    await addDoc(collection(db, OFFICIALS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding official:", e); }
};

export const updateOfficialInDb = async (id: string, updates: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
  try { await updateDoc(doc(db, OFFICIALS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating official:", e); }
};

export const deleteOfficialFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try { await deleteDoc(doc(db, OFFICIALS_COL, id)); } catch (e) { console.error("Error deleting official:", e); }
};

// --- 5. REPORTS (LAPORAN WARGA) ---
export const addReportToDb = async (report: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Laporan tidak terkirim ke database."); return; }
  try {
    const { id, ...data } = report;
    await addDoc(collection(db, REPORTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding report:", e); }
};

export const updateReportStatus = async (id: string, status: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await updateDoc(doc(db, REPORTS_COL, id), { status });
  } catch (e) { console.error("Error updating report:", e); }
};

export const deleteReportFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try { await deleteDoc(doc(db, REPORTS_COL, id)); } catch (e) { console.error("Error deleting report:", e); }
};

// --- 6. LETTERS (ARSIP SURAT) ---
export const addLetterToDb = async (letter: any) => {
  if (!isFirebaseConfigured) return; 
  try {
    const { id, ...data } = letter;
    await addDoc(collection(db, LETTERS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding letter:", e); }
};

export const updateLetterStatus = async (id: string, status: string) => {
  if (!isFirebaseConfigured) return;
  try { await updateDoc(doc(db, LETTERS_COL, id), { status }); } catch (e) { console.error("Error updating letter:", e); }
};

export const deleteLetterFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try { await deleteDoc(doc(db, LETTERS_COL, id)); } catch (e) { console.error("Error deleting letter:", e); }
};

// --- 7. INVENTORY (FASILITAS/ASET) ---
export const addInventoryToDb = async (item: any) => {
    if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
    try {
        const { id, ...data } = item;
        await addDoc(collection(db, INVENTORY_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding inventory:", e); }
};

export const updateInventoryInDb = async (id: string, updates: any) => {
    if (!isFirebaseConfigured) return;
    try { await updateDoc(doc(db, INVENTORY_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating inventory:", e); }
};

export const deleteInventoryFromDb = async (id: string) => {
    if (!isFirebaseConfigured) return;
    try { await deleteDoc(doc(db, INVENTORY_COL, id)); } catch (e) { console.error("Error deleting inventory:", e); }
};

// --- 8. RONDA SCHEDULE ---
export const updateRondaSchedule = async (id: string, members: string[]) => {
    if (!isFirebaseConfigured) { alert("Demo Mode: Jadwal tidak disimpan."); return; }
    try {
        await updateDoc(doc(db, RONDA_COL, id), { members });
    } catch (e) { console.error("Error updating ronda:", e); }
};

// --- 9. UMKM (Baru) ---
export const addUMKMToDb = async (umkm: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
  try {
    const { id, ...data } = umkm;
    await addDoc(collection(db, UMKM_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding UMKM:", e); }
};

export const updateUMKMInDb = async (id: string, updates: any) => {
  if (!isFirebaseConfigured) { alert("Demo Mode: Data tidak disimpan."); return; }
  try { await updateDoc(doc(db, UMKM_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating UMKM:", e); }
};

export const deleteUMKMFromDb = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try { await deleteDoc(doc(db, UMKM_COL, id)); } catch (e) { console.error("Error deleting UMKM:", e); }
};


// --- SEEDING ---
export const seedDatabase = async (initialData: any) => {
    if (!isFirebaseConfigured) return;

    try {
      const housesSnap = await getDocs(collection(db, HOUSES_COL));
      if (housesSnap.empty && initialData.houses.length > 0) {
          console.log("Seeding Houses...");
          for (const h of initialData.houses) await addHouse(h);
      }

      const officialsSnap = await getDocs(collection(db, OFFICIALS_COL));
      if (officialsSnap.empty && initialData.officials.length > 0) {
          console.log("Seeding Officials...");
          for (const o of initialData.officials) await addOfficialToDb(o);
      }
      
      const rondaSnap = await getDocs(collection(db, RONDA_COL));
      if (rondaSnap.empty && initialData.ronda.length > 0) {
          console.log("Seeding Ronda...");
          for (const r of initialData.ronda) await addDoc(collection(db, RONDA_COL), deepSanitize(r));
      }
      
      const inventorySnap = await getDocs(collection(db, INVENTORY_COL));
      if (inventorySnap.empty && initialData.inventory.length > 0) {
          console.log("Seeding Inventory...");
          for (const i of initialData.inventory) await addDoc(collection(db, INVENTORY_COL), deepSanitize(i));
      }

      // Seed UMKM if empty
      const umkmSnap = await getDocs(collection(db, UMKM_COL));
      if (umkmSnap.empty && initialData.umkm && initialData.umkm.length > 0) {
          console.log("Seeding UMKM...");
          for (const u of initialData.umkm) await addDoc(collection(db, UMKM_COL), deepSanitize(u));
      }

    } catch (e) {
      console.error("Seeding failed:", e);
    }
};