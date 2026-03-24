









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
import { MapPoint, Checkpoint, LetterRequest, ResidentRegistration } from "../types";

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
const UMKM_ORDERS_COL = "umkmOrders";
const NOTIFICATIONS_COL = "notifications";
const POLLS_COL = "polls";
const RONDA_LOGS_COL = "rondaLogs";
const PATROL_SESSIONS_COL = "patrolSessions";
const MARKET_COL = "marketItems";
const BILLS_COL = "bills";
const NEWS_COL = "news";
const CHECKPOINTS_COL = "checkpoints";
const MAP_POINTS_COL = "mapPoints";
const DOCUMENTS_COL = "documents";
const POPULATION_LOGS_COL = "populationLogs";
const IURAN_PAYMENTS_COL = "iuranPayments";
const RESIDENT_REGISTRATIONS_COL = "residentRegistrations";
const GUEST_REPORTS_COL = "guestReports";
const INVENTORY_LOGS_COL = "inventoryLogs";
const AUDIT_LOGS_COL = "auditLogs";
const ACTIVITIES_COL = "activities";
const ATTENDANCE_COL = "attendance";
const HEALTH_RECORDS_COL = "healthRecords";
const FAQ_COL = "faq";
const EVENTS_COL = "events";
const WASTE_DEPOSITS_COL = "wasteDeposits";
const WASTE_PRICES_COL = "wastePrices";
const WASTE_BALANCES_COL = "wasteBalances";
const IDEAS_COL = "ideas";
const DONATION_CAMPAIGNS_COL = "donationCampaigns";
const DONATION_RECORDS_COL = "donationRecords";
const PANIC_ALERTS_COL = "panicAlerts";
const UPDATE_REQUESTS_COL = "updateRequests";

// --- IDEAS SERVICES ---
export const subscribeToIdeas = (callback: (data: any[]) => void) => {
    const q = query(collection(db, IDEAS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

export const addIdea = async (data: any) => {
    return await addDoc(collection(db, IDEAS_COL), {
        ...data,
        date: new Date().toISOString(),
        upvotes: [],
        status: 'Usulan'
    });
};

export const updateIdeaStatus = async (id: string, status: string) => {
    const docRef = doc(db, IDEAS_COL, id);
    return await updateDoc(docRef, { status });
};

export const toggleUpvoteIdea = async (id: string, houseId: string) => {
    const docRef = doc(db, IDEAS_COL, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const upvotes = docSnap.data().upvotes || [];
        const newUpvotes = upvotes.includes(houseId) 
            ? upvotes.filter((hid: string) => hid !== houseId)
            : [...upvotes, houseId];
        return await updateDoc(docRef, { upvotes: newUpvotes });
    }
};

// --- DONATIONS SERVICES ---
export const subscribeToDonationCampaigns = (callback: (data: any[]) => void) => {
    const q = query(collection(db, DONATION_CAMPAIGNS_COL), orderBy("startDate", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

export const subscribeToDonationRecords = (campaignId: string, callback: (data: any[]) => void) => {
    const q = query(
        collection(db, DONATION_RECORDS_COL), 
        where("campaignId", "==", campaignId),
        orderBy("date", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

export const addDonationCampaign = async (data: any) => {
    return await addDoc(collection(db, DONATION_CAMPAIGNS_COL), {
        ...data,
        currentAmount: 0,
        startDate: new Date().toISOString(),
        status: 'Aktif'
    });
};

export const addDonationRecord = async (data: any) => {
    const batch = writeBatch(db);
    
    // Add record
    const recordRef = doc(collection(db, DONATION_RECORDS_COL));
    batch.set(recordRef, {
        ...data,
        date: new Date().toISOString()
    });
    
    // Update campaign amount
    const campaignRef = doc(db, DONATION_CAMPAIGNS_COL, data.campaignId);
    batch.update(campaignRef, {
        currentAmount: increment(data.amount)
    });
    
    return await batch.commit();
};

// --- AUDIT LOGS SERVICES ---
export const logAction = async (action: string, details: string) => {
    try {
        const user = auth.currentUser;
        await addDoc(collection(db, AUDIT_LOGS_COL), {
            adminEmail: user?.email || 'System',
            action,
            details,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error logging action:", e);
    }
};

export const subscribeToAuditLogs = (callback: (data: any[]) => void) => {
    const q = query(collection(db, AUDIT_LOGS_COL), orderBy("timestamp", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to audit logs:", error);
    });
};

// --- INVENTORY LOGS SERVICES ---
export const subscribeToInventoryLogs = (callback: (data: any[]) => void) => {
    const q = query(collection(db, INVENTORY_LOGS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to inventory logs:", error);
    });
};

export const addInventoryLogToDb = async (log: any) => {
    try {
        await addDoc(collection(db, INVENTORY_LOGS_COL), deepSanitize(log));
        
        // AUTOMATED FINANCE INTEGRATION: If it's a maintenance log with cost, add to cash flow
        if (log.type === 'Maintenance' && log.cost && log.cost > 0) {
            const transaction = {
                date: log.date || new Date().toISOString().split('T')[0],
                amount: log.cost,
                type: 'Expense',
                category: 'Pemeliharaan Aset',
                description: `Biaya Pemeliharaan: ${log.description || log.itemName}`,
                houseId: 'RT-SYSTEM',
                status: 'Lunas'
            };
            await addTransactionToDb(transaction);
        }
    } catch (e) {
        console.error("Error adding inventory log:", e);
    }
};

export const updateInventoryLogStatus = async (id: string, status: 'Borrowed' | 'Returned') => {
    try {
        await updateDoc(doc(db, INVENTORY_LOGS_COL, id), { status });
    } catch (e) {
        console.error("Error updating inventory log status:", e);
    }
};

export const deleteInventoryLogFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, INVENTORY_LOGS_COL, id));
    } catch (e) {
        console.error("Error deleting inventory log:", e);
    }
};

// --- GUEST REPORTS SERVICES ---
export const subscribeToGuestReports = (callback: (data: any[]) => void) => {
    const q = query(collection(db, GUEST_REPORTS_COL), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to guest reports:", error);
    });
};

export const addGuestReportToDb = async (data: any) => {
    try {
        await addDoc(collection(db, GUEST_REPORTS_COL), deepSanitize(data));
    } catch (e) {
        console.error("Error adding guest report:", e);
    }
};

export const updateGuestReportStatus = async (id: string, status: 'Active' | 'Departed') => {
    try {
        await updateDoc(doc(db, GUEST_REPORTS_COL, id), { status });
    } catch (e) {
        console.error("Error updating guest report status:", e);
    }
};

export const deleteGuestReportFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, GUEST_REPORTS_COL, id));
    } catch (e) {
        console.error("Error deleting guest report:", e);
    }
};

// --- DOCUMENTS SERVICES ---
export const subscribeToDocuments = (callback: (data: any[]) => void) => {
    const q = query(collection(db, DOCUMENTS_COL), orderBy("uploadDate", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to documents:", error);
        const qSimple = query(collection(db, DOCUMENTS_COL));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
            callback(data);
        });
    });
};

