// src/components/common/WatchConfirmModal.tsx
import { PlayCircle, ExternalLink, PlusCircle, X } from 'lucide-react';

interface WatchConfirmModalProps {
  isOpen: boolean;
  videoTitle: string;
  actionType: 'youtube' | 'manual'; // 🌟 どっちのアクションか判定
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export const WatchConfirmModal = ({ isOpen, videoTitle, actionType, onClose, onConfirm, onSkip }: WatchConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-extrabold text-gray-800">視聴の記録</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-2">
            {actionType === 'youtube' ? '以下の動画を開きます：' : '以下の動画の視聴回数を追加します：'}
          </p>
          <p className="font-bold text-gray-800 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100 line-clamp-2">
            {videoTitle}
          </p>

          <p className="text-sm font-bold text-gray-700 mb-4 text-center">
            この視聴を HasuLog に記録しますか？
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              {actionType === 'youtube' ? <PlayCircle size={20} /> : <PlusCircle size={20} />}
              はい（記録して +100pt 獲得）
            </button>

            <button
              onClick={onSkip}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
            >
              <ExternalLink size={18} className="text-gray-400" />
              {actionType === 'youtube' ? 'いいえ（動画を確認するだけ）' : 'いいえ（ポイントなしで回数のみ追加）'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};