
import { db, auth } from "./firebaseConfig";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDoc, setDoc, writeBatch, orderBy, limit, where, increment
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";

export const loginAdmin = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const logoutAdmin = () => signOut(auth);
export const updateAdminPassword = async (newPass: string) => {
    if (auth.currentUser) await updatePassword(auth.currentUser, newPass);
};

export const subscribeToCollection = (colName: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, colName));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  });
};

export const subscribeToNotifications = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "notifications"), orderBy("date", "desc"), limit(20));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  }, () => {
    onSnapshot(query(collection(db, "notifications")), (snap) => callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
  });
};

export const validateResidentAccess = async (houseId: string, code: string): Promise<boolean> => {
    try {
        const snapshot = await getDoc(doc(db, "houses", houseId.toUpperCase()));
        if (snapshot.exists()) {
            const data = snapshot.data();
            return data.accessCode === code;
        }
        return false;
    } catch (e) { return false; }
};

export const addAnnouncementToDb = (data: any) => addDoc(collection(db, "announcements"), data);
export const deleteAnnouncementFromDb = (id: string) => deleteDoc(doc(db, "announcements", id));
export const addReportToDb = (data: any) => addDoc(collection(db, "reports"), data);
export const updateReportStatus = (id: string, status: string) => updateDoc(doc(db, "reports", id), { status });
export const deleteReportFromDb = (id: string) => deleteDoc(doc(db, "reports", id));
export const addLetterToDb = (data: any) => addDoc(collection(db, "letters"), data);
export const updateLetterStatus = (id: string, status: string) => updateDoc(doc(db, "letters", id), { status });
export const deleteLetterFromDb = (id: string) => deleteDoc(doc(db, "letters", id));
export const addOfficialToDb = (data: any) => addDoc(collection(db, "officials"), data);
export const updateOfficialInDb = (id: string, data: any) => updateDoc(doc(db, "officials", id), data);
export const deleteOfficialFromDb = (id: string) => deleteDoc(doc(db, "officials", id));
export const updateHouseData = (id: string, data: any) => updateDoc(doc(db, "houses", id), data);

// Added fix for: Module '"./services/databaseService"' has no exported member 'deleteHouseFromDb'
export const deleteHouseFromDb = (id: string) => deleteDoc(doc(db, "houses", id));

export const addInventoryToDb = (data: any) => addDoc(collection(db, "inventory"), data);
export const updateInventoryInDb = (id: string, data: any) => updateDoc(doc(db, "inventory", id), data);
export const deleteInventoryFromDb = (id: string) => deleteDoc(doc(db, "inventory", id));
export const addPollToDb = (data: any) => addDoc(collection(db, "polls"), data);
export const deletePollFromDb = (id: string) => deleteDoc(doc(db, "polls", id));
export const updatePollStatus = (id: string, status: string) => updateDoc(doc(db, "polls", id), { status });
export const submitVote = (pollId: string, optionId: string, options: any[]) => {
  const pollRef = doc(db, "polls", pollId);
  const newOptions = options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o);
  return updateDoc(pollRef, { options: newOptions, totalVotes: increment(1) });
};
export const addNotificationToDb = (data: any) => addDoc(collection(db, "notifications"), data);
export const subscribeToMarketItems = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "marketItems"), (snap) => callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
};
export const addMarketItem = (data: any) => addDoc(collection(db, "marketItems"), data);
export const updateMarketItemStatus = (id: string, status: string) => updateDoc(doc(db, "marketItems", id), { status });
export const deleteMarketItem = (id: string) => deleteDoc(doc(db, "marketItems", id));
export const addRondaLog = (data: any) => addDoc(collection(db, "rondaLogs"), data);
export const subscribeToRondaLogs = (callback: (data: any[]) => void) => {
  return onSnapshot(query(collection(db, "rondaLogs"), orderBy("timestamp", "desc"), limit(50)), (snap) => callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
};
export const addTransactionToDb = (data: any) => addDoc(collection(db, "cashFlow"), data);
export const updateTransactionInDb = (id: string, data: any) => updateDoc(doc(db, "cashFlow", id), data);
export const deleteTransactionFromDb = (id: string) => deleteDoc(doc(db, "cashFlow", id));
export const updateRondaSchedule = (id: string, members: string[]) => updateDoc(doc(db, "ronda", id), { members });
export const addUMKMToDb = (data: any) => addDoc(collection(db, "umkm"), data);
export const updateUMKMInDb = (id: string, data: any) => updateDoc(doc(db, "umkm", id), data);
export const deleteUMKMFromDb = (id: string) => deleteDoc(doc(db, "umkm", id));
export const batchUpdateHouses = async (updates: any[]) => {
  const batch = writeBatch(db);
  updates.forEach(u => batch.update(doc(db, "houses", u.id), u));
  return batch.commit();
};
export const seedDatabase = async (data: any) => {
  // Logic to clear and re-add initial state
};
