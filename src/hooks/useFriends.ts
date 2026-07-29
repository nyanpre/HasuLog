// src/hooks/useFriends.ts
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export type FriendData = {
  uid: string;
  displayName: string;
  photoURL?: string;
  monthlyPoints: number;
  friendId: string;
};

export const useFriends = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const friendUids = docSnap.data().friends || [];
        if (friendUids.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }
        
        try {
          // フレンドのUIDリストから、全員の最新プロフィール情報を取得
          const friendPromises = friendUids.map((uid: string) => getDoc(doc(db, 'users', uid)));
          const friendDocs = await Promise.all(friendPromises);
          
          const friendsData = friendDocs
            .filter(d => d.exists())
            .map(d => {
              const data = d.data();
              return {
                uid: d.id,
                displayName: data?.displayName || '名無しさん',
                photoURL: data?.photoURL,
                monthlyPoints: data?.monthlyPoints || 0,
                friendId: data?.friendId || '',
              };
            }) as FriendData[];
          
          setFriends(friendsData);
        } catch (err) {
          console.error("フレンド取得エラー:", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // フレンドID（8桁）を使ってフレンドを追加
  const addFriend = async (friendCode: string) => {
    if (!currentUser) return;
    setError(null);
    try {
      const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (userSnap.exists() && userSnap.data().friendId === friendCode) {
        throw new Error("自分自身のIDは追加できません");
      }

      // 入力されたIDを持つユーザーを検索
      const q = query(collection(db, 'users'), where('friendId', '==', friendCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("ユーザーが見つかりませんでした");
      }

      const targetUid = querySnapshot.docs[0].id;
      
      // 自分のfriends配列に相手のUIDを追加
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayUnion(targetUid)
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // フレンドを解除
  const removeFriend = async (friendUid: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayRemove(friendUid)
      });
    } catch (err) {
      console.error("フレンド削除エラー:", err);
    }
  };

  return { friends, loading, error, addFriend, removeFriend };
};