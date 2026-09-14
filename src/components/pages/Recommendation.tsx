// src/components/pages/Recommendation.tsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

import { Loader2, Star, Lock, Sparkles, Dices } from 'lucide-react';
import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import { DailyThread } from '../thread/DailyThread';
import type { StreamData } from '../../types';
import { useStreams } from '../../contexts/StreamContext';
import { useUserData } from '../../hooks/useUserData';
import { useAuth } from '../../contexts/AuthContext';

// コンポーネント化したピッカーをインポート
import { RandomVideoPicker } from '../recommendation/RandomVideoPicker';

const RECOMMENDED_TYPES = ['with_meets', 'with_station'];
const TAB_STORAGE_KEY = 'hasulog_rec_active_tab';

type TabType = 'daily' | 'picker';

export default function Recommendation() {
  const { records, updateRecord } = useUserRecords();
  const { streams, isLoading: isStreamsLoading } = useStreams(); 
  const { userData, loading: isUserLoading } = useUserData();
  const { currentUser, loading: isAuthLoading } = useAuth();
  
  // 🌟 タブの初期状態を localStorage から復元
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
      return (savedTab === 'picker' || savedTab === 'daily') ? savedTab : 'daily';
    } catch {
      return 'daily';
    }
  });

  const [recommendedStream, setRecommendedStream] = useState<StreamData | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isGuest = currentUser?.isAnonymous ?? false;
  const isEx = Boolean(currentUser && !currentUser.isAnonymous && userData?.exMode === true);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch (e) {
      console.warn("タブ状態の保存に失敗しました:", e);
    }
  };

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isStreamsLoading || isAuthLoading) return;

    if (isGuest) {
      setIsLoading(false);
      return;
    }

    if (currentUser && !currentUser.isAnonymous && isUserLoading) return;

    const fetchTodayRecommendation = async () => {
      try {
        const todayStr = getTodayStr();
        const cachedRecStr = localStorage.getItem('hasulog_daily_rec');
        if (cachedRecStr) {
          try {
            const cachedRec = JSON.parse(cachedRecStr);
            if (cachedRec.date === todayStr && cachedRec.streamId_all) {
              const targetId = isEx 
                ? cachedRec.streamId_all 
                : (cachedRec.streamId_official || cachedRec.streamId_all);
                
              const stream = streams.find(s => s.id === targetId);
              if (stream && RECOMMENDED_TYPES.includes(stream.type)) {
                setRecommendedStream(stream);
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error("キャッシュパースエラー", e);
          }
        }

        const todayRecRef = doc(db, 'recommendations', todayStr);
        const todayRecSnap = await getDoc(todayRecRef);

        if (todayRecSnap.exists()) {
          const recData = todayRecSnap.data();
          const targetId = isEx 
            ? (recData.streamId_all || recData.streamId) 
            : (recData.streamId_official || recData.streamId_all || recData.streamId);
          
          const stream = streams.find(s => s.id === targetId);
          if (stream && RECOMMENDED_TYPES.includes(stream.type)) {
            setRecommendedStream(stream);
            localStorage.setItem('hasulog_daily_rec', JSON.stringify({
              date: todayStr,
              streamId_all: recData.streamId_all,
              streamId_official: recData.streamId_official
            }));
            setIsLoading(false);
            return;
          }
        }

        const poolRef = doc(db, 'system', 'recommendation');
        const poolSnap = await getDoc(poolRef);
        const poolData = poolSnap.exists() ? poolSnap.data() : { 
          shownIds_all: [], 
          shownIds_official: [] 
        };

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

        let shownIds_all: string[] = poolData.shownIds_all || [];
        let shownIds_official: string[] = poolData.shownIds_official || [];
        
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

        const targetStream = isEx ? candidate_all : candidate_official;
        setRecommendedStream(targetStream);

        localStorage.setItem('hasulog_daily_rec', JSON.stringify({
          date: todayStr,
          streamId_all: candidate_all.id,
          streamId_official: candidate_official.id
        }));

        try {
          const new_shownIds_all = Array.from(new Set([...shownIds_all, candidate_all.id]));
          const new_shownIds_official = Array.from(new Set([...shownIds_official, candidate_official.id]));

          await setDoc(todayRecRef, {
            date: todayStr,
            streamId_all: candidate_all.id,
            streamTitle_all: candidate_all.title || '',
            streamId_official: candidate_official.id,
            streamTitle_official: candidate_official.title || '',
            createdAt: new Date().toISOString()
          }, { merge: true });

          await setDoc(poolRef, {
            shownIds_all: new_shownIds_all,
            shownIds_official: new_shownIds_official
          }, { merge: true });

        } catch (writeErr) {
          console.warn("Firestoreへのおすすめ履歴保存エラー:", writeErr);
        }

      } catch (error) {
        console.error("おすすめ動画の取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayRecommendation();
  }, [streams, isStreamsLoading, userData, isUserLoading, currentUser, isAuthLoading, isGuest, isEx]);

  return (
    <div className="p-4 relative pb-28 max-w-2xl mx-auto">
      
      {/* 上部タブ切り替えスイッチ */}
      <div className="flex bg-gray-100/80 p-1 rounded-xl mb-6 border border-gray-200/60">
        <button
          type="button"
          onClick={() => handleTabChange('daily')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-white text-gray-800 shadow-xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles size={15} className={activeTab === 'daily' ? 'text-amber-500' : 'text-gray-400'} />
          <span>今日のおすすめ</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('picker')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'picker'
              ? 'bg-white text-pink-600 shadow-xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Dices size={15} className={activeTab === 'picker' ? 'text-pink-500' : 'text-gray-400'} />
          <span>ランダムで動画を選ぶ</span>
        </button>
      </div>

      {/* コンテンツ1: 今日のおすすめ */}
      <div className={activeTab === 'daily' ? 'block animate-fade-in' : 'hidden'}>
        <div className="flex items-center mb-5 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
          <Star className="text-amber-500 mr-2 flex-shrink-0" size={24} />
          <div>
            <h2 className="text-lg font-bold text-gray-800 leading-tight">今日のおすすめ</h2>
            <p className="text-[11px] text-gray-400">1日1本更新される公式ピックアップ</p>
          </div>
        </div>

        {isLoading || isStreamsLoading || isAuthLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : isGuest ? (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-200 shadow-xs px-4">
            <Lock className="text-gray-300 mx-auto mb-3" size={36} />
            <h3 className="text-gray-700 font-bold mb-1.5 text-sm">おすすめ機能はロックされています</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              今日のおすすめ動画機能は、ログインユーザー限定の機能です。<br />
              Googleアカウントでログインしてご利用ください。
            </p>
          </div>
        ) : recommendedStream ? (
          <div>
            <StreamCard 
              stream={recommendedStream} 
              columns={1}
              viewCount={records[recommendedStream.id]?.viewCount || 0}
              onClick={() => setSelectedStream(recommendedStream)} 
            />
          </div>
        ) : (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-200 text-gray-500 text-xs">
            おすすめできる動画がありません
          </div>
        )}

        {!isGuest && recommendedStream && (
          <div className="mt-6">
            <DailyThread streamId={recommendedStream.id} />
          </div>
        )}
      </div>

      {/* コンテンツ2: ランダム動画Picker */}
      <div className={activeTab === 'picker' ? 'block animate-fade-in' : 'hidden'}>
        <RandomVideoPicker
          baseStreams={streams}
          records={records}
          isEx={isEx}
          onSelectStream={(stream) => setSelectedStream(stream)}
        />
      </div>

      {/* 動画詳細モーダル */}
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