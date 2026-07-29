// src/components/profile/FriendSocialModal.tsx
import { useState, useEffect } from 'react';
import { X, User, Users } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface FriendData {
  uid: string;
  displayName: string;
  photoURL?: string;
  oshiMember?: string;
}

interface FriendSocialModalProps {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}

export function FriendSocialModal({ targetUserId, targetUserName, onClose }: FriendSocialModalProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<FriendData[]>([]);
  const [followers, setFollowers] = useState<FriendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchSocialData = async () => {
      setIsLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', targetUserId));
        const friendUids = userDoc.data()?.friends || [];
        
        if (friendUids.length > 0) {
          const followingDocs = await Promise.all(friendUids.map((uid: string) => getDoc(doc(db, 'users', uid))));
          setFollowing(
            followingDocs
              .filter(d => d.exists() && d.id !== targetUserId)
              .map(d => ({ uid: d.id, displayName: d.data()?.displayName || '名無しさん', ...d.data() } as FriendData))
          );
        } else {
          setFollowing([]);
        }

        const followersQuery = query(collection(db, 'users'), where('friends', 'array-contains', targetUserId));
        const followersSnap = await getDocs(followersQuery);
        
        setFollowers(
          followersSnap.docs
            .filter(d => d.id !== targetUserId)
            .map(d => ({ uid: d.id, displayName: d.data()?.displayName || '名無しさん', ...d.data() } as FriendData))
        );

      } catch (error) {
        console.error("フレンドデータの取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, [targetUserId]);

  // 🌟 対象ユーザーにとって「相互」かどうかを判定
  const isMutual = (uid: string) => 
    following.some(f => f.uid === uid) && followers.some(f => f.uid === uid);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-600" />
            <h3 className="font-bold text-gray-800 text-sm">{targetUserName} さんのフレンド</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-200/50 hover:bg-gray-200 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-100 p-2 gap-1 bg-white">
          <button 
            onClick={() => setActiveTab('following')} 
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'following' ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            フォロー中 {!isLoading && `(${following.length})`}
          </button>
          <button 
            onClick={() => setActiveTab('followers')} 
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'followers' ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            フォロワー {!isLoading && `(${followers.length})`}
          </button>
        </div>

        {/* リスト部分 */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <span className="w-6 h-6 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'following' && (
                following.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">誰もフォローしていません</p>
                ) : (
                  following.map(user => (
                    <UserListItem key={user.uid} user={user} isMutual={isMutual(user.uid)} />
                  ))
                )
              )}

              {activeTab === 'followers' && (
                followers.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">フォロワーがいません</p>
                ) : (
                  followers.map(user => (
                    <UserListItem key={user.uid} user={user} isMutual={isMutual(user.uid)} />
                  ))
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🌟 isMutual（相互判定）を受け取れるように拡張
function UserListItem({ user, isMutual }: { user: FriendData, isMutual: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold flex-shrink-0 overflow-hidden">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <User size={18} />
        )}
      </div>
      <div className="truncate">
        {/* 名前と「相互」バッジを並べて表示 */}
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-gray-800 text-sm truncate">{user.displayName}</p>
          {isMutual && (
            <span className="text-[9px] bg-pink-50 text-pink-500 border border-pink-200 px-1 py-0.5 rounded-sm font-bold flex-shrink-0">相互</span>
          )}
        </div>
        {user.oshiMember && (
          <p className="text-[10px] text-pink-500 truncate mt-0.5">推し: {user.oshiMember}</p>
        )}
      </div>
    </div>
  );
}