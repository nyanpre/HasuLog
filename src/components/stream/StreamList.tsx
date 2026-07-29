// src/components/StreamList.tsx

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import type { StreamData } from "../../types";

import { useUserRecords } from "../../hooks/useUserRecords";
import { StreamCard } from "./StreamCard";
import { MemberFilterModal, type FilterState } from "./MemberFilterModal";
import { StreamDetailModal } from "./StreamDetailModal";

const MEMBERS = [
  "花帆", "さやか", "瑠璃乃", "梢", "綴理", "慈", 
  "吟子", "小鈴", "姫芽", "セラス", "泉"
];

export const StreamList = () => {
  const { records, updateRecord } = useUserRecords();

  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [columns, setColumns] = useState<1 | 2 | 4>(() => {
    const saved = sessionStorage.getItem('hl_columns');
    return saved ? Number(saved) as 1 | 2 | 4 : 1;
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('hl_filterOpen');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [isMemberPopupOpen, setIsMemberPopupOpen] = useState<boolean>(false);
  
  const [filterSeason, setFilterSeason] = useState<string>(() => sessionStorage.getItem('hl_season') || "all");
  const [filterType, setFilterType] = useState<string>(() => sessionStorage.getItem('hl_type') || "all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(() => (sessionStorage.getItem('hl_sort') as "desc" | "asc") || "desc");
  
  const [memberFilters, setMemberFilters] = useState<Record<string, FilterState>>(() => {
    const saved = sessionStorage.getItem('hl_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return MEMBERS.reduce((acc, member) => ({ ...acc, [member]: "none" }), {});
  });

  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);

  useEffect(() => {
    sessionStorage.setItem('hl_columns', columns.toString());
    sessionStorage.setItem('hl_filterOpen', String(isFilterOpen));
    sessionStorage.setItem('hl_season', filterSeason);
    sessionStorage.setItem('hl_type', filterType);
    sessionStorage.setItem('hl_sort', sortOrder);
    sessionStorage.setItem('hl_members', JSON.stringify(memberFilters));
  }, [columns, isFilterOpen, filterSeason, filterType, sortOrder, memberFilters]);

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

  const getViewCount = (id: string) => records[id]?.viewCount || 0;

  const setMemberFilter = (member: string, state: FilterState) => {
    setMemberFilters(prev => ({ ...prev, [member]: state }));
  };

  const resetMemberFilters = () => {
    setMemberFilters(MEMBERS.reduce((acc, member) => ({ ...acc, [member]: "none" }), {}));
  };

  // 🌟 フィルターリセット処理（ソート以外を初期化）
  const handleResetFilters = () => {
    setFilterSeason("all");
    setFilterType("all");
    resetMemberFilters();
  };

  const displayStreams = useMemo(() => {
    let result = [...streams];

    if (filterSeason !== "all") {
      result = result.filter(s => s.season && s.season.startsWith(filterSeason));
    }
    if (filterType !== "all") {
      result = result.filter(s => s.type === filterType);
    }

    const includes = MEMBERS.filter(m => memberFilters[m] === "include");
    const excludes = MEMBERS.filter(m => memberFilters[m] === "exclude");

    if (includes.length > 0 || excludes.length > 0) {
      result = result.filter(s => {
        const participants = s.participants || "";
        if (!includes.every(m => participants.includes(m))) return false;
        if (excludes.some(m => participants.includes(m))) return false;
        return true;
      });
    }

    return sortOrder === "asc" ? result.reverse() : result;
  }, [streams, filterSeason, filterType, memberFilters, sortOrder]);


  if (loading) return <div className="p-5 text-center text-gray-500">データを読み込み中...</div>;
  if (error) return <div className="p-5 text-center text-red-500">{error}</div>;

  const gridClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  const isFilteringMembers = Object.values(memberFilters).some(state => state !== "none");
  const isAnyFilterActive = filterSeason !== "all" || filterType !== "all" || isFilteringMembers;

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6 pb-24">
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-bold text-gray-700 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            表示切替・フィルター
          </span>
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
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  メンバー
                </span>
                {isFilteringMembers && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 ml-1"></span>
                )}
              </button>

              {/* 🌟 リセットボタン（何かしらフィルターがかかっている時だけ強調表示などアレンジ可能ですが、今回はシンプルに配置） */}
              {isAnyFilterActive && (
                <button 
                  onClick={handleResetFilters}
                  className="text-xs sm:text-sm py-1.5 px-4 bg-gray-50 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 font-medium text-gray-600 transition-colors"
                >
                  リセット
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
        {displayStreams.map((stream) => (
          <StreamCard 
            key={stream.id}
            stream={stream}
            columns={columns}
            viewCount={getViewCount(stream.id)}
            onClick={() => setSelectedStream(stream)}
          />
        ))}
      </div>
      
      {displayStreams.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">条件に一致するアーカイブがありません。</div>
      )}

      <MemberFilterModal 
        isOpen={isMemberPopupOpen}
        onClose={() => setIsMemberPopupOpen(false)}
        members={MEMBERS}
        memberFilters={memberFilters}
        setMemberFilter={setMemberFilter}
        resetMemberFilters={resetMemberFilters}
      />

      <StreamDetailModal 
        stream={selectedStream}
        record={selectedStream ? (records[selectedStream.id] || null) : null}
        onClose={() => setSelectedStream(null)}
        onUpdateRecord={updateRecord}
      />
    </div>
  );
};