// src/hooks/usePublicMemos.ts
import { useState, useEffect, useCallback } from 'react';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export type PublicMemo = {
  id: string;
  userId: string;
  memo: string;
  visibility: 'public_anonymous' | 'public_named';
  updatedAt: string;
  userName?: string;
};

const memoCache = new Map<string, { data: PublicMemo[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

export const usePublicMemos = (streamId: string | undefined) => {
  const [memos, setMemos] = useState<PublicMemo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0); // 🌟 追加: 再取得用トリガー
  const { currentUser } = useAuth();

  // 🌟 追加: キャッシュを破棄して強制的に再取得する関数
  const refetch = useCallback(() => {
    if (streamId) {
      memoCache.delete(streamId); // この動画のキャッシュを消去
      setRefreshCount((prev) => prev + 1); // useEffectを再実行させる
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
        const memosQuery = query(
          collectionGroup(db, 'watchHistory'),
          where('streamId', '==', streamId),
          where('memoVisibility', 'in', ['public_anonymous', 'public_named'])
        );

        const snapshot = await getDocs(memosQuery);
        const fetchedMemos: PublicMemo[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const userId = doc.ref.parent.parent?.id || 'unknown';

          if (!data.memo || data.memo.trim() === '') return;

          fetchedMemos.push({
            id: doc.id,
            userId,
            memo: data.memo,
            visibility: data.memoVisibility,
            updatedAt: data.updatedAt,
            userName: data.userName,
          });
        });

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
  }, [streamId, currentUser?.uid, refreshCount]); // 🌟 refreshCountを追加

  return { memos, loading, refetch }; // 🌟 refetchを外で使えるように返す
};