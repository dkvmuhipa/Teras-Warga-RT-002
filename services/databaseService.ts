









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
import { MapPoint, Checkpoint, LetterRequest, ResidentRegistration, RondaSchedule, RondaAttendance, RondaCheckLog, Poll, UMKM, OperationType, FirestoreErrorInfo } from "../types";

export { OperationType, isFirebaseConfigured };

export const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

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
const FCM_TOKENS_COL = "fcmTokens";
const CONFIGS_COL = "configs";

// --- FCM TOKEN SERVICES ---
export const saveFCMToken = async (userId: string, token: string) => {
    try {
        const docRef = doc(db, FCM_TOKENS_COL, userId);
        return await setDoc(docRef, {
            token,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${FCM_TOKENS_COL}/${userId}`);
    }
};

export const getFCMTokens = async () => {
    try {
        const snapshot = await getDocs(collection(db, FCM_TOKENS_COL));
        return snapshot.docs.map(doc => doc.data().token);
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, FCM_TOKENS_COL);
    }
};
export const subscribeToPdfConfig = (callback: (data: any) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const docRef = doc(db, CONFIGS_COL, "pdf");
    return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data().data);
        } else {
            callback(null);
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, `${CONFIGS_COL}/pdf`);
    });
};

export const updatePdfConfig = async (config: any) => {
    try {
        const docRef = doc(db, CONFIGS_COL, "pdf");
        // Use a safer way to ensure a plain object for simple configs
        const cleanData = JSON.parse(JSON.stringify(deepSanitize(config) || {}));
        await setDoc(docRef, {
            type: "pdf",
            data: cleanData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${CONFIGS_COL}/pdf`);
    }
};

export const subscribeToIdeas = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, IDEAS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, IDEAS_COL);
    });
};

export const addIdea = async (data: any) => {
    try {
        return await addDoc(collection(db, IDEAS_COL), {
            ...data,
            date: new Date().toISOString(),
            upvotes: [],
            status: 'Usulan'
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, IDEAS_COL);
    }
};

export const updateIdeaStatus = async (id: string, status: string) => {
    try {
        const docRef = doc(db, IDEAS_COL, id);
        return await updateDoc(docRef, { status });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${IDEAS_COL}/${id}`);
    }
};

export const toggleUpvoteIdea = async (id: string, houseId: string) => {
    try {
        const docRef = doc(db, IDEAS_COL, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const upvotes = docSnap.data().upvotes || [];
            const newUpvotes = upvotes.includes(houseId) 
                ? upvotes.filter((hid: string) => hid !== houseId)
                : [...upvotes, houseId];
            return await updateDoc(docRef, { upvotes: newUpvotes });
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${IDEAS_COL}/${id}`);
    }
};

// --- DONATIONS SERVICES ---
export const subscribeToDonationCampaigns = (callback: (data: any[]) => void) => {
    const q = query(collection(db, DONATION_CAMPAIGNS_COL), orderBy("startDate", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, DONATION_CAMPAIGNS_COL);
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
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, DONATION_RECORDS_COL);
    });
};

export const addDonationCampaign = async (data: any) => {
    try {
        return await addDoc(collection(db, DONATION_CAMPAIGNS_COL), {
            ...data,
            currentAmount: 0,
            startDate: new Date().toISOString(),
            status: 'Aktif'
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, DONATION_CAMPAIGNS_COL);
    }
};

export const addDonationRecord = async (data: any) => {
    try {
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
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, DONATION_RECORDS_COL);
    }
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
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, AUDIT_LOGS_COL);
    }
};

export const subscribeToAuditLogs = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, AUDIT_LOGS_COL), orderBy("timestamp", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, AUDIT_LOGS_COL);
    });
};

// --- INVENTORY LOGS SERVICES ---
export const subscribeToInventoryLogs = (callback: (data: any[]) => void) => {
    const q = query(collection(db, INVENTORY_LOGS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, INVENTORY_LOGS_COL);
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
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, INVENTORY_LOGS_COL);
    }
};

export const updateInventoryLogStatus = async (id: string, status: 'Borrowed' | 'Returned') => {
    try {
        await updateDoc(doc(db, INVENTORY_LOGS_COL, id), { status });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${INVENTORY_LOGS_COL}/${id}`);
    }
};

export const deleteInventoryLogFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, INVENTORY_LOGS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${INVENTORY_LOGS_COL}/${id}`);
    }
};

// --- GUEST REPORTS SERVICES ---
export const subscribeToGuestReports = (callback: (data: any[]) => void) => {
    const q = query(collection(db, GUEST_REPORTS_COL), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, GUEST_REPORTS_COL);
    });
};

