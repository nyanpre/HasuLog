// src/components/profile/FriendRankComparison.tsx
import { Trophy } from 'lucide-react';
import { getRankInfo } from '../../utils/pointSystem';
import { useUserData } from '../../hooks/useUserData';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../contexts/AuthContext'; // 🌟 追加

export const FriendRankComparison = () => {
  const { userData } = useUserData();
  const { friends } = useFriends();
  const { currentUser } = useAuth(); // 🌟 認証情報から確実に取得する

  // 自分とフレンドのデータを結合してランキング化
  const allUsers = [
    {
      id: 'me',
      // 🌟 userData ではなく currentUser から名前と写真を取得
      name: currentUser?.displayName || 'あなた',
      monthlyPoints: userData?.monthlyPoints || 0,
      photoURL: currentUser?.photoURL,
      isMe: true
    },
    ...friends.map(f => ({
      id: f.uid,
      name: f.displayName,
      monthlyPoints: f.monthlyPoints,
      photoURL: f.photoURL,
      isMe: false
    }))
  ];

  // ポイントが多い順にソート
  const sortedUsers = allUsers.sort((a, b) => b.monthlyPoints - a.monthlyPoints);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
        <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
        フレンドランキング (今月)
      </h3>

      <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2">
        {sortedUsers.map((user, index) => {
          const rankInfo = getRankInfo(user.monthlyPoints);
          return (
            <div 
              key={user.id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                user.isMe ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black flex-shrink-0 ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                )}
                
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-700 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{user.monthlyPoints.toLocaleString()} pt</p>
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                <span className={`text-lg font-black ${rankInfo.color}`}>{rankInfo.rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};