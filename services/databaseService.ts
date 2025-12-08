import { db, auth, isFirebaseConfigured } from "./firebaseConfig";
import * as Firestore from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

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
const PANIC_COL = "panic_alerts";
const POLLS_COL = "polls";
const COMMENTS_COL = "comments";

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
  const q = Firestore.query(Firestore.collection(db, colName));
  return Firestore.onSnapshot(q, (snapshot) => {
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
       await Firestore.setDoc(Firestore.doc(db, HOUSES_COL, cleanData.id), cleanData);
    } else {
       await Firestore.addDoc(Firestore.collection(db, HOUSES_COL), cleanData);
    }
  } catch (e) { console.error("Error adding house: ", e); }
};

export const updateHouseData = async (id: string, updates: any) => {
    try {
      const houseRef = Firestore.doc(db, HOUSES_COL, id);
      await Firestore.updateDoc(houseRef, deepSanitize(updates));
    } catch (e) { console.error("Error updating house:", e); }
};

export const batchUpdateHouses = async (housesData: any[]) => {
  try {
    console.log(`Mulai import ${housesData.length} data warga...`);
    const MAX_BATCH_SIZE = 400; 
    let batch = Firestore.writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = Firestore.writeBatch(db);
        operationCount = 0;
    };

    for (const house of housesData) {
       const cleanData = deepSanitize(house);
       if (!cleanData || !cleanData.id) continue;
       
       const ref = Firestore.doc(db, HOUSES_COL, cleanData.id);
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
    const snapshot = await Firestore.getDocs(Firestore.collection(db, HOUSES_COL));
    
    const MAX_BATCH_SIZE = 400; 
    let batch = Firestore.writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = Firestore.writeBatch(db);
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
       
       const ref = Firestore.doc(db, HOUSES_COL, house.id); 
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
    await Firestore.addDoc(Firestore.collection(db, ANNOUNCEMENTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding announcement:", e); }
};

export const deleteAnnouncementFromDb = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, ANNOUNCEMENTS_COL, id)); } catch (e) { console.error("Error deleting announcement:", e); }
};

// --- 3. CASHFLOW ---
export const addTransactionToDb = async (transaction: any) => {
  try {
    const { id, ...data } = transaction;
    await Firestore.addDoc(Firestore.collection(db, CASHFLOW_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding transaction:", e); }
};

export const deleteTransactionFromDb = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, CASHFLOW_COL, id)); } catch (e) { console.error("Error deleting transaction:", e); }
};

// --- 4. OFFICIALS ---
export const addOfficialToDb = async (official: any) => {
  try {
    const { id, ...data } = official;
    await Firestore.addDoc(Firestore.collection(db, OFFICIALS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding official:", e); }
};

export const updateOfficialInDb = async (id: string, updates: any) => {
  try { await Firestore.updateDoc(Firestore.doc(db, OFFICIALS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating official:", e); }
};

export const deleteOfficialFromDb = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, OFFICIALS_COL, id)); } catch (e) { console.error("Error deleting official:", e); }
};

// --- 5. REPORTS ---
export const addReportToDb = async (report: any) => {
  try {
    const { id, ...data } = report;
    await Firestore.addDoc(Firestore.collection(db, REPORTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding report:", e); }
};

export const updateReportStatus = async (id: string, status: string) => {
  try {
    await Firestore.updateDoc(Firestore.doc(db, REPORTS_COL, id), { status });
  } catch (e) { console.error("Error updating report:", e); }
};

export const deleteReportFromDb = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, REPORTS_COL, id)); } catch (e) { console.error("Error deleting report:", e); }
};

// --- 6. LETTERS ---
export const addLetterToDb = async (letter: any) => {
  try {
    const { id, ...data } = letter;
    await Firestore.addDoc(Firestore.collection(db, LETTERS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding letter:", e); }
};

export const updateLetterStatus = async (id: string, status: string) => {
  try { await Firestore.updateDoc(Firestore.doc(db, LETTERS_COL, id), { status }); } catch (e) { console.error("Error updating letter:", e); }
};

export const deleteLetterFromDb = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, LETTERS_COL, id)); } catch (e) { console.error("Error deleting letter:", e); }
};