export const addGuestReportToDb = async (data: any) => {
    try {
        await addDoc(collection(db, GUEST_REPORTS_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, GUEST_REPORTS_COL);
    }
};

export const updateGuestReportStatus = async (id: string, status: 'Active' | 'Departed') => {
    try {
        await updateDoc(doc(db, GUEST_REPORTS_COL, id), { status });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${GUEST_REPORTS_COL}/${id}`);
    }
};

export const deleteGuestReportFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, GUEST_REPORTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${GUEST_REPORTS_COL}/${id}`);
    }
};

// --- DOCUMENTS SERVICES ---
export const subscribeToDocuments = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, DOCUMENTS_COL), orderBy("uploadDate", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, DOCUMENTS_COL);
    });
};

export const addDocumentToDb = async (docData: any) => {
    try {
        const { id, ...data } = docData;
        await addDoc(collection(db, DOCUMENTS_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, DOCUMENTS_COL);
    }
};

export const deleteDocumentFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, DOCUMENTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${DOCUMENTS_COL}/${id}`);
    }
};

// --- CHECKPOINTS SERVICES ---
export const subscribeToCheckpoints = (callback: (data: Checkpoint[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, CHECKPOINTS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Checkpoint));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, CHECKPOINTS_COL);
    });
};

export const addCheckpointToDb = async (checkpoint: Omit<Checkpoint, 'id'>) => {
    try {
        await addDoc(collection(db, CHECKPOINTS_COL), deepSanitize(checkpoint));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, CHECKPOINTS_COL);
    }
};

export const updateCheckpointInDb = async (id: string, data: Partial<Checkpoint>) => {
    try {
        await updateDoc(doc(db, CHECKPOINTS_COL, id), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${CHECKPOINTS_COL}/${id}`);
    }
};

export const deleteCheckpointFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, CHECKPOINTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${CHECKPOINTS_COL}/${id}`);
    }
};

// --- MAP POINTS SERVICES ---
export const subscribeToMapPoints = (callback: (data: MapPoint[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, MAP_POINTS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MapPoint));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, MAP_POINTS_COL);
    });
};

export const addMapPointToDb = async (point: Partial<MapPoint>) => {
    try {
        await addDoc(collection(db, MAP_POINTS_COL), deepSanitize(point));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, MAP_POINTS_COL);
    }
};

export const updateMapPointInDb = async (id: string, point: Partial<MapPoint>) => {
    try {
        const { id: _, ...data } = point;
        await setDoc(doc(db, MAP_POINTS_COL, id), deepSanitize(data), { merge: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${MAP_POINTS_COL}/${id}`);
    }
};

export const deleteMapPointFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, MAP_POINTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${MAP_POINTS_COL}/${id}`);
    }
};

// --- CHECKPOINTS SERVICES ---

export const updateCheckpointPosition = async (id: string, x: number, y: number) => {
    try {
        await setDoc(doc(db, CHECKPOINTS_COL, id), { x, y }, { merge: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${CHECKPOINTS_COL}/${id}`);
    }
};


// --- BILLS SERVICES ---
export const addBillToDb = async (bill: any) => {
    try {
        const { id, ...data } = bill;
        await addDoc(collection(db, BILLS_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, BILLS_COL);
    }
};

export const updateBillInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, BILLS_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${BILLS_COL}/${id}`);
    }
};

export const deleteBillFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, BILLS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${BILLS_COL}/${id}`);
    }
};

export const subscribeToBills = (callback: (data: any[]) => void) => {
    const q = query(collection(db, BILLS_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, BILLS_COL);
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
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, BILLS_COL);
        return false;
    }
};
export const getPlaceholderImage = (keyword: string = 'community', width: number = 800, height: number = 600) => {
  return `https://picsum.photos/seed/${keyword}/${width}/${height}`;
};

export const uploadImageToStorage = async (file: File, path: string) => {
  if (!isFirebaseConfigured || !storage) {
    console.warn("Firebase Storage is not configured. Using placeholder instead.");
    return getPlaceholderImage(path.split('/')[0]);
  }
  
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Storage upload failed:", error);
    // Instead of throwing, we can return a placeholder to keep the app functional
    // but we should probably inform the user.
    return getPlaceholderImage(path.split('/')[0]);
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
  if (!isFirebaseConfigured || !db) {
    console.warn(`Firebase not configured, skipping subscription to ${colName}`);
    return () => {};
  }
  const q = query(collection(db, colName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, colName);
  });
};

// --- OPTIMIZED REPORT SUBSCRIBE ---
export const subscribeToActiveReports = (callback: (data: any[]) => void) => {
  if (!isFirebaseConfigured || !db) return () => {};
  // Query only 'Baru' or 'Diproses' status
  const q = query(collection(db, REPORTS_COL), where('status', 'in', ['Baru', 'Diproses']));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COL);
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
    handleFirestoreError(error, OperationType.LIST, NOTIFICATIONS_COL);
  });
};

