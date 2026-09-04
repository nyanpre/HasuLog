// src/components/pages/Recommendation.tsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

import { Loader2, Star, Lock } from 'lucide-react'; // 🌟 Lockアイコン追加
import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import { DailyThread } from '../thread/DailyThread';
import type { StreamData } from '../../types';
import { useStreams } from '../../contexts/StreamContext';
import { useUserData } from '../../hooks/useUserData';
import { useAuth } from '../../contexts/AuthContext';

const RECOMMENDED_TYPES = ['with_meets', 'with_station'];

export default function Recommendation() {
  const { records, updateRecord } = useUserRecords();
  const { streams, isLoading: isStreamsLoading } = useStreams(); 
  const { userData, loading: isUserLoading } = useUserData();
  const { currentUser, loading: isAuthLoading } = useAuth();
  
  const [recommendedStream, setRecommendedStream] = useState<StreamData | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 ゲストユーザー判定
  const isGuest = currentUser?.isAnonymous ?? false;

  // 午前0時切り替え
  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isStreamsLoading || isAuthLoading) return;

    // 🌟 ゲストユーザーはおすすめ処理・通信を一切行わない
    if (isGuest) {
      setIsLoading(false);
      return;
    }

    if (currentUser && !currentUser.isAnonymous && isUserLoading) return;

    const fetchTodayRecommendation = async () => {
      try {
        const todayStr = getTodayStr();
        // Layout側で保存したキャッシュを利用し、ユーザー情報の余分な通信待ちをカット
        const isEx = localStorage.getItem('hasulog_isExMode') === 'true' || Boolean(userData?.exMode === true);

        // 🌟 1. ローカルキャッシュ判定（通信負荷・ラグをゼロに）
        const cachedRecStr = localStorage.getItem('hasulog_daily_rec');
        if (cachedRecStr) {
          try {
            const cachedRec = JSON.parse(cachedRecStr);
            // キャッシュが今日のものであればそのまま利用
            if (cachedRec.date === todayStr && cachedRec.streamId_all) {
              const targetId = isEx 
                ? cachedRec.streamId_all 
                : (cachedRec.streamId_official || cachedRec.streamId_all);
                
              const stream = streams.find(s => s.id === targetId);
              if (stream && RECOMMENDED_TYPES.includes(stream.type)) {
                setRecommendedStream(stream);
                setIsLoading(false);
                return; // 🚀 キャッシュがあればFirestoreを読まずにここで終了
              }
            }
          } catch (e) {
            console.error("キャッシュパースエラー", e);
          }
        }

        // 🌟 2. キャッシュがない場合のみ Firestore から取得
        const recRef = doc(db, 'system', 'recommendation');
        const recSnap = await getDoc(recRef);
        
        const recData = recSnap.exists() ? recSnap.data() : { 
          date: '', 
          streamId_all: '', 
          streamId_official: '', 
          shownIds_all: [], 
          shownIds_official: [] 
        };

        // パターンA: 既に「今日の動画」がFirestoreにある場合（誰かが既に引いた）
        if (recData.date === todayStr && (recData.streamId_all || recData.streamId_official || recData.streamId)) {
          const targetId = isEx 
            ? (recData.streamId_all || recData.streamId) 
            : (recData.streamId_official || recData.streamId_all || recData.streamId);
          
          const stream = streams.find(s => s.id === targetId);
          
          if (stream && RECOMMENDED_TYPES.includes(stream.type)) {
            setRecommendedStream(stream);
            // 次回アクセス時用にローカルにキャッシュ
            localStorage.setItem('hasulog_daily_rec', JSON.stringify({
              date: todayStr,
              streamId_all: recData.streamId_all || recData.streamId,
              streamId_official: recData.streamId_official || recData.streamId_all || recData.streamId
            }));
            return;
          }
        }

        // パターンB: 自分が今日の最初にアクセスして新しくランダム抽選する場合
        const validStreamsAll = streams.filter(
          s => s.youtubeUrl && 
               s.youtubeUrl.trim() !== "" && 
               RECOMMENDED_TYPES.includes(s.type)
        );
        const validStreamsOfficial = validStreamsAll.filter(
          s => s.is_official !== false && (s.is_official as any) !== "false"
        );

        if (validStreamsAll.length === 0) {
          setRecommendedStream(null);
          return;
        }

        let shownIds_all: string[] = recData.shownIds_all || recData.shownIds || [];
        let shownIds_official: string[] = recData.shownIds_official || recData.shownIds || [];
        
        let unshown_all = validStreamsAll.filter(s => !shownIds_all.includes(s.id));
        if (unshown_all.length === 0) {
          shownIds_all = [];
          unshown_all = validStreamsAll;
        }
        // 💡 ランダム抽選ロジックをそのまま維持
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

        const targetStream = isEx ? candidate_all : candidate_official;
        setRecommendedStream(targetStream);

        // 抽選結果をローカルキャッシュに保存
        localStorage.setItem('hasulog_daily_rec', JSON.stringify({
          date: todayStr,
          streamId_all: candidate_all.id,
          streamId_official: candidate_official.id
        }));

        // Firestoreへの保存（※ルールを修正したことで、非認証ユーザー①も保存可能になります）
        try {
          const new_shownIds_all = Array.from(new Set([...shownIds_all, candidate_all.id]));
          const new_shownIds_official = Array.from(new Set([...shownIds_official, candidate_official.id]));

          await setDoc(recRef, {
            date: todayStr,
            streamId_all: candidate_all.id,
            streamId_official: candidate_official.id,
            shownIds_all: new_shownIds_all,
            shownIds_official: new_shownIds_official
          }, { merge: true });
        } catch (writeErr) {
          console.warn("Firestoreへのおすすめ更新エラー:", writeErr);
        }

      } catch (error) {
        console.error("おすすめ動画の計算・取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayRecommendation();
  }, [streams, isStreamsLoading, userData, isUserLoading, currentUser, isAuthLoading, isGuest]);

  return (
    <div className="p-4 relative pb-20">
      <div className="flex items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <Star className="text-gray-500 mr-2" size={24} />
        <h2 className="text-lg font-bold text-gray-800">今日のおすすめ</h2>
      </div>

      {isLoading || isStreamsLoading || isAuthLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : isGuest ? (
        /* 🌟 ゲストユーザー用のロック画面 */
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in px-4">
          <Lock className="text-gray-300 mx-auto mb-4" size={40} />
          <h3 className="text-gray-700 font-bold mb-2">おすすめ機能はロックされています</h3>
          <p className="text-gray-500 text-xs leading-relaxed">
            今日のおすすめ動画機能は、<br className="sm:hidden" />
            ログインユーザー限定の機能です。<br />
            Googleアカウントでログインしてご利用ください。
          </p>
        </div>
      ) : recommendedStream ? (
        <div className="max-w-md mx-auto animate-fade-in">
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

      {/* ゲストユーザーには DailyThread も表示しない */}
      {!isGuest && (
        <div className="max-w-md mx-auto mt-8">
          <DailyThread />
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