// --- 7. INVENTORY ---
export const addInventoryToDb = async (item: any) => {
    try {
        const { id, ...data } = item;
        await Firestore.addDoc(Firestore.collection(db, INVENTORY_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding inventory:", e); }
};

export const updateInventoryInDb = async (id: string, updates: any) => {
    try { await Firestore.updateDoc(Firestore.doc(db, INVENTORY_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating inventory:", e); }
};

export const deleteInventoryFromDb = async (id: string) => {
    try { await Firestore.deleteDoc(Firestore.doc(db, INVENTORY_COL, id)); } catch (e) { console.error("Error deleting inventory:", e); }
};

// --- 8. RONDA ---
export const updateRondaSchedule = async (id: string, members: string[]) => {
    try {
        await Firestore.updateDoc(Firestore.doc(db, RONDA_COL, id), { members });
    } catch (e) { console.error("Error updating ronda:", e); }
};

// --- 9. UMKM ---
export const addUMKMToDb = async (umkm: any) => {
  try {
    const { id, ...data } = umkm;
    await Firestore.addDoc(Firestore.collection(db, UMKM_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding UMKM:", e); }
};

export const updateUMKMInDb = async (id: string, updates: any) => {
  try { await Firestore.updateDoc(Firestore.doc(db, UMKM_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating UMKM:", e); }
};

export const deleteUMKMFromDb = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, UMKM_COL, id)); } catch (e) { console.error("Error deleting UMKM:", e); }
};

// --- 10. PANIC BUTTON & ALERTS ---
export const sendPanicAlert = async (location: string) => {
  try {
      await Firestore.addDoc(Firestore.collection(db, PANIC_COL), {
          location,
          timestamp: new Date().toISOString(),
          status: 'Active'
      });
  } catch (e) { console.error("Error sending panic alert:", e); }
};

export const resolvePanicAlert = async (id: string) => {
  try {
      await Firestore.updateDoc(Firestore.doc(db, PANIC_COL, id), { status: 'Resolved' });
  } catch (e) { console.error("Error resolving panic alert:", e); }
};

// --- 11. POLLING (E-VOTING) ---
export const addPoll = async (poll: any) => {
  try {
      const { id, ...data } = poll;
      await Firestore.addDoc(Firestore.collection(db, POLLS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding poll:", e); }
};

export const votePoll = async (pollId: string, optionId: string) => {
  try {
    await Firestore.runTransaction(db, async (transaction) => {
        const pollRef = Firestore.doc(db, POLLS_COL, pollId);
        const pollDoc = await transaction.get(pollRef);
        if (!pollDoc.exists()) throw "Document does not exist!";
        
        const data = pollDoc.data();
        const options = data.options.map((opt: any) => {
            if (opt.id === optionId) {
                return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
        });
        const totalVotes = (data.totalVotes || 0) + 1;
        transaction.update(pollRef, { options, totalVotes });
    });
  } catch (e) { console.error("Error voting:", e); }
};

export const deletePoll = async (id: string) => {
  try { await Firestore.deleteDoc(Firestore.doc(db, POLLS_COL, id)); } catch (e) { console.error("Error deleting poll:", e); }
};

// --- 12. COMMENTS ---
export const addComment = async (comment: any) => {
  try {
      const { id, ...data } = comment;
      await Firestore.addDoc(Firestore.collection(db, COMMENTS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding comment:", e); }
};


// --- SEEDING & AUTO-MIGRATION ---
export const seedDatabase = async (initialData: any) => {
    try {
      const housesSnap = await Firestore.getDocs(Firestore.collection(db, HOUSES_COL));
      
      const hasOldData = housesSnap.docs.some(doc => {
          const data = doc.data();
          return ['C1', 'C2', 'C3', 'C4'].includes(data.block);
      });

      if (housesSnap.empty || hasOldData) {
          console.log("Sinkronisasi data awal (Seeding)...");
          await resetHouseData(initialData.houses);
      }

      const officialsSnap = await Firestore.getDocs(Firestore.collection(db, OFFICIALS_COL));
      if (officialsSnap.empty && initialData.officials.length > 0) {
          for (const o of initialData.officials) {
            const { id, ...data } = o;
            await Firestore.addDoc(Firestore.collection(db, OFFICIALS_COL), deepSanitize(data));
          }
      }
      
      const rondaSnap = await Firestore.getDocs(Firestore.collection(db, RONDA_COL));
      if (rondaSnap.empty && initialData.ronda.length > 0) {
          for (const r of initialData.ronda) {
             const { id, ...data } = r;
             await Firestore.addDoc(Firestore.collection(db, RONDA_COL), deepSanitize(data));
          }
      }
      
      const inventorySnap = await Firestore.getDocs(Firestore.collection(db, INVENTORY_COL));
      if (inventorySnap.empty && initialData.inventory.length > 0) {
          for (const i of initialData.inventory) {
             const { id, ...data } = i;
             await Firestore.addDoc(Firestore.collection(db, INVENTORY_COL), deepSanitize(data));
          }
      }

      const umkmSnap = await Firestore.getDocs(Firestore.collection(db, UMKM_COL));
      if (umkmSnap.empty && initialData.umkm && initialData.umkm.length > 0) {
          for (const u of initialData.umkm) {
             const { id, ...data } = u;
             await Firestore.addDoc(Firestore.collection(db, UMKM_COL), deepSanitize(data));
          }
      }
      
      // Seed Data Dummy untuk Laporan & Transaksi agar tidak kosong
      const reportsSnap = await Firestore.getDocs(Firestore.collection(db, REPORTS_COL));
      if (reportsSnap.empty && initialData.reports && initialData.reports.length > 0) {
          for (const r of initialData.reports) {
              const { id, ...data } = r;
              await Firestore.addDoc(Firestore.collection(db, REPORTS_COL), deepSanitize(data));
          }
      }

      const cashSnap = await Firestore.getDocs(Firestore.collection(db, CASHFLOW_COL));
      if (cashSnap.empty && initialData.cashFlow && initialData.cashFlow.length > 0) {
          for (const c of initialData.cashFlow) {
              const { id, ...data } = c;
              await Firestore.addDoc(Firestore.collection(db, CASHFLOW_COL), deepSanitize(data));
          }
      }

    } catch (e) {
      console.error("Seeding/Migration failed:", e);
    }
};