// src/components/VideoCard.tsx
import type { VideoData } from '../types';
import { CheckCircle } from 'lucide-react';

interface Props {
  video: VideoData;
  layout: 1 | 2 | 4;
  onClick: (video: VideoData) => void; // ← これを追加
}

export default function VideoCard({ video, layout, onClick }: Props) {
  const titleClass = 
    layout === 4 ? 'text-[8px] line-clamp-2 leading-tight' : 
    layout === 2 ? 'text-xs line-clamp-2' : 
    'text-sm font-medium';

  return (
    <div 
      onClick={() => onClick(video)} // ← クリックイベントを追加
      className="bg-white rounded-lg shadow-sm overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
    >
      <div className="relative aspect-video bg-gray-200">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        {video.isWatched && (
          <div className="absolute top-1 right-1 bg-white rounded-full">
            <CheckCircle className="text-green-500 w-4 h-4 md:w-5 md:h-5" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
          {video.type === 'with_meets' ? 'With×MEETS' : '活動記録'}
        </div>
      </div>
      <div className="p-2">
        <p className="text-[10px] text-gray-500 mb-0.5">{video.date}</p>
        <h3 className={titleClass}>{video.title}</h3>
      </div>
    </div>
  );
}