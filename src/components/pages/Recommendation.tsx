// src/components/pages/Recommendation.tsx
import { useState, useEffect } from 'react';
// 🌟 管理用ドキュメントを読み書きするための必要最小限のインポートのみ残しています
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase'; 

import { Loader2, Star } from 'lucide-react';
import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import { DailyThread } from '../thread/DailyThread';
import type { StreamData } from '../../types';
import { useStreams } from '../../contexts/StreamContext';

export default function Recommendation() {
  const { records, updateRecord } = useUserRecords();
  const { streams, isLoading: isStreamsLoading } = useStreams(); 
  const [recommendedStream, setRecommendedStream] = useState<StreamData | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 今日の日付文字列を取得（例: "2026-08-16"）
  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isStreamsLoading) return;

    const fetchTodayRecommendation = async () => {
      try {
        const validStreams = streams.filter(s => s.youtubeUrl && s.youtubeUrl.trim() !== "");
        if (validStreams.length === 0) {
          setRecommendedStream(null);
          return;
        }

        const todayStr = getTodayStr();
        
        // Firestoreの「system/recommendation」というたった1つのファイルを読みに行く
        const recRef = doc(db, 'system', 'recommendation');
        const recSnap = await getDoc(recRef);
        const recData = recSnap.exists() ? recSnap.data() : { date: '', streamId: '', shownIds: [] };

        // パターンA: 既に「今日の動画」がFirestoreに記録されている場合は、それを表示するだけ
        if (recData.date === todayStr && recData.streamId) {
          const stream = validStreams.find(s => s.id === recData.streamId);
          if (stream) {
            setRecommendedStream(stream);
            return;
          }
        }

        // パターンB: 日付が変わって「最初の1人目」だった場合、新しい動画を選んで記録する
        let shownIds: string[] = recData.shownIds || [];
        
        // まだ選ばれていない動画を絞り込む
        let unshownStreams = validStreams.filter(s => !shownIds.includes(s.id));

        // もし全部選ばれ尽くしていたらリストをリセットしてループする
        if (unshownStreams.length === 0) {
          shownIds = [];
          unshownStreams = validStreams;
        }

        // まだ選ばれていないものの中からランダムに1つ選ぶ
        const randomIndex = Math.floor(Math.random() * unshownStreams.length);
        const candidate = unshownStreams[randomIndex];

        // 選んだ動画と、過去の履歴をFirestoreに「上書き保存」する
        await setDoc(recRef, {
          date: todayStr,
          streamId: candidate.id,
          shownIds: [...shownIds, candidate.id]
        });

        setRecommendedStream(candidate);

      } catch (error) {
        console.error("おすすめ動画の計算・取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayRecommendation();
  }, [streams, isStreamsLoading]);

  return (
    <div className="p-4 relative pb-20">
      <div className="flex items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <Star className="text-gray-500 mr-2" size={24} />
        <h2 className="text-lg font-bold text-gray-800">今日のおすすめ</h2>
      </div>

      {isLoading || isStreamsLoading ? (
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
          />
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 text-sm">
          おすすめできる動画がありません
        </div>
      )}

      <div className="max-w-md mx-auto mt-8">
        <DailyThread />
      </div>

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