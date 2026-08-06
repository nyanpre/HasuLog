// src/components/pages/Recommendation.tsx
import { useState, useEffect } from 'react';
// 🌟 Firestoreのインポートを削除しました
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

  useEffect(() => {
    // 🌟 Contextのデータ準備が完了するまで待機
    if (isStreamsLoading) return;

    try {
      if (streams && streams.length > 0) {
        // 🌟 重要: sort() は元の配列を書き換えてしまうため、コピーを作成してソートする
        const streamList = [...streams];

        // 1. ID順に並び替えて、リストの順番を全ユーザーで統一する
        streamList.sort((a, b) => a.id.localeCompare(b.id));

        // 2. 今日の日付文字列を作成
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        
        // 3. 日付からハッシュを計算
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
          hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // フィルタリング前の「全動画数」を使ってインデックスを計算する
        let startIndex = Math.abs(hash) % streamList.length;
        let selectedIndex = startIndex;
        let candidate = streamList[selectedIndex];

        // 🌟 パターンB: 2026年8月6日だけ、特定の動画IDを強制表示する特別対応
        if (dateString === "2026-8-6") {
           // 表示したい動画のIDをここに入れます
           const specialStream = streamList.find(s => s.id === "51ce7044-c8d1-4ea5-9b05-865246b4b1d1");
           if (specialStream) {
               candidate = specialStream;
           }
        }

        // 🌟 選ばれた動画に youtubeUrl がない場合のみ、ある動画が見つかるまで次へ進む
        while (!candidate.youtubeUrl || candidate.youtubeUrl.trim() === "") {
          selectedIndex = (selectedIndex + 1) % streamList.length;
          candidate = streamList[selectedIndex];
          
          // 無限ループ防止（万が一すべての動画にURLがない場合のフェイルセーフ）
          if (selectedIndex === startIndex) {
            candidate = null as any;
            break;
          }
        }
        
        setRecommendedStream(candidate);
      }
    } catch (error) {
      console.error("おすすめ動画の計算に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  }, [streams, isStreamsLoading]); // 🌟 streamsの状態が変わった時に再計算する

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