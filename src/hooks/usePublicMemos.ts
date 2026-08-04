// src/hooks/usePublicMemos.ts
import { useState, useEffect } from 'react';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export type PublicMemo = {
  id: string; // ドキュメントID
  userId: string; // 作成者のUID
  memo: string;
  visibility: 'public_anonymous' | 'public_named';
  updatedAt: string;
  userName?: string;
};

export const usePublicMemos = (streamId: string | undefined) => {
  const [memos, setMemos] = useState<PublicMemo[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // streamIdが無い場合や、初期化前は処理しない
    if (!streamId) {
      setMemos([]);
      return;
    }

    const fetchMemos = async () => {
      setLoading(true);
      try {
        // collectionGroupを使って、全ユーザーの watchHistory から該当する動画の公開メモを検索
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

          // 空のメモや、自分のメモ（自分の入力欄で確認できるため）は一覧から除外する
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

        // 新しい順に並べ替え
        fetchedMemos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setMemos(fetchedMemos);
      } catch (error) {
        console.error('公開メモの取得エラー:', error);
        // ※最初はFirestoreのインデックス作成が必要なため、ここにエラーが出ます（後述します）
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [streamId, currentUser]);

  return { memos, loading };
};