import { useState, useEffect } from "react";
import { 
  auth, 
  login, 
  logout, 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  checkIsAdmin,
  Vehicle,
  VehicleStatus,
  handleFirestoreError,
  OperationType,
  fetchVehicles as fetchVehiclesService,
  firebaseConfigData,
  loginEmail,
  registerEmail,
  getBypassStatus,
  setBypassStatus,
  getLocalVehicles,
  saveLocalVehicles,
  holdsPlaceholderConfig,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from "@/lib/firebase";
import { writeBatch } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, LogOut, Edit2, Trash2, Cloud, Search, Database, ShieldCheck, AlertTriangle, Eye, EyeOff } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { inventory, resolveVehicleData } from "@/data/inventory";
import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Admin = () => {
  const { convertPrice, currency } = useCurrency();
  const [user, setUser] = useState<User | null>(getBypassStatus() ? { email: 'local-admin@bypass.internal', uid: 'bypass' } as any : null);
  const [isAdmin, setIsAdmin] = useState(getBypassStatus());
  const [loading, setLoading] = useState(!getBypassStatus());
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: "",
    year: 2024,
    chassis: "",
    img: "",
    priceJPY: 0,
    mileage: "",
    mileageKm: 0,
    grade: "",
    transmission: "MT",
    displacementCc: 0,
    displacementLabel: "",
    status: "AVAILABLE",
    featured: false,
    featuredOrder: 0,
    stockNumber: "",
    description: "",
    color: "",
    repaired: "No repair history",
    seatingCapacity: 2,
    driveSystem: "2WD",
    images: [],
    isVisible: true
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isConfigPending, setIsConfigPending] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(getBypassStatus());
  const [useEmailAuth, setUseEmailAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if configuration is just placeholders
    const isPlaceholder = holdsPlaceholderConfig();
    
    // Auto-detect if user has updated config but is still in bypass
    if (!isPlaceholder && getBypassStatus()) {
      const liveRequested = localStorage.getItem("jdm_live_requested");
      if (!liveRequested) {
        toast.info("New Firebase configuration detected. Switching to Live System...", { duration: 5000 });
        setBypassStatus(false);
        localStorage.setItem("jdm_live_requested", "true");
        window.location.reload();
        return;
      }
    }
    
    // If we are in local mode, we aren't "pending" setup
    if (getBypassStatus()) {
      setIsConfigPending(false);
      setIsAdmin(true);
      setUser({ email: 'local-admin@bypass.internal', uid: 'bypass' } as any);
      setLoading(false);
    } else {
      setIsConfigPending(isPlaceholder);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isSubscribed || getBypassStatus()) return;
      
      console.log("Auth state verified:", user?.email);
      setUser(user);
      
      if (user) {
        setCheckingAdmin(true);
        try {
          console.log("Verifying admin privileges...");
          const adminStatus = await checkIsAdmin(user);
          console.log("Admin verification result:", adminStatus);
          
          if (isSubscribed) {
            setIsAdmin(adminStatus);
            if (adminStatus) {
              fetchInventory();
            }
          }
        } catch (error) {
          console.error("Admin verification error:", error);
          toast.error("Security check failed. Please refresh.");
        } finally {
          if (isSubscribed) setCheckingAdmin(false);
        }
      } else {
        if (isSubscribed) setIsAdmin(false);
      }
      
      if (isSubscribed) setLoading(false);
    });
    
    return () => { isSubscribed = false; unsubscribe(); };
  }, []);

  const fetchInventory = async () => {
    const path = "vehicles";
    
    // Fallback for local mode bypass
    if (isLocalMode) {
      console.log("System running in Local Mode - Fetching from persistent storage");
      let localData = getLocalVehicles();
      
      if (localData.length === 0) {
        // First time initialization or clear
        localData = inventory.map(item => ({
          ...item,
          dateAdded: "LOCAL_SYNC",
          updatedAt: { seconds: Date.now() / 1000 }
        } as unknown as Vehicle));
        saveLocalVehicles(localData);
      }

      // Apply sorting to local results
      const sorted = [...localData].sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        if (sortBy === "newest") return timeB - timeA;
        if (sortBy === "oldest") return timeA - timeB;
        if (sortBy === "stock-az") return (a.stockNumber || "").localeCompare(b.stockNumber || "");
        if (sortBy === "stock-za") return (b.stockNumber || "").localeCompare(a.stockNumber || "");
        return 0;
      });

      setVehicles(sorted);
      return;
    }

    try {
      let q;
      if (sortBy === "newest") {
        q = query(collection(db, path), orderBy("updatedAt", "desc"));
      } else if (sortBy === "oldest") {
        q = query(collection(db, path), orderBy("updatedAt", "asc"));
      } else if (sortBy === "stock-az") {
        q = query(collection(db, path), orderBy("stockNumber", "asc"));
      } else {
        q = query(collection(db, path), orderBy("stockNumber", "desc"));
      }
      
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const resolvedData = resolveVehicleData(data);
        return { 
          id: doc.id, 
          ...resolvedData,
          dateAdded: data.dateAdded || (data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString().split('T')[0] : "-")
        } as Vehicle;
      });
      setVehicles(list);
    } catch (error: any) {
      console.error("Fetch error details:", error);
      
      const isBlocked = error.message?.includes("Failed to fetch") || error.message?.includes("network-error");
      const indexLink = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
      
      if (isBlocked) {
        toast.error("Connection Blocked: Please disable your Ad-Blocker (uBlock, etc.) and refresh.", { duration: 8000 });
      } else if (indexLink) {
        toast.info("Database Index missing. Loading inventory without sorting...");
        try {
          const fallbackSnapshot = await getDocs(collection(db, path));
          const fallbackList = fallbackSnapshot.docs.map(doc => {
            const data = doc.data() as any;
            return { 
              id: doc.id, 
              ...resolveVehicleData(data),
              dateAdded: data.dateAdded || (data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString().split('T')[0] : "-")
            } as Vehicle;
          });
          setVehicles(fallbackList);
        } catch (fError) {
          console.error("Fallback failed:", fError);
          setVehicles([]);
        }
      } else if (error.code === 'permission-denied') {
        toast.error("Access Denied. Check your firestore.rules.");
      }
    }
  };

  useEffect(() => {
    if (isAdmin) fetchInventory();
  }, [sortBy, isAdmin]);

  const handleSave = async () => {
    const path = "vehicles";
    
    try {
      if (isLocalMode) {
        const current = getLocalVehicles();
        const vehicleData = {
          ...formData,
          updatedAt: { seconds: Date.now() / 1000 }
        } as any;

        let nextList: Vehicle[];
        if (editingVehicle) {
          nextList = current.map(v => v.id === editingVehicle.id ? { ...v, ...vehicleData } : v);
          toast.success("Local listing updated");
        } else {
          const newItem = { 
            ...vehicleData, 
            id: `local-${Date.now()}`, 
            dateAdded: new Date().toISOString().split('T')[0] 
          };
          nextList = [newItem, ...current];
          toast.success("Local listing created");
        }
        
        try {
          saveLocalVehicles(nextList);
        } catch (storageErr: any) {
          console.error("Local storage quota exceeded:", storageErr);
          if (storageErr.name === "QuotaExceededError" || storageErr.message?.toLowerCase().includes("quota") || storageErr.message?.toLowerCase().includes("limit")) {
            toast.error("Browser memory quota exceeded! Storing too many high-resolution photos locally. Please use fewer photos or compress them.");
          } else {
            toast.error(`Local save failed: ${storageErr.message || String(storageErr)}`);
          }
          return;
        }

        setIsDialogOpen(false);
        // Update state directly for instant feedback
        const sorted = [...nextList].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setVehicles(sorted);
        return;
      }

      const vehicleData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingVehicle) {
        await updateDoc(doc(db, path, editingVehicle.id), vehicleData);
        toast.success("Live database updated");
      } else {
        const docRef = await addDoc(collection(db, path), {
          ...vehicleData,
          dateAdded: new Date().toISOString().split('T')[0]
        });
        toast.success("Live entry created");
        
        // Optimistic update: Add it to state instantly to bypass index delays
        const newDoc: Vehicle = {
          ...formData,
          id: docRef.id,
          dateAdded: new Date().toISOString().split('T')[0],
          updatedAt: { seconds: Date.now() / 1000 }
        } as any;
        setVehicles(prev => [newDoc, ...prev]);
      }
      setIsDialogOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error("Firestore database write error details:", error);
      
      let errMsg = error.message || String(error);
      try {
        if (errMsg.startsWith("{")) {
          const parsed = JSON.parse(errMsg);
          errMsg = parsed.error || errMsg;
        }
      } catch (e) {}

      if (
        errMsg.toLowerCase().includes("exceed") || 
        errMsg.toLowerCase().includes("limit") || 
        errMsg.toLowerCase().includes("too large") || 
        errMsg.toLowerCase().includes("size") ||
        error.code === "invalid-argument"
      ) {
        toast.error("Database Save Failed: The listing is too large for Google Firestore's 1MB limit. This usually happens when uploading multiple very high-resolution images as direct-embed documents. Please reduce image sizes or use fewer images.");
      } else if (errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("denied")) {
        toast.error("Database Save Failed: Access Denied. Check your firestore.rules permissions or make sure you are signed in.");
      } else {
        toast.error(`Database Save Failed: ${errMsg}`);
      }
      
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch (fe) {
        // Suppress rethrow to prevent applet crash in event-loop
      }
    }
  };

  const handleDelete = async (id: string) => {
    const path = `vehicles/${id}`;
    if (!confirm("Permanently remove this vehicle from inventory?")) return;
    
    if (isLocalMode) {
      const current = getLocalVehicles();
      const updated = current.filter(v => v.id !== id);
      saveLocalVehicles(updated);
      toast.success("Local entry removed");
      setVehicles(prev => prev.filter(v => v.id !== id));
      return;
    }

    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "vehicles", id));
      toast.success("System entry removed");
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleVisibility = async (vehicle: Vehicle) => {
    if (!vehicle.id) return;
    const nextVisibility = vehicle.isVisible === false ? true : false;
    const path = `vehicles/${vehicle.id}`;

    if (isLocalMode) {
      const current = getLocalVehicles();
      const updated = current.map(v => v.id === vehicle.id ? { ...v, isVisible: nextVisibility } : v);
      saveLocalVehicles(updated);
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, isVisible: nextVisibility } : v));
      toast.success(nextVisibility ? "Listing is now visible on public inventory!" : "Listing is now hidden from public inventory!");
      return;
    }

    try {
      // Use setDoc with merge or updateDoc
      await updateDoc(doc(db, "vehicles", vehicle.id), {
        isVisible: nextVisibility,
        updatedAt: { seconds: Date.now() / 1000 }
      });
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, isVisible: nextVisibility } : v));
      toast.success(nextVisibility ? "Listing is now visible publicly!" : "Listing is now hidden from public inventory!");
    } catch (error: any) {
      console.error("Error toggling visibility in Firestore:", error);
      toast.error(`Could not update visibility: ${error.message || String(error)}`);
    }
  };

  const openAdd = () => {
    setEditingVehicle(null);
    setFormData({
      name: "",
      year: 2024,
      chassis: "",
      img: "",
      priceJPY: 0,
      mileage: "",
      mileageKm: 0,
      grade: "",
      transmission: "MT",
      displacementCc: 0,
      displacementLabel: "",
      status: "AVAILABLE",
      featured: false,
      featuredOrder: 0,
      stockNumber: "",
      description: "",
      color: "",
      repaired: "No repair history",
      seatingCapacity: 2,
      driveSystem: "2WD",
      images: [],
      isVisible: true
    });
    setIsDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      ...v,
      isVisible: v.isVisible !== false
    });
    setIsDialogOpen(true);
  };

  const handleSeedData = async () => {
    if (!confirm("This will clear all current listings and sync with the initial inventory. Continue?")) return;
    setIsSeeding(true);
    const path = "vehicles";

    if (isLocalMode) {
      const initial = inventory.map(item => ({
        ...item,
        dateAdded: "LOCAL_SYNC",
        updatedAt: { seconds: Date.now() / 1000 }
      } as any));
      saveLocalVehicles(initial);
      toast.success("Local inventory reset");
      setVehicles(initial);
      setIsSeeding(false);
      return;
    }

    try {
      // 1. Clear existing vehicles (using a batch for efficiency if possible)
      toast.info("Preparing system...");
      const snapshot = await getDocs(collection(db, path));
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(item => {
        batch.delete(doc(db, "vehicles", item.id));
      });
      
      // 2. Add inventory items to the same batch
      inventory.forEach(item => {
        const { id, ...vehicleData } = item;
        const newDocRef = doc(collection(db, path));
        batch.set(newDocRef, {
          ...vehicleData,
          dateAdded: new Date().toISOString().split('T')[0],
          updatedAt: serverTimestamp()
        });
      });

      toast.info(`Syncing ${inventory.length} records...`);
      await batch.commit();
      
      toast.success("Inventory synced successfully");
      fetchInventory().catch(console.error);
    } catch (error: any) {
      console.error("Seed error:", error);
      if (error.code === 'permission-denied') {
        toast.error("Access Refused: Ensure firestore.rules are published and your email is authorized.");
      } else if (error.message?.includes("database") || error.code === 'not-found' || error.message?.includes("not-found")) {
        toast.error("Database Missing: Please follow Step 3 to create the Firestore database first.");
      } else {
        toast.error(`Operation failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePhotoReorder = (targetIdx: number) => {
    if (draggedPhotoIndex === null || draggedPhotoIndex === targetIdx) return;
    setFormData(prev => {
      const images = prev.images ? [...prev.images] : [];
      const pulled = images[draggedPhotoIndex];
      if (!pulled) return prev;
      
      // Remove from old pos
      images.splice(draggedPhotoIndex, 1);
      // Insert at new pos
      images.splice(targetIdx, 0, pulled);
      
      return {
        ...prev,
        images,
        // Sync thumbnail
        img: images[0] || ""
      };
    });
    setDraggedPhotoIndex(null);
  };

  const dataURLToBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const compressImage = (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.90): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Step-down scaling (incremental halving) algorithm to completely eliminate aliasing/jaggedness
          let tempCanvas = document.createElement("canvas");
          let tempCtx = tempCanvas.getContext("2d");
          let currentWidth = img.width;
          let currentHeight = img.height;

          if (tempCtx) {
            tempCanvas.width = currentWidth;
            tempCanvas.height = currentHeight;
            tempCtx.drawImage(img, 0, 0);

            // Repeatedly scale down by 50% max until the size is just above our target
            while (currentWidth > 2 * width) {
              const nextWidth = Math.round(currentWidth / 2);
              const nextHeight = Math.round(currentHeight / 2);
              const stepCanvas = document.createElement("canvas");
              stepCanvas.width = nextWidth;
              stepCanvas.height = nextHeight;
              const stepCtx = stepCanvas.getContext("2d");
              
              if (stepCtx) {
                stepCtx.imageSmoothingEnabled = true;
                stepCtx.imageSmoothingQuality = "high";
                stepCtx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
                tempCanvas = stepCanvas;
                tempCtx = stepCtx;
                currentWidth = nextWidth;
                currentHeight = nextHeight;
              } else {
                break;
              }
            }
          }

          // Final high-quality draw onto the target canvas
          canvas.width = width;
          canvas.height = height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          if (tempCtx) {
            ctx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight, 0, 0, width, height);
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }

          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
      };
      reader.onerror = () => {
        const fReader = new FileReader();
        fReader.onloadend = () => resolve(fReader.result as string);
        fReader.readAsDataURL(file);
      };
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      if (isLocalMode) {
        toast.info("Optimizing high-fidelity assets locally...", { duration: 1500 });
        const optimizedPromises = Array.from(files).map(file => compressImage(file, 1400, 1400, 0.84));
        const base64Images = await Promise.all(optimizedPromises);
        
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...base64Images],
          img: prev.img || base64Images[0]
        }));
        toast.success("High-definition optimized & cached locally");
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Live Mode Upload
      const uploadedUrls: string[] = [];
      const MAX_WAIT = 12000; // Fail over fast (12s) to local compression backup so users are never stuck
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Use a persistent toast for progress
        const toastId = toast.loading(`Preparing high-fidelity image ${i + 1}/${files.length}...`);
        
        try {
          // 1. Pre-compress original image to HD (1600px, 0.85 quality) -> results in crystal clear ~200KB image
          const preCompressedBase64 = await compressImage(file, 1600, 1600, 0.85);
          const compressedBlob = dataURLToBlob(preCompressedBase64);
          
          toast.loading(`Uploading HD optimized image ${i + 1}/${files.length}...`, { id: toastId });
          
          const fileName = `vehicles/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
          const storageRef = ref(storage, fileName);
          
          const uploadPromise = uploadBytes(storageRef, compressedBlob).then(snap => getDownloadURL(snap.ref));
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Storage Timeout")), MAX_WAIT)
          );

          const url = await Promise.race([uploadPromise, timeoutPromise]);
          uploadedUrls.push(url);
          toast.success(`Image ${i + 1} synced to Cloud Storage beautifully!`, { id: toastId });
        } catch (err: any) {
          console.warn(`Cloud upload failed for ${file.name}, trying local embed fallback. Error:`, err);
          toast.loading(`Cloud Storage unactivated or slow. Saving HD direct-embed...`, { id: toastId });
          
          try {
            // Save beautiful crisp 1300px image at 0.82 quality with advanced rendering
            const optimizedBase64 = await compressImage(file, 1300, 1300, 0.82);
            uploadedUrls.push(optimizedBase64);
            toast.success(`Image ${i + 1} finalized (HD direct-embed)!`, { id: toastId, duration: 5000 });
          } catch (compressErr) {
            toast.error(`Failed to process Image ${i + 1}`, { id: toastId });
            throw err;
          }
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
        img: prev.img || uploadedUrls[0]
      }));
      toast.success("All photos synced");
    } catch (error: any) {
      console.error("Upload process state error:", error);
      toast.error(`Upload issue: Some pictures fallback-saved directly.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  if (isConfigPending) {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
    const googleCloudProjectUrl = `https://console.cloud.google.com/auth/overview?project=${firebaseConfigData.projectId}`;
    const authorizedDomainsUrl = `https://console.firebase.google.com/project/${firebaseConfigData.projectId}/authentication/providers`;

    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center space-y-6 p-6">
        <Database className="w-16 h-16 text-bronze animate-pulse mb-4" />
        <div className="text-center space-y-4 max-w-lg w-full">
          <h1 className="font-display text-4xl uppercase tracking-tighter text-foreground">Backend Setup Center</h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-center">
            Manual configuration detected. Please follow these precise steps to enable the system.
          </p>
          
          <div className="p-6 bg-secondary/20 border border-white/5 rounded-sm text-left space-y-6">
            <div className="space-y-4">
              <div className="text-[11px] font-black uppercase text-bronze tracking-widest border-b border-white/5 pb-2">Step 1: Authorize Current Domain</div>
              <div className="flex items-center gap-3 bg-black/40 p-3 rounded-sm border border-white/5">
                <code className="text-xs font-mono flex-1 truncate">{currentDomain}</code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-3 text-[10px] font-bold uppercase transition-all bg-bronze/10 hover:bg-bronze hover:text-black border border-bronze/20"
                  onClick={() => {
                    navigator.clipboard.writeText(currentDomain);
                    toast.success("Domain copied to clipboard");
                  }}
                >
                  Copy Domain
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                Add this to <a href={authorizedDomainsUrl} target="_blank" rel="noopener noreferrer" className="text-bronze underline">Firebase Auth Settings</a> → Settings → Authorized domains.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="text-[11px] font-black uppercase text-bronze tracking-widest border-b border-white/5 pb-2">Step 2: Fix "Error updating [Method]"</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If Firebase says "Error updating Google" or "Error updating Email", it means your <strong>Support Email</strong> is missing.
              </p>
              <div className="bg-black/40 p-4 border border-bronze/20 rounded-sm space-y-3">
                <p className="text-[10px] uppercase font-bold text-bronze tracking-widest">Resolution Steps:</p>
                <ol className="text-[11px] space-y-2 list-decimal pl-4 text-muted-foreground">
                  <li>Open the <a href={googleCloudProjectUrl} target="_blank" rel="noopener noreferrer" className="text-white underline">Google OAuth Consent Screen Console</a>.</li>
                  <li>Click <strong>"Configure Consent Screen"</strong> or <strong>"Edit App"</strong> (or select <strong>"Branding"</strong> / <strong>"OAuth consent screen"</strong> in the left menu).</li>
                  <li>In the App Information section, enter <code>JDM Retro Rides</code> as the <strong>App Name</strong>.</li>
                  <li><strong>CRITICAL:</strong> Select your email in the <strong>"User support email"</strong> dropdown list.</li>
                  <li>Scroll to the bottom and make sure you enter your email address under <strong>"Developer contact information"</strong>.</li>
                  <li>Click <strong>"Save and Continue"</strong> (or <strong>"Save"</strong>) at the bottom.</li>
                  <li>Go back to your Firebase Console and try enabling the provider again.</li>
                </ol>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="text-[11px] font-black uppercase text-bronze tracking-widest border-b border-white/5 pb-2">Step 3: Create Firestore Database</div>
              <div className="bg-black/40 p-4 border border-white/5 rounded-sm space-y-3">
                <p className="text-[10px] uppercase font-bold text-white tracking-widest">Console Selection Guide:</p>
                <ul className="text-[11px] space-y-2 list-disc pl-4 text-muted-foreground">
                  <li><strong>Database Mode:</strong> Always select <strong>"Firestore in Native mode"</strong> (NOT Datastore mode).</li>
                  <li><strong>Database ID:</strong> Select <span className="text-bronze">(default)</span>. If you typed "default", delete it and let it use <code>(default)</code>.</li>
                  <li><strong>Security Rules Mode:</strong> Choose <strong>"Start in production mode"</strong> (or test mode, as we will override this anyway).</li>
                </ul>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Once created, go to the <strong>Rules</strong> tab in the Firebase Firestore Console and paste the content of <code>firestore.rules</code> from the root of this project.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="text-[11px] font-black uppercase text-bronze tracking-widest border-b border-white/5 pb-2">Step 5: System Mode</div>
              <div className="bg-black/40 p-4 border border-white/5 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-white tracking-widest">Current Mode:</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLocalMode ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
                    {isLocalMode ? 'LOCAL BROWSER' : 'LIVE FIREBASE'}
                  </span>
                </div>
                
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {isLocalMode 
                    ? "Currently saving to your browser cache. This is for testing only." 
                    : "Connected to your live Google Cloud project. All data is persistent."}
                </p>

                <Button 
                  onClick={() => {
                    const nextMode = !isLocalMode;
                    setBypassStatus(nextMode);
                    toast.info(nextMode ? "Switching to Local Mode..." : "Connecting to Live System...");
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  className={`w-full text-[10px] font-black h-9 uppercase tracking-widest border border-white/10 ${
                    isLocalMode ? 'bg-bronze text-black hover:bg-bronze/90' : 'bg-transparent text-white hover:bg-white/5'
                  }`}
                >
                  {isLocalMode ? "Switch to Live System" : "Switch to Local Mode"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline"
              className="bg-transparent text-white border-white/10 hover:bg-white/10 rounded-none h-12 font-black uppercase tracking-widest text-xs"
              onClick={() => {
                setBypassStatus(true);
                setIsLocalMode(true);
                setIsConfigPending(false);
                setIsAdmin(true);
                setUser({ email: 'local-admin@bypass.internal', uid: 'bypass' } as any);
                setLoading(false);
                toast.warning("Bypass Active: App is now using Local Browser Storage.");
              }}
            >
              Skip Setup (Local Mode)
            </Button>
            <Button 
              className="bg-white text-black hover:bg-white/90 rounded-none h-12 font-black uppercase tracking-widest text-xs"
              onClick={() => window.location.reload()}
            >
              Check Connection
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-40">
            Dev Mode allows you to manage local state without a functioning Firebase backend.
          </p>
        </div>
      </div>
    );
  }

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-bronze" />
          <div className="absolute inset-0 blur-2xl bg-bronze/20 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <div className="font-display text-2xl uppercase tracking-[0.2em] text-foreground">
            {loading ? "Initializing System" : "Verifying Clearance"}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse">
            Secure WebSocket Connection established...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-32">
        <SiteNav />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full p-12 border border-border rounded-sm bg-secondary/20 text-center">
            <ShieldCheck className="w-16 h-16 text-bronze mx-auto mb-8 opacity-40" />
            <h1 className="font-display text-5xl mb-4">RESTRICTED AREA</h1>
            <p className="text-muted-foreground text-sm mb-10 leading-relaxed tracking-wider italic">
              Log in with an authorized JDM Retro Rides account to manage system inventory.
            </p>
            {useEmailAuth ? (
              <div className="space-y-4 w-full">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="your@email.com"
                    className="h-12 bg-background border-border rounded-sm"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="h-12 bg-background border-border rounded-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={async () => {
                      if (!email || !password) return toast.error("Enter credentials");
                      setIsAuthLoading(true);
                      setAuthError(null);
                      try {
                        await loginEmail(email, password);
                        toast.success("Welcome back");
                      } catch (err: any) {
                        const msg = err.message || "Auth failed";
                        setAuthError(msg);
                        toast.error(msg);
                      } finally {
                        setIsAuthLoading(false);
                      }
                    }}
                    disabled={isAuthLoading}
                    className="flex-1 bg-bronze hover:bg-bronze/90 text-black h-12 rounded-sm font-black tracking-widest"
                  >
                    {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LOG IN"}
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!email || !password) return toast.error("Enter and confirm credentials");
                      setIsAuthLoading(true);
                      setAuthError(null);
                      try {
                        await registerEmail(email, password);
                        toast.success("Account created");
                      } catch (err: any) {
                        const msg = err.message || "Registration failed";
                        setAuthError(msg);
                        toast.error(msg);
                      } finally {
                        setIsAuthLoading(false);
                      }
                    }}
                    disabled={isAuthLoading}
                    variant="outline"
                    className="flex-1 border-white/10 h-12 rounded-sm font-black tracking-widest"
                  >
                    REGISTER
                  </Button>
                </div>
                <Button 
                  variant="link" 
                  onClick={() => setUseEmailAuth(false)}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-bronze"
                >
                  Back to Google Sign-in
                </Button>

                {authError?.includes('project-soft-deleted') && (
                  <div className="mt-6 p-6 bg-destructive/10 border border-destructive/20 rounded-sm space-y-4 text-left">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Connection Error</span>
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      If you've just updated the config, you may need to wait a few minutes or verify your Auth providers.
                    </p>

                    <div className="space-y-3">
                      <div className="bg-black/40 p-3 rounded-sm border border-white/5">
                        <div className="text-[10px] font-bold text-white mb-1 uppercase">Step 1: Enable Auth</div>
                        <p className="text-[10px] text-muted-foreground">Go to <strong>Authentication</strong> in Firebase Console and enable <strong>Google</strong> and <strong>Email/Password</strong> providers.</p>
                      </div>
                      
                      <div className="bg-black/40 p-3 rounded-sm border border-white/5">
                        <div className="text-[10px] font-bold text-white mb-1 uppercase">Step 2: Authorized Domains</div>
                        <p className="text-[10px] text-muted-foreground">In Firebase <strong>Authentication &gt; Settings &gt; Authorized domains</strong>, click <strong>Add domain</strong> and paste <code>{window.location.hostname}</code>. Also add <code>ais-pre-pttqwx7df56q66duccps6h-343348950519.asia-east1.run.app</code> if you plan to share the link.</p>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-bronze text-black text-[10px] font-black h-10 hover:bg-bronze/90 mt-2"
                      onClick={() => {
                        setAuthError(null);
                        setUseEmailAuth(false);
                      }}
                    >
                      Dismiss Error
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <Button 
                  onClick={() => {
                    const currentDomain = window.location.hostname;
                    login().catch(err => {
                      console.error(err);
                      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
                        toast.error(`Domain ${currentDomain} is not authorized in Firebase Console. Please add it under Authentication > Settings > Authorized domains.`);
                      } else {
                        toast.error(`Login error: ${err.message || err}`);
                      }
                    });
                  }}
                  className="w-full bg-bronze hover:bg-bronze/90 text-black h-12 rounded-sm font-black tracking-widest"
                >
                  LOG IN WITH GOOGLE
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => setUseEmailAuth(true)}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-bronze"
                >
                  Use Email/Password Fallback
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background pt-32 flex flex-col items-center justify-center px-6">
        <SiteNav />
        <div className="max-w-md text-center">
          <h1 className="font-display text-5xl text-destructive mb-4 tracking-tighter">ACCESS DENIED</h1>
          <p className="text-muted-foreground mb-8">
            You are logged in as <span className="text-foreground">{user.email}</span>. <br />
            This account does not have administrator privileges.
          </p>
          <Button onClick={logout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-32 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display text-4xl mb-2">
              Inventory Management 
              <span className={`text-[10px] uppercase tracking-wider ml-4 ${isLocalMode ? "text-bronze" : "text-success"}`}>
                ● {isLocalMode ? "Local Mode" : "Connected"}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm tracking-wide">
              {isLocalMode 
                ? "Bypass mode Active: All entries saved to this browser only." 
                : "Add, edit, or remove public listings in real-time."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-secondary/20 px-4 py-2 border border-white/5 rounded-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sort By:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer appearance-none pr-2"
              >
                <option value="newest" className="bg-[#1a1a1c] text-foreground">Date Added (Newest)</option>
                <option value="oldest" className="bg-[#1a1a1c] text-foreground">Date Added (Oldest)</option>
                <option value="stock-az" className="bg-[#1a1a1c] text-foreground">Stock # (A-Z)</option>
                <option value="stock-za" className="bg-[#1a1a1c] text-foreground">Stock # (Z-A)</option>
              </select>
            </div>
            <Button 
              onClick={openAdd}
              className="bg-bronze hover:bg-bronze/90 text-black h-11 px-6 rounded-sm font-bold tracking-widest gap-2 shadow-[0_0_15px_rgba(205,127,50,0.2)]"
            >
              <Plus className="w-5 h-5" /> Add New Vehicle
            </Button>
          </div>
        </div>

        <div className="hidden md:block border border-white/5 rounded-sm overflow-hidden bg-secondary/5 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/20 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">
              <tr>
                <th className="px-6 py-5 border-b border-white/5">Vehicle</th>
                <th className="px-6 py-5 border-b border-white/5">Date Added</th>
                <th className="px-6 py-5 border-b border-white/5">Stock #</th>
                <th className="px-6 py-5 border-b border-white/5">Status</th>
                <th className="px-6 py-5 border-b border-white/5">Price</th>
                <th className="px-6 py-5 border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] tracking-wide text-muted-foreground">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="opacity-20 flex flex-col items-center mb-8">
                        <Search className="w-12 h-12 mb-4" />
                        <div className="font-display text-4xl uppercase tracking-tighter">No Stock Found</div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="border-bronze text-bronze hover:bg-white hover:text-black gap-2"
                      >
                        {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Sync Initial Inventory
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className={`hover:bg-white/[0.02] transition-colors group border-b border-white/5 last:border-0 ${v.isVisible === false ? 'opacity-40 grayscale-[20%]' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 aspect-video rounded-sm overflow-hidden bg-secondary border border-white/5 shrink-0">
                          <img src={v.img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-foreground font-bold mb-0.5">{v.year} {v.name}</div>
                          <div className="text-[10px] opacity-60 uppercase">{v.year} · {v.transmission}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap opacity-80">
                      {v.dateAdded}
                    </td>
                    <td className="px-6 py-5 font-mono text-[11px] opacity-80">
                      {v.stockNumber || "-"}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-sm text-[9px] font-black tracking-widest border border-current bg-current/10 ${
                        v.status === 'AVAILABLE' ? 'text-success' : v.status === 'RESERVED' ? 'text-bronze' : 'text-destructive'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-foreground font-bold">{convertPrice(v.priceJPY).formatted}</div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 px-2">
                        <Button onClick={() => handleToggleVisibility(v)} size="icon" variant="ghost" className="h-8 w-8 hover:bg-bronze hover:text-black" title={v.isVisible === false ? "Show Listing (Make visible on public inventory)" : "Hide Listing (Remove from public inventory)"}>
                          {v.isVisible !== false ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                        </Button>
                        <Button onClick={() => openEdit(v)} size="icon" variant="ghost" className="h-8 w-8 hover:bg-bronze hover:text-black" title="Edit Vehicle Details">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => v.id && handleDelete(v.id)} size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive hover:text-white" disabled={isDeleting === v.id} title="Delete Listing">
                          {isDeleting === v.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Inventory View */}
        <div className="md:hidden space-y-4">
          {vehicles.length === 0 ? (
             <div className="py-24 text-center border border-white/5 rounded-sm bg-secondary/5">
                <Search className="w-12 h-12 mb-4 mx-auto opacity-20" />
                <div className="font-display text-2xl uppercase tracking-tighter opacity-20 mb-6">No Stock Found</div>
                <Button 
                  variant="outline" 
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="border-bronze text-bronze hover:bg-white hover:text-black gap-2"
                >
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  Sync Initial Inventory
                </Button>
             </div>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className={`bg-secondary/10 border border-white/5 rounded-sm p-6 space-y-6 transition-all duration-300 ${v.isVisible === false ? 'opacity-40 grayscale-[20%]' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-20 aspect-video rounded-sm overflow-hidden bg-secondary border border-white/5 shrink-0">
                    <img src={v.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="text-foreground font-bold text-base truncate">{v.year} {v.name}</div>
                      <Cloud className="w-3 h-3 text-success shrink-0" />
                    </div>
                    <div className="text-[10px] opacity-60 uppercase">{v.year} · {v.transmission}</div>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Added:</span>
                    <span className="font-medium text-foreground/80">{v.dateAdded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Stock:</span>
                    <span className="font-mono text-foreground/80 lowercase">{v.stockNumber || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Status:</span>
                    <span className={`inline-block px-2.5 py-1 rounded-sm text-[8px] font-black tracking-widest border border-current bg-current/10 ${
                      v.status === 'AVAILABLE' ? 'text-success' : v.status === 'RESERVED' ? 'text-bronze' : 'text-destructive'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Price:</span>
                    <span className="font-bold text-bronze text-sm">{convertPrice(v.priceJPY).formatted}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Button onClick={() => handleToggleVisibility(v)} variant="secondary" className="bg-secondary/50 hover:bg-bronze hover:text-black gap-2 h-10 px-4 text-[10px] uppercase font-bold tracking-widest rounded-sm flex-1 sm:flex-initial justify-center">
                    {v.isVisible !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" /> Hide
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-zinc-400" /> Show
                      </>
                    )}
                  </Button>
                  <Button onClick={() => openEdit(v)} variant="secondary" className="bg-secondary/50 hover:bg-bronze hover:text-black gap-2 h-10 px-6 text-[10px] uppercase font-bold tracking-widest rounded-sm flex-1 sm:flex-initial justify-center">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button 
                    onClick={() => v.id && handleDelete(v.id)} 
                    className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white gap-2 h-10 px-6 text-[10px] uppercase font-bold tracking-widest rounded-sm border border-destructive/20 flex-1 sm:flex-initial justify-center"
                    disabled={isDeleting === v.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* COMPACT DESIGN COLLAPSIBLE DEV & SEED UTILITIES */}
        <div className="mt-16 border-t border-white/5 pt-10">
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setShowDevTools(!showDevTools)}
              className="text-[#999999] hover:text-[#cccccc] text-[9px] font-black uppercase tracking-[0.2em] transition-all gap-2"
            >
              <Database className="w-3 h-3 text-bronze/60" />
              {showDevTools ? "Hide System Console" : "Show System Console & Tools"}
            </Button>
          </div>

          {showDevTools && (
            <div className="mt-6 p-6 max-w-xl mx-auto bg-secondary/15 border border-white/5 rounded-sm space-y-6 text-center">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-bronze uppercase tracking-[0.2em]">Developer Console</div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Toggle environments or synchronize the default vehicle catalog variables.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-black/40 p-4 rounded-sm border border-white/5 text-left flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-1">Execution Mode</span>
                    <p className="text-[9px] text-muted-foreground leading-relaxed uppercase">
                      Current: <strong className={isLocalMode ? 'text-amber-400' : 'text-emerald-400'}>{isLocalMode ? 'Local Cache' : 'Cloud database'}</strong>
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const nextMode = !isLocalMode;
                      setBypassStatus(nextMode);
                      toast.info(nextMode ? "Switching to Local Cache..." : "Connecting to Live Cloud Database...");
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                    variant="outline"
                    className="w-full h-8 text-[9px] font-bold uppercase tracking-widest border-white/10 hover:bg-white hover:text-black cursor-pointer"
                  >
                    {isLocalMode ? "Go Live (Firebase)" : "Bypass (Local)"}
                  </Button>
                </div>

                <div className="bg-black/40 p-4 rounded-sm border border-white/5 text-left flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-1">Backup & Defaults</span>
                    <p className="text-[9px] text-[#999999] leading-relaxed uppercase">
                      Populate system catalogs with default classic JDM legacy listings.
                    </p>
                  </div>
                  <Button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    variant="outline"
                    className="w-full h-8 text-[9px] font-bold uppercase tracking-widest border-white/10 hover:bg-white hover:text-black cursor-pointer gap-1.5"
                  >
                    {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                    Sync JDM Catalog
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 border-t border-border/50 flex flex-col items-center gap-4">
        <div className="opacity-40 text-[10px] tracking-widest uppercase">
          Authenticated Session for: {user.email}
        </div>
        <Button onClick={logout} variant="outline" className="h-9 px-6 rounded-sm border-white/10 gap-2 font-bold tracking-widest text-[10px] uppercase">
          <LogOut className="w-3.5 h-3.5" /> Log Out
        </Button>
      </footer>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl bg-[#0d0d0e] border-border text-foreground rounded-sm p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 border-b border-white/5">
            <DialogTitle className="font-display text-4xl tracking-tight">
              {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            {/* IDENTITY & STATUS */}
            <section className="space-y-6">
              <h3 className="font-sans text-xs font-black tracking-[0.3em] uppercase text-bronze border-b border-bronze/20 pb-2">IDENTITY & STATUS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Vehicle Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-background border-white/10 rounded-sm h-11" placeholder="1996 Toyota MR2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Stock Number</Label>
                  <Input value={formData.stockNumber} onChange={e => setFormData({...formData, stockNumber: e.target.value})} className="bg-background border-white/10 rounded-sm h-11" placeholder="J.6502" />
                </div>
                <div className="grid grid-cols-2 gap-6 md:col-span-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground tracking-wide">Status</Label>
                    <select 
                      className="w-full h-11 bg-background border border-white/10 rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-bronze appearance-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="AVAILABLE" className="bg-[#1a1a1c]">AVAILABLE</option>
                      <option value="RESERVED" className="bg-[#1a1a1c]">RESERVED</option>
                      <option value="SOLD" className="bg-[#1a1a1c]">SOLD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground tracking-wide">Price (¥)</Label>
                    <Input type="number" value={formData.priceJPY} onChange={e => setFormData({...formData, priceJPY: parseInt(e.target.value)})} className="bg-background border-white/10 rounded-sm h-11" />
                  </div>
                </div>
                <div className="space-y-4 md:col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Featured Vehicle Listing Order</Label>
                  <div className="flex items-center gap-8">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="flex items-center gap-3">
                        <Checkbox 
                          id={`feat-${num}`}
                          checked={formData.featuredOrder === num || (formData.featured && formData.featuredOrder === undefined && num === 1)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, featured: true, featuredOrder: num });
                            } else {
                              setFormData({ ...formData, featured: false, featuredOrder: 0 });
                            }
                          }}
                          className="w-5 h-5 rounded-none border-white/20 data-[state=checked]:bg-bronze data-[state=checked]:border-bronze"
                        />
                        <Label htmlFor={`feat-${num}`} className="text-xs cursor-pointer font-bold">{num}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2 border-t border-white/5 pt-6 mt-2">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="isVisible"
                      checked={formData.isVisible !== false}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, isVisible: !!checked });
                      }}
                      className="w-5 h-5 rounded-none border-white/20 data-[state=checked]:bg-bronze data-[state=checked]:border-bronze mt-0.5"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="isVisible" className="text-xs cursor-pointer font-bold uppercase tracking-wider text-foreground">Visible on Public Inventory</Label>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uncheck to hide this listing completely from the customer collection page.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TECHNICAL SPECIFICATIONS */}
            <section className="space-y-6">
              <h3 className="font-sans text-xs font-black tracking-[0.3em] uppercase text-bronze border-b border-bronze/20 pb-2">TECHNICAL SPECIFICATIONS</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Year</Label>
                  <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className="bg-background border-white/10 rounded-sm h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Mileage (km)</Label>
                  <Input type="number" value={formData.mileageKm} onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, mileageKm: val, mileage: `${val.toLocaleString()} km`});
                  }} className="bg-background border-white/10 rounded-sm h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Displacement (cc)</Label>
                  <Input type="number" value={formData.displacementCc} onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, displacementCc: val, displacementLabel: `${(val/1000).toFixed(1)}L`});
                  }} className="bg-background border-white/10 rounded-sm h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Transmission</Label>
                   <select 
                    className="w-full h-11 bg-background border border-white/10 rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-bronze appearance-none"
                    value={formData.transmission}
                    onChange={e => setFormData({...formData, transmission: e.target.value})}
                  >
                    <option value="MT" className="bg-[#1a1a1c]">MT</option>
                    <option value="AT" className="bg-[#1a1a1c]">AT</option>
                    <option value="5-Speed Manual" className="bg-[#1a1a1c]">5-Speed Manual</option>
                    <option value="6-Speed Manual" className="bg-[#1a1a1c]">6-Speed Manual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Color</Label>
                  <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="bg-background border-white/10 rounded-sm h-11" placeholder="Super Red II" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Drive System</Label>
                  <select 
                    className="w-full h-11 bg-background border border-white/10 rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-bronze appearance-none"
                    value={formData.driveSystem}
                    onChange={e => setFormData({...formData, driveSystem: e.target.value})}
                  >
                    <option value="2WD" className="bg-[#1a1a1c]">2WD</option>
                    <option value="4WD" className="bg-[#1a1a1c]">4WD</option>
                    <option value="AWD" className="bg-[#1a1a1c]">AWD</option>
                    <option value="RWD" className="bg-[#1a1a1c]">RWD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Repaired</Label>
                  <select 
                    className="w-full h-11 bg-background border border-white/10 rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-bronze appearance-none"
                    value={formData.repaired}
                    onChange={e => setFormData({...formData, repaired: e.target.value})}
                  >
                    <option value="No repair history" className="bg-[#1a1a1c]">No repair history</option>
                    <option value="Minor panel repair" className="bg-[#1a1a1c]">Minor panel repair</option>
                    <option value="Fully restored" className="bg-[#1a1a1c]">Fully restored</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Seating</Label>
                  <Input type="number" value={formData.seatingCapacity} onChange={e => setFormData({...formData, seatingCapacity: parseInt(e.target.value)})} className="bg-background border-white/10 rounded-sm h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground tracking-wide">Grade</Label>
                  <Input value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="bg-background border-white/10 rounded-sm h-11" placeholder="4.0" />
                </div>
              </div>
            </section>

            {/* ADDITIONAL INFORMATION */}
            <section className="space-y-6">
              <h3 className="font-sans text-xs font-black tracking-[0.3em] uppercase text-bronze border-b border-bronze/20 pb-2">ADDITIONAL INFORMATION</h3>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground tracking-wide">Description (Paragraphs for View Details)</Label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full min-h-[160px] bg-background border border-white/10 rounded-sm p-4 text-sm focus:outline-none focus:ring-1 focus:ring-bronze resize-none leading-relaxed"
                  placeholder="A fun and engaging mid-engine sports car..."
                />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="font-sans text-xs font-black tracking-[0.3em] uppercase text-bronze border-b border-bronze/20 pb-2">PHOTOS (FIRST IS FEATURED)</h3>
              <div className="space-y-6">
                <div 
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  className="relative border-2 border-dashed border-white/5 rounded-sm p-16 text-center bg-secondary/5 hover:bg-secondary/10 hover:border-bronze/30 transition-all group overflow-hidden"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-12 h-12 text-bronze animate-spin mb-4" />
                      <div className="text-sm font-bold animate-pulse">Uploading Media...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Cloud className="w-12 h-12 text-bronze mx-auto mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <div className="text-sm font-bold mb-1 tracking-wide">Click to select or Drag & Drop</div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-6">Supports JPG, PNG, WEBP</div>
                      </div>
                      <Button 
                        type="button"
                        variant="outline"
                        className="border-bronze/30 text-bronze hover:bg-bronze hover:text-black pointer-events-none"
                      >
                        Select Files
                      </Button>
                    </div>
                  )}
                  {!isUploading && (
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      multiple 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept="image/*"
                    />
                  )}
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-black">
                      Tip: Drag and drop cards with your mouse or finger to reorder photos. The first image is automatically featured.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {formData.images.map((img, idx) => {
                        const isDraggingCurrent = draggedPhotoIndex === idx;
                        return (
                          <div 
                            key={idx} 
                            draggable
                            onDragStart={() => setDraggedPhotoIndex(idx)}
                            onDragEnd={() => setDraggedPhotoIndex(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handlePhotoReorder(idx)}
                            className={`relative aspect-square rounded-sm overflow-hidden border transition-all duration-200 group bg-secondary select-none cursor-grab active:cursor-grabbing ${
                              isDraggingCurrent 
                                ? "opacity-30 border-dashed border-bronze scale-95" 
                                : "border-white/10 hover:border-bronze"
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="w-8 h-8 rounded-sm cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Remove this photo?")) {
                                    setFormData(prev => {
                                      const newImages = [...(prev.images || [])];
                                      newImages.splice(idx, 1);
                                      return { 
                                        ...prev, 
                                        images: newImages,
                                        img: prev.img === img ? (newImages[0] || "") : prev.img
                                      };
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] font-mono px-1.5 py-0.5 rounded-sm">
                              #{idx + 1}
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-2 left-2 bg-bronze text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-sm">Featured</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <DialogFooter className="p-8 border-t border-white/5 bg-secondary/10 flex items-center justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-sm tracking-widest font-bold text-xs uppercase h-12 px-10">Cancel</Button>
            <Button onClick={handleSave} className="bg-bronze hover:bg-bronze/90 text-black px-12 h-12 rounded-sm font-black tracking-widest shadow-[0_0_20px_rgba(205,127,50,0.15)] uppercase">Save Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
