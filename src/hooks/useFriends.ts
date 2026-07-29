// src/hooks/useFriends.ts
import { useState, useEffect } from 'react';
import { doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export type FriendData = {
  uid: string;
  displayName: string;
  photoURL?: string;
  monthlyPoints: number;
  friendId: string;
  oshiMember?: string;
};

export const useFriends = () => {
  const { currentUser } = useAuth();
  
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [followers, setFollowers] = useState<FriendData[]>([]);
  const [requests, setRequests] = useState<FriendData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);

    // 🌟 安全にデータを整形する処理（データ欠損によるクラッシュ防止）
    const mapDocToFriend = (d: any): FriendData => {
      const data = d.data();
      return {
        uid: d.id,
        displayName: data?.displayName || '名無しさん',
        photoURL: data?.photoURL,
        monthlyPoints: data?.monthlyPoints || 0,
        friendId: data?.friendId || '',
        oshiMember: data?.oshiMember
      };
    };
    
    // 1. 自分のデータ（フォロー中 ＆ 承認待ち）を監視
    const unsubUser = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const friendUids = data?.friends || [];
        const requestUids = data?.followRequests || [];

        try {
          if (friendUids.length > 0) {
            const friendDocs = await Promise.all(friendUids.map((uid: string) => getDoc(doc(db, 'users', uid))));
            setFriends(friendDocs.filter(d => d.exists()).map(mapDocToFriend));
          } else {
            setFriends([]);
          }

          if (requestUids.length > 0) {
            const requestDocs = await Promise.all(requestUids.map((uid: string) => getDoc(doc(db, 'users', uid))));
            setRequests(requestDocs.filter(d => d.exists()).map(mapDocToFriend));
          } else {
            setRequests([]);
          }
        } catch (err) {
          console.error("ユーザー情報取得エラー:", err);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("ユーザースナップショットエラー:", err);
      setLoading(false);
    });

    // 2. 自分をフォローしている人（フォロワー）を監視
    const followersQuery = query(collection(db, 'users'), where('friends', 'array-contains', currentUser.uid));
    const unsubFollowers = onSnapshot(followersQuery, (snap) => {
      setFollowers(snap.docs.map(mapDocToFriend));
    }, (err) => {
      console.error("フォロワー監視エラー:", err);
    });

    return () => {
      unsubUser();
      unsubFollowers();
    };
  }, [currentUser]);

  // フォローリクエストを送信（または相互フォロー成立）
  const requestFollow = async (targetFriendCode: string) => {
    if (!currentUser) return false;
    setError(null);
    try {
      const myUserSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (myUserSnap.exists() && myUserSnap.data()?.friendId === targetFriendCode) {
        throw new Error("自分自身は追加できません");
      }

      const q = query(collection(db, 'users'), where('friendId', '==', targetFriendCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) throw new Error("ユーザーが見つかりませんでした");
      
      const targetDoc = querySnapshot.docs[0];
      const targetUid = targetDoc.id;
      const targetData = targetDoc.data();

      if (targetData?.friends?.includes(currentUser.uid)) {
        await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayUnion(targetUid) });
        return 'added'; 
      } else {
        await updateDoc(doc(db, 'users', targetUid), { followRequests: arrayUnion(currentUser.uid) });
        return 'requested'; 
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const approveRequest = async (requesterUid: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', requesterUid), { friends: arrayUnion(currentUser.uid) });
      await updateDoc(doc(db, 'users', currentUser.uid), { followRequests: arrayRemove(requesterUid) });
    } catch (err) { console.error(err); }
  };

  const rejectRequest = async (requesterUid: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { followRequests: arrayRemove(requesterUid) });
    } catch (err) { console.error(err); }
  };

  const removeFriend = async (friendUid: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayRemove(friendUid) });
    } catch (err) { console.error(err); }
  };

  return { 
    friends, followers, requests, loading, error, 
    requestFollow, 
    addFriend: requestFollow, // 🌟 既存のコンポーネントがエラーで落ちないように互換性を保つ
    approveRequest, rejectRequest, removeFriend 
  };
};