export const addDocumentToDb = async (docData: any) => {
    try {
        const { id, ...data } = docData;
        await addDoc(collection(db, DOCUMENTS_COL), deepSanitize(data));
    } catch (e) {
        console.error("Error adding document:", e);
    }
};

export const deleteDocumentFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, DOCUMENTS_COL, id));
    } catch (e) {
        console.error("Error deleting document:", e);
    }
};

// --- CHECKPOINTS SERVICES ---
export const subscribeToCheckpoints = (callback: (data: Checkpoint[]) => void) => {
    const q = query(collection(db, CHECKPOINTS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Checkpoint));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to checkpoints:", error);
    });
};

export const addCheckpointToDb = async (checkpoint: Omit<Checkpoint, 'id'>) => {
    try {
        await addDoc(collection(db, CHECKPOINTS_COL), deepSanitize(checkpoint));
    } catch (e) {
        console.error("Error adding checkpoint:", e);
    }
};

export const updateCheckpointInDb = async (id: string, data: Partial<Checkpoint>) => {
    try {
        await updateDoc(doc(db, CHECKPOINTS_COL, id), deepSanitize(data));
    } catch (e) {
        console.error("Error updating checkpoint:", e);
    }
};

export const deleteCheckpointFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, CHECKPOINTS_COL, id));
    } catch (e) {
        console.error("Error deleting checkpoint:", e);
    }
};

// --- MAP POINTS SERVICES ---
export const subscribeToMapPoints = (callback: (data: MapPoint[]) => void) => {
    const q = query(collection(db, MAP_POINTS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MapPoint));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to map points:", error);
    });
};

export const addMapPointToDb = async (point: Partial<MapPoint>) => {
    try {
        await addDoc(collection(db, MAP_POINTS_COL), deepSanitize(point));
    } catch (e) {
        console.error("Error adding map point:", e);
    }
};

export const updateMapPointInDb = async (id: string, point: Partial<MapPoint>) => {
    try {
        const { id: _, ...data } = point;
        await setDoc(doc(db, MAP_POINTS_COL, id), deepSanitize(data), { merge: true });
    } catch (e) {
        console.error("Error updating map point:", e);
    }
};

export const deleteMapPointFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, MAP_POINTS_COL, id));
    } catch (e) {
        console.error("Error deleting map point:", e);
    }
};

// --- CHECKPOINTS SERVICES ---

