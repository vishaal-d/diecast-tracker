import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  addDoc,
  collection,
  onSnapshot,
  query,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Loader2,
  Car,
  Plus,
  ShoppingCart,
  DollarSign,
  X,
  Trash2,
  LogIn,
  LogOut,
  TrendingUp,
  Search,
  Save,
  Calendar,
  MapPin,
  Package,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// --- CONFIGURATION START ---
const getEnv = (key, fallback) => {
  try {
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "PASTE_YOUR_API_KEY_HERE"),
  authDomain: getEnv(
    "VITE_FIREBASE_AUTH_DOMAIN",
    "PASTE_YOUR_PROJECT_ID.firebaseapp.com"
  ),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "PASTE_YOUR_PROJECT_ID"),
  storageBucket: getEnv(
    "VITE_FIREBASE_STORAGE_BUCKET",
    "PASTE_YOUR_PROJECT_ID.appspot.com"
  ),
  messagingSenderId: getEnv(
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "PASTE_YOUR_SENDER_ID"
  ),
  appId: getEnv("VITE_FIREBASE_APP_ID", "PASTE_YOUR_APP_ID"),
};
// --- CONFIGURATION END ---

const PYTHON_API_URL = getEnv(
  "VITE_PYTHON_API_URL",
  "http://localhost:5000/api/fetch_model"
);

