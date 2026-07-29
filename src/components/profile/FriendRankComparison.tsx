import type { RankGrade } from '../../types/rank';
import { RANKS } from '../../constants/rank';

export interface FriendStat {
  id: string;
  name: string;
  avatarUrl?: string;
  monthlyPoints: number;
  rank: RankGrade;
}

interface FriendRankComparisonProps {
  friends: FriendStat[];
}

export const FriendRankComparison = ({ friends }: FriendRankComparisonProps) => {
  // ポイントが高い順に並び替え
  const sortedFriends = [...friends].sort((a, b) => b.monthlyPoints - a.monthlyPoints);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
        🏆 フレンドランキング
      </h3>
      <ul className="space-y-3">
        {sortedFriends.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">フレンドがいません</p>
        ) : (
          sortedFriends.map((friend, index) => {
            const rankInfo = RANKS[friend.rank];
            const isTop3 = index < 3;
            
            return (
              <li key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                <div className="flex items-center gap-4">
                  {/* 順位 */}
                  <span className={`w-6 text-center font-black ${isTop3 ? 'text-gray-800' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                  
                  {/* アイコン */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 font-bold">{friend.name[0]}</span>
                    )}
                  </div>
                  
                  {/* 名前とポイント */}
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{friend.name}</p>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">
                      {friend.monthlyPoints.toLocaleString()} pt
                    </p>
                  </div>
                </div>
                
                {/* ランクバッジ */}
                <div className={`px-4 py-1.5 rounded-full font-black text-xs ${rankInfo.badgeBg}`}>
                  {rankInfo.name}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};