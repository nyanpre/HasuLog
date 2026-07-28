// src/hooks/useUserRecords.ts
import { useState, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface StreamRecord {
  viewCount: number;
  memo: string;
  isFavorite?: boolean; // 🌟 お気に入りフラグを追加
  lastViewedAt: string;
  updatedAt: string;
}

export const useUserRecords = () => {
  const [records, setRecords] = useState<Record<string, StreamRecord>>({});

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setRecords({});
        return;
      }
      const recordsRef = collection(db, "users", user.uid, "streamRecords");
      const unsubscribeDocs = onSnapshot(recordsRef, (snapshot) => {
        const newRecords: Record<string, StreamRecord> = {};
        snapshot.forEach(doc => {
          newRecords[doc.id] = doc.data() as StreamRecord;
        });
        setRecords(newRecords);
      });
      return () => unsubscribeDocs();
    });

    return () => unsubscribeAuth();
  }, []);

  // 🌟 非同期関数としてPromiseを返す
  const updateRecord = async (streamId: string, data: Partial<StreamRecord>) => {
    const user = auth.currentUser;
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    
    const now = new Date().toISOString();
    const ref = doc(db, "users", user.uid, "streamRecords", streamId);
    const isViewUpdate = data.viewCount !== undefined;
    
    await setDoc(ref, {
      ...data,
      updatedAt: now,
      ...(isViewUpdate ? { lastViewedAt: now } : {})
    }, { merge: true });
  };

  return { records, updateRecord };
};