// Initialize Firebase
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PASTE_YOUR")) {
  console.warn("Firebase Config Missing! Check .env file.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- 3D Tilt Card Component ---
export const TiltCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => {
        setIsHovering(true);
        handleMouseMove(e);
      }}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovering
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: isHovering
          ? "transform 0.1s ease-out"
          : "transform 0.5s ease-out",
      }}
      className={`transform-gpu ${className}`}
    >
      {children}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [view, setView] = useState("add");
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [collectionData, setCollectionData] = useState([]);
  const [isoData, setIsoData] = useState([]);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCollectionData([]);
      setIsoData([]);
      return;
    }

    setLoadingCollection(true);

    const qCollection = query(
      collection(db, `users/${user.uid}/diecast_collection`)
    );
    const unsubscribeCollection = onSnapshot(
      qCollection,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data(), type: "collection" });
        });
        setCollectionData(list);
        setLoadingCollection(false);
      },
      (err) => handleFirestoreError(err)
    );

    const qIso = query(collection(db, `users/${user.uid}/iso_collection`));
    const unsubscribeIso = onSnapshot(
      qIso,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data(), type: "iso" });
        });
        setIsoData(list);
      },
      (err) => handleFirestoreError(err)
    );

    return () => {
      unsubscribeCollection();
      unsubscribeIso();
    };
  }, [user]);

  const handleFirestoreError = (err) => {
    console.error("Firestore Error:", err);
    if (err.code === "permission-denied") {
      setError("Database Permission Denied. Check Firestore Rules.");
    } else {
      setError(`Database Error: ${err.message}`);
    }
    setLoadingCollection(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Google Login Failed: " + err.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError("Guest Login Failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView("add");
  };

  const handleViewDetails = (car) => {
    setSelectedCar(car);
    setShowDetailModal(true);
  };

  const handleDeleteCar = async (carId, type) => {
    if (!confirm("Delete this model?")) return;
    const collectionName =
      type === "iso" ? "iso_collection" : "diecast_collection";
    try {
      await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, carId));
      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    }
  };

  const handleUpdateCar = async (carId, updates, type) => {
    const collectionName =
      type === "iso" ? "iso_collection" : "diecast_collection";
    try {
      await updateDoc(
        doc(db, `users/${user.uid}/${collectionName}`, carId),
        updates
      );
      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCollection = async (car) => {
    if (!confirm("Congratulations! Move this item to your main Garage?"))
      return;
    try {
      await addDoc(collection(db, `users/${user.uid}/diecast_collection`), {
        ...car,
        type: "collection",
        addedAt: new Date().toISOString(),
      });
      await deleteDoc(doc(db, `users/${user.uid}/iso_collection`, car.id));
      setShowDetailModal(false);
      setView("collections");
    } catch (err) {
      console.error("Move Error:", err);
      alert("Failed to move item.");
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex justify-center items-center h-screen flex-col bg-slate-50">
        <Loader2 className="animate-spin text-red-600 mb-4 w-12 h-12" />
        <p className="text-gray-500 font-medium tracking-wide">
          INITIALIZING SYSTEM...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-8 z-10 border border-white/20">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            GARAGE<span className="text-red-600">.OS</span>
          </h1>
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
            >
              Sync with Google
            </button>
            <button
              onClick={handleGuestLogin}
              className="w-full py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
            >
              Enter as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-20 selection:bg-red-200">
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-md border-b border-white/20 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => setView("collections")}
          >
            <div className="bg-red-600 p-2 rounded-lg text-white transform group-hover:rotate-12 transition-transform">
              <Car size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">
              GARAGE<span className="text-red-600">.OS</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-gray-100/50 p-1 rounded-xl backdrop-blur-sm">
              <button
                onClick={() => setView("add")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === "add"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Plus size={16} className="inline mr-2" />
                Add
              </button>
              <button
                onClick={() => setView("collections")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === "collections"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <ShoppingCart size={16} className="inline mr-2" />
                Garage
              </button>
              <button
                onClick={() => setView("iso")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === "iso"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Search size={16} className="inline mr-2" />
                ISO
              </button>
              <button
                onClick={() => setView("preorder")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === "preorder"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Clock size={16} className="inline mr-2" />
                Pre-Orders
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors ml-2"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 pt-28">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8">
            <strong className="font-bold">System Error:</strong> {error}
          </div>
        )}

        <div className="transition-all duration-500 ease-in-out transform">
          {view === "add" && (
            <AddModelForm
              userId={user.uid}
              setError={setError}
              setView={setView}
            />
          )}
          {view === "collections" && (
            <CollectionDisplay
              data={collectionData}
              isLoading={loadingCollection}
              onViewDetails={handleViewDetails}
              title="Garage Inventory"
            />
          )}
          {view === "iso" && (
            <CollectionDisplay
              data={isoData}
              isLoading={loadingCollection}
              onViewDetails={handleViewDetails}
              title="In Search Of (ISO)"
              isIso={true}
            />
          )}
          {view === "preorder" && (
            <Preorder userId={user.uid} db={db} pythonApiUrl={PYTHON_API_URL} />
          )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 z-50 flex justify-around">
        <button
          onClick={() => setView("add")}
          className={`flex flex-col items-center ${
            view === "add" ? "text-red-600" : "text-gray-400"
          }`}
        >
          <Plus size={24} />
        </button>
        <button
          onClick={() => setView("collections")}
          className={`flex flex-col items-center ${
            view === "collections" ? "text-red-600" : "text-gray-400"
          }`}
        >
          <ShoppingCart size={24} />
        </button>
        <button
          onClick={() => setView("iso")}
          className={`flex flex-col items-center ${
            view === "iso" ? "text-red-600" : "text-gray-400"
          }`}
        >
          <Search size={24} />
        </button>
        <button
          onClick={() => setView("preorder")}
          className={`flex flex-col items-center ${
            view === "preorder" ? "text-red-600" : "text-gray-400"
          }`}
        >
          <Clock size={24} />
        </button>
      </div>

      {showDetailModal && selectedCar && (
        <DetailModal
          car={selectedCar}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleUpdateCar}
          onDelete={handleDeleteCar}
          onMove={handleMoveToCollection}
          isIsoView={selectedCar.type === "iso"}
        />
      )}
    </div>
  );
};

// --- ADD MODEL FORM COMPONENT ---
const AddModelForm = ({ userId, setError, setView }) => {
  const [modelNumber, setModelNumber] = useState("");
  const [status, setStatus] = useState("idle");
  const [foundDetails, setFoundDetails] = useState(null);
  const [metrics, setMetrics] = useState({
    purchasePrice: "",
    currentValue: "",
    condition: "Mint in Box",
    packaging: "Blister",
    purchaseDate: "",
    source: "",
    notes: "",
    isChase: false,
  });

  const [useSameValue, setUseSameValue] = useState(true);

  const handlePurchasePriceChange = (e) => {
    const val = e.target.value;
    setMetrics((prev) => ({
      ...prev,
      purchasePrice: val,
      currentValue: useSameValue ? val : prev.currentValue,
    }));
  };

  const handleUseSameValueToggle = () => {
    setUseSameValue(!useSameValue);
    if (!useSameValue) {
      setMetrics((prev) => ({ ...prev, currentValue: prev.purchasePrice }));
    }
  };

  const fetchDetails = async () => {
    setStatus("searching");
    setError(null);
    try {
      const res = await fetch(`${PYTHON_API_URL}/${modelNumber}`);
      if (!res.ok) throw new Error("Model not found in Python scraper.");
      const data = await res.json();
      setFoundDetails(data);
      setStatus("found");
    } catch (err) {
      console.error(err);
      alert(`Fetch Failed: ${err.message}. Is your Python server running?`);
      setStatus("idle");
    }
  };

  const saveModel = async (targetCollection = "diecast_collection") => {
    if (!foundDetails) return;
    setStatus("saving");
    try {
      await addDoc(collection(db, `users/${userId}/${targetCollection}`), {
        ...foundDetails,
        modelNumber,
        ...metrics,
        purchasePrice: parseFloat(metrics.purchasePrice) || 0,
        currentValue: parseFloat(metrics.currentValue) || 0,
        addedAt: new Date().toISOString(),
      });
      setView(targetCollection === "iso_collection" ? "iso" : "collections");
      setModelNumber("");
      setFoundDetails(null);
      setMetrics({
        purchasePrice: "",
        currentValue: "",
        condition: "Mint in Box",
        packaging: "Blister",
        purchaseDate: "",
        source: "",
        notes: "",
        isChase: false,
      });
    } catch (err) {
      console.error("Save Error:", err);
      alert("Save Failed! Check console.");
    }
    setStatus("idle");
  };

  return (
    <div className="max-w-4xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-blue-100 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative bg-gradient-to-br from-white to-slate-50 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50">
        <div className="relative p-8 md:p-12 overflow-hidden bg-slate-50">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold tracking-widest uppercase mb-4 border border-red-200">
              <Plus size={12} strokeWidth={3} /> Inventory System
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
              ADD NEW{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                MODEL
              </span>
            </h2>
            <p className="text-gray-500 font-medium max-w-lg">
              Enter the manufacturer's model code to retrieve technical
              specifications.
            </p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <Search
                className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={24}
              />
              <input
                className="w-full pl-16 pr-6 py-5 bg-white border-2 border-gray-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-2xl text-xl font-bold outline-none transition-all placeholder:font-normal placeholder:text-gray-300 shadow-sm"
                placeholder="Model Number (e.g. 844)"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDetails()}
              />
            </div>
            <button
              onClick={fetchDetails}
              disabled={status === "searching"}
              className="bg-gray-900 text-white px-8 md:px-12 rounded-2xl font-black text-lg tracking-wide hover:bg-black hover:shadow-xl hover:shadow-gray-900/20 disabled:bg-gray-200 disabled:text-gray-400 transition-all active:scale-95"
            >
              {status === "searching" ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                "FETCH DATA"
              )}
            </button>
          </div>

          {status === "idle" && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <Car size={80} strokeWidth={1} className="mb-6 text-gray-200" />
              <p className="font-bold text-sm uppercase tracking-[0.2em] text-gray-400">
                Awaiting Input Signal
              </p>
            </div>
          )}

          {status === "found" && foundDetails && (
            <div className="animate-fade-in-up">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img
                    src={foundDetails.imageUrl}
                    alt={foundDetails.modelName}
                    className="w-full h-auto object-contain transform group-hover:scale-110 transition-transform duration-500 filter drop-shadow-2xl"
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-red-600 tracking-wider uppercase mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      Model Identified
                    </p>
                    <h3 className="font-black text-3xl text-gray-900 leading-tight">
                      {foundDetails.modelName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide group-focus-within:text-red-500 transition-colors">
                        Buy Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-red-500 transition-colors">
                          ₹
                        </span>
                        <input
                          className="w-full pl-10 p-4 bg-white rounded-xl font-bold border-2 border-gray-100 focus:border-red-500 outline-none transition-all"
                          placeholder="0"
                          type="number"
                          onChange={handlePurchasePriceChange}
                          value={metrics.purchasePrice}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          id="samePrice"
                          checked={useSameValue}
                          onChange={handleUseSameValueToggle}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        />
                        <label
                          htmlFor="samePrice"
                          className="text-xs text-gray-500 cursor-pointer select-none"
                        >
                          Same as Current Value
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide group-focus-within:text-green-500 transition-colors">
                        Current Value
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-green-500 transition-colors">
                          ₹
                        </span>
                        <input
                          className={`w-full pl-10 p-4 bg-white rounded-xl font-bold border-2 border-gray-100 focus:border-green-500 outline-none transition-all ${
                            useSameValue
                              ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder="0"
                          type="number"
                          value={metrics.currentValue}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              currentValue: e.target.value,
                            })
                          }
                          disabled={useSameValue}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Packaging
                      </label>
                      <div className="relative">
                        <Package
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <select
                          className="w-full pl-10 p-4 bg-white rounded-xl font-bold border-2 border-gray-100 focus:border-gray-300 outline-none appearance-none"
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              packaging: e.target.value,
                            })
                          }
                        >
                          <option>Blister</option>
                          <option>Box</option>
                          <option>Loose</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Condition
                      </label>
                      <div className="relative">
                        <Star
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <select
                          className="w-full pl-10 p-4 bg-white rounded-xl font-bold border-2 border-gray-100 focus:border-gray-300 outline-none appearance-none"
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              condition: e.target.value,
                            })
                          }
                          value={metrics.condition}
                        >
                          <option>Mint in Box</option>
                          <option>Opened / Mint</option>
                          <option>Loose / Displayed</option>
                          <option>Damaged</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Relocated Chase Toggle */}
                  <div
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      setMetrics({ ...metrics, isChase: !metrics.isChase })
                    }
                  >
                    <span
                      className={`text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${
                        metrics.isChase ? "text-yellow-600" : "text-gray-400"
                      }`}
                    >
                      <Star
                        size={14}
                        className={
                          metrics.isChase
                            ? "fill-yellow-500 text-yellow-500"
                            : ""
                        }
                      />
                      Chase Edition
                    </span>
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                        metrics.isChase ? "bg-yellow-400" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                          metrics.isChase ? "translate-x-5" : ""
                        }`}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Purchased Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                      size={16}
                    />
                    <input
                      type="date"
                      className="w-full pl-10 p-4 bg-white rounded-xl font-bold border-2 border-gray-100 focus:border-blue-500 outline-none transition-all text-gray-600"
                      onChange={(e) =>
                        setMetrics({ ...metrics, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Source / Store
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="e.g. eBay"
                      className="w-full pl-10 p-4 bg-white rounded-xl font-bold border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                      onChange={(e) =>
                        setMetrics({ ...metrics, source: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  className="w-full p-5 bg-white rounded-2xl font-medium border-2 border-gray-100 focus:border-gray-300 outline-none resize-none min-h-[80px]"
                  placeholder="E.g. Shelf A..."
                  rows="2"
                  onChange={(e) =>
                    setMetrics({ ...metrics, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => saveModel("diecast_collection")}
                  disabled={status === "saving"}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white p-5 rounded-2xl font-black text-lg tracking-wide hover:shadow-2xl hover:shadow-red-500/30 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {status === "saving" ? "SAVING..." : "ADD TO GARAGE"}
                </button>
                <button
                  onClick={() => saveModel("iso_collection")}
                  disabled={status === "saving"}
                  className="flex-1 bg-gray-900 text-white p-5 rounded-2xl font-black text-lg tracking-wide hover:shadow-2xl hover:shadow-gray-900/30 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex justify-center items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  ADD TO ISO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PREORDER COMPONENT (Merged) ---
const Preorder = ({ userId, db, pythonApiUrl }) => {
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/preorder_collection`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPreorders(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, db]);

  const handleDelete = async (id) => {
    if (!confirm("Cancel this pre-order?")) return;
    await deleteDoc(doc(db, `users/${userId}/preorder_collection`, id));
    setSelectedItem(null);
  };

  const handleMoveToGarage = async (item) => {
    if (!confirm("Has this item arrived? Move to Main Garage?")) return;

    await addDoc(collection(db, `users/${userId}/diecast_collection`), {
      ...item,
      purchasePrice: item.expectedPrice,
      currentValue: item.expectedPrice,
      addedAt: new Date().toISOString(),
      condition: "Mint in Box",
      notes: `Pre-ordered from ${
        item.source
      }. Arrived: ${new Date().toLocaleDateString()}`,
    });

    await deleteDoc(doc(db, `users/${userId}/preorder_collection`, item.id));
    setSelectedItem(null);
  };

  const handleUpdate = async (id, updates) => {
    await updateDoc(
      doc(db, `users/${userId}/preorder_collection`, id),
      updates
    );
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );

  const totalExposure = preorders.reduce(
    (sum, item) => sum + (parseFloat(item.expectedPrice) || 0),
    0
  );

  return (
    <div className="space-y-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Clock className="text-blue-600" size={36} />
            PRE-ORDERS
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Track incoming assets and estimated arrivals.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={20} /> Add Pre-Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TiltCard className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
            Pending Arrivals
          </p>
          <p className="text-5xl font-black text-gray-900">
            {preorders.length}
          </p>
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600">
            <Package size={64} />
          </div>
        </TiltCard>
        <TiltCard className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
            Total Exposure
          </p>
          <p className="text-5xl font-black text-gray-900 blur-sm hover:blur-0 transition-all duration-300 cursor-pointer">
            ₹{totalExposure.toLocaleString()}
          </p>
          <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
            <DollarSign size={64} />
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {preorders.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer border-2 ${
              item.isDelayed
                ? "border-orange-200 bg-orange-50/30"
                : "border-transparent hover:border-blue-100"
            }`}
          >
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                <img
                  src={item.imageUrl}
                  className="w-full h-full object-contain"
                  alt={item.modelName}
                />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    #{item.modelNumber}
                  </p>
                  {item.isDelayed && (
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={10} /> DELAYED
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 mt-1">
                  {item.modelName}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      ETA
                    </span>
                    <span className="font-bold text-blue-600 text-sm">
                      {item.etaMonth} {item.etaYear}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Price
                    </span>
                    <p className="font-bold">₹{item.expectedPrice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <AddPreorderModal
          onClose={() => setShowAddForm(false)}
          db={db}
          userId={userId}
          pythonApiUrl={pythonApiUrl}
        />
      )}
      {selectedItem && (
        <EditPreorderModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onMove={handleMoveToGarage}
        />
      )}
    </div>
  );
};

const AddPreorderModal = ({ onClose, db, userId, pythonApiUrl }) => {
  const [modelNumber, setModelNumber] = useState("");
  const [status, setStatus] = useState("idle");
  const [foundDetails, setFoundDetails] = useState(null);
  const [form, setForm] = useState({
    expectedPrice: "",
    poAmount: "",
    etaMonth: "January",
    etaYear: "2025",
    source: "",
    isDelayed: false,
  });

  const fetchDetails = async () => {
    setStatus("searching");
    try {
      const res = await fetch(`${pythonApiUrl}/${modelNumber}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setFoundDetails(data);
      setStatus("found");
    } catch (err) {
      alert("Fetch failed. Is Python server running?");
      setStatus("idle");
    }
  };

  const handleSave = async () => {
    if (!foundDetails) return;
    setStatus("saving");
    await addDoc(collection(db, `users/${userId}/preorder_collection`), {
      ...foundDetails,
      modelNumber,
      ...form,
      addedAt: new Date().toISOString(),
    });
    onClose();
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["2024", "2025", "2026", "2027"];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-500/30 backdrop-blur-md">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-black text-gray-900 mb-6">
          New Pre-Order
        </h2>

        <div className="flex gap-4 mb-6">
          <input
            className="flex-grow p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
            placeholder="Model Number"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
          />
          <button
            onClick={fetchDetails}
            disabled={status === "searching"}
            className="bg-gray-900 text-white px-6 rounded-xl font-bold hover:bg-black"
          >
            {status === "searching" ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Fetch"
            )}
          </button>
        </div>

        {status === "found" && foundDetails && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl">
              <img
                src={foundDetails.imageUrl}
                className="w-20 h-20 object-contain"
              />
              <h3 className="font-bold text-lg">{foundDetails.modelName}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">
                  Exp. Price (₹)
                </label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-lg font-bold"
                  value={form.expectedPrice}
                  onChange={(e) =>
                    setForm({ ...form, expectedPrice: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">
                  PO Amount (Paid)
                </label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-lg font-bold"
                  value={form.poAmount}
                  onChange={(e) =>
                    setForm({ ...form, poAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">
                  ETA Month
                </label>
                <select
                  className="w-full p-3 bg-gray-50 rounded-lg font-bold"
                  value={form.etaMonth}
                  onChange={(e) =>
                    setForm({ ...form, etaMonth: e.target.value })
                  }
                >
                  {months.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">
                  ETA Year
                </label>
                <select
                  className="w-full p-3 bg-gray-50 rounded-lg font-bold"
                  value={form.etaYear}
                  onChange={(e) =>
                    setForm({ ...form, etaYear: e.target.value })
                  }
                >
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                Source
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-lg font-bold"
                placeholder="e.g. Karz&Dolls"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={status === "saving"}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30"
            >
              Confirm Pre-Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const EditPreorderModal = ({ item, onClose, onUpdate, onDelete, onMove }) => {
  const [form, setForm] = useState(item);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["2024", "2025", "2026", "2027"];

  const handleSave = () => {
    onUpdate(item.id, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-500/30 backdrop-blur-md">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <img src={item.imageUrl} className="h-40 object-contain mb-4" />
          <h2 className="text-2xl font-black text-center">{item.modelName}</h2>
        </div>

        <div className="space-y-6">
          <div
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              form.isDelayed
                ? "border-orange-200 bg-orange-50"
                : "border-gray-100 bg-gray-50"
            }`}
            onClick={() => setForm({ ...form, isDelayed: !form.isDelayed })}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  form.isDelayed
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Shipment Delayed?</p>
                <p className="text-xs text-gray-500">
                  Toggle if ETA has been pushed back.
                </p>
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                form.isDelayed
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-300"
              }`}
            >
              {form.isDelayed && <CheckCircle size={16} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                ETA Month
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-lg border"
                value={form.etaMonth}
                onChange={(e) => setForm({ ...form, etaMonth: e.target.value })}
              >
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                ETA Year
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-lg border"
                value={form.etaYear}
                onChange={(e) => setForm({ ...form, etaYear: e.target.value })}
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                Total Price
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 rounded-lg border"
                value={form.expectedPrice}
                onChange={(e) =>
                  setForm({ ...form, expectedPrice: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                Paid Amount
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 rounded-lg border"
                value={form.poAmount}
                onChange={(e) => setForm({ ...form, poAmount: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 border-t flex flex-col gap-3">
            <button
              onClick={handleSave}
              className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold hover:bg-black"
            >
              Save Changes
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => onMove(item)}
                className="flex-1 bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2"
              >
                <CheckCircle size={20} /> Arrived! Move to Garage
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-4 border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COLLECTION DISPLAY COMPONENT (Modified for Badges/Blur) ---
const CollectionDisplay = ({
  data,
  isLoading,
  onViewDetails,
  title,
  isIso = false,
}) => {
  if (isLoading)
    return (
      <div className="text-center p-20 flex flex-col items-center">
        <Loader2 className="animate-spin text-red-600 mb-4 w-10 h-10" />
        <p className="text-gray-400 font-bold">Scanning Garage...</p>
      </div>
    );

  const totalValue = data.reduce(
    (sum, item) => sum + (parseFloat(item.currentValue) || 0),
    0
  );
  const totalCount = data.length;

  if (data.length === 0)
    return (
      <div className="text-center p-20 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center">
        <div className="bg-gray-50 p-6 rounded-full mb-4">
          <Car className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {isIso ? "ISO List Empty" : "Garage Empty"}
        </h3>
        <p className="text-gray-500">
          {isIso
            ? "Add models you are searching for."
            : "Start by adding your first model."}
        </p>
      </div>
    );

  return (
    <div className="space-y-10">
      {!isIso && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TiltCard className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl text-white shadow-xl shadow-gray-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
              Total Models
            </p>
            <p className="text-5xl font-black">{totalCount}</p>
            <Car className="absolute bottom-6 right-6 w-12 h-12 text-white/10" />
          </TiltCard>
          <TiltCard className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
              Collection Value
            </p>
            {/* BLUR EFFECT APPLIED HERE */}
            <p className="text-5xl font-black text-gray-900 blur-sm hover:blur-0 transition-all duration-300 cursor-pointer">
              ₹{totalValue.toLocaleString()}
            </p>
            <TrendingUp className="absolute bottom-6 right-6 w-12 h-12 text-green-500/20 group-hover:text-green-500/40 transition-colors" />
          </TiltCard>
        </div>
      )}

      <div>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          {title}{" "}
          <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
            {totalCount}
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.map((car) => (
            <div
              key={car.id}
              onClick={() => onViewDetails(car)}
              className={`group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 relative overflow-hidden hover:-translate-y-2 ${
                car.isChase
                  ? "border-yellow-400 shadow-yellow-500/20"
                  : "border-transparent hover:border-red-100"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-t ${
                  car.isChase ? "from-yellow-500/10" : "from-red-500/5"
                } to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
              ></div>

              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-4 relative">
                <img
                  src={car.imageUrl}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:drop-shadow-2xl group-hover:scale-110 transition-all duration-500"
                  alt={car.modelName}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {car.isChase && (
                    <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Star size={8} fill="currentColor" /> CHASE
                    </span>
                  )}
                  {!isIso && car.condition === "Mint in Box" && (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      MINT
                    </span>
                  )}
                  {!isIso && (
                    <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {car.packaging === "Loose" ? "Display" : car.packaging}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 relative bg-white">
                <p className="text-[10px] font-bold text-red-600 tracking-wide uppercase mb-1">
                  Mini GT #{car.modelNumber}
                </p>
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-red-600 transition-colors">
                  {car.modelName}
                </h3>

                {!isIso && (
                  <div className="mt-3 flex items-end justify-between border-t border-gray-50 pt-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Value
                      </p>
                      <p className="text-lg font-black text-gray-900">
                        ₹{car.currentValue || 0}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Search size={14} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({
  car,
  onClose,
  onUpdate,
  onDelete,
  onMove,
  isIsoView,
}) => {
  const [form, setForm] = useState({
    ...car,
    packaging: car.packaging || "Blister",
    purchaseDate: car.purchaseDate || "",
    source: car.source || "",
    isChase: car.isChase || false,
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(
      car.id,
      {
        purchasePrice: parseFloat(form.purchasePrice),
        currentValue: parseFloat(form.currentValue),
        condition: form.condition,
        packaging: form.packaging,
        purchaseDate: form.purchaseDate,
        source: form.source,
        notes: form.notes,
        isChase: form.isChase,
      },
      car.type
    );
    setIsEditing(false);
  };

  const DetailRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3 text-gray-500">
        {Icon && <Icon size={16} />}
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <span className="font-bold text-gray-900">{value || "-"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-scale-up flex flex-col md:flex-row overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative min-h-[300px] md:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
          <img
            src={car.imageUrl}
            className="w-full h-auto object-contain filter drop-shadow-2xl relative z-10"
            alt=""
          />

          {car.isChase && (
            <div className="absolute bottom-6 right-6 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-xl font-black text-sm shadow-lg flex items-center gap-2 z-20 animate-pulse">
              <Star size={16} fill="currentColor" /> CHASE PIECE
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="md:w-1/2 p-8 flex flex-col bg-white">
          <div className="mb-6">
            <div className="flex gap-2 mb-3">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wide">
                MINI GT #{car.modelNumber}
              </span>
              {!isIsoView && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold tracking-wide">
                  {car.packaging === "Loose" ? "Display" : car.packaging}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">
              {car.modelName}
            </h2>
          </div>

          <div className="flex-grow space-y-6 overflow-y-auto pr-2">
            {!isEditing ? (
              <>
                {!isIsoView && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">
                        Bought For
                      </p>
                      <p className="text-2xl font-black text-gray-900">
                        ₹{car.purchasePrice}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-xs text-green-600 font-bold uppercase mb-1">
                        Collection Value
                      </p>
                      <p className="text-2xl font-black text-green-600">
                        ₹{car.currentValue}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <DetailRow
                    label="Condition"
                    value={car.condition}
                    icon={Package}
                  />
                  {!isIsoView && (
                    <>
                      <DetailRow
                        label="Purchased"
                        value={car.purchaseDate}
                        icon={Calendar}
                      />
                      <DetailRow
                        label="Source"
                        value={car.source}
                        icon={MapPin}
                      />
                    </>
                  )}
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-2">
                    Notes
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {car.notes || "No notes added."}
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Edit Mode - Include Chase Toggle */}
                <div
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 cursor-pointer"
                  onClick={() => setForm({ ...form, isChase: !form.isChase })}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${
                      form.isChase ? "text-yellow-600" : "text-gray-400"
                    }`}
                  >
                    Chase Model
                  </span>
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      form.isChase ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        form.isChase ? "translate-x-6" : ""
                      }`}
                    ></span>
                  </div>
                </div>

                {!isIsoView && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Buy Price
                      </label>
                      <input
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 font-bold"
                        type="number"
                        value={form.purchasePrice}
                        onChange={(e) =>
                          setForm({ ...form, purchasePrice: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-green-600 uppercase">
                        Est. Value
                      </label>
                      <input
                        className="w-full p-3 bg-green-50 rounded-lg border border-green-200 font-bold text-green-700"
                        type="number"
                        value={form.currentValue}
                        onChange={(e) =>
                          setForm({ ...form, currentValue: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {!isIsoView && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Packaging
                      </label>
                      <select
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                        value={form.packaging}
                        onChange={(e) =>
                          setForm({ ...form, packaging: e.target.value })
                        }
                      >
                        <option>Blister</option>
                        <option>Box</option>
                        <option>Loose</option>
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Condition
                    </label>
                    <select
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                      value={form.condition}
                      onChange={(e) =>
                        setForm({ ...form, condition: e.target.value })
                      }
                    >
                      <option>Mint in Box</option>
                      <option>Opened / Mint</option>
                      <option>Loose / Displayed</option>
                      <option>Damaged</option>
                    </select>
                  </div>
                </div>

                {!isIsoView && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                        value={form.purchaseDate}
                        onChange={(e) =>
                          setForm({ ...form, purchaseDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Source
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                        value={form.source}
                        onChange={(e) =>
                          setForm({ ...form, source: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Notes
                  </label>
                  <textarea
                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                    rows="3"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex gap-3">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-500/30"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg"
                >
                  Edit Details
                </button>
              )}
              <button
                onClick={() => onDelete(car.id, car.type)}
                className="px-4 border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {isIsoView && (
              <button
                onClick={() => onMove(car)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2"
              >
                <TrendingUp size={18} /> Move to Main Collection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
