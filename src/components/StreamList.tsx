// hasulog/src/components/StreamList.tsx

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import type { StreamData } from "../types";

// メンバー名をJSON準拠（半角スペース入り）に修正
const MEMBERS = [
  "日野下花帆", "村野さやか", "乙宗 梢", "夕霧綴理", 
  "大沢瑠璃乃", "藤島 慈", "百生吟子", "徒町小鈴", 
  "安養寺姫芽", "セラス 柳田 リリエンフェルト", "桂城泉"
];

type FilterState = "none" | "include" | "exclude";

export const StreamList = () => {
  // --- State (データ) ---
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- State (UI制御用) ---
  const [columns, setColumns] = useState<1 | 2 | 4>(1);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
  const [isMemberPopupOpen, setIsMemberPopupOpen] = useState<boolean>(false);
  
  // フィルター用State
  const [filterSeason, setFilterSeason] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [memberFilters, setMemberFilters] = useState<Record<string, FilterState>>({});
  
  // 完全一致（特定の人"だけ"）モードのフラグ
  const [isExactMatch, setIsExactMatch] = useState<boolean>(false);

  // 視聴回数State
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);

  // --- データ取得 ---
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const streamsRef = collection(db, "streams");
        const q = query(streamsRef, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        
        const streamData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as StreamData);
        
        setStreams(streamData);
      } catch (err) {
        console.error("データの取得に失敗しました:", err);
        setError("データの読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchStreams();
  }, []);

  const updateViewCount = (id: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewCounts(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const getViewCount = (id: string) => viewCounts[id] || 0;

  const setMemberFilter = (member: string, state: FilterState) => {
    setMemberFilters(prev => ({ ...prev, [member]: state }));
  };

  // --- フィルター・ソート処理 ---
  const displayStreams = useMemo(() => {
    let result = [...streams];

    if (filterSeason !== "all") {
      result = result.filter(s => s.season && s.season.startsWith(filterSeason));
    }

    if (filterType !== "all") {
      result = result.filter(s => s.type === filterType);
    }

    // メンバーフィルター処理（集合の考え方に基づく）
    const includes = MEMBERS.filter(m => memberFilters[m] === "include");
    const excludes = MEMBERS.filter(m => memberFilters[m] === "exclude");

    if (includes.length > 0 || excludes.length > 0 || isExactMatch) {
      result = result.filter(s => {
        if (!s.participants) return false;
        
        // 注意: 名前の半角スペースを維持するため、カンマのみで分割する (\sを含めない)
        const attendees = s.participants
          .split(/[,、]+/)
          .map(m => m.trim())
          .filter(Boolean);

        if (isExactMatch) {
          // ② 特定の人"だけ"が参加した (完全一致)
          // attendees == include AND (exclude は使わない/空)
          if (attendees.length !== includes.length) return false;
          return includes.every(m => attendees.includes(m));
        } else {
          // ① 特定の人が参加した（他は問わない）
          // include ⊆ attendees AND (exclude ∩ attendees = ∅)
          if (excludes.some(m => attendees.includes(m))) return false;
          if (includes.length > 0 && !includes.every(m => attendees.includes(m))) return false;
          return true;
        }
      });
    }

    if (sortOrder === "asc") {
      result = result.reverse();
    }

    return result;
  }, [streams, filterSeason, filterType, memberFilters, isExactMatch, sortOrder]);

  if (loading) return <div className="p-5 text-center text-gray-500">データを読み込み中...</div>;
  if (error) return <div className="p-5 text-center text-red-500">{error}</div>;

  const gridClass = 
    columns === 1 ? "grid-cols-1" : 
    columns === 2 ? "grid-cols-2" : 
    "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6 pb-24">
      
      {/* --- ヘッダー：表示切替・フィルター --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-bold text-gray-700">⚙️ 表示切替・フィルター</span>
          <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isFilterOpen && (
          <div className="p-3 sm:p-4 flex flex-col gap-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3 items-center">
              
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
                <button onClick={() => setColumns(1)} className={`p-1.5 rounded transition-colors ${columns === 1 ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                </button>
                <button onClick={() => setColumns(2)} className={`p-1.5 rounded transition-colors ${columns === 2 ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h7v12H4zm9 0h7v12h-7z"/></svg>
                </button>
                <button onClick={() => setColumns(4)} className={`p-1.5 rounded transition-colors ${columns === 4 ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5h4v14H3zm5 0h4v14H8zm5 0h4v14h-4zm5 0h4v14h-4z"/></svg>
                </button>
              </div>

              <select value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0">
                <option value="all">すべての期</option>
                <option value="103">103期</option>
                <option value="104">104期</option>
                <option value="105">105期</option>
              </select>

              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0">
                <option value="all">すべての配信</option>
                <option value="with_meets">With×MEETS</option>
                <option value="with_station">With×STATION</option>
              </select>

              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0">
                <option value="desc">新しい順</option>
                <option value="asc">古い順</option>
              </select>

              <button 
                onClick={() => setIsMemberPopupOpen(true)}
                className="text-xs sm:text-sm py-1.5 px-4 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-1 font-medium text-gray-700"
              >
                <span>👤 メンバー</span>
                {Object.values(memberFilters).some(v => v !== "none" && v !== undefined) && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 ml-1"></span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 動画一覧リスト --- */}
      <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
        {displayStreams.map((stream) => (
          <div 
            key={stream.id} 
            onClick={() => setSelectedStream(stream)}
            className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex ${
              columns === 1 ? "flex-col sm:flex-row items-stretch" : "flex-col"
            }`}
          >
            <div className={`relative bg-gray-100 flex-shrink-0 flex items-center justify-center ${
              columns === 1 ? "w-full sm:w-1/3 md:w-64 aspect-video sm:aspect-auto border-b sm:border-b-0 sm:border-r border-gray-100" : "w-full aspect-video"
            }`}>
              {stream.thumbnailUrl ? (
                <img src={stream.thumbnailUrl} alt={stream.title} className={`w-full h-full object-cover ${columns === 1 ? "sm:absolute sm:inset-0" : ""}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
              )}
              <span className={`absolute top-1 left-1 sm:top-2 sm:left-2 text-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                stream.type === "with_meets" ? "bg-pink-500" : "bg-blue-500"
              }`}>
                {stream.type === "with_meets" ? "MEETS" : "STATION"}
              </span>
            </div>

            <div className={`flex flex-col flex-grow justify-between min-w-0 ${columns === 1 ? "p-3 sm:p-4" : "p-2"}`}>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 mb-0.5 flex gap-2">
                  <span>{stream.date}</span>
                </div>
                
                <h3 className={`font-bold text-gray-800 leading-tight break-words ${
                  columns === 1 ? "text-sm sm:text-base line-clamp-2" : "text-xs line-clamp-2"
                }`}>
                  {stream.title}
                </h3>
                
                {columns === 1 && stream.participants && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    🗣 {stream.participants}
                  </div>
                )}

                {columns === 1 && stream.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {stream.description}
                  </p>
                )}
              </div>

              <div className={`${columns === 1 ? "mt-3" : "mt-2"} flex items-center`}>
                <div className="flex items-center border border-gray-300 rounded bg-gray-50 overflow-hidden shadow-sm">
                  <button 
                    onClick={(e) => updateViewCount(stream.id, -1, e)}
                    className="px-2.5 py-0.5 sm:py-1 text-gray-600 hover:bg-gray-200 transition-colors"
                  >−</button>
                  <span className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-700 border-x border-gray-300 min-w-[5.5rem] text-center font-medium bg-white">
                    視聴回数：{getViewCount(stream.id)}
                  </span>
                  <button 
                    onClick={(e) => updateViewCount(stream.id, 1, e)}
                    className="px-2.5 py-0.5 sm:py-1 text-gray-600 hover:bg-gray-200 transition-colors"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {displayStreams.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">条件に一致するアーカイブがありません。</div>
      )}

      {/* --- メンバーフィルター ポップアップ --- */}
      {isMemberPopupOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col animate-fade-in max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">メンバーで絞り込み</h3>
              <button onClick={() => setIsMemberPopupOpen(false)} className="text-gray-500 hover:text-gray-800 text-lg">✕</button>
            </div>
            
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <p className="text-[11px] font-bold text-gray-500 mb-2">マッチ条件</p>
              <div className="flex flex-col gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!isExactMatch} onChange={() => setIsExactMatch(false)} className="text-blue-500" />
                  <span>① 通常（「含む」の全員が参加、かつ「除外」が不在）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={isExactMatch} onChange={() => setIsExactMatch(true)} className="text-blue-500" />
                  <span>② 完全一致（「含む」に指定したメンバー<strong>のみ</strong>が参加）</span>
                </label>
              </div>
            </div>

            <div className="overflow-y-auto p-4 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {MEMBERS.map(member => (
                  <div key={member} className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="text-sm text-gray-700 font-medium">{member}</span>
                    <div className="flex items-center gap-3 text-xs">
                      {/* 明示的に「指定なし」も残しておくことで、選択状態を解除可能にしています */}
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`filter-${member}`} checked={!memberFilters[member] || memberFilters[member] === "none"} onChange={() => setMemberFilter(member, "none")} className="text-gray-400 focus:ring-0" />
                        <span className="text-gray-500">ー</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`filter-${member}`} checked={memberFilters[member] === "include"} onChange={() => setMemberFilter(member, "include")} className="text-blue-500 focus:ring-blue-400" />
                        <span className={memberFilters[member] === "include" ? "font-bold text-blue-600" : "text-gray-600"}>含む</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`filter-${member}`} checked={memberFilters[member] === "exclude"} onChange={() => setMemberFilter(member, "exclude")} className="text-red-500 focus:ring-red-400" />
                        <span className={memberFilters[member] === "exclude" ? "font-bold text-red-600" : "text-gray-600"}>除外</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between gap-3">
              <button 
                onClick={() => { setMemberFilters({}); setIsExactMatch(false); }}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                リセット
              </button>
              <button 
                onClick={() => setIsMemberPopupOpen(false)}
                className="flex-grow px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 動画詳細モーダル --- */}
      {selectedStream && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
          <div className="bg-white w-full max-w-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-fade-in">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm truncate">【 動画詳細 】</h3>
              <button 
                onClick={() => setSelectedStream(null)}
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              >✕</button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                {selectedStream.thumbnailUrl ? (
                  <img src={selectedStream.thumbnailUrl} alt={selectedStream.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-snug break-words">{selectedStream.title}</h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                <p><strong>配信日:</strong> {selectedStream.date}</p>
                <p className="w-full mt-1"><strong>出演:</strong> {selectedStream.participants || "不明"}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {selectedStream.description || "公式概要やあらすじはありません。"}
                </p>
              </div>

              {selectedStream.youtubeUrl && (
                <a 
                  href={selectedStream.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg mb-6 shadow-sm text-sm transition-colors"
                >▶️ YouTubeで開く</a>
              )}

              <div className="border-t border-gray-200 pt-4 pb-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-800">視聴メモ</h4>
                  
                  <div className="flex items-center border border-gray-300 rounded bg-gray-50 overflow-hidden shadow-sm">
                    <button onClick={() => updateViewCount(selectedStream.id, -1)} className="px-3 py-1 text-gray-600 hover:bg-gray-200">−</button>
                    <span className="px-3 py-1 text-xs text-gray-700 border-x border-gray-300 min-w-[6rem] text-center font-medium bg-white">
                      視聴回数：{getViewCount(selectedStream.id)}
                    </span>
                    <button onClick={() => updateViewCount(selectedStream.id, 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-200">+</button>
                  </div>
                </div>
                <textarea 
                  className="w-full border-gray-300 rounded-lg p-2 text-xs sm:text-sm focus:border-blue-400 min-h-[100px] mb-3 shadow-sm"
                  placeholder="感想やメモを入力..."
                ></textarea>
                <button className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs sm:text-sm shadow-sm transition-colors">
                  保存する
                </button>
              </div>
            </div>
            <div className="h-safe-bottom bg-white rounded-b-xl"></div>
          </div>
        </div>
      )}
    </div>
  );
};