// src/components/pages/Recommendation.tsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase'; 

import { Loader2, Star } from 'lucide-react';
import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import { DailyThread } from '../thread/DailyThread';
import type { StreamData } from '../../types';
import { useStreams } from '../../contexts/StreamContext';
import { useUserData } from '../../hooks/useUserData';
import { useAuth } from '../../contexts/AuthContext';

export default function Recommendation() {
  const { records, updateRecord } = useUserRecords();
  const { streams, isLoading: isStreamsLoading } = useStreams(); 
  const { userData, loading: isUserLoading } = useUserData();
  const { currentUser, loading: isAuthLoading } = useAuth();
  
  const [recommendedStream, setRecommendedStream] = useState<StreamData | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    // 認証状態の確認と動画データのロードを待つ（ゲストの場合は isUserLoading を待たない）
    if (isStreamsLoading || isAuthLoading) return;
    if (currentUser && !currentUser.isAnonymous && isUserLoading) return;

    const fetchTodayRecommendation = async () => {
      try {
        const validStreamsAll = streams.filter(s => s.youtubeUrl && s.youtubeUrl.trim() !== "");
        const validStreamsOfficial = validStreamsAll.filter(s => s.is_official !== false && (s.is_official as any) !== "false");

        if (validStreamsAll.length === 0) {
          setRecommendedStream(null);
          return;
        }

        const todayStr = getTodayStr();
        const isEx = Boolean(userData?.exMode === true);

        const recRef = doc(db, 'system', 'recommendation');
        const recSnap = await getDoc(recRef);
        
        const recData = recSnap.exists() ? recSnap.data() : { 
          date: '', 
          streamId_all: '', 
          streamId_official: '', 
          shownIds_all: [], 
          shownIds_official: [] 
        };

        // パターンA: 既に「今日の動画」がFirestoreに記録されている場合
        if (recData.date === todayStr && (recData.streamId_all || recData.streamId_official || recData.streamId)) {
          const targetId = isEx 
            ? (recData.streamId_all || recData.streamId) 
            : (recData.streamId_official || recData.streamId_all || recData.streamId);
          
          const stream = validStreamsAll.find(s => s.id === targetId);
          if (stream) {
            setRecommendedStream(stream);
            return;
          }
        }

        // パターンB: 新しい動画を選出する
        let shownIds_all: string[] = recData.shownIds_all || recData.shownIds || [];
        let shownIds_official: string[] = recData.shownIds_official || recData.shownIds || [];
        
        let unshown_all = validStreamsAll.filter(s => !shownIds_all.includes(s.id));
        if (unshown_all.length === 0) {
          shownIds_all = [];
          unshown_all = validStreamsAll;
        }
        const candidate_all = unshown_all[Math.floor(Math.random() * unshown_all.length)];

        let candidate_official = null;
        const isCandidateAllOfficial = candidate_all.is_official !== false && (candidate_all.is_official as any) !== "false";

        if (isCandidateAllOfficial) {
          candidate_official = candidate_all;
        } else {
          let unshown_official = validStreamsOfficial.filter(s => !shownIds_official.includes(s.id));
          if (unshown_official.length === 0) {
            shownIds_official = [];
            unshown_official = validStreamsOfficial;
          }
          candidate_official = unshown_official[Math.floor(Math.random() * unshown_official.length)] || candidate_all;
        }

        // 画面へのセット
        const targetStream = isEx ? candidate_all : candidate_official;
        setRecommendedStream(targetStream);

        // Firestoreへの書き込み（ゲスト等でパーミッションエラーになっても画面表示は維持する）
        try {
          const new_shownIds_all = Array.from(new Set([...shownIds_all, candidate_all.id]));
          const new_shownIds_official = Array.from(new Set([...shownIds_official, candidate_official.id]));

          await setDoc(recRef, {
            date: todayStr,
            streamId_all: candidate_all.id,
            streamId_official: candidate_official.id,
            shownIds_all: new_shownIds_all,
            shownIds_official: new_shownIds_official
          });
        } catch (writeErr) {
          console.warn("Firestoreへのおすすめ更新権限がありません（閲覧のみ継続）:", writeErr);
        }

      } catch (error) {
        console.error("おすすめ動画の計算・取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayRecommendation();
  }, [streams, isStreamsLoading, userData, isUserLoading, currentUser, isAuthLoading]);

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