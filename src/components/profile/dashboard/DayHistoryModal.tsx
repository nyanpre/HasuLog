// src/components/profile/dashboard/DayHistoryModal.tsx
import { Calendar, X, Film, ChevronRight } from 'lucide-react';
import type { DayData } from '../../../hooks/useDashboardData';

type Props = {
  dayData: DayData;
  onClose: () => void;
  onStreamClick: (streamId: string) => void;
};

export const DayHistoryModal = ({ dayData, onClose, onStreamClick }: Props) => {
  if (!dayData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
              <Calendar size={16} className="text-pink-500" />
              {dayData.date} の視聴履歴
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              合計獲得: <span className="font-bold text-pink-600">+{dayData.totalPoints} pt</span>（{dayData.count}回視聴）
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2.5">
          {dayData.items.map((item, idx) => (
            <div 
              key={`${item.id}-${idx}`}
              onClick={() => {
                onClose(); // モーダルを閉じる
                onStreamClick(item.id); // 詳細を開く
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-pink-50/40 hover:border-pink-200 cursor-pointer transition-all group"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <Film size={12} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                  <p className="text-xs font-bold text-gray-800 truncate group-hover:text-pink-600 transition-colors">
                    {item.title}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400">視聴回数: {item.viewCount}回</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-pink-600 bg-white px-2 py-0.5 rounded-md border border-pink-100">
                  +{item.points} pt
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};