export const updateCheckpointPosition = async (id: string, x: number, y: number) => {
    try {
        await setDoc(doc(db, CHECKPOINTS_COL, id), { x, y }, { merge: true });
    } catch (e) {
        console.error("Error updating checkpoint position:", e);
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

export const generateMonthlyBills = async (month: string, dueDate: string, items: any[]) => {
    try {
        const housesSnap = await getDocs(collection(db, HOUSES_COL));
        const batch = writeBatch(db);
        
        housesSnap.docs.forEach(houseDoc => {
            const house = houseDoc.data();
            if (house.status === 'Occupied') {
                const billRef = doc(collection(db, BILLS_COL));
                const total = items.reduce((acc, item) => acc + item.amount, 0);
                
                batch.set(billRef, deepSanitize({
                    houseId: houseDoc.id,
                    month,
                    dueDate,
                    items: items.map(item => ({ ...item, status: 'Unpaid' })),
                    total,
                    createdAt: new Date().toISOString()
                }));
            }
        });
        
        await batch.commit();
        return true;
    } catch (e) {
        console.error("Error generating monthly bills:", e);
        return false;
    }
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

export const deepSanitize = (data: any, seen = new WeakSet(), depth = 0): any => {
  // Prevent infinite recursion with a safety depth limit
  if (depth > 20) return "[Depth Limit]";
  
  if (data === null || data === undefined) return data;
  
  // Handle non-objects
  if (typeof data !== 'object') return data;
  
  // Handle Dates
  if (data instanceof Date) return data.toISOString();

  // Handle circular references
  if (seen.has(data)) return "[Circular]";
  
  // Avoid complex objects like Google Maps, DOM elements, or React elements
  try {
    const constructor = data.constructor;
    const constructorName = constructor?.name;
    
    // Detect internal/complex objects
    const isComplex = 
      data.nodeType || 
      data instanceof Element ||
      (typeof window !== 'undefined' && (
        data instanceof window.Node || 
        data instanceof window.Window || 
        data instanceof window.Document ||
        (window.Image && data instanceof window.Image)
      )) ||
      data.$$typeof || // React element
      (typeof constructorName === 'string' && (
        /^(Y2|Ka|Map|Marker|google|HTML|Window|Document|__)/i.test(constructorName) ||
        // Minified classes are often 1-2 chars
        (constructorName.length <= 2 && /^[A-Z]/.test(constructorName))
      )) ||
      data.gm_bindings_ || 
      data.gm_accessors_ ||
      data.__gm ||
      (typeof constructor === 'function' && (
        constructor.toString().includes('google.maps') ||
        constructor.toString().includes('gm_')
      )) ||
      data instanceof Promise ||
      typeof data.then === 'function' ||
      data instanceof Error ||
      data instanceof Map ||
      data instanceof Set ||
      data instanceof File ||
      data instanceof Blob ||
      data instanceof ArrayBuffer ||
      ArrayBuffer.isView(data);

    if (isComplex) return undefined;
  } catch (e) {
    return undefined;
  }

  seen.add(data);

  if (Array.isArray(data)) {
    return data
      .map(item => deepSanitize(item, seen, depth + 1))
      .filter(i => i !== undefined);
  }

  const clean: any = {};
  try {
    const keys = Object.keys(data);
    for (const key of keys) {
      // Skip internal properties
      if (key.startsWith('_') || key.startsWith('__') || key.startsWith('$')) continue;
      
      try {
        const value = data[key];
        if (value === undefined || typeof value === 'function') continue;
        
        // Extra check for 'src' property which often causes circularity in DOM/Image objects
        if (key === 'src' && typeof value === 'object') continue;

        const sanitized = deepSanitize(value, seen, depth + 1);
        if (sanitized !== undefined) {
          clean[key] = sanitized;
        }
      } catch (e) {
        // Skip properties that throw on access
      }
    }
  } catch (e) {
    return "[Complex Object]";
  }
  
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

export const deleteNotificationFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, NOTIFICATIONS_COL, id)); } catch (e) { console.error("Error deleting notification:", e); }
};

export const markNotificationAsRead = async (id: string) => {
    try { await updateDoc(doc(db, NOTIFICATIONS_COL, id), { isRead: true }); } catch (e) { console.error("Error marking notification as read:", e); }
};

export const sendPanicAlert = async (houseId: string, residentName: string, location: string, locationCoords?: { x: number, y: number }) => {
    try {
        const timestamp = new Date().toISOString();
        const notification = {
            title: "🚨 DARURAT (PANIC BUTTON)",
            message: `Warga ${residentName} (Blok ${location}) menekan tombol darurat! Segera cek lokasi!`,
            date: timestamp,
            type: 'Alert',
            target: 'All',
            isRead: false
        };
        await addNotificationToDb(notification);
        
        // Add to panic alerts collection for real-time tracking
        await addDoc(collection(db, PANIC_ALERTS_COL), {
            houseId,
            residentName,
            location,
            locationCoords,
            timestamp,
            status: 'Active'
        });
        
        // Also log it to reports for record
        await addDoc(collection(db, REPORTS_COL), {
            type: 'Keamanan',
            description: `[PANIC BUTTON] Warga menekan tombol darurat dari Blok ${location}`,
            reporterName: residentName,
            reporterHouseId: houseId,
            date: timestamp,
            status: 'Baru'
        });
        
        return true;
    } catch (e) {
        console.error("Error sending panic alert:", e);
        return false;
    }
};

