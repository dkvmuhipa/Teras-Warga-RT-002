









import { db, auth, storage, isFirebaseConfigured } from "./firebaseConfig";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  orderBy,
  limit,
  where,
  increment
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const NOTIFICATIONS_COL = "notifications";
const POLLS_COL = "polls";
const RONDA_LOGS_COL = "rondaLogs";
const PATROL_SESSIONS_COL = "patrolSessions";
const MARKET_COL = "marketItems";
const BILLS_COL = "bills";
const NEWS_COL = "news";
const CHECKPOINTS_COL = "checkpoints";

// --- CHECKPOINTS SERVICES ---
export const subscribeToCheckpoints = (callback: (data: any[]) => void) => {
    const q = query(collection(db, CHECKPOINTS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to checkpoints:", error);
    });
};

export const updateCheckpointPosition = async (id: string, x: number, y: number) => {
    try {
        await setDoc(doc(db, CHECKPOINTS_COL, id), { x, y }, { merge: true });
    } catch (e) {
        console.error("Error updating checkpoint position:", e);
    }
};

export const addCheckpointToDb = async (checkpoint: any) => {
    try {
        const { id, ...data } = checkpoint;
        if (id) {
            await setDoc(doc(db, CHECKPOINTS_COL, id), deepSanitize(data));
        } else {
            await addDoc(collection(db, CHECKPOINTS_COL), deepSanitize(data));
        }
    } catch (e) {
        console.error("Error adding checkpoint:", e);
    }
};

// --- BILLS SERVICES ---
export const addBillToDb = async (bill: any) => {
    try {
        const { id, ...data } = bill;
        await addDoc(collection(db, BILLS_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding bill:", e); }
};

export const updateBillInDb = async (id: string, updates: any) => {
    try { await updateDoc(doc(db, BILLS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating bill:", e); }
};

export const deleteBillFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, BILLS_COL, id)); } catch (e) { console.error("Error deleting bill:", e); }
};

export const subscribeToBills = (callback: (data: any[]) => void) => {
    const q = query(collection(db, BILLS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to bills:", error);
    });
};
export const uploadImageToStorage = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (e) {
    console.error("Error uploading image:", e);
    throw e;
  }
};
export const loginAdmin = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutAdmin = () => {
  return signOut(auth);
};

export const updateAdminPassword = async (newPass: string) => {
    if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPass);
    } else {
        throw new Error("No user logged in");
    }
};

// --- UTILS ---

export const deepSanitize = (data: any, seen = new WeakSet()): any => {
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

// --- OPTIMIZED REPORT SUBSCRIBE ---
export const subscribeToActiveReports = (callback: (data: any[]) => void) => {
  // Query only 'Baru' or 'Diproses' status
  const q = query(collection(db, REPORTS_COL), where('status', 'in', ['Baru', 'Diproses']));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to active reports:", error);
  });
};

// --- NOTIFICATIONS (NEW) ---
export const subscribeToNotifications = (callback: (data: any[]) => void) => {
  // Order by date descending, limit to last 20 to avoid overload
  const q = query(collection(db, NOTIFICATIONS_COL), orderBy("date", "desc"), limit(20));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    // Fallback if index missing or error
    console.log("Notification index missing or query error, falling back to simple query");
    const qSimple = query(collection(db, NOTIFICATIONS_COL));
    onSnapshot(qSimple, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Manual Sort
        data.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(data.slice(0, 20));
    });
  });
};

