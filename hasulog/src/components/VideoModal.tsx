// src/components/VideoModal.tsx
import type { VideoData } from '../types';
import { X } from 'lucide-react';

interface Props {
  video: VideoData;
  onClose: () => void;
}

export default function VideoModal({ video, onClose }: Props) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose} // 背景タップで閉じる
    >
      {/* モーダル本体（クリックしても閉じないように伝播をストップ） */}
      <div 
        className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* サムネイルと閉じるボタン */}
        <div className="relative aspect-video bg-gray-200">
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* 詳細情報とメモ入力エリア */}
        <div className="p-4">
          <p className="text-xs text-pink-600 font-bold mb-1">
            {video.type === 'with_meets' ? 'With×MEETS' : '活動記録'} • {video.date}
          </p>
          <h2 className="text-base font-bold mb-4 leading-tight">{video.title}</h2>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">感想・メモ</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-300 outline-none resize-none h-28"
              placeholder="例: めぐちゃんのパフォーマンスが最高だった！"
            ></textarea>
          </div>

          <button className="mt-4 w-full bg-pink-500 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform shadow-sm">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}