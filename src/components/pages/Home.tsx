// src/components/pages/Home.tsx
import { useState, useEffect } from 'react';
import { LayoutList, Grid2X2, Grid3X3, ArrowUpDown, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // ← firebase.tsからdbをインポート
import VideoCard from '../VideoCard';
import VideoModal from '../VideoModal';
import type { VideoData } from '../../types';

type LayoutType = 1 | 2 | 4;
type SortOrder = 'desc' | 'asc';

export default function Home() {
  const [videos, setVideos] = useState<VideoData[]>([]); // 取得したデータを保存するState
  const [layout, setLayout] = useState<LayoutType>(2);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(true); // ローディング状態の管理

  // 画面が表示された時に1回だけFirestoreからデータを取得する
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // 'videos' コレクションからデータを全件取得
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const videoList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VideoData[];
        
        setVideos(videoList);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // ソート処理
  const sortedVideos = [...videos].sort((a, b) => {
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

      {/* ローディング表示 または データ表示 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-pink-500" size={32} />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">
          データがありません
        </div>
      ) : (
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
      )}

      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
}