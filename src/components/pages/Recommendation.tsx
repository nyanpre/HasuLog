// src/components/pages/Recommendation.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; 
import { Loader2, Star } from 'lucide-react';

import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import type { StreamData } from '../../types';

export default function Recommendation() {
  const { records, updateRecord } = useUserRecords();
  const [recommendedStream, setRecommendedStream] = useState<StreamData | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRandomStream = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'streams'));
        const streamList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StreamData[];

        if (streamList.length > 0) {
          const randomIndex = Math.floor(Math.random() * streamList.length);
          setRecommendedStream(streamList[randomIndex]);
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomStream();
  }, []);

  return (
    <div className="p-4 relative pb-20">
      {/* 🌟 シンプルなヘッダーに変更 */}
      <div className="flex items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <Star className="text-gray-500 mr-2" size={24} />
        <h2 className="text-lg font-bold text-gray-800">今日のおすすめ</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : recommendedStream ? (
        <div className="max-w-md mx-auto">
          <StreamCard 
            stream={recommendedStream} 
            columns={1}
            viewCount={records[recommendedStream.id]?.viewCount || 0}
            onClick={() => setSelectedStream(recommendedStream)} 
            onUpdateViewCount={(delta, e) => {
              e?.stopPropagation();
              const current = records[recommendedStream.id]?.viewCount || 0;
              updateRecord(recommendedStream.id, { viewCount: Math.max(0, current + delta) });
            }}
          />
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 text-sm">
          おすすめデータがありません
        </div>
      )}

      {selectedStream && (
        <StreamDetailModal 
          stream={selectedStream} 
          record={selectedStream ? (records[selectedStream.id] || null) : null}
          onClose={() => setSelectedStream(null)} 
          onUpdateRecord={updateRecord}
          isRecommended={true}
        />
      )}
    </div>
  );
}