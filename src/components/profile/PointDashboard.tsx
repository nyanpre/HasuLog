// src/components/profile/PointDashboard.tsx
import { Award, Star, TrendingUp, ChevronRight } from 'lucide-react';

// 🌟 ポイント・ランクのダミーデータ
const MOCK_POINTS = 1250;
const NEXT_RANK_POINTS = 2000;
const PROGRESS_PERCENT = (MOCK_POINTS / NEXT_RANK_POINTS) * 100;
const CURRENT_RANK = "C";
const NEXT_RANK = "B";

export default function PointDashboard() {
  return (
    <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl shadow-md p-5 mb-5 text-white relative overflow-hidden">
      <Star className="absolute -top-4 -right-4 text-pink-300 opacity-20" size={100} />
      
      <div className="flex justify-between items-center mb-2 relative z-10">
        <h3 className="font-bold flex items-center text-sm">
          <Award className="mr-1.5" size={18} />
          HasuLog ポイント
        </h3>
        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm shadow-inner">
          ランク: {CURRENT_RANK}
        </span>
      </div>
      
      <div className="relative z-10 mb-4">
        <div className="flex items-baseline space-x-1">
          <span className="text-4xl font-extrabold tracking-tight">{MOCK_POINTS.toLocaleString()}</span>
          <span className="text-sm font-medium opacity-90">pt</span>
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between text-xs mb-1.5 opacity-90 font-medium">
          <span>次のランク（{NEXT_RANK}）まで</span>
          <span>あと {(NEXT_RANK_POINTS - MOCK_POINTS).toLocaleString()} pt</span>
        </div>
        <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${PROGRESS_PERCENT}%` }}
          ></div>
        </div>
      </div>
      
      <button className="relative z-10 mt-5 w-full bg-white/20 hover:bg-white/30 active:scale-[0.98] backdrop-blur-sm transition-all py-2.5 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm border border-white/10">
        <TrendingUp size={16} className="mr-1.5" />
        獲得履歴を見る
        <ChevronRight size={16} className="ml-1 opacity-70" />
      </button>
    </div>
  );
}