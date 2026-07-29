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
                        rankInfo.nextAt === 1500 ? 400 : 
                        rankInfo.nextAt === 3000 ? 1500 : 
                        rankInfo.nextAt === 5000 ? 3000 : 5000;
  
  const progressPercent = rankInfo.nextAt
    ? Math.min(100, Math.max(0, ((currentPoints - prevThreshold) / (rankInfo.nextAt - prevThreshold)) * 100))
    : 100;

  if (loading) return <div className="animate-pulse bg-gray-200 h-40 rounded-2xl w-full"></div>;

  return (
    <div 
      onClick={onOpenDashboard}
      className={`rounded-2xl p-6 ${rankInfo.bg} ${rankInfo.border || ""} shadow-sm relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md active:scale-[0.98] group`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-1 tracking-wider uppercase">Current Rank</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${rankInfo.color} drop-shadow-sm`}>{rankInfo.rank}</span>
            <span className={`text-sm font-bold opacity-70 ${rankInfo.color}`}>Class</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center">
            今月のポイント
            <ChevronRight size={14} className="ml-1 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </p>
          <div className="text-2xl font-black text-gray-800">
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