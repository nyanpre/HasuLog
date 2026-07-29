// src/hooks/useUserRecords.ts
import { useState, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface StreamRecord {
  streamId?: string; // pointSystem.tsで追加されるため念のため定義
  streamTitle?: string; // pointSystem.tsで追加されるため念のため定義
  viewCount: number;
  memo: string;
  isFavorite?: boolean;
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
      // 🌟 Firestoreの保存先を "streamRecords" から新しいスキーマの "watchHistory" に変更
      const recordsRef = collection(db, "users", user.uid, "watchHistory");
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

  const updateRecord = async (streamId: string, data: Partial<StreamRecord>) => {
    const user = auth.currentUser;
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    
    const now = new Date().toISOString();
    // 🌟 こちらの参照先も "watchHistory" に変更
    const ref = doc(db, "users", user.uid, "watchHistory", streamId);
    const isViewUpdate = data.viewCount !== undefined;
    
    await setDoc(ref, {
      ...data,
      updatedAt: now,
      ...(isViewUpdate ? { lastViewedAt: now } : {})
    }, { merge: true });
  };

  return { records, updateRecord };
};