export const addNotificationToDb = async (notification: any) => {
    try {
        const { id, ...data } = notification;
        await addDoc(collection(db, NOTIFICATIONS_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding notification:", e); }
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

export const validateResidentAccess = async (houseId: string, code: string): Promise<boolean> => {
    try {
        const docRef = doc(db, HOUSES_COL, houseId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            // Simple validation: check if code matches
            // In production, bcrypt hash would be better, but plain text for MVP is fine per spec
            return data.accessCode && data.accessCode.toUpperCase() === code.toUpperCase();
        }
        return false;
    } catch (e) {
        console.error("Verification error:", e);
        return false;
    }
};

export const generateAllAccessCodes = async (houses: any[]) => {
  try {
    console.log(`Mulai generate PIN untuk ${houses.length} data warga...`);
    const MAX_BATCH_SIZE = 400; 
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    for (const house of houses) {
       // Hanya generate jika belum ada accessCode
       if (house.accessCode) continue;

       const newCode = Math.floor(1000 + Math.random() * 9000).toString();
       const ref = doc(db, HOUSES_COL, house.id);
       batch.update(ref, { accessCode: newCode });
       
       operationCount++;
       if (operationCount >= MAX_BATCH_SIZE) await commitBatch();
    }

    if (operationCount > 0) {
      await batch.commit();
    }
    console.log("Generate PIN massal selesai.");
    return true;
  } catch (e) {
    console.error("Gagal melakukan generate PIN massal:", e);
    throw e;
  }
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

export const updateAnnouncementInDb = async (id: string, updates: any) => {
  try { await updateDoc(doc(db, ANNOUNCEMENTS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating announcement:", e); }
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

export const updateRondaShifts = async (id: string, shifts: any[]) => {
    try {
        await updateDoc(doc(db, RONDA_COL, id), { shifts });
    } catch (e) { console.error("Error updating ronda shifts:", e); }
};

export const addRondaSwapRequest = async (request: any) => {
    try {
        await addDoc(collection(db, "rondaSwapRequests"), deepSanitize(request));
    } catch (e) { console.error("Error adding swap request:", e); }
};

export const updateRondaSwapRequestStatus = async (id: string, status: string) => {
    try {
        await updateDoc(doc(db, "rondaSwapRequests", id), { status });
    } catch (e) { console.error("Error updating swap request status:", e); }
};

export const subscribeToRondaSwapRequests = (callback: (data: any[]) => void) => {
    const q = query(collection(db, "rondaSwapRequests"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to swap requests:", error);
        const qSimple = query(collection(db, "rondaSwapRequests"));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            callback(data);
        });
    });
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

// --- 10. POLLS (E-VOTING) ---
export const addPollToDb = async (poll: any) => {
  try {
    const { id, ...data } = poll;
    await addDoc(collection(db, POLLS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding poll:", e); }
};

export const deletePollFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, POLLS_COL, id)); } catch (e) { console.error("Error deleting poll:", e); }
};

export const updatePollStatus = async (id: string, status: string) => {
  try { await updateDoc(doc(db, POLLS_COL, id), { status }); } catch (e) { console.error("Error updating poll status:", e); }
};

export const submitVote = async (pollId: string, optionId: string, currentOptions: any[]) => {
  try {
    const pollRef = doc(db, POLLS_COL, pollId);
    
    // Find option index
    const optIndex = currentOptions.findIndex((o: any) => o.id === optionId);
    if (optIndex === -1) return;

    // Create new options array
    const newOptions = [...currentOptions];
    newOptions[optIndex] = {
      ...newOptions[optIndex],
      votes: newOptions[optIndex].votes + 1
    };

    await updateDoc(pollRef, {
      options: newOptions,
      totalVotes: increment(1)
    });

  } catch (e) { console.error("Error submitting vote:", e); }
};


// --- 11. RONDA LOGS (DIGITAL SISKAMLING) ---
export const addRondaLog = async (log: any) => {
  try {
    const { id, ...data } = log;
    await addDoc(collection(db, RONDA_LOGS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding ronda log:", e); }
};

export const subscribeToRondaLogs = (callback: (data: any[]) => void) => {
  // Order by timestamp descending, limit to recent logs
  const q = query(collection(db, RONDA_LOGS_COL), orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    // Fallback if index missing or error
    console.log("Ronda Logs index missing, fallback query");
    const qSimple = query(collection(db, RONDA_LOGS_COL));
    onSnapshot(qSimple, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        data.sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(data.slice(0, 50));
    });
  });
};

// --- 11.5 PATROL SESSIONS ---
export const startPatrolSession = async (officerName: string) => {
    try {
        const session = {
            officerName,
            startTime: new Date().toISOString(),
            visitedCheckpoints: [],
            status: 'Ongoing'
        };
        const docRef = await addDoc(collection(db, PATROL_SESSIONS_COL), deepSanitize(session));
        return docRef.id;
    } catch (e) { console.error("Error starting patrol:", e); }
};

export const visitCheckpoint = async (sessionId: string, checkpointId: string) => {
    try {
        const sessionRef = doc(db, PATROL_SESSIONS_COL, sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            const visited = data.visitedCheckpoints || [];
            if (!visited.includes(checkpointId)) {
                await updateDoc(sessionRef, { visitedCheckpoints: [...visited, checkpointId] });
            }
        }
    } catch (e) { console.error("Error visiting checkpoint:", e); }
};

export const finishPatrolSession = async (sessionId: string) => {
    try {
        await updateDoc(doc(db, PATROL_SESSIONS_COL, sessionId), { 
            endTime: new Date().toISOString(),
            status: 'Completed' 
        });
    } catch (e) { console.error("Error finishing patrol:", e); }
};

export const subscribeToActivePatrols = (callback: (data: any[]) => void) => {
    const q = query(collection(db, PATROL_SESSIONS_COL), where("status", "==", "Ongoing"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// --- 12. BURSA WARGA (COMMUNITY MARKET) ---
export const addMarketItem = async (item: any) => {
  try {
    const { id, ...data } = item;
    await addDoc(collection(db, MARKET_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding market item:", e); }
};

export const deleteMarketItem = async (id: string) => {
  try { await deleteDoc(doc(db, MARKET_COL, id)); } catch (e) { console.error("Error deleting market item:", e); }
};

export const updateMarketItemStatus = async (id: string, status: string) => {
  try { await updateDoc(doc(db, MARKET_COL, id), { status }); } catch (e) { console.error("Error updating market status:", e); }
};

export const subscribeToMarketItems = (callback: (data: any[]) => void) => {
  const q = query(collection(db, MARKET_COL));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to market items:", error);
  });
};


// --- 13. GALLERY ---
const GALLERY_COL = "gallery";

export const addGalleryItemToDb = async (item: any) => {
  try {
    const { id, ...data } = item;
    await addDoc(collection(db, GALLERY_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding gallery item:", e); }
};

export const deleteGalleryItemFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, GALLERY_COL, id)); } catch (e) { console.error("Error deleting gallery item:", e); }
};

export const subscribeToGallery = (callback: (data: any[]) => void) => {
  const q = query(collection(db, GALLERY_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to gallery:", error);
    // Fallback if index missing
    const qSimple = query(collection(db, GALLERY_COL));
    onSnapshot(qSimple, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        data.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(data);
    });
  });
};

// --- 14. NEWS ---
export const addNewsToDb = async (news: any) => {
  try {
    const { id, ...data } = news;
    await addDoc(collection(db, NEWS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding news:", e); }
};

export const updateNewsInDb = async (id: string, updates: any) => {
  try { await updateDoc(doc(db, NEWS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating news:", e); }
};

export const deleteNewsFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, NEWS_COL, id)); } catch (e) { console.error("Error deleting news:", e); }
};

export const subscribeToNews = (callback: (data: any[]) => void) => {
  const q = query(collection(db, NEWS_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to news:", error);
  });
};


// --- SEEDING & AUTO-MIGRATION ---
export const seedDatabase = async (initialData?: any) => {
    try {
      // If no initialData provided, use dummy data or fetch from a source
      // For now, we'll just log a warning if it's missing and return
      if (!initialData) {
          console.warn("No initial data provided for seeding.");
          return;
      }

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

      // Seed Polls
      const pollsSnap = await getDocs(collection(db, POLLS_COL));
      if (pollsSnap.empty && initialData.polls && initialData.polls.length > 0) {
          for (const p of initialData.polls) {
              const { id, ...data } = p;
              await addDoc(collection(db, POLLS_COL), deepSanitize(data));
          }
      }

      // Seed Ronda Logs
      const logsSnap = await getDocs(collection(db, RONDA_LOGS_COL));
      if (logsSnap.empty && initialData.rondaLogs && initialData.rondaLogs.length > 0) {
          for (const l of initialData.rondaLogs) {
              const { id, ...data } = l;
              await addDoc(collection(db, RONDA_LOGS_COL), deepSanitize(data));
          }
      }

      // Seed Market Items (New)
      const marketSnap = await getDocs(collection(db, MARKET_COL));
      if (marketSnap.empty && initialData.marketItems && initialData.marketItems.length > 0) {
          for (const m of initialData.marketItems) {
              const { id, ...data } = m;
              await addDoc(collection(db, MARKET_COL), deepSanitize(data));
          }
      }

      // Seed Checkpoints
      const checkpointsSnap = await getDocs(collection(db, CHECKPOINTS_COL));
      if (checkpointsSnap.empty && initialData.checkpoints && initialData.checkpoints.length > 0) {
          for (const cp of initialData.checkpoints) {
              const { id, ...data } = cp;
              if (id) {
                  await setDoc(doc(db, CHECKPOINTS_COL, id), deepSanitize(data));
              } else {
                  await addDoc(collection(db, CHECKPOINTS_COL), deepSanitize(data));
              }
          }
      }

      // Seed Bills (New)
      const billsSnap = await getDocs(collection(db, BILLS_COL));
      if (billsSnap.empty && initialData.bills && initialData.bills.length > 0) {
          for (const b of initialData.bills) {
              const { id, ...data } = b;
              await addDoc(collection(db, BILLS_COL), deepSanitize(data));
          }
      }

    } catch (e) {
      console.error("Seeding/Migration failed:", e);
      throw e;
    }
};