export const subscribeToActivePanicAlerts = (callback: (data: any[]) => void) => {
    const q = query(collection(db, PANIC_ALERTS_COL), where("status", "in", ["Active", "Responding"]));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

export const updatePanicAlertStatus = async (id: string, status: string, responderName?: string) => {
    try {
        const updateData: any = { status };
        if (responderName) updateData.responderName = responderName;
        if (status === 'Resolved') updateData.resolvedAt = new Date().toISOString();
        await updateDoc(doc(db, PANIC_ALERTS_COL, id), updateData);
    } catch (e) { console.error("Error updating panic alert:", e); }
};

// --- UPDATE REQUESTS SERVICES ---
export const subscribeToUpdateRequests = (callback: (data: any[]) => void) => {
    const q = query(collection(db, UPDATE_REQUESTS_COL), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to update requests:", error);
        // Fallback
        const qSimple = query(collection(db, UPDATE_REQUESTS_COL));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(data);
        });
    });
};

export const subscribeToHouseUpdateRequests = (houseId: string, callback: (data: any[]) => void) => {
    const q = query(
        collection(db, UPDATE_REQUESTS_COL), 
        where("houseId", "==", houseId)
    );
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(data);
    }, (error) => {
        console.error("Error subscribing to house update requests:", error);
    });
};

export const addUpdateRequest = async (data: any) => {
    return await addDoc(collection(db, UPDATE_REQUESTS_COL), {
        ...deepSanitize(data),
        status: 'Pending',
        createdAt: new Date().toISOString()
    });
};

export const updateRequestStatus = async (id: string, status: 'Approved' | 'Rejected', notes?: string) => {
    const docRef = doc(db, UPDATE_REQUESTS_COL, id);
    return await updateDoc(docRef, { 
        status, 
        notes,
        updatedAt: new Date().toISOString()
    });
};

// --- GUEST REPORTS FOR RESIDENT ---
export const subscribeToHouseGuestReports = (houseId: string, callback: (data: any[]) => void) => {
    const q = query(
        collection(db, GUEST_REPORTS_COL), 
        where("residentHouseId", "==", houseId)
    );
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Sort on client side to avoid composite index requirement
        data.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        callback(data);
    }, (error) => {
        console.error("Error subscribing to house guest reports:", error);
        // Fallback
        const qSimple = query(collection(db, GUEST_REPORTS_COL), where("residentHouseId", "==", houseId));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(data);
        });
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

export const formatHouseId = (houseId: string): string => {
    if (!houseId) return '';
    
    // Remove spaces and convert to uppercase
    let formatted = houseId.toUpperCase().replace(/\s+/g, '');
    
    // If it doesn't have a hyphen, try to insert one between block and number
    if (!formatted.includes('-')) {
        // Match pattern like C108 or C1008 or C18
        // We assume block is [A-Z]+ followed by some digits, and number is the last 1 or 2 digits
        const match = formatted.match(/^([A-Z]+\d+?)(\d{1,2})$/);
        if (match) {
            formatted = `${match[1]}-${match[2]}`;
        } else {
            // Fallback for simple patterns like C8
            const match2 = formatted.match(/^([A-Z]+)(\d+)$/);
            if (match2) {
                formatted = `${match2[1]}-${match2[2]}`;
            } else {
                // Another fallback for patterns like C10-08A (ignoring suffix for matching)
                const match3 = formatted.match(/^([A-Z]+\d+?)(\d{1,2})([A-Z]+)$/);
                if (match3) {
                    formatted = `${match3[1]}-${match3[2]}`;
                }
            }
        }
    }

    const parts = formatted.split('-');
    if (parts.length >= 2) {
        const block = parts[0];
        let num = parts[1];
        // Ensure number is 2 digits
        if (num.length === 1) {
            num = `0${num}`;
        } else if (num.length > 2) {
            // If someone entered C10-008, take last 2 digits
            num = num.slice(-2);
        }
        return `${block}-${num}`;
    }
    
    return formatted;
};

/**
 * Mendapatkan label tampilan rumah yang ramah pengguna (misal: Blok C10 No. 08)
 */
export const getHouseDisplayLabel = (houseId: string, houses?: any[]): string => {
    if (!houseId) return '-';
    const formattedId = formatHouseId(houseId);
    
    if (houses) {
        const house = houses.find(h => formatHouseId(h.id) === formattedId);
        if (house && house.block && house.number) {
            return `Blok ${house.block} No. ${house.number}`;
        }
    }

    // Fallback: Parse from ID string (e.g. C10-08)
    const parts = formattedId.split('-');
    if (parts.length === 2) {
        return `Blok ${parts[0]} No. ${parts[1]}`;
    }
    
    return `Blok ${formattedId}`;
};

export const validateResidentAccess = async (houseId: string, code: string): Promise<boolean> => {
    try {
        const formattedHouseId = formatHouseId(houseId);
        console.log(`Validating access for houseId: ${houseId} -> formatted: ${formattedHouseId}`);
        console.log(`Input code: ${code}`);

        let data: any = null;

        // Try direct document ID first
        const docRef = doc(db, HOUSES_COL, formattedHouseId);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
            data = snapshot.data();
        } else {
            // If not found by ID, try finding by block and number (handles case and padding differences)
            const parts = formattedHouseId.split('-');
            if (parts.length >= 2) {
                const block = parts[0];
                const number = parts[1];
                
                const q = query(collection(db, HOUSES_COL));
                const querySnapshot = await getDocs(q);
                const allHouses = querySnapshot.docs.map(doc => doc.data());
                
                data = allHouses.find(h => {
                    const hBlock = String(h.block || '').toUpperCase().trim();
                    const hNum = String(h.number || '').toUpperCase().trim();
                    const hNumPadded = hNum.length === 1 ? `0${hNum}` : hNum;
                    return hBlock === block && (hNum === number || hNumPadded === number);
                });
            }
        }

        if (data) {
            console.log(`Found house data:`, data);
            
            if (!data.accessCode) return false;

            const dbCodeClean = String(data.accessCode).toUpperCase().replace(/[\s-]+/g, '');
            const inputCodeClean = String(code).toUpperCase().replace(/[\s-]+/g, '');
            
            // Handle both legacy format (C10-08-SHEA) and new format (123456)
            const parts = String(data.accessCode).split('-');
            const suffix = parts.length > 1 ? parts[parts.length - 1] : String(data.accessCode);
            const suffixClean = suffix.toUpperCase().replace(/[\s-]+/g, '');

            // Allow exact match OR if the user only typed the suffix
            // This works for both "123456" === "123456" and "SHEA" === "SHEA"
            const isValid = inputCodeClean.length > 0 && (dbCodeClean === inputCodeClean || suffixClean === inputCodeClean);
            
            console.log(`Validation result: ${isValid}`);
            return isValid;
        } else {
            console.log(`House document not found for ${formattedHouseId}`);
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
    let generatedCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    for (const house of houses) {
       // Hanya generate jika belum ada accessCode, atau accessCode hanya berisi spasi/strip
       if (house.accessCode && house.accessCode.trim() !== '' && house.accessCode.trim() !== '-') continue;

       const newCode = Math.floor(100000 + Math.random() * 900000).toString();
       const ref = doc(db, HOUSES_COL, house.id);
       batch.update(ref, { accessCode: newCode });
       
       operationCount++;
       generatedCount++;
       if (operationCount >= MAX_BATCH_SIZE) await commitBatch();
    }

    if (operationCount > 0) {
      await batch.commit();
    }
    console.log(`Generate PIN massal selesai. ${generatedCount} PIN dibuat.`);
    return generatedCount;
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

export const addIuranPaymentToDb = async (payment: any) => {
    try {
        await addDoc(collection(db, IURAN_PAYMENTS_COL), deepSanitize(payment));
    } catch (e) {
        console.error("Error adding iuran payment:", e);
    }
};

export const subscribeToIuranPayments = (callback: (data: any[]) => void) => {
    const q = query(collection(db, IURAN_PAYMENTS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

export const deleteIuranPaymentFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, IURAN_PAYMENTS_COL, id));
    } catch (e) {
        console.error("Error deleting iuran payment:", e);
    }
};

export const checkWasteRetribution = async (houseId: string): Promise<{ paid: boolean; month: string }> => {
    try {
        const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const q = query(
            collection(db, IURAN_PAYMENTS_COL), 
            where("houseId", "==", houseId),
            where("month", "==", currentMonth)
        );
        const snapshot = await getDocs(q);
        const payments = snapshot.docs.map(doc => doc.data());
        const isPaid = payments.some((p: any) => p.type === 'Sampah' || p.type === 'Both');
        return { paid: isPaid, month: currentMonth };
    } catch (e) {
        console.error("Error checking waste retribution:", e);
        return { paid: false, month: '' };
    }
};

export const updateIuranPaymentInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, IURAN_PAYMENTS_COL, id), deepSanitize(updates));
    } catch (e) {
        console.error("Error updating iuran payment:", e);
    }
};

// --- RESIDENT REGISTRATIONS ---
export const addResidentRegistrationToDb = async (registration: any) => {
    try {
        await addDoc(collection(db, RESIDENT_REGISTRATIONS_COL), deepSanitize(registration));
    } catch (e) {
        console.error("Error adding resident registration:", e);
    }
};