export const addNotificationToDb = async (notification: any) => {
    try {
        const { id, ...data } = notification;
        await addDoc(collection(db, NOTIFICATIONS_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, NOTIFICATIONS_COL);
    }
};

export const deleteNotificationFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, NOTIFICATIONS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${NOTIFICATIONS_COL}/${id}`);
    }
};

export const markNotificationAsRead = async (id: string) => {
    try {
        await updateDoc(doc(db, NOTIFICATIONS_COL, id), { isRead: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${NOTIFICATIONS_COL}/${id}`);
    }
};

export const sendPanicAlert = async (houseId: string, residentName: string, location: string, locationCoords?: { x: number, y: number }) => {
    if (!isFirebaseConfigured) {
        return "Firebase belum terkonfigurasi dengan benar. Hubungi admin.";
    }
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

        // Trigger Push Notifications
        try {
            const tokens = await getFCMTokens();
            if (tokens && tokens.length > 0) {
                fetch('/api/push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tokens,
                        notification: {
                            title: "🚨 DARURAT (PANIC BUTTON)",
                            body: `Warga ${residentName} (Blok ${location}) menekan tombol darurat! Segera cek lokasi!`
                        },
                        data: {
                            type: 'PanicAlert',
                            houseId,
                            location
                        }
                    })
                }).catch(err => {
                    // Non-critical error, just log
                    console.warn("Push API fetch error:", err);
                });
            }
        } catch (error) {
            // Non-critical error, just log
            console.warn("Error triggering push notifications:", error);
        }
        
        return true;
    } catch (error: any) {
        handleFirestoreError(error, OperationType.WRITE, PANIC_ALERTS_COL);
        return error.message || "Gagal mengirim sinyal darurat.";
    }
};

export const subscribeToActivePanicAlerts = (callback: (data: any[]) => void) => {
    const q = query(collection(db, PANIC_ALERTS_COL), where("status", "in", ["Active", "Responding"]));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, PANIC_ALERTS_COL);
    });
};

export const updatePanicAlertStatus = async (id: string, status: string, responderName?: string) => {
    try {
        const updateData: any = { status };
        if (responderName) updateData.responderName = responderName;
        if (status === 'Resolved') updateData.resolvedAt = new Date().toISOString();
        await updateDoc(doc(db, PANIC_ALERTS_COL, id), updateData);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${PANIC_ALERTS_COL}/${id}`);
    }
};

// --- UPDATE REQUESTS SERVICES ---
export const subscribeToUpdateRequests = (callback: (data: any[]) => void) => {
    const q = query(collection(db, UPDATE_REQUESTS_COL), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, UPDATE_REQUESTS_COL);
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
        handleFirestoreError(error, OperationType.LIST, UPDATE_REQUESTS_COL);
    });
};

export const addUpdateRequest = async (data: any) => {
    try {
        return await addDoc(collection(db, UPDATE_REQUESTS_COL), {
            ...deepSanitize(data),
            status: 'Menunggu',
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, UPDATE_REQUESTS_COL);
    }
};

export const updateRequestStatus = async (id: string, status: 'Disetujui' | 'Ditolak', notes?: string) => {
    try {
        const docRef = doc(db, UPDATE_REQUESTS_COL, id);
        return await updateDoc(docRef, { 
            status, 
            notes,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${UPDATE_REQUESTS_COL}/${id}`);
    }
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
        handleFirestoreError(error, OperationType.LIST, GUEST_REPORTS_COL);
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
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, HOUSES_COL);
  }
};

export const updateHouseData = async (id: string, updates: any) => {
    try {
      const houseRef = doc(db, HOUSES_COL, id);
      await updateDoc(houseRef, deepSanitize(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${HOUSES_COL}/${id}`);
    }
};

export const deleteHouseFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, HOUSES_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${HOUSES_COL}/${id}`);
  }
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

export const checkHouseOccupied = async (houseId: string): Promise<boolean> => {
    try {
        const formattedHouseId = formatHouseId(houseId);
        const docRef = doc(db, HOUSES_COL, formattedHouseId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            // A house is considered occupied if it has a headOfFamily or an accessCode
            return !!(data.headOfFamily || data.accessCode);
        }
        return false;
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${HOUSES_COL}/${formatHouseId(houseId)}`);
        return false;
    }
};

export const checkHouseExists = async (houseId: string): Promise<boolean> => {
    try {
        const formattedHouseId = formatHouseId(houseId);
        const docRef = doc(db, HOUSES_COL, formattedHouseId);
        const snapshot = await getDoc(docRef);
        return snapshot.exists();
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${HOUSES_COL}/${formatHouseId(houseId)}`);
        return false;
    }
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
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, HOUSES_COL);
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
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, HOUSES_COL);
    throw error;
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, HOUSES_COL);
    throw error;
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, HOUSES_COL);
    throw error;
  }
};

