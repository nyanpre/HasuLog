// src/components/profile/FriendTimeline.tsx
import { useEffect, useState } from 'react';
import { Clock, PlayCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFriends } from '../../hooks/useFriends';

interface TimelineItem {
  id: string;
  uid: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  lastViewedAt: number;
}

export const FriendTimeline = () => {
  const { friends } = useFriends();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      // フレンドがいない場合は処理しない
      if (friends.length === 0) {
        setTimeline([]);
        return;
      }
      
      setLoading(true);
      try {
        const allLogs: TimelineItem[] = [];

        // 全フレンドの最新視聴履歴（直近5件）を並列で取得
        const promises = friends.map(async (friend) => {
          const recordsRef = collection(db, 'users', friend.uid, 'records');
          const q = query(recordsRef, orderBy('lastViewedAt', 'desc'), limit(5));
          
          try {
            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.lastViewedAt) {
                const dateObj = new Date(data.lastViewedAt);
                allLogs.push({
                  id: `${friend.uid}-${doc.id}`,
                  uid: friend.uid,
                  userName: friend.displayName,
                  userPhotoURL: friend.photoURL,
                  title: data.streamTitle || data.title || '視聴記録',
                  lastViewedAt: dateObj.getTime(),
                });
              }
            });
          } catch (err) {
            console.warn(`${friend.displayName}の履歴取得に失敗しました`, err);
            // ※Firestoreのインデックスエラーが出た場合は無視して次に進める
          }
        });

        await Promise.all(promises);

        // 全フレンドのログを時系列（新しい順）に並び替え、全体で最新20件に絞る
        const sortedLogs = allLogs.sort((a, b) => b.lastViewedAt - a.lastViewedAt).slice(0, 20);
        setTimeline(sortedLogs);
      } catch (error) {
        console.error("タイムライン取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [friends]);

  // 相対時間を計算する関数（例: "2時間前"）
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

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col min-h-[350px]">
      <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center">
        <Clock className="w-4 h-4 mr-2 text-blue-500" />
        みんなのアクティビティ
      </h3>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400">
            <Clock className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-xs">まだフレンドの視聴履歴がありません</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-100 ml-3 pl-5 space-y-5 pb-2">
            {timeline.map((item) => (
              <div key={item.id} className="relative group">
                {/* タイムラインの丸ポチ */}
                <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-400 group-hover:bg-blue-400 transition-colors" />
                
                <div className="flex items-start gap-3">
                  {item.userPhotoURL ? (
                    <img src={item.userPhotoURL} alt={item.userName} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0 shadow-sm">
                      {item.userName.charAt(0)}
                    </div>
                  )}
                  
                  <div className="flex-grow bg-gray-50/80 hover:bg-gray-50 p-3 rounded-lg border border-gray-100 transition-colors">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs font-bold text-gray-700">{item.userName}</span>
                      <span className="text-[10px] font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                        {getRelativeTime(item.lastViewedAt)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-800 flex items-start gap-1.5">
                      <PlayCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">{item.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};