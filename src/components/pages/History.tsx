// src/components/pages/History.tsx
import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useUserRecords } from "../../hooks/useUserRecords";
import type { StreamData } from "../../types";
import { StreamDetailModal } from "../stream/StreamDetailModal";

type TabType = "viewed" | "memo" | "favorite";

export const History = () => {
  const { records, updateRecord } = useUserRecords();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>("viewed");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);

  useEffect(() => {
    const fetchStreams = async () => {
      const snapshot = await getDocs(collection(db, "streams"));
      const streamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StreamData);
      setStreams(streamData);
      setLoading(false);
    };
    fetchStreams();
  }, []);

  const historyItems = useMemo(() => {
    let items = streams
      .map(stream => ({ stream, record: records[stream.id] }))
      .filter(item => item.record);

    items = items.filter(item => {
      if (activeTab === "viewed") return item.record.viewCount > 0;
      if (activeTab === "memo") return item.record.memo && item.record.memo.trim() !== "";
      if (activeTab === "favorite") return item.record.isFavorite === true;
      return false;
    });

    items.sort((a, b) => {
      const dateA = a.record.lastViewedAt || a.record.updatedAt || "";
      const dateB = b.record.lastViewedAt || b.record.updatedAt || "";
      if (sortOrder === "desc") return dateB.localeCompare(dateA);
      return dateA.localeCompare(dateB);
    });

    return items;
  }, [streams, records, activeTab, sortOrder]);

  if (loading) return <div className="p-5 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* 🌟 タイトルアイコンの変更 */}
      <h2 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z"></path></svg>
        記録・履歴
      </h2>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 shadow-inner">
        {/* 🌟 視聴履歴タブ */}
        <button onClick={() => setActiveTab("viewed")} className={`flex-1 py-2 flex items-center justify-center text-sm font-bold rounded-lg transition-all ${activeTab === "viewed" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          視聴履歴
        </button>
        {/* 🌟 メモタブ */}
        <button onClick={() => setActiveTab("memo")} className={`flex-1 py-2 flex items-center justify-center text-sm font-bold rounded-lg transition-all ${activeTab === "memo" ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          メモ
        </button>
        {/* 🌟 お気に入りタブ */}
        <button onClick={() => setActiveTab("favorite")} className={`flex-1 py-2 flex items-center justify-center text-sm font-bold rounded-lg transition-all ${activeTab === "favorite" ? "bg-white text-yellow-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          お気に入り
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as "desc" | "asc")} className="text-xs py-1.5 px-3 border-gray-300 rounded-lg shadow-sm focus:border-blue-400 focus:ring-0 text-gray-600 bg-white">
          <option value="desc">↓ 新しい順</option>
          <option value="asc">↑ 古い順</option>
        </select>
      </div>

      <div className="flex flex-col gap-4">
        {historyItems.map(({ stream, record }) => (
          <div key={stream.id} onClick={() => setSelectedStream(stream)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row gap-4 relative">
            
            {record.isFavorite && (
              <svg className="absolute top-2 right-2 w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            )}

            <div className="w-full sm:w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {stream.thumbnailUrl && <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />}
            </div>
            
            <div className="flex flex-col flex-grow pr-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-2">{stream.title}</h3>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold whitespace-nowrap ml-2">
                  視聴 {record.viewCount}回
                </span>
              </div>
              
              <div className="text-[11px] text-gray-400 font-medium mb-3">
                {record.lastViewedAt ? `最終視聴: ${new Date(record.lastViewedAt).toLocaleDateString('ja-JP')}` : ''}
              </div>

              {record.memo && (
                <div className="mt-auto bg-gray-50 border border-gray-100 p-3 rounded-lg text-xs sm:text-sm text-gray-700 line-clamp-3">
                  {/* 🌟 リスト内のメモアイコン */}
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 flex items-center mb-1">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    メモ
                  </span>
                  {record.memo}
                </div>
              )}
            </div>
          </div>
        ))}

        {historyItems.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm bg-white rounded-xl border border-gray-100 shadow-sm">
            {activeTab === "viewed" && "視聴履歴がありません。"}
            {activeTab === "memo" && "メモがありません。動画にメモを残してみましょう！"}
            {activeTab === "favorite" && "お気に入りがありません。☆マークを押して追加しましょう！"}
          </div>
        )}
      </div>

      <StreamDetailModal 
        stream={selectedStream}
        record={selectedStream ? (records[selectedStream.id] || null) : null}
        onClose={() => setSelectedStream(null)}
        onUpdateRecord={updateRecord}
      />
    </div>
  );
};