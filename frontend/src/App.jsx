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
} from "lucide-react";

// --- CONFIGURATION START ---
// 🔒 SECURE CONFIGURATION:
// This helper safely accesses environment variables to prevent build errors
// in environments that don't support import.meta directly (like some previews).
const getEnv = (key, fallback) => {
  try {
    // In a standard Vite setup, import.meta.env exists.
    // We try/catch to handle environments where it might not.
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

// These values are loaded from your .env file in the frontend folder.
// The fallbacks prevent crashes if the .env file is missing during development.
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

const PYTHON_API_URL = "http://localhost:5000/api/fetch_model";

// Initialize Firebase
// Check if config is loaded correctly
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PASTE_YOUR")) {
  console.warn(
    "Firebase Config Missing or using placeholders! Make sure your .env file exists in the frontend folder and you have restarted the server."
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- 3D Tilt Card Component ---
const TiltCard = ({ children, className = "" }) => {
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

    const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
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

const App = () => {
  const [view, setView] = useState("add");
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [collectionData, setCollectionData] = useState([]);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [error, setError] = useState(null);

  // 1. Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) {
      setCollectionData([]);
      return;
    }

    setLoadingCollection(true);
    console.log(`Listening to: users/${user.uid}/diecast_collection`);
    const q = query(collection(db, `users/${user.uid}/diecast_collection`));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCollectionData(list);
        setLoadingCollection(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        if (err.code === "permission-denied") {
          setError("Database Permission Denied. Check Firestore Rules.");
        } else {
          setError(`Database Error: ${err.message}`);
        }
        setLoadingCollection(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

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

  const handleDeleteCar = async (carId) => {
    if (!confirm("Delete this model?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/diecast_collection`, carId));
      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    }
  };

  const handleUpdateCar = async (carId, updates) => {
    try {
      await updateDoc(
        doc(db, `users/${user.uid}/diecast_collection`, carId),
        updates
      );
      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
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

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-8 z-10 border border-white/20">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-5 rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <Car className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              GARAGE<span className="text-red-600">.OS</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Next-Gen Collection Tracking
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
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

  // Authenticated App
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-20 selection:bg-red-200">
      {/* Glass Navbar */}
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
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  view === "add"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Plus size={16} className="inline mr-2" />
                Add Model
              </button>
              <button
                onClick={() => setView("collections")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  view === "collections"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <ShoppingCart size={16} className="inline mr-2" />
                Collection
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors ml-2"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 pt-28">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8 flex items-center shadow-sm">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <X size={16} />
            </div>
            <span className="font-medium">{error}</span>
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
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 z-50 flex justify-around">
        <button
          onClick={() => setView("add")}
          className={`flex flex-col items-center ${
            view === "add" ? "text-red-600" : "text-gray-400"
          }`}
        >
          <Plus size={24} />
          <span className="text-xs font-bold mt-1">Add</span>
        </button>
        <button
          onClick={() => setView("collections")}
          className={`flex flex-col items-center ${
            view === "collections" ? "text-red-600" : "text-gray-400"
          }`}
        >
          <ShoppingCart size={24} />
          <span className="text-xs font-bold mt-1">Garage</span>
        </button>
      </div>

      {showDetailModal && selectedCar && (
        <DetailModal
          car={selectedCar}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleUpdateCar}
          onDelete={handleDeleteCar}
        />
      )}
    </div>
  );
};

const AddModelForm = ({ userId, setError, setView }) => {
  const [modelNumber, setModelNumber] = useState("");
  const [status, setStatus] = useState("idle");
  const [foundDetails, setFoundDetails] = useState(null);
  const [metrics, setMetrics] = useState({
    purchasePrice: "",
    currentValue: "",
    condition: "Mint in Box",
    notes: "",
  });

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

  const saveModel = async () => {
    if (!foundDetails) return;
    setStatus("saving");
    try {
      await addDoc(collection(db, `users/${userId}/diecast_collection`), {
        ...foundDetails,
        modelNumber,
        ...metrics,
        purchasePrice: parseFloat(metrics.purchasePrice) || 0,
        currentValue: parseFloat(metrics.currentValue) || 0,
        addedAt: new Date().toISOString(),
      });
      setView("collections");
      setModelNumber("");
      setFoundDetails(null);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Save Failed! Check console.");
    }
    setStatus("idle");
  };

  return (
    <div className="max-w-4xl mx-auto relative group">
      {/* Decorative Background Elements */}
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50">
        {/* Header Section with Blueprint Pattern */}
        <div className="relative p-8 md:p-12 overflow-hidden bg-slate-50">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-50 to-transparent skew-x-12 opacity-50"></div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold tracking-widest uppercase mb-4 border border-red-200">
              <Plus size={12} strokeWidth={3} /> Inventory System
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
              ACQUIRE{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                ASSET
              </span>
            </h2>
            <p className="text-gray-500 font-medium max-w-lg">
              Enter the manufacturer's model code to retrieve technical
              specifications and imagery from the global database.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <Search
                className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={24}
              />
              <input
                className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-gray-100 focus:border-red-500 focus:bg-white rounded-2xl text-xl font-bold outline-none transition-all placeholder:font-normal placeholder:text-gray-300 shadow-inner"
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
                      Asset Identified
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
                          className="w-full pl-10 p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:bg-white focus:border-red-500 outline-none transition-all"
                          placeholder="0"
                          type="number"
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              purchasePrice: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide group-focus-within:text-green-500 transition-colors">
                        Est. Value
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-green-500 transition-colors">
                          ₹
                        </span>
                        <input
                          className="w-full pl-10 p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:bg-white focus:border-green-500 outline-none transition-all"
                          placeholder="0"
                          type="number"
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              currentValue: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      Condition
                    </label>
                    <div className="relative">
                      <select
                        className="w-full p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:bg-white focus:border-gray-300 outline-none appearance-none"
                        onChange={(e) =>
                          setMetrics({ ...metrics, condition: e.target.value })
                        }
                      >
                        <option>Mint in Box</option>
                        <option>Opened / Mint</option>
                        <option>Loose / Displayed</option>
                        <option>Damaged</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Notes & Location
                </label>
                <textarea
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium border-2 border-transparent focus:bg-white focus:border-gray-200 outline-none resize-none min-h-[100px]"
                  placeholder="E.g. Shelf A, Row 2..."
                  rows="2"
                  onChange={(e) =>
                    setMetrics({ ...metrics, notes: e.target.value })
                  }
                />
              </div>

              <button
                onClick={saveModel}
                disabled={status === "saving"}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white p-5 rounded-2xl font-black text-xl tracking-wide hover:shadow-2xl hover:shadow-red-500/30 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex justify-center items-center gap-3"
              >
                <Save className="w-6 h-6" />
                {status === "saving" ? "ENCRYPTING DATA..." : "SECURE ASSET"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CollectionDisplay = ({ data, isLoading, onViewDetails }) => {
  if (isLoading)
    return (
      <div className="text-center p-20 flex flex-col items-center">
        <Loader2 className="animate-spin text-red-600 mb-4 w-10 h-10" />
        <p className="text-gray-400 font-bold">Scanning Garage...</p>
      </div>
    );

  // Calculate Stats
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
        <h3 className="text-xl font-bold text-gray-900">Garage Empty</h3>
        <p className="text-gray-500">Start by adding your first model.</p>
      </div>
    );

  return (
    <div className="space-y-10">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TiltCard className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl text-white shadow-xl shadow-gray-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
            Total Assets
          </p>
          <p className="text-5xl font-black">{totalCount}</p>
          <Car className="absolute bottom-6 right-6 w-12 h-12 text-white/10" />
        </TiltCard>
        <TiltCard className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
            Portfolio Value
          </p>
          <p className="text-5xl font-black text-gray-900">
            ₹{totalValue.toLocaleString()}
          </p>
          <TrendingUp className="absolute bottom-6 right-6 w-12 h-12 text-green-500/20 group-hover:text-green-500/40 transition-colors" />
        </TiltCard>
      </div>

      {/* Grid */}
      <div>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          Garage Inventory{" "}
          <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
            {totalCount}
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.map((car) => (
            <div
              key={car.id}
              onClick={() => onViewDetails(car)}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-red-100 relative overflow-hidden hover:-translate-y-2"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-4 relative">
                <img
                  src={car.imageUrl}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:drop-shadow-2xl group-hover:scale-110 transition-all duration-500"
                  alt={car.modelName}
                />
                {car.condition === "Mint in Box" && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    MINT
                  </span>
                )}
              </div>
              <div className="p-4 relative bg-white">
                <p className="text-[10px] font-bold text-red-600 tracking-wide uppercase mb-1">
                  Mini GT #{car.modelNumber}
                </p>
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-red-600 transition-colors">
                  {car.modelName}
                </h3>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ car, onClose, onUpdate, onDelete }) => {
  const [form, setForm] = useState(car);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(car.id, {
      purchasePrice: parseFloat(form.purchasePrice),
      currentValue: parseFloat(form.currentValue),
      notes: form.notes,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-scale-up flex flex-col md:flex-row overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
          <img
            src={car.imageUrl}
            className="w-full h-auto object-contain filter drop-shadow-2xl relative z-10"
            alt=""
          />
        </div>

        {/* Info Section */}
        <div className="md:w-1/2 p-8 flex flex-col">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wide mb-2">
              MINI GT #{car.modelNumber}
            </span>
            <h2 className="text-2xl font-black text-gray-900 leading-tight">
              {car.modelName}
            </h2>
          </div>

          <div className="flex-grow space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">
                  Purchase Price
                </p>
                {isEditing ? (
                  <input
                    className="w-full bg-white border border-gray-200 rounded p-1 font-bold text-lg"
                    type="number"
                    value={form.purchasePrice}
                    onChange={(e) =>
                      setForm({ ...form, purchasePrice: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-xl font-black text-gray-900">
                    ₹{car.purchasePrice}
                  </p>
                )}
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase mb-1">
                  Current Value
                </p>
                {isEditing ? (
                  <input
                    className="w-full bg-white border border-green-200 rounded p-1 font-bold text-lg text-green-700"
                    type="number"
                    value={form.currentValue}
                    onChange={(e) =>
                      setForm({ ...form, currentValue: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-xl font-black text-green-600">
                    ₹{car.currentValue}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-full">
              <p className="text-xs text-gray-400 font-bold uppercase mb-2">
                Collector Notes
              </p>
              {isEditing ? (
                <textarea
                  className="w-full bg-white border border-gray-200 rounded p-2 text-sm"
                  rows="4"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              ) : (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {car.notes || "No notes added."}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
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
              onClick={() => onDelete(car.id)}
              className="px-4 border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
