import { Award, ChevronRight, TrendingUp } from 'lucide-react';
import { RANKS, calculateRank, getNextRankInfo } from '../../constants/rank';

interface RankCardProps {
  monthlyPoints: number;
  totalPoints: number;
  onOpenDashboard: () => void;
}

export const RankCard = ({ monthlyPoints, totalPoints, onOpenDashboard }: RankCardProps) => {
  const currentRankGrade = calculateRank(monthlyPoints);
  const rankInfo = RANKS[currentRankGrade];
  const nextRank = getNextRankInfo(monthlyPoints);

  const currentThreshold = rankInfo.threshold;
  const targetThreshold = nextRank ? nextRank.threshold : currentThreshold;
  const progressPercent = nextRank 
    ? Math.min(100, Math.max(0, ((monthlyPoints - currentThreshold) / (targetThreshold - currentThreshold)) * 100))
    : 100;

  return (
    <div className={`p-6 md:p-8 rounded-2xl border transition-all duration-500 flex flex-col ${rankInfo.cardBg}`}>
      <div className="flex flex-row items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-sm font-extrabold text-gray-700 flex items-center gap-1.5 mb-2">
            <Award size={18} className={rankInfo.textColor} />
            HasuLog ポイント
          </h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-5xl font-black ${rankInfo.textColor}`}>
              {monthlyPoints.toLocaleString()}
            </span>
            <span className={`text-lg font-bold ${rankInfo.textColor}`}>pt</span>
          </div>
          <p className="text-sm text-gray-700/80 font-medium">
            累計獲得: {totalPoints.toLocaleString()} pt
          </p>
        </div>

        {/* 🌟 変更点: ランクの文字をバッジの外（上）へ */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-gray-600 mb-2 tracking-wide">
            HasuLogランク
          </span>
          <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transform hover:scale-105 transition-transform duration-300 ${rankInfo.badgeBg}`}>
            <span className="text-6xl md:text-7xl font-black leading-none drop-shadow-sm">
              {rankInfo.name}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white/40 p-4 rounded-xl border border-black/5">
        {nextRank ? (
          <>
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2.5">
              <span>次のランク（{nextRank.name}）まで</span>
              <span>あと {(nextRank.threshold - monthlyPoints).toLocaleString()} pt</span>
            </div>
            <div className="w-full bg-black/10 rounded-full h-3.5 overflow-hidden">
              <div
                className="h-full bg-black/40 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </>
        ) : (
          <div className="text-sm font-bold text-gray-700 text-center py-1">
            最高ランク到達！おめでとうございます🎉
          </div>
        )}
      </div>

      <button
        onClick={onOpenDashboard}
        className="w-full py-4 rounded-xl bg-white/60 hover:bg-white/90 text-gray-900 border border-black/10 flex items-center justify-center gap-2 font-black transition-all active:scale-[0.98] shadow-sm"
      >
        <TrendingUp size={18} className="text-gray-700" />
        獲得履歴・アーカイブを見る
        <ChevronRight size={18} className="ml-1 text-gray-500" />
      </button>
    </div>
  );
};