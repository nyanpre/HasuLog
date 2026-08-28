// src/components/profile/dashboard/RecentActivitySection.tsx
import { Clock } from 'lucide-react';

type Props = {
  recentHistory: any[];
  onStreamClick: (streamId: string) => void;
};

export const RecentActivitySection = ({ recentHistory, onStreamClick }: Props) => {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-700 mb-4 flex items-center">
        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
        最近のアクティビティ 
      </h4>
      <div className="p-4 rounded-lg border border-gray-100 bg-white">
        {recentHistory.length > 0 ? (
          <div className="space-y-3">
            {recentHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onStreamClick(item.id)}
                className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-gray-800 truncate mb-0.5 group-hover:text-pink-600 transition-colors">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.dateStr}</p>
                </div>
                <div className="flex-shrink-0 text-right bg-pink-50 px-2 py-1 rounded-md">
                  <span className="text-xs font-bold text-pink-600">
                    {item.lastAction === 'memo' ? 'メモ更新' : 
                     item.lastAction === 'favorite' ? 'お気に入り' : 
                     `+${item.pointPerView} pt`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-gray-400">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">まだアクティビティがありません</p>
          </div>
        )}
      </div>
    </div>
  );
};