// --- 2. ANNOUNCEMENTS ---
export const addAnnouncementToDb = async (announcement: any) => {
  try {
    const { id, ...data } = announcement; 
    await addDoc(collection(db, ANNOUNCEMENTS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ANNOUNCEMENTS_COL);
  }
};

export const deleteAnnouncementFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, ANNOUNCEMENTS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ANNOUNCEMENTS_COL}/${id}`);
  }
};

export const updateAnnouncementInDb = async (id: string, updates: any) => {
  try {
    await updateDoc(doc(db, ANNOUNCEMENTS_COL, id), deepSanitize(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ANNOUNCEMENTS_COL}/${id}`);
  }
};

export const addIuranPaymentToDb = async (payment: any) => {
    try {
        await addDoc(collection(db, IURAN_PAYMENTS_COL), deepSanitize(payment));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, IURAN_PAYMENTS_COL);
    }
};

export const subscribeToIuranPayments = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, IURAN_PAYMENTS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, IURAN_PAYMENTS_COL);
    });
};

export const deleteIuranPaymentFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, IURAN_PAYMENTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${IURAN_PAYMENTS_COL}/${id}`);
    }
};

export const checkWasteRetribution = async (houseId: string): Promise<{ paid: boolean; month: string; isMandatory: boolean; dayOfMonth: number }> => {
    try {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const currentMonth = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        // Mandatory check starts from the 20th of the month
        const isMandatory = dayOfMonth >= 20;

        // Simplify query to avoid composite index requirement
        const q = query(
            collection(db, IURAN_PAYMENTS_COL), 
            where("houseId", "==", houseId)
        );
        const snapshot = await getDocs(q);
        const payments = snapshot.docs.map(doc => doc.data());
        // Filter by month on client side
        const currentMonthPayments = payments.filter((p: any) => p.month === currentMonth);
        
        const hasPaidSampah = currentMonthPayments.some((p: any) => p.type === 'Sampah' || p.type === 'Both');
        const hasPaidAir = currentMonthPayments.some((p: any) => p.type === 'Air' || p.type === 'Both');
        
        const isPaid = hasPaidSampah && hasPaidAir;
        
        return { 
            paid: isPaid, 
            month: currentMonth, 
            isMandatory, 
            dayOfMonth 
        };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, IURAN_PAYMENTS_COL);
        return { paid: false, month: '', isMandatory: false, dayOfMonth: 1 };
    }
};

export const updateIuranPaymentInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, IURAN_PAYMENTS_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${IURAN_PAYMENTS_COL}/${id}`);
    }
};

// --- RESIDENT REGISTRATIONS ---
export const addResidentRegistrationToDb = async (registration: any) => {
    try {
        await addDoc(collection(db, RESIDENT_REGISTRATIONS_COL), deepSanitize(registration));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, RESIDENT_REGISTRATIONS_COL);
    }
};

export const subscribeToResidentRegistrations = (callback: (data: ResidentRegistration[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, RESIDENT_REGISTRATIONS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ResidentRegistration[];
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, RESIDENT_REGISTRATIONS_COL);
    });
};

export const updateResidentRegistrationInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, RESIDENT_REGISTRATIONS_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${RESIDENT_REGISTRATIONS_COL}/${id}`);
    }
};

export const deleteResidentRegistrationFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, RESIDENT_REGISTRATIONS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${RESIDENT_REGISTRATIONS_COL}/${id}`);
    }
};

// --- ACTIVITIES SERVICES ---
export const subscribeToActivities = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, ACTIVITIES_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, ACTIVITIES_COL);
    });
};

export const addActivityToDb = async (activity: any) => {
    try {
        const { id, ...data } = activity;
        await addDoc(collection(db, ACTIVITIES_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, ACTIVITIES_COL);
    }
};

export const updateActivityInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, ACTIVITIES_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${ACTIVITIES_COL}/${id}`);
    }
};

export const deleteActivityFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, ACTIVITIES_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${ACTIVITIES_COL}/${id}`);
    }
};

// --- ATTENDANCE SERVICES ---
export const subscribeToAttendance = (activityId: string, callback: (data: any[]) => void) => {
    // Simplify query to avoid composite index requirement (where + orderBy)
    const q = query(collection(db, ATTENDANCE_COL), where("activityId", "==", activityId));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Sort on client side
        data.sort((a: any, b: any) => {
            const dateA = new Date(a.timestamp || 0).getTime();
            const dateB = new Date(b.timestamp || 0).getTime();
            return dateB - dateA;
        });
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COL);
    });
};

