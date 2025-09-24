import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxFfJWeMWqGZtMBQt-DH5W0vXo4i1FYIU",
  authDomain: "veyoo-ai-bd7d6.firebaseapp.com",
  projectId: "veyoo-ai-bd7d6",
  storageBucket: "veyoo-ai-bd7d6.firebasestorage.app",
  messagingSenderId: "406735514034",
  appId: "1:406735514034:web:ab0916bd7c3adac95a9cab",
  measurementId: "G-SLE06LD454"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };