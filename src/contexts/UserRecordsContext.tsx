// src/contexts/UserRecordsContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
// 🌟 型定義は既存のものを再利用します
import type { StreamRecord } from '../hooks/useUserRecords';

type UserRecordsContextType = {
  records: Record<string, StreamRecord>;
  updateRecord: (streamId: string, data: Partial<StreamRecord>) => Promise<void>;
};

const UserRecordsContext = createContext<UserRecordsContextType | undefined>(undefined);

export const UserRecordsProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<Record<string, StreamRecord>>({});

  useEffect(() => {
    // ログインしていない時はデータを空にする
    if (!currentUser) {
      setRecords({});
      return;
    }

    // ログイン中なら、そのユーザーの視聴履歴を「1回だけ」監視（onSnapshot）する
    const recordsRef = collection(db, "users", currentUser.uid, "watchHistory");
    const unsubscribeDocs = onSnapshot(recordsRef, (snapshot) => {
      const newRecords: Record<string, StreamRecord> = {};
      snapshot.forEach(doc => {
        newRecords[doc.id] = doc.data() as StreamRecord;
      });
      setRecords(newRecords);
    });

    // クリーンアップ関数
    return () => unsubscribeDocs();
  }, [currentUser]);

  const updateRecord = async (streamId: string, data: Partial<StreamRecord>) => {
    if (!currentUser) {
      alert("ログインが必要です");
      return;
    }
    
    const now = new Date().toISOString();
    const ref = doc(db, "users", currentUser.uid, "watchHistory", streamId);
    const isViewUpdate = data.viewCount !== undefined;
    
    await setDoc(ref, {
      ...data,
      updatedAt: now,
      ...(isViewUpdate ? { lastViewedAt: now } : {})
    }, { merge: true });
  };

  return (
    <UserRecordsContext.Provider value={{ records, updateRecord }}>
      {children}
    </UserRecordsContext.Provider>
  );
};

export const useUserRecordsContext = () => {
  const context = useContext(UserRecordsContext);
  if (context === undefined) {
    throw new Error('useUserRecordsContext must be used within a UserRecordsProvider');
  }
  return context;
};