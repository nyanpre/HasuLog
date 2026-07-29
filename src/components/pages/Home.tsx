// src/components/pages/Home.tsx
import { useState, useEffect } from 'react';
import { LayoutList, Grid2X2, Grid3X3, ArrowUpDown, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; 

import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import type { StreamData } from '../../types';

type LayoutType = 1 | 2 | 4;
type SortOrder = 'desc' | 'asc';

export default function Home() {
  const { records, updateRecord } = useUserRecords();
  const [streams, setStreams] = useState<StreamData[]>([]); 
  const [layout, setLayout] = useState<LayoutType>(2);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'streams'));
        const streamList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StreamData[];
        
        setStreams(streamList);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const sortedStreams = [...streams].sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime();
    const timeB = new Date(b.date || 0).getTime();
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

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-pink-500" size={32} />
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">
          データがありません
        </div>
      ) : (
        <div className={`grid ${gridClass}`}>
          {sortedStreams.map((stream) => {
            const currentRecord = records[stream.id];
            const currentViewCount = currentRecord?.viewCount || 0;

            return (
              <StreamCard 
                key={stream.id} 
                stream={stream} 
                columns={layout}
                viewCount={currentViewCount}
                onClick={() => setSelectedStream(stream)} 
                /* 🌟 不要になった onUpdateViewCount をここから削除しました！ */
              />
            );
          })}
        </div>
      )}

      {selectedStream && (
        <StreamDetailModal 
          stream={selectedStream} 
          record={selectedStream ? (records[selectedStream.id] || null) : null}
          onClose={() => setSelectedStream(null)} 
          onUpdateRecord={updateRecord}
        />
      )}
    </div>
  );
}