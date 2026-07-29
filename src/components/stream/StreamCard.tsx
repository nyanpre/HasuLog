// src/components/stream/StreamCard.tsx
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { addWatchRecord, removeWatchRecord } from "../../utils/pointSystem";
import { WatchConfirmModal } from "../common/WatchConfirmModal";
import type { StreamData } from "../../types";

type Props = {
  stream: StreamData;
  columns: 1 | 2 | 4;
  viewCount: number;
  onClick: () => void;
  onUpdateViewCount: (delta: number, e?: React.MouseEvent) => void;
};

export const StreamCard = ({ stream, columns, viewCount, onClick, onUpdateViewCount }: Props) => {
  const { currentUser } = useAuth();
  
  // 🌟 カード側にもポップアップ用の状態を追加
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'increase' | 'decrease'>('increase');

  // 🌟 プラス・マイナスが押された時にポップアップを開く
  const handleOpenConfirm = (mode: 'increase' | 'decrease', e: React.MouseEvent) => {
    e.stopPropagation(); // カード自体のクリック（詳細を開く）を防ぐ
    if (mode === 'decrease' && viewCount === 0) return;
    setActionMode(mode);
    setIsConfirmOpen(true);
  };

  // 🌟 ポップアップで「はい」が押された時
  const handleConfirm = async () => {
    setIsConfirmOpen(false);
    if (currentUser) {
      try {
        if (actionMode === 'increase') {
          await addWatchRecord(currentUser.uid, stream.id, stream.title);
        } else {
          await removeWatchRecord(currentUser.uid, stream.id, stream.title);
        }
      } catch (error) {
        console.error("記録に失敗しました", error);
      }
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex ${
        columns === 1 ? "flex-col sm:flex-row items-stretch" : "flex-col"
      }`}
    >
      <div className={`relative bg-gray-100 flex-shrink-0 flex items-center justify-center ${
        columns === 1 ? "w-full sm:w-1/3 md:w-64 aspect-video sm:aspect-auto border-b sm:border-b-0 sm:border-r border-gray-100" : "w-full aspect-video"
      }`}>
        {stream.thumbnailUrl ? (
          <img src={stream.thumbnailUrl} alt={stream.title} className={`w-full h-full object-cover ${columns === 1 ? "sm:absolute sm:inset-0" : ""}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
        )}
        <span className={`absolute top-1 left-1 sm:top-2 sm:left-2 text-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
          stream.type === "with_meets" ? "bg-pink-500" : "bg-blue-500"
        }`}>
          {stream.type === "with_meets" ? "MEETS" : "STATION"}
        </span>
      </div>

      <div className={`flex flex-col flex-grow justify-between min-w-0 ${columns === 1 ? "p-3 sm:p-4" : "p-2"}`}>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 mb-0.5 flex gap-2">
            <span>{stream.date}</span>
          </div>
          
          <h3 className={`font-bold text-gray-800 leading-tight break-words ${
            columns === 1 ? "text-sm sm:text-base line-clamp-2" : "text-xs line-clamp-2"
          }`}>
            {stream.title}
          </h3>
          
          {columns === 1 && stream.participants && (
            <div className="text-xs text-gray-600 mt-1 truncate">
              🗣 {stream.participants}
            </div>
          )}

          {columns === 1 && stream.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
              {stream.description}
            </p>
          )}
        </div>

        <div className={`${columns === 1 ? "mt-3" : "mt-2"} flex items-center`}>
          <div className="flex items-center border border-gray-300 rounded bg-gray-50 overflow-hidden shadow-sm">
            {/* 🌟 マイナスボタン */}
            <button 
              onClick={(e) => handleOpenConfirm('decrease', e)}
              className="px-2.5 py-0.5 sm:py-1 text-gray-600 hover:bg-gray-200 transition-colors"
            >−</button>
            <span className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-700 border-x border-gray-300 min-w-[5.5rem] text-center font-medium bg-white">
              視聴回数：{viewCount}
            </span>
            {/* 🌟 プラスボタン */}
            <button 
              onClick={(e) => handleOpenConfirm('increase', e)}
              className="px-2.5 py-0.5 sm:py-1 text-gray-600 hover:bg-gray-200 transition-colors"
            >+</button>
          </div>
        </div>
      </div>

      {/* 🌟 ポップアップを開いた時にカード自体がクリックされるのを防ぐ枠で囲む */}
      {isConfirmOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <WatchConfirmModal
            isOpen={isConfirmOpen}
            videoTitle={stream.title}
            actionType={actionMode}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirm}
            onSkip={() => setIsConfirmOpen(false)}
          />
        </div>
      )}
    </div>
  );
};