// src/hooks/usePublicMemos.ts
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export type PublicMemo = {
  userId: string;
  memo: string;
  visibility: 'public_anonymous' | 'public_named';
  updatedAt: string;
  userName?: string;
};

const memoCache = new Map<string, { data: PublicMemo[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; 

export const usePublicMemos = (streamId: string | undefined) => {
  const [memos, setMemos] = useState<PublicMemo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0); 
  const { currentUser } = useAuth();

  const refetch = useCallback(() => {
    if (streamId) {
      memoCache.delete(streamId); 
      setRefreshCount((prev) => prev + 1); 
    }
  }, [streamId]);

  useEffect(() => {
    if (!streamId) {
      setMemos([]);
      return;
    }

    const fetchMemos = async () => {
      const cached = memoCache.get(streamId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setMemos(cached.data);
        return;
      }

      setLoading(true);
      try {
        const docRef = doc(db, 'publicMemos', streamId);
        const docSnap = await getDoc(docRef);

        let fetchedMemos: PublicMemo[] = [];

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.memos) {
            fetchedMemos = Object.entries(data.memos).map(([userId, memoData]: [string, any]) => ({
              userId,
              ...memoData
            }));
          }
        }

        // 🌟 修正: 自分のメモを除外するフィルターを削除しました！
        // これにより、自分が書いたメモも「みんなのメモ」一覧に表示され、公開されたか確認できるようになります。

        fetchedMemos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        memoCache.set(streamId, { data: fetchedMemos, timestamp: Date.now() });
        setMemos(fetchedMemos);
      } catch (error) {
        console.error('公開メモの取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [streamId, currentUser?.uid, refreshCount]);

  return { memos, loading, refetch }; 
};