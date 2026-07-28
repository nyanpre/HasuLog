import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyBAgCOz1BugFtGWTWhItVq3xQsSCC7XStk",
  authDomain: "hasulog.firebaseapp.com",
  projectId: "hasulog",
  storageBucket: "hasulog.firebasestorage.app",
  messagingSenderId: "572812400505",
  appId: "1:572812400505:web:f2faa86d851df6fd7c41a8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// 🌟 追加: Storageをエクスポート
export const storage = getStorage(app);