export const subscribeToResidentRegistrations = (callback: (data: ResidentRegistration[]) => void) => {
    const q = query(collection(db, RESIDENT_REGISTRATIONS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ResidentRegistration[];
        callback(data);
    });
};

export const updateResidentRegistrationInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, RESIDENT_REGISTRATIONS_COL, id), deepSanitize(updates));
    } catch (e) {
        console.error("Error updating resident registration:", e);
    }
};

export const deleteResidentRegistrationFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, RESIDENT_REGISTRATIONS_COL, id));
    } catch (e) {
        console.error("Error deleting resident registration:", e);
    }
};

// --- ACTIVITIES SERVICES ---
export const subscribeToActivities = (callback: (data: any[]) => void) => {
    const q = query(collection(db, ACTIVITIES_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to activities:", error);
        const qSimple = query(collection(db, ACTIVITIES_COL));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            callback(data);
        });
    });
};

export const addActivityToDb = async (activity: any) => {
    try {
        const { id, ...data } = activity;
        await addDoc(collection(db, ACTIVITIES_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding activity:", e); }
};

export const updateActivityInDb = async (id: string, updates: any) => {
    try { await updateDoc(doc(db, ACTIVITIES_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating activity:", e); }
};

export const deleteActivityFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, ACTIVITIES_COL, id)); } catch (e) { console.error("Error deleting activity:", e); }
};

// --- ATTENDANCE SERVICES ---
export const subscribeToAttendance = (activityId: string, callback: (data: any[]) => void) => {
    const q = query(collection(db, ATTENDANCE_COL), where("activityId", "==", activityId), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to attendance:", error);
        const qSimple = query(collection(db, ATTENDANCE_COL), where("activityId", "==", activityId));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(data);
        });
    });
};

export const addAttendanceToDb = async (attendance: any) => {
    try {
        const { id, ...data } = attendance;
        await addDoc(collection(db, ATTENDANCE_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding attendance:", e); }
};

export const deleteAttendanceFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, ATTENDANCE_COL, id)); } catch (e) { console.error("Error deleting attendance:", e); }
};

// --- HEALTH RECORDS SERVICES ---
export const subscribeToHealthRecords = (callback: (data: any[]) => void) => {
    const q = query(collection(db, HEALTH_RECORDS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to health records:", error);
        const qSimple = query(collection(db, HEALTH_RECORDS_COL));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            callback(data);
        });
    });
};

