// src/components/profile/FriendTimeline.tsx
import { useEffect, useState, useCallback } from 'react';
import { Clock, PlayCircle, MessageSquare, Star, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../contexts/AuthContext';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import type { StreamData } from '../../types';
// 🌟 追加: StreamContext から本物の動画データを取得するフックをインポート
import { useStreams } from '../../contexts/StreamContext';

// ※仮置きしていた const streamsData = [] は削除しました！

const timelineCache = { data: [] as TimelineItem[], timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; 

interface TimelineItem {
  id: string;
  streamId: string;
  uid: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  lastViewedAt: number;
  lastAction: string;
}

export const FriendTimeline = () => {
  const { friends } = useFriends();
  const { currentUser } = useAuth();
  const { records: myRecords, updateRecord: myUpdateRecord } = useUserRecords();
  
  // 🌟 追加: ContextからJSON由来の全動画データを受け取る
  const { streams: streamsData } = useStreams();
  
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);

  const fetchTimeline = useCallback(async (forceRefresh = false) => {
    if (!currentUser) return;

    if (!forceRefresh && Date.now() - timelineCache.timestamp < CACHE_DURATION && timelineCache.data.length > 0) {
      setTimeline(timelineCache.data);
      return; 
    }
    
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const allLogs: TimelineItem[] = [];
      const targetUsers = [
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'あなた',
          photoURL: currentUser.photoURL || undefined
        },
        ...friends
      ];

      const promises = targetUsers.map(async (user) => {
        const recordsRef = collection(db, 'users', user.uid, 'watchHistory');
        const q = query(recordsRef, orderBy('updatedAt', 'desc'), limit(8)); 
        
        try {
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            if (data.lastAction === 'decrease' || data.viewCount === 0) return;

            let activityTime = 0;
            if (data.updatedAt) {
              activityTime = typeof data.updatedAt === 'string' 
                ? new Date(data.updatedAt).getTime() 
                : (data.updatedAt.toMillis ? data.updatedAt.toMillis() : 0);
            }
            if (!activityTime && data.lastViewedAt) {
              activityTime = new Date(data.lastViewedAt).getTime();
            }

            // 🌟 ここで Context から受け取った本物の streamsData を使ってタイトルを探します
            const localStream = streamsData.find(s => s.id === doc.id);
            const streamTitle = localStream?.title || data.streamTitle || data.title || '視聴記録';

            if (activityTime > 0) {
              allLogs.push({
                id: `${user.uid}-${doc.id}`,
                streamId: doc.id,
                uid: user.uid,
                userName: user.uid === currentUser.uid ? 'あなた' : user.displayName,
                userPhotoURL: user.photoURL,
                title: streamTitle,
                lastViewedAt: activityTime,
                lastAction: data.lastAction || 'watch'
              });
            }
          });
        } catch (err) {
          console.warn(`${user.displayName}の履歴取得に失敗しました`, err);
        }
      });

      await Promise.all(promises);
      const sortedLogs = allLogs.sort((a, b) => b.lastViewedAt - a.lastViewedAt).slice(0, 20);
      
      timelineCache.data = sortedLogs;
      timelineCache.timestamp = Date.now();
      
      setTimeline(sortedLogs);

    } catch (error) {
      console.error("タイムライン取得エラー:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser, friends, streamsData]); // 🌟 依存配列に streamsData を追加

  useEffect(() => {
    // 🌟 streamsData が空の間（読み込み中）は実行を待つ
    if (streamsData.length > 0) {
      fetchTimeline();
    }
  }, [fetchTimeline, streamsData.length]);

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}日前`;
    return '1ヶ月以上前';
  };

  const handleOpenStreamDetail = (streamId: string) => {
    // 🌟 本物の streamsData からデータを検索する
    const stream = streamsData.find(s => s.id === streamId);
    if (stream) {
      setSelectedStream(stream);
    } else {
      alert("動画データが見つかりませんでした。");
    }
  };

  return (
    <>
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col min-h-[350px]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            みんなのアクティビティ
          </h3>
          <button
            onClick={() => fetchTimeline(true)}
            disabled={loading || isRefreshing}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50"
            title="最新のアクティビティを取得"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400">
              <Clock className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-xs">まだアクティビティがありません</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-100 ml-3 pl-5 space-y-5 pb-2">
              {timeline.map((item) => {
                const isMemo = item.lastAction === 'memo';
                const isFav = item.lastAction === 'favorite';
                const isRecommended = item.lastAction === 'recommended_watch';
                
                const actionText = isMemo ? "がメモを更新しました" 
                                 : isFav ? "がお気に入り登録しました" 
                                 : isRecommended ? "が今日のおすすめを視聴しました" 
                                 : "が視聴しました";
                
                const Icon = isMemo ? MessageSquare : isFav ? Star : isRecommended ? Sparkles : PlayCircle;
                const iconColor = isMemo ? "text-blue-500" : isFav ? "text-yellow-500" : isRecommended ? "text-emerald-500" : "text-pink-500";

                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-400 group-hover:bg-blue-400 transition-colors" />
                    
                    <div className="flex items-start gap-3">
                      {item.userPhotoURL ? (
                        <img src={item.userPhotoURL} alt={item.userName} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0 shadow-sm">
                          {item.userName.charAt(0)}
                        </div>
                      )}
                      
                      <div 
                        onClick={() => handleOpenStreamDetail(item.streamId)}
                        className="flex-grow bg-gray-50/80 hover:bg-gray-50 p-3 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className={`text-xs font-bold ${item.uid === currentUser?.uid ? 'text-blue-600' : 'text-gray-700'}`}>
                            {item.userName} <span className="text-gray-500 font-normal">{actionText}</span>
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                            {getRelativeTime(item.lastViewedAt)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 flex items-start gap-1.5">
                          <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                          <span className="line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                            {isRecommended && <span className="text-emerald-600 text-xs mr-1 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">おすすめ</span>}
                            {item.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedStream && (
        <StreamDetailModal 
          stream={selectedStream} 
          record={myRecords[selectedStream.id] || null}
          onClose={() => setSelectedStream(null)} 
          onUpdateRecord={myUpdateRecord}
        />
      )}
    </>
  );
};