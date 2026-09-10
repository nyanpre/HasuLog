// src/components/stream/StreamList.tsx
import { useState } from "react";
import { Search, X } from "lucide-react";
import type { StreamData } from "../../types";
import { useUserRecords } from "../../hooks/useUserRecords";
import { useStreams } from "../../contexts/StreamContext";
import { useStreamFilters, MEMBERS } from "../../hooks/useStreamFilters";
import { StreamCard } from "./StreamCard";
import { MemberFilterModal } from "./MemberFilterModal";
import { StreamDetailModal } from "./StreamDetailModal";

export const StreamList = () => {
  const { records, updateRecord } = useUserRecords();
  const { streams, isLoading: loading, error } = useStreams();

  const {
    columns, setColumns,
    isFilterOpen, setIsFilterOpen,
    searchQuery, setSearchQuery,
    isTitleOnly, setIsTitleOnly,
    filterSeason, setFilterSeason,
    filterType, setFilterType,
    filterWatched, setFilterWatched,
    sortOrder, setSortOrder,
    memberFilters, setMemberFilter,
    resetMemberFilters,
    handleResetFilters,
    displayStreams,
    isFilteringMembers,
    isAnyFilterActive
  } = useStreamFilters(streams, records);

  const [isMemberPopupOpen, setIsMemberPopupOpen] = useState<boolean>(false);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);

  const getViewCount = (id: string) => records[id]?.viewCount || 0;

  if (loading) return <div className="p-5 text-center text-gray-500">データを読み込み中...</div>;
  if (error) return <div className="p-5 text-center text-red-500">{error}</div>;

  const gridClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6 pb-24">
      
      {/* 画面上部に固定 */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              表示切替・フィルター
            </span>
            <span className="text-xs bg-gray-200/80 text-gray-600 font-bold px-2 py-0.5 rounded-full">
              {displayStreams.length} 件
            </span>
          </div>
          <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isFilterOpen && (
          <div className="p-3 sm:p-4 flex flex-col gap-3 border-t border-gray-200 max-h-[70vh] overflow-y-auto">
            
            {/* 🌟 検索バー（flex-1 で空きスペースを最大拡張）＋ タイトルのみボタン（サイズ固定） */}
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キーワード検索（スペース区切りでAND）..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-400 focus:bg-white transition-all font-medium text-gray-800 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* タイトルのみ切り替えボタン（大きさ保持・縮まないよう flex-shrink-0） */}
              <button
                type="button"
                onClick={() => setIsTitleOnly(!isTitleOnly)}
                className={`flex-shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isTitleOnly
                    ? "bg-pink-500 border-pink-500 text-white shadow-xs"
                    : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                }`}
                title="タイトルのみを対象に絞り込み"
              >
                タイトルのみ
              </button>
            </div>

            {/* 各種絞り込みドロップダウン */}
            <div className="flex flex-wrap gap-2.5 items-center">
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

              <select value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0 bg-white">
                <option value="all">すべての期</option>
                <option value="102">102期</option>
                <option value="103">103期</option>
                <option value="104">104期</option>
                <option value="105">105期</option>
                <option value="106">106期</option>
              </select>

              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0 bg-white">
                <option value="all">すべての配信</option>
                <option value="with_meets">With×MEETS</option>
                <option value="with_station">With×STATION</option>
                <option value="fes_live">Fes×LIVE</option>
                <option value="story">活動記録</option>
                <option value="mirapa_mc">みらぱマイクラ</option>
              </select>

              <select value={filterWatched} onChange={(e) => setFilterWatched(e.target.value)} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0 bg-white">
                <option value="all">視聴/未視聴</option>
                <option value="watched">視聴済み</option>
                <option value="unwatched">未視聴</option>
              </select>

              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")} className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring-0 bg-white">
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

      {/* 動画カードリスト */}
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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm font-bold">条件に一致するアーカイブがありません。</p>
          <button
            onClick={handleResetFilters}
            className="mt-3 text-xs text-pink-600 font-bold hover:underline"
          >
            検索条件をクリアする
          </button>
        </div>
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