// src/components/pages/Home.tsx
import { useState } from 'react';
import { LayoutList, Grid2X2, Grid3X3, ArrowUpDown } from 'lucide-react';
import VideoCard from '../VideoCard';
import VideoModal from '../VideoModal';
import type { VideoData } from '../../types';

const MOCK_VIDEOS: VideoData[] = [
  {
    id: '1',
    title: '【103期第1話】せーので！ はすのそら！',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516280440502-85f541f7e025?w=500&q=80',
    date: '2023/04/15',
    type: 'activity_record',
    isWatched: true,
  },
  {
    id: '2',
    title: '初配信！みらくらぱーく！です！',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9ed?w=500&q=80',
    date: '2023/04/16',
    type: 'with_meets',
    isWatched: false,
  },
  {
    id: '3',
    title: '【104期第1話】新入生、来ちゃった！？',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80',
    date: '2024/04/15',
    type: 'activity_record',
    isWatched: false,
  }
];

type LayoutType = 1 | 2 | 4;
type SortOrder = 'desc' | 'asc'; // 新しい順(desc)か古い順(asc)か

export default function Home() {
  const [layout, setLayout] = useState<LayoutType>(2);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // ソート処理
  const sortedVideos = [...MOCK_VIDEOS].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const gridClass = 
    layout === 1 ? 'grid-cols-1 gap-4' :
    layout === 2 ? 'grid-cols-2 gap-3' :
    'grid-cols-4 gap-2';

  return (
    <div className="p-4 relative pb-20">
      <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-700">コンテンツ一覧</span>
          {/* ソートボタン */}
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded active:scale-95 transition-transform"
          >
            <ArrowUpDown size={14} />
            <span>{sortOrder === 'desc' ? '新しい順' : '古い順'}</span>
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button onClick={() => setLayout(1)} className={`p-1.5 rounded ${layout === 1 ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}>
            <LayoutList size={20} />
          </button>
          <button onClick={() => setLayout(2)} className={`p-1.5 rounded ${layout === 2 ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}>
            <Grid2X2 size={20} />
          </button>
          <button onClick={() => setLayout(4)} className={`p-1.5 rounded ${layout === 4 ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}>
            <Grid3X3 size={20} />
          </button>
        </div>
      </div>

      {/* ソート済みの配列をマップする */}
      <div className={`grid ${gridClass}`}>
        {sortedVideos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            layout={layout} 
            onClick={setSelectedVideo} 
          />
        ))}
      </div>

      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
}