// src/components/profile/RankCard.tsx
import { useUserData } from "../../hooks/useUserData";
import { getRankInfo } from "../../utils/pointSystem";
import { ChevronRight } from "lucide-react";

type Props = {
  onOpenDashboard: () => void;
};

export const RankCard = ({ onOpenDashboard }: Props) => {
  const { userData, loading } = useUserData();

  const currentPoints = userData?.monthlyPoints || 0;
  const rankInfo = getRankInfo(currentPoints);
  
  const prevThreshold = rankInfo.nextAt === 100 ? 0 : 
                        rankInfo.nextAt === 400 ? 100 : 
                        rankInfo.nextAt === 1000 ? 400 : 
                        rankInfo.nextAt === 2000 ? 1000 : 
                        rankInfo.nextAt === 3000 ? 2000 : 3000;
  
  const progressPercent = rankInfo.nextAt
    ? Math.min(100, Math.max(0, ((currentPoints - prevThreshold) / (rankInfo.nextAt - prevThreshold)) * 100))
    : 100;

  if (loading) return <div className="animate-pulse bg-gray-200 h-40 rounded-2xl w-full"></div>;

  // 🌟 Unranked判定と文字サイズの切り替え (text-4xlの0.6倍である21.6px)
  const isUnranked = rankInfo.rank === 'Unranked';
  const rankTextSize = isUnranked ? 'text-[21.6px]' : 'text-4xl';

  return (
    <div 
      onClick={onOpenDashboard}
      className={`rounded-2xl p-6 ${rankInfo.bg} ${rankInfo.border || ""} shadow-sm relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md active:scale-[0.98] group`}
    >
      {/* 🌟 左右の要素がくっつきすぎるのを防ぐ gap-4 */}
      <div className="flex justify-between items-start mb-6 gap-4">
        
        {/* 左側: 必要に応じて縮むことを許可する min-w-0 */}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-600 mb-1 tracking-wider truncate">HasuLog ランク</h3>
          <div className="flex items-baseline gap-2">
            {/* 🌟 ここに rankTextSize 変数を適用 */}
            <span className={`${rankTextSize} font-black ${rankInfo.color} drop-shadow-sm`}>{rankInfo.rank}</span>
            <span className={`text-sm font-bold opacity-70 ${rankInfo.color}`}>Class</span>
          </div>
        </div>
        
        {/* 右側: 縮小を禁止してスペースを絶対確保 flex-shrink-0 */}
        <div className="text-right flex flex-col items-end flex-shrink-0">
          
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center whitespace-nowrap">
            今月のポイント
            <ChevronRight size={14} className="ml-1 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </p>
          
          <div className="text-2xl font-black text-gray-800 whitespace-nowrap">
            {currentPoints.toLocaleString()}<span className="text-base font-bold text-gray-500 ml-1">pt</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
          <span>{rankInfo.rank}</span>
          <span>{rankInfo.nextAt ? `NEXT: ${rankInfo.nextAt.toLocaleString()}pt` : 'MAX RANK'}</span>
        </div>
        <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${rankInfo.color.replace('text-', 'bg-')} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {rankInfo.nextAt && (
          <p className="text-[10px] text-right mt-2 text-gray-500 font-medium">
            次のランクまであと {(rankInfo.nextAt - currentPoints).toLocaleString()}pt
          </p>
        )}
      </div>
    </div>
  );
};