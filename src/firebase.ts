// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
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

// 🌟 修正: getFirestore(app) を置き換え、オフラインキャッシュを有効化して初期化
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// 🌟 追加: Storageをエクスポート
export const storage = getStorage(app);