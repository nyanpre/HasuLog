// src/components/common/WatchConfirmModal.tsx
import { PlayCircle, ExternalLink, PlusCircle, MinusCircle, X } from 'lucide-react';

interface WatchConfirmModalProps {
  isOpen: boolean;
  videoTitle: string;
  actionType: 'youtube' | 'increase' | 'decrease'; // 🌟 アクションを3つに変更
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export const WatchConfirmModal = ({ isOpen, videoTitle, actionType, onClose, onConfirm, onSkip }: WatchConfirmModalProps) => {
  if (!isOpen) return null;

  // アクションに応じたテキストの出し分け
  const isDecrease = actionType === 'decrease';
  const isYoutube = actionType === 'youtube';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-extrabold text-gray-800">
            {isDecrease ? '視聴記録の編集' : '視聴の記録'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-2">
            {isYoutube && '以下の動画を開きます：'}
            {actionType === 'increase' && '以下の動画の視聴回数を追加します：'}
            {isDecrease && '以下の動画の視聴回数を減らします：'}
          </p>
          <p className="font-bold text-gray-800 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100 line-clamp-2">
            {videoTitle}
          </p>

          <p className={`text-sm font-bold mb-4 text-center ${isDecrease ? 'text-red-500' : 'text-gray-700'}`}>
            {isDecrease ? '本当に視聴回数を編集しますか？' : 'この視聴を HasuLog に記録しますか？'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-white ${
                isDecrease ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {isYoutube && <PlayCircle size={20} />}
              {actionType === 'increase' && <PlusCircle size={20} />}
              {isDecrease && <MinusCircle size={20} />}
              
              {isYoutube && 'はい（記録して +100pt 獲得）'}
              {actionType === 'increase' && 'はい（記録して +100pt 獲得）'}
              {isDecrease && 'はい（回数とポイントを減らす）'}
            </button>

            <button
              onClick={onSkip}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
            >
              {isYoutube ? (
                <>
                  <ExternalLink size={18} className="text-gray-400" />
                  いいえ（動画を確認するだけ）
                </>
              ) : (
                <>
                  <X size={18} className="text-gray-400" />
                  キャンセル
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};