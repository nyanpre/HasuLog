// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 先ほどのFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBAgCOz1BugFtGWTWhItVq3xQsSCC7XStk",
  authDomain: "hasulog.firebaseapp.com",
  projectId: "hasulog",
  storageBucket: "hasulog.firebasestorage.app",
  messagingSenderId: "572812400505",
  appId: "1:572812400505:web:f2faa86d851df6fd7c41a8"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// データベース(Firestore)と認証(Auth)の機能をエクスポートして、他のファイルで使えるようにする
export const db = getFirestore(app);
export const auth = getAuth(app);