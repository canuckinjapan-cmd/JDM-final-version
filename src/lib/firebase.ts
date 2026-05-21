import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  limit,
  serverTimestamp,
  getDoc,
  writeBatch,
  Timestamp,
  FieldValue
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import firebaseConfigData from "../../firebase-applet-config.json";
import { resolveVehicleData, inventory as defaultInventory } from "@/data/inventory";

// Types
export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface Vehicle {
  id: string;
  name: string;
  year: number;
  chassis: string;
  img: string;
  priceJPY: number;
  mileage: string;
  mileageKm: number;
  grade: string;
  transmission: string;
  displacementCc: number;
  displacementLabel: string;
  status: VehicleStatus;
  featured: boolean;
  featuredOrder?: number;
  stockNumber?: string;
  description?: string;
  color?: string;
  repaired?: string;
  seatingCapacity?: number;
  driveSystem?: string;
  images?: string[];
  updatedAt?: any;
  dateAdded?: string;
  isVisible?: boolean;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Initialization
export { firebaseConfigData };

const configuredApiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfigData.apiKey;
const hasPlaceholderKey = !configuredApiKey || 
  configuredApiKey.trim() === "" ||
  configuredApiKey.includes("remixed") || 
  configuredApiKey.includes("YOUR");

const configuredProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigData.projectId;
const hasPlaceholderProject = !configuredProjectId || 
  configuredProjectId.trim() === "" ||
  configuredProjectId.includes("remixed") || 
  configuredProjectId.includes("YOUR");

export const firebaseConfig = {
  apiKey: hasPlaceholderKey ? "AIzaSyFakeKeyForBypassModeOnly12345" : configuredApiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigData.authDomain || `${configuredProjectId || 'jdm-retro-rides-v2'}.firebaseapp.com`,
  projectId: hasPlaceholderProject ? "jdm-retro-rides-v2" : configuredProjectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigData.storageBucket || `${configuredProjectId || 'jdm-retro-rides-v2'}.firebasestorage.app`,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigData.messagingSenderId || "906100169608",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfigData.appId || "1:906100169608:web:000e02e82b21d704bfb83d",
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || firebaseConfigData.firestoreDatabaseId
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Handle "(default)" by passing undefined to getFirestore
const dbId = firebaseConfig.firestoreDatabaseId === "(default)" || !firebaseConfig.firestoreDatabaseId 
  ? undefined 
  : firebaseConfig.firestoreDatabaseId;

export const db = getFirestore(app, dbId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Auth Helpers
export const login = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const loginEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerEmail = async (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const logout = () => signOut(auth);

export const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  if (getBypassStatus()) return true;
  
  // The owner is always an admin
  const ownerEmail = "canuck.in.japan@gmail.com"; 
  if (user.email === ownerEmail) return true;

  try {
    // 1. Check if the user is in the 'users' collection with an 'admin' role
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && (userSnap.data() as any).role === 'admin') {
      return true;
    }
    
    // 2. Check if the user ID exists in the 'admins' collection
    const adminRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminRef);
    
    return adminSnap.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    // Fallback based on email if we can't reach DB but have the user object
    return user.email === ownerEmail;
  }
};

// Firestore Helpers
export const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: (auth.currentUser as any)?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// Local Persistence Helpers
const LOCAL_STORAGE_DB_KEY = "jdm_retro_rides_db";
const BYPASS_FLAG_KEY = "jdm_bypass_firebase";

export const getBypassStatus = () => {
  const stored = localStorage.getItem(BYPASS_FLAG_KEY);
  if (stored !== null) {
    return stored === "true";
  }
  return holdsPlaceholderConfig();
};

export const setBypassStatus = (status: boolean) => {
  localStorage.setItem(BYPASS_FLAG_KEY, String(status));
};

export const holdsPlaceholderConfig = () => {
  const key = (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfigData.apiKey;
  const project = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigData.projectId;
  return !key || 
         key.trim() === "" ||
         key.includes("remixed") || 
         key.includes("YOUR") ||
         !project ||
         project.trim() === "" ||
         project.includes("remixed") ||
         project.includes("YOUR") ||
         key === "AIzaSyFakeKeyForBypassModeOnly12345";
};

export const getLocalVehicles = (): Vehicle[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.length > 0) {
        return parsed.map(resolveVehicleData);
      }
    } catch (e) {
      console.warn("Failed to parse local vehicles, recreating from default", e);
    }
  }
  const restored = defaultInventory || [];
  saveLocalVehicles(restored);
  return restored.map(resolveVehicleData);
};

export const saveLocalVehicles = (vehicles: Vehicle[]) => {
  localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(vehicles));
};

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  if (getBypassStatus()) {
    const local = getLocalVehicles();
    return local.length > 0 ? local : [];
  }

  const path = "vehicles";
  try {
    const q = query(collection(db, path), orderBy("stockNumber", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...resolveVehicleData(doc.data()) } as Vehicle));
  } catch (error) {
    console.warn("fetchVehicles failed with standard sorted query (likely missing index), attempting fallback unsorted fetch:", error);
    try {
      const fallbackSnapshot = await getDocs(collection(db, path));
      const fallbackList = fallbackSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...resolveVehicleData(doc.data()) 
      } as Vehicle));
      
      // Manually sort in JS Memory to replicate orderBy("stockNumber", "asc")
      fallbackList.sort((a, b) => (a.stockNumber || "").localeCompare(b.stockNumber || ""));
      return fallbackList;
    } catch (fallbackError) {
      console.error("fetchVehicles fallback query failed too:", fallbackError);
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};

export const statusStyles: Record<VehicleStatus, string> = {
  AVAILABLE: "border-success/50 text-success bg-success/10",
  RESERVED: "border-bronze/50 text-bronze bg-bronze/10",
  SOLD: "border-destructive/50 text-destructive bg-destructive/10",
};

export { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  limit,
  serverTimestamp,
  writeBatch,
  ref,
  uploadBytes,
  getDownloadURL,
  getStorage
};
