// src/components/profile/dashboard/DashboardStats.tsx
import { Trophy, Users } from 'lucide-react';

type Props = {
  totalPoints: number;
  hasTargetUser: boolean;
  onOpenSocial: () => void;
};

export const DashboardStats = ({ totalPoints, hasTargetUser, onOpenSocial }: Props) => {
  return (
    <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-lg border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="p-2 border border-gray-200 rounded-md bg-white">
          <Trophy className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 mb-0.5">HasuLog 累計獲得ポイント</p>
          <p className="text-xl font-bold text-gray-800">
            {totalPoints.toLocaleString()} <span className="text-xs font-normal text-gray-500">pt</span>
          </p>
        </div>
      </div>
      
      {hasTargetUser && (
        <button
          onClick={onOpenSocial}
          className="flex items-center gap-1.5 bg-white border border-gray-200 text-pink-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
        >
          <Users size={14} />
          フレンド
        </button>
      )}
    </div>
  );
};