export const addHealthRecordToDb = async (record: any) => {
    try {
        const { id, ...data } = record;
        await addDoc(collection(db, HEALTH_RECORDS_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding health record:", e); }
};

export const updateHealthRecordInDb = async (id: string, updates: any) => {
    try { await updateDoc(doc(db, HEALTH_RECORDS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating health record:", e); }
};

export const deleteHealthRecordFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, HEALTH_RECORDS_COL, id)); } catch (e) { console.error("Error deleting health record:", e); }
};

// --- FAQ SERVICES ---
export const subscribeToFAQ = (callback: (data: any[]) => void) => {
    const q = query(collection(db, FAQ_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to FAQ:", error);
    });
};

export const addFAQToDb = async (faq: any) => {
    try {
        const { id, ...data } = faq;
        await addDoc(collection(db, FAQ_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding FAQ:", e); }
};

export const updateFAQInDb = async (id: string, updates: any) => {
    try { await updateDoc(doc(db, FAQ_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating FAQ:", e); }
};

export const deleteFAQFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, FAQ_COL, id)); } catch (e) { console.error("Error deleting FAQ:", e); }
};

// --- EVENTS SERVICES ---
export const subscribeToEvents = (callback: (data: any[]) => void) => {
    const q = query(collection(db, EVENTS_COL), orderBy("date", "asc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to events:", error);
        const qSimple = query(collection(db, EVENTS_COL));
        onSnapshot(qSimple, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            data.sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            callback(data);
        });
    });
};

export const addEventToDb = async (event: any) => {
    try {
        const { id, ...data } = event;
        await addDoc(collection(db, EVENTS_COL), deepSanitize(data));
    } catch (e) { console.error("Error adding event:", e); }
};

export const updateEventInDb = async (id: string, updates: any) => {
    try { await updateDoc(doc(db, EVENTS_COL, id), deepSanitize(updates)); } catch (e) { console.error("Error updating event:", e); }
};

export const deleteEventFromDb = async (id: string) => {
    try { await deleteDoc(doc(db, EVENTS_COL, id)); } catch (e) { console.error("Error deleting event:", e); }
};

// --- 3. CASHFLOW ---
export const addTransactionToDb = async (transaction: any) => {
  try {
    const { id, ...data } = transaction;
    await addDoc(collection(db, CASHFLOW_COL), deepSanitize(data));
    await logAction('Catat Keuangan', `${data.type}: ${data.description} - Rp ${data.amount.toLocaleString()}`);
  } catch (e) { console.error("Error adding transaction:", e); }
};

export const updateTransactionInDb = async (id: string, updates: any) => {
  try { 
    await updateDoc(doc(db, CASHFLOW_COL, id), deepSanitize(updates)); 
    await logAction('Update Keuangan', `Mengubah transaksi ID: ${id}`);
  } catch (e) { console.error("Error updating transaction:", e); }
};

export const deleteTransactionFromDb = async (id: string) => {
  try { 
    await deleteDoc(doc(db, CASHFLOW_COL, id)); 
    await logAction('Hapus Keuangan', `Menghapus transaksi ID: ${id}`);
  } catch (e) { console.error("Error deleting transaction:", e); }
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
    await logAction('Update Laporan', `Mengubah status laporan ID: ${id} menjadi ${status}`);
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

export const updateLetterStatus = async (id: string, status: string, letterNumber?: string) => {
  try { 
    const updates: any = { status };
    if (letterNumber) updates.letterNumber = letterNumber;
    await updateDoc(doc(db, LETTERS_COL, id), updates); 
    await logAction('Update Surat', `Mengubah status surat ID: ${id} menjadi ${status}${letterNumber ? ' (No: ' + letterNumber + ')' : ''}`);
  } catch (e) { console.error("Error updating letter:", e); }
};

export const updateLetterInDb = async (id: string, updates: Partial<LetterRequest>) => {
  try {
    await updateDoc(doc(db, LETTERS_COL, id), deepSanitize(updates));
  } catch (e) { console.error("Error updating letter in DB:", e); }
};

export const deleteLetterFromDb = async (id: string) => {
  try { await deleteDoc(doc(db, LETTERS_COL, id)); } catch (e) { console.error("Error deleting letter:", e); }
};

// --- 6.5 MUTATIONS ---
export const addPopulationLogToDb = async (log: any) => {
  try {
    const { id, ...data } = log;
    await addDoc(collection(db, POPULATION_LOGS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding population log:", e); }
};

export const deletePopulationLogFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, POPULATION_LOGS_COL, id));
  } catch (e) { console.error("Error deleting population log:", e); }
};

export const addPopulationReportToDb = async (report: any) => {
  try {
    const { id, ...data } = report;
    await addDoc(collection(db, "populationReports"), deepSanitize(data));
  } catch (e) { console.error("Error adding population report:", e); }
};

export const deletePopulationReportFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, "populationReports", id));
  } catch (e) { console.error("Error deleting population report:", e); }
};

export const subscribeToPopulationLogs = (callback: (data: any[]) => void) => {
  const q = query(collection(db, POPULATION_LOGS_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to population logs:", error);
    const qSimple = query(collection(db, POPULATION_LOGS_COL));
    onSnapshot(qSimple, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      callback(data);
    });
  });
};

// --- 7. INVENTORY ---
export const addInventoryToDb = async (item: any) => {
    try {
        const { id, ...data } = item;
        await addDoc(collection(db, INVENTORY_COL), deepSanitize(data));
        await logAction('Tambah Inventaris', `Menambahkan barang: ${data.name}`);
    } catch (e) { console.error("Error adding inventory:", e); }
};

export const updateInventoryInDb = async (id: string, updates: any) => {
    try { 
      await updateDoc(doc(db, INVENTORY_COL, id), deepSanitize(updates)); 
      await logAction('Update Inventaris', `Mengubah data barang ID: ${id}`);
    } catch (e) { console.error("Error updating inventory:", e); }
};