export const addAttendanceToDb = async (attendance: any) => {
    try {
        const { id, ...data } = attendance;
        await addDoc(collection(db, ATTENDANCE_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, ATTENDANCE_COL);
    }
};

export const deleteAttendanceFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, ATTENDANCE_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${ATTENDANCE_COL}/${id}`);
    }
};

// --- HEALTH RECORDS SERVICES ---
export const subscribeToHealthRecords = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, HEALTH_RECORDS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, HEALTH_RECORDS_COL);
    });
};

export const addHealthRecordToDb = async (record: any) => {
    try {
        const { id, ...data } = record;
        await addDoc(collection(db, HEALTH_RECORDS_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, HEALTH_RECORDS_COL);
    }
};

export const updateHealthRecordInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, HEALTH_RECORDS_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${HEALTH_RECORDS_COL}/${id}`);
    }
};

export const deleteHealthRecordFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, HEALTH_RECORDS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${HEALTH_RECORDS_COL}/${id}`);
    }
};

// --- FAQ SERVICES ---
export const subscribeToFAQ = (callback: (data: any[]) => void) => {
    const q = query(collection(db, FAQ_COL));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, FAQ_COL);
    });
};

export const addFAQToDb = async (faq: any) => {
    try {
        const { id, ...data } = faq;
        await addDoc(collection(db, FAQ_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, FAQ_COL);
    }
};

export const updateFAQInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, FAQ_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${FAQ_COL}/${id}`);
    }
};

export const deleteFAQFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, FAQ_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${FAQ_COL}/${id}`);
    }
};

// --- EVENTS SERVICES ---
export const subscribeToEvents = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, EVENTS_COL), orderBy("date", "asc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, EVENTS_COL);
    });
};

export const addEventToDb = async (event: any) => {
    try {
        const { id, ...data } = event;
        await addDoc(collection(db, EVENTS_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, EVENTS_COL);
    }
};

export const updateEventInDb = async (id: string, updates: any) => {
    try {
        await updateDoc(doc(db, EVENTS_COL, id), deepSanitize(updates));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${EVENTS_COL}/${id}`);
    }
};

export const deleteEventFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, EVENTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COL}/${id}`);
    }
};

// --- 3. CASHFLOW ---
export const addTransactionToDb = async (transaction: any) => {
  try {
    const { id, ...data } = transaction;
    await addDoc(collection(db, CASHFLOW_COL), deepSanitize(data));
    await logAction('Catat Keuangan', `${data.type}: ${data.description} - Rp ${data.amount.toLocaleString()}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CASHFLOW_COL);
  }
};

export const updateTransactionInDb = async (id: string, updates: any) => {
  try { 
    await updateDoc(doc(db, CASHFLOW_COL, id), deepSanitize(updates)); 
    await logAction('Update Keuangan', `Mengubah transaksi ID: ${id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASHFLOW_COL}/${id}`);
  }
};

export const deleteTransactionFromDb = async (id: string) => {
  try { 
    await deleteDoc(doc(db, CASHFLOW_COL, id)); 
    await logAction('Hapus Keuangan', `Menghapus transaksi ID: ${id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CASHFLOW_COL}/${id}`);
  }
};

// --- 4. OFFICIALS ---
export const addOfficialToDb = async (official: any) => {
  try {
    const { id, ...data } = official;
    await addDoc(collection(db, OFFICIALS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, OFFICIALS_COL);
  }
};

export const updateOfficialInDb = async (id: string, updates: any) => {
  try {
    await updateDoc(doc(db, OFFICIALS_COL, id), deepSanitize(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${OFFICIALS_COL}/${id}`);
  }
};

export const deleteOfficialFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, OFFICIALS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OFFICIALS_COL}/${id}`);
  }
};

// --- 5. REPORTS ---
export const subscribeToHouseReports = (houseId: string, callback: (data: any[]) => void) => {
    // Simplify query to avoid composite index requirement (where + orderBy)
    const q = query(
        collection(db, REPORTS_COL), 
        where("reporterHouseId", "==", houseId)
    );
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Sort on client side
        data.sort((a: any, b: any) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
        });
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, REPORTS_COL);
    });
};

export const addReportToDb = async (report: any) => {
  try {
    const { id, ...data } = report;
    await addDoc(collection(db, REPORTS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REPORTS_COL);
  }
};

export const updateReportStatus = async (id: string, status: string) => {
  try {
    await updateDoc(doc(db, REPORTS_COL, id), { status });
    await logAction('Update Laporan', `Mengubah status laporan ID: ${id} menjadi ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COL}/${id}`);
  }
};

export const archiveOldReports = async (days: number = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString();

    // Simplify query to avoid composite index requirement
    const q = query(collection(db, REPORTS_COL), where("status", "==", "Selesai"));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if ((data.date || '') < cutoffStr && !data.archived) {
        batch.update(doc.ref, { archived: true });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, REPORTS_COL);
    return 0;
  }
};

