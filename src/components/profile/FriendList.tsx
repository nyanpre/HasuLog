// src/components/profile/FriendList.tsx
import { useState } from 'react';
import { Users, Search, UserPlus, User, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import { PointDashboard } from './PointDashboard'; // 🌟 ダッシュボードをインポート

type TabType = 'list' | 'add' | 'requests';

interface FriendListProps {
  friendId: string;
}

interface SearchResult {
  uid: string;
  displayName: string;
  photoURL?: string;
  oshiMember?: string;
  friendId?: string;
}

export default function FriendList({ friendId }: FriendListProps) {
  const { currentUser } = useAuth();
  const { friends, addFriend, removeFriend, error: hookError } = useFriends();
  
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState('');

  // 🌟 選択したフレンドのダッシュボードを開くためのステート
  const [selectedFriend, setSelectedFriend] = useState<{uid: string, name: string} | null>(null);

  const requests: any[] = []; 

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchMessage('');
    setSearchResults([]);

    try {
      const usersRef = collection(db, 'users');
      const isIdSearch = /^\d{8}$/.test(searchQuery.trim());
      
      const q = isIdSearch 
        ? query(usersRef, where('friendId', '==', searchQuery.trim()))
        : query(usersRef, where('displayName', '==', searchQuery.trim()));

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setSearchMessage('ユーザーが見つかりませんでした。');
      } else {
        const results: SearchResult[] = [];
        snapshot.forEach((doc) => {
          if (doc.id !== currentUser?.uid) {
            results.push({
              uid: doc.id,
              displayName: doc.data().displayName || '名無しさん',
              photoURL: doc.data().photoURL,
              oshiMember: doc.data().oshiMember,
              friendId: doc.data().friendId,
            });
          }
        });
        
        if (results.length === 0) {
          setSearchMessage('ユーザーが見つかりませんでした。');
        } else {
          setSearchResults(results);
        }
      }
    } catch (error) {
      console.error("検索エラー:", error);
      setSearchMessage('検索中にエラーが発生しました。');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetFriendId?: string) => {
    if (!targetFriendId) {
      alert("IDが取得できませんでした。");
      return;
    }
    const success = await addFriend(targetFriendId);
    if (success) {
      alert("フレンドを追加しました！");
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('list');
    } else {
      alert("追加に失敗しました。既にフレンドの可能性があります。");
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 border border-gray-100 h-full flex flex-col">
        <div className="flex items-center mb-4 text-gray-800 border-b border-gray-100 pb-2">
          <Users size={20} className="mr-2 text-gray-600" />
          <h3 className="font-bold">フレンド</h3>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            フレンド一覧
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'add' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            追加する
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors relative ${activeTab === 'requests' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            承認待ち
            {requests.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-pink-500 rounded-full"></span>
            )}
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar -mx-2 px-2">
          {activeTab === 'list' && (
            <div className="space-y-3 pb-4">
              {friends.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  まだフレンドがいません。
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div 
                      key={friend.uid} 
                      onClick={() => setSelectedFriend({uid: friend.uid, name: friend.displayName})} // 🌟 クリックでダッシュボードを開く
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group transition-colors hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0 overflow-hidden border border-gray-200">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-gray-800 text-sm truncate">{friend.displayName}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // 🌟 ゴミ箱を押した時はダッシュボードを開かないようにする
                          if (window.confirm(`${friend.displayName}さんをフレンドから削除しますか？`)) {
                            removeFriend(friend.uid);
                          }
                        }}
                        className="ml-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="フレンド解除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="pb-4">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="8桁のID または 表示名" 
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                />
                <button 
                  type="submit" 
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[48px]"
                >
                  {isSearching ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                </button>
              </form>

              {searchMessage && <p className="text-sm text-red-500 mb-4 text-center">{searchMessage}</p>}
              {hookError && <p className="text-sm text-red-500 mb-4 text-center">{hookError}</p>}

              {searchResults.length > 0 && (
                <div className="mb-6 space-y-3">
                  <p className="text-xs font-bold text-gray-500">検索結果</p>
                  {searchResults.map(user => (
                    <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold flex-shrink-0 overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-gray-800 text-sm truncate">{user.displayName}</p>
                          {user.oshiMember && <p className="text-xs text-pink-500 truncate">推し: {user.oshiMember}</p>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddFriend(user.friendId)}
                        className="ml-2 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors flex-shrink-0"
                      >
                        <UserPlus size={14} />
                        追加
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-3 pb-4">
              {requests.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  承認待ちのフレンドリクエストはありません。
                </div>
              ) : (
                <div>リクエストリストを表示します</div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-auto flex-shrink-0">
          <p className="text-xs text-blue-600 font-bold mb-1">あなたのフレンドID</p>
          <div 
            className="flex justify-between items-center bg-white border border-blue-200 p-2 rounded text-lg font-mono font-bold text-gray-700 tracking-wider text-center cursor-pointer hover:bg-blue-50/50 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(friendId);
              alert("フレンドIDをコピーしました！");
            }}
            title="クリックしてコピー"
          >
            {friendId || "取得中..."}
          </div>
        </div>
      </div>

      {/* 🌟 選択したフレンドのダッシュボードを表示 */}
      {selectedFriend && (
        <PointDashboard 
          targetUserId={selectedFriend.uid}
          targetUserName={selectedFriend.name}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </>
  );
}