export const deleteInventoryFromDb = async (id: string) => {
    try { 
      await deleteDoc(doc(db, INVENTORY_COL, id)); 
      await logAction('Hapus Inventaris', `Menghapus barang ID: ${id}`);
    } catch (e) { console.error("Error deleting inventory:", e); }
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

export const addUMKMOrderToDb = async (order: any) => {
  try {
    const { id, ...data } = order;
    await addDoc(collection(db, UMKM_ORDERS_COL), deepSanitize(data));
  } catch (e) { console.error("Error adding UMKM order:", e); }
};

export const updateUMKMOrderStatus = async (id: string, status: string) => {
  try { await updateDoc(doc(db, UMKM_ORDERS_COL, id), { status }); } catch (e) { console.error("Error updating UMKM order status:", e); }
};

export const subscribeToUMKMOrders = (callback: (data: any[]) => void) => {
  const q = query(collection(db, UMKM_ORDERS_COL), orderBy("orderDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  }, (error) => {
    console.error("Error subscribing to UMKM orders:", error);
    const qSimple = query(collection(db, UMKM_ORDERS_COL));
    onSnapshot(qSimple, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        data.sort((a:any, b:any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        callback(data);
    });
  });
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

export const updatePatrolLocation = async (sessionId: string, x: number, y: number) => {
    try {
        await updateDoc(doc(db, PATROL_SESSIONS_COL, sessionId), { 
            currentLocation: { x, y }
        });
    } catch (e) { console.error("Error updating patrol location:", e); }
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
// --- WASTE BANK SERVICES ---
export const subscribeToWasteDeposits = (callback: (data: any[]) => void) => {
    const q = query(collection(db, WASTE_DEPOSITS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to waste deposits:", error);
    });
};

export const addWasteDepositToDb = async (deposit: any) => {
    try {
        await addDoc(collection(db, WASTE_DEPOSITS_COL), deepSanitize(deposit));
        await logAction("Waste Deposit Created", `Resident: ${deposit.residentName}, Type: ${deposit.type}`);
    } catch (e) {
        console.error("Error adding waste deposit:", e);
        throw e;
    }
};

export const updateWasteDepositStatus = async (id: string, status: 'Confirmed', totalValue: number, houseId: string) => {
    try {
        const batch = writeBatch(db);
        
        // Update deposit status
        const depositRef = doc(db, WASTE_DEPOSITS_COL, id);
        batch.update(depositRef, { status });

        // Update house balance
        const balanceRef = doc(db, WASTE_BALANCES_COL, houseId);
        const balanceSnap = await getDoc(balanceRef);
        
        if (balanceSnap.exists()) {
            batch.update(balanceRef, {
                totalBalance: increment(totalValue),
                lastUpdated: new Date().toISOString()
            });
        } else {
            batch.set(balanceRef, {
                houseId,
                totalBalance: totalValue,
                lastUpdated: new Date().toISOString()
            });
        }

        await batch.commit();
        await logAction("Waste Deposit Confirmed", `ID: ${id}, Value: ${totalValue}`);
    } catch (e) {
        console.error("Error confirming waste deposit:", e);
        throw e;
    }
};

export const deleteWasteDepositFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, WASTE_DEPOSITS_COL, id));
        await logAction("Waste Deposit Deleted", `ID: ${id}`);
    } catch (e) {
        console.error("Error deleting waste deposit:", e);
        throw e;
    }
};

export const subscribeToWastePrices = (callback: (data: any[]) => void) => {
    return onSnapshot(collection(db, WASTE_PRICES_COL), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

export const updateWastePriceInDb = async (id: string, pricePerUnit: number) => {
    try {
        await updateDoc(doc(db, WASTE_PRICES_COL, id), { pricePerUnit });
    } catch (e) {
        console.error("Error updating waste price:", e);
        throw e;
    }
};

export const addWastePriceToDb = async (price: any) => {
    try {
        const { id, ...data } = price;
        await addDoc(collection(db, WASTE_PRICES_COL), deepSanitize(data));
    } catch (e) {
        console.error("Error adding waste price:", e);
        throw e;
    }
};

export const deleteWastePriceFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, WASTE_PRICES_COL, id));
    } catch (e) {
        console.error("Error deleting waste price:", e);
        throw e;
    }
};

export const subscribeToWasteBalance = (houseId: string, callback: (data: any) => void) => {
    return onSnapshot(doc(db, WASTE_BALANCES_COL, houseId), (doc) => {
        if (doc.exists()) {
            callback({ ...doc.data(), id: doc.id });
        } else {
            callback(null);
        }
    });
};

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

      // Seed Map Points
      const mapPointsSnap = await getDocs(collection(db, MAP_POINTS_COL));
      if (mapPointsSnap.empty && initialData.mapPoints && initialData.mapPoints.length > 0) {
          for (const mp of initialData.mapPoints) {
              const { id, ...data } = mp;
              await addDoc(collection(db, MAP_POINTS_COL), deepSanitize(data));
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

      // Seed FAQ
      const faqSnap = await getDocs(collection(db, FAQ_COL));
      if (faqSnap.empty && initialData.faq && initialData.faq.length > 0) {
          for (const f of initialData.faq) {
              const { id, ...data } = f;
              await addDoc(collection(db, FAQ_COL), deepSanitize(data));
          }
      }

      // Seed Events
      const eventsSnap = await getDocs(collection(db, EVENTS_COL));
      if (eventsSnap.empty && initialData.events && initialData.events.length > 0) {
          for (const ev of initialData.events) {
              const { id, ...data } = ev;
              await addDoc(collection(db, EVENTS_COL), deepSanitize(data));
          }
      }

      // Seed Waste Prices
      const wastePricesSnap = await getDocs(collection(db, WASTE_PRICES_COL));
      if (wastePricesSnap.empty && initialData.wastePrices && initialData.wastePrices.length > 0) {
          for (const wp of initialData.wastePrices) {
              const { id, ...data } = wp;
              await addDoc(collection(db, WASTE_PRICES_COL), deepSanitize(data));
          }
      }

    } catch (e) {
      console.error("Seeding/Migration failed:", e);
      throw e;
    }
};