export const deleteReportFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, REPORTS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REPORTS_COL}/${id}`);
  }
};

// --- 6. LETTERS ---
export const addLetterToDb = async (letter: any) => {
  try {
    const { id, ...data } = letter;
    await addDoc(collection(db, LETTERS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, LETTERS_COL);
  }
};

export const updateLetterStatus = async (id: string, status: string, letterNumber?: string) => {
  try { 
    const updates: any = { status };
    if (letterNumber) updates.letterNumber = letterNumber;
    await updateDoc(doc(db, LETTERS_COL, id), updates); 
    await logAction('Update Surat', `Mengubah status surat ID: ${id} menjadi ${status}${letterNumber ? ' (No: ' + letterNumber + ')' : ''}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${LETTERS_COL}/${id}`);
  }
};

export const updateLetterInDb = async (id: string, updates: Partial<LetterRequest>) => {
  try {
    await updateDoc(doc(db, LETTERS_COL, id), deepSanitize(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${LETTERS_COL}/${id}`);
  }
};

export const archiveOldLetters = async (days: number = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString();

    // Simplify query to avoid composite index requirement
    const q = query(collection(db, LETTERS_COL), where("status", "in", ["Disetujui", "Ditolak"]));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if ((data.date || '') < cutoffStr && !data.archived) {
        batch.update(doc.ref, { archived: true });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, LETTERS_COL);
    return 0;
  }
};

export const deleteLetterFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, LETTERS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${LETTERS_COL}/${id}`);
  }
};

// --- 6.5 MUTATIONS ---
export const addPopulationLogToDb = async (log: any) => {
  try {
    const { id, ...data } = log;
    await addDoc(collection(db, POPULATION_LOGS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, POPULATION_LOGS_COL);
  }
};

export const updatePopulationLogToDb = async (id: string, updates: any) => {
  try {
    const { id: _, ...data } = updates;
    await updateDoc(doc(db, POPULATION_LOGS_COL, id), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${POPULATION_LOGS_COL}/${id}`);
  }
};

export const deletePopulationLogFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, POPULATION_LOGS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${POPULATION_LOGS_COL}/${id}`);
  }
};

export const addPopulationReportToDb = async (report: any) => {
  try {
    const { id, ...data } = report;
    await addDoc(collection(db, "populationReports"), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "populationReports");
  }
};

export const updatePopulationReportToDb = async (id: string, updates: any) => {
  try {
    const { id: _, ...data } = updates;
    await updateDoc(doc(db, "populationReports", id), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `populationReports/${id}`);
  }
};

export const deletePopulationReportFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, "populationReports", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `populationReports/${id}`);
  }
};

export const subscribeToPopulationLogs = (callback: (data: any[]) => void) => {
  const q = query(collection(db, POPULATION_LOGS_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, POPULATION_LOGS_COL);
  });
};

// --- 7. INVENTORY ---
export const addInventoryToDb = async (item: any) => {
    try {
        const { id, ...data } = item;
        await addDoc(collection(db, INVENTORY_COL), deepSanitize(data));
        await logAction('Tambah Inventaris', `Menambahkan barang: ${data.name}`);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, INVENTORY_COL);
    }
};

export const updateInventoryInDb = async (id: string, updates: any) => {
    try { 
      await updateDoc(doc(db, INVENTORY_COL, id), deepSanitize(updates)); 
      await logAction('Update Inventaris', `Mengubah data barang ID: ${id}`);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${INVENTORY_COL}/${id}`);
    }
};

export const deleteInventoryFromDb = async (id: string) => {
    try { 
      await deleteDoc(doc(db, INVENTORY_COL, id)); 
      await logAction('Hapus Inventaris', `Menghapus barang ID: ${id}`);
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${INVENTORY_COL}/${id}`);
    }
};

// --- 8. RONDA ---
export const updateRondaSchedule = async (id: string, members: string[]) => {
    try {
        await updateDoc(doc(db, RONDA_COL, id), { members });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${RONDA_COL}/${id}`);
    }
};

export const updateRondaScheduleFull = async (id: string, data: Partial<RondaSchedule>) => {
    try {
        const { id: _, ...cleanData } = data;
        await updateDoc(doc(db, RONDA_COL, id), deepSanitize(cleanData));
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${RONDA_COL}/${id}`);
    }
};

export const addRondaAttendance = async (data: Omit<RondaAttendance, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, "rondaAttendance"), deepSanitize(data));
        return docRef.id;
    } catch (error) { 
        handleFirestoreError(error, OperationType.CREATE, "rondaAttendance");
        return null;
    }
};

export const getRondaAttendance = (callback: (data: RondaAttendance[]) => void) => {
    const q = query(collection(db, "rondaAttendance"), orderBy('date', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RondaAttendance));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "rondaAttendance");
    });
};

export const updateRondaShifts = async (id: string, shifts: any[]) => {
    try {
        await updateDoc(doc(db, RONDA_COL, id), { shifts });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${RONDA_COL}/${id}`);
    }
};

export const addRondaSwapRequest = async (request: any) => {
    try {
        await addDoc(collection(db, "rondaSwapRequests"), deepSanitize(request));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "rondaSwapRequests");
    }
};

export const updateRondaSwapRequestStatus = async (id: string, status: string) => {
    try {
        await updateDoc(doc(db, "rondaSwapRequests", id), { status });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `rondaSwapRequests/${id}`);
    }
};

export const subscribeToRondaSwapRequests = (callback: (data: any[]) => void) => {
    const q = query(collection(db, "rondaSwapRequests"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "rondaSwapRequests");
    });
};

// --- 9. UMKM ---
export const addUMKMToDb = async (umkm: any) => {
  try {
    const { id, ...data } = umkm;
    await addDoc(collection(db, UMKM_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, UMKM_COL);
  }
};

export const updateUMKMInDb = async (id: string, updates: any) => {
  try {
    await updateDoc(doc(db, UMKM_COL, id), deepSanitize(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${UMKM_COL}/${id}`);
  }
};

export const deleteUMKMFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, UMKM_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${UMKM_COL}/${id}`);
  }
};

export const addUMKMOrderToDb = async (order: any) => {
  try {
    const { id, ...data } = order;
    await addDoc(collection(db, UMKM_ORDERS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, UMKM_ORDERS_COL);
  }
};

export const updateUMKMOrderStatus = async (id: string, status: string) => {
  try {
    await updateDoc(doc(db, UMKM_ORDERS_COL, id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${UMKM_ORDERS_COL}/${id}`);
  }
};

export const subscribeToUMKMOrders = (callback: (data: any[]) => void) => {
  const q = query(collection(db, UMKM_ORDERS_COL), orderBy("orderDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, UMKM_ORDERS_COL);
  });
};

// --- 10. POLLS (E-VOTING) ---
export const addPollToDb = async (poll: any) => {
  try {
    const { id, ...data } = poll;
    await addDoc(collection(db, POLLS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, POLLS_COL);
  }
};

export const deletePollFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, POLLS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${POLLS_COL}/${id}`);
  }
};

export const updatePollStatus = async (id: string, status: string) => {
  try {
    await updateDoc(doc(db, POLLS_COL, id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${POLLS_COL}/${id}`);
  }
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

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${POLLS_COL}/${pollId}`);
  }
};


// --- 11. RONDA LOGS (DIGITAL SISKAMLING) ---
export const addRondaLog = async (log: any) => {
  try {
    const { id, ...data } = log;
    await addDoc(collection(db, RONDA_LOGS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, RONDA_LOGS_COL);
  }
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
    handleFirestoreError(error, OperationType.LIST, RONDA_LOGS_COL);
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
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, PATROL_SESSIONS_COL);
    }
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
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${PATROL_SESSIONS_COL}/${sessionId}`);
    }
};

export const finishPatrolSession = async (sessionId: string) => {
    try {
        await updateDoc(doc(db, PATROL_SESSIONS_COL, sessionId), { 
            endTime: new Date().toISOString(),
            status: 'Completed' 
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${PATROL_SESSIONS_COL}/${sessionId}`);
    }
};

export const updatePatrolLocation = async (sessionId: string, x: number, y: number) => {
    try {
        await updateDoc(doc(db, PATROL_SESSIONS_COL, sessionId), { 
            currentLocation: { x, y }
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${PATROL_SESSIONS_COL}/${sessionId}`);
    }
};

export const subscribeToActivePatrols = (callback: (data: any[]) => void) => {
    const q = query(collection(db, PATROL_SESSIONS_COL), where("status", "==", "Ongoing"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, PATROL_SESSIONS_COL);
    });
};

// --- 12. BURSA WARGA (COMMUNITY MARKET) ---
export const addMarketItem = async (item: any) => {
  try {
    const { id, ...data } = item;
    await addDoc(collection(db, MARKET_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MARKET_COL);
  }
};

export const deleteMarketItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, MARKET_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MARKET_COL}/${id}`);
  }
};

export const updateMarketItemStatus = async (id: string, status: string) => {
  try {
    await updateDoc(doc(db, MARKET_COL, id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${MARKET_COL}/${id}`);
  }
};

export const subscribeToMarketItems = (callback: (data: any[]) => void) => {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, MARKET_COL));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, MARKET_COL);
  });
};


// --- 13. GALLERY ---
const GALLERY_COL = "gallery";

export const addGalleryItemToDb = async (item: any) => {
  try {
    const { id, ...data } = item;
    await addDoc(collection(db, GALLERY_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, GALLERY_COL);
  }
};

export const deleteGalleryItemFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, GALLERY_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GALLERY_COL}/${id}`);
  }
};

export const subscribeToGallery = (callback: (data: any[]) => void) => {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, GALLERY_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, GALLERY_COL);
  });
};

// --- 14. NEWS ---
export const addNewsToDb = async (news: any) => {
  try {
    const { id, ...data } = news;
    await addDoc(collection(db, NEWS_COL), deepSanitize(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, NEWS_COL);
  }
};

export const updateNewsInDb = async (id: string, updates: any) => {
  try {
    await updateDoc(doc(db, NEWS_COL, id), deepSanitize(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NEWS_COL}/${id}`);
  }
};

export const deleteNewsFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, NEWS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${NEWS_COL}/${id}`);
  }
};

export const subscribeToNews = (callback: (data: any[]) => void) => {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, NEWS_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(), 
      id: doc.id 
    }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, NEWS_COL);
  });
};


// --- SEEDING & AUTO-MIGRATION ---
// --- WASTE BANK SERVICES ---
export const subscribeToPolls = (callback: (data: Poll[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    return onSnapshot(collection(db, POLLS_COL), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, POLLS_COL);
    });
};

export const subscribeToUMKM = (callback: (data: UMKM[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    return onSnapshot(collection(db, UMKM_COL), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UMKM));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, UMKM_COL);
    });
};

export const subscribeToWasteDeposits = (callback: (data: any[]) => void) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const q = query(collection(db, WASTE_DEPOSITS_COL), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, WASTE_DEPOSITS_COL);
    });
};

export const addWasteDepositToDb = async (deposit: any) => {
    try {
        await addDoc(collection(db, WASTE_DEPOSITS_COL), deepSanitize(deposit));
        await logAction("Waste Deposit Created", `Resident: ${deposit.residentName}, Type: ${deposit.type}`);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, WASTE_DEPOSITS_COL);
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
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${WASTE_DEPOSITS_COL}/${id}`);
    }
};

export const deleteWasteDepositFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, WASTE_DEPOSITS_COL, id));
        await logAction("Waste Deposit Deleted", `ID: ${id}`);
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${WASTE_DEPOSITS_COL}/${id}`);
    }
};

export const subscribeToWastePrices = (callback: (data: any[]) => void) => {
    return onSnapshot(collection(db, WASTE_PRICES_COL), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, WASTE_PRICES_COL);
    });
};

export const updateWastePriceInDb = async (id: string, pricePerUnit: number) => {
    try {
        await updateDoc(doc(db, WASTE_PRICES_COL, id), { pricePerUnit });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${WASTE_PRICES_COL}/${id}`);
    }
};

export const addWastePriceToDb = async (price: any) => {
    try {
        const { id, ...data } = price;
        await addDoc(collection(db, WASTE_PRICES_COL), deepSanitize(data));
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, WASTE_PRICES_COL);
    }
};

export const deleteWastePriceFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, WASTE_PRICES_COL, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${WASTE_PRICES_COL}/${id}`);
    }
};

export const subscribeToWasteBalance = (houseId: string, callback: (data: any) => void) => {
    return onSnapshot(doc(db, WASTE_BALANCES_COL, houseId), (doc) => {
        if (doc.exists()) {
            callback({ ...doc.data(), id: doc.id });
        } else {
            callback(null);
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, `${WASTE_BALANCES_COL}/${houseId}`);
    });
};

export const ensureMosqueExists = async () => {
    try {
        const q = query(collection(db, MAP_POINTS_COL), where("label", "==", "Masjid Al-Ikhlas"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            const mosquePoint = {
                label: 'Masjid Al-Ikhlas',
                type: 'Facility',
                x: 85,
                y: 85,
                icon: 'MapPin',
                facilityInfo: 'Masjid utama warga RT 02, berlokasi di sisi timur jalur alternatif. Digunakan untuk shalat berjamaah dan kegiatan keagamaan warga.'
            };
            await addDoc(collection(db, MAP_POINTS_COL), deepSanitize(mosquePoint));
            console.log("Mosque added to Firestore.");
        }

        // Also check checkpoint
        const qcp = query(collection(db, CHECKPOINTS_COL), where("name", "==", "Masjid Al-Ikhlas"));
        const snapshotcp = await getDocs(qcp);
        if (snapshotcp.empty) {
            const mosqueCheckpoint = {
                name: 'Masjid Al-Ikhlas',
                qrCode: 'MASJID_RT02',
                x: 85,
                y: 85
            };
            await addDoc(collection(db, CHECKPOINTS_COL), deepSanitize(mosqueCheckpoint));
            console.log("Mosque checkpoint added to Firestore.");
        }
    } catch (error) {
        console.error("Error ensuring mosque exists:", error);
    }
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

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "seeding");
      throw error;
    }
};