// src/components/stream/StreamList.tsx
import { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import type { StreamData } from "../../types";
import { useUserRecords } from "../../hooks/useUserRecords";
import { useStreams } from "../../contexts/StreamContext";
import { useStreamFilters, MEMBERS } from "../../hooks/useStreamFilters";
import { StreamCard } from "./StreamCard";
import { MemberFilterModal } from "./MemberFilterModal";
import { StreamDetailModal } from "./StreamDetailModal";

const DynamicSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) => {
  const currentLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <div className="relative inline-flex items-center h-[28px] bg-white border border-gray-300 rounded-md shadow-2xs hover:bg-gray-50 transition-colors text-gray-700 text-[11px] sm:text-xs flex-shrink-0">
      <span className="invisible whitespace-pre pl-2 pr-5 pointer-events-none">
        {currentLabel}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full appearance-none bg-transparent pl-2 pr-5 focus:outline-none cursor-pointer z-10 text-gray-700 font-normal"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-0"
      />
    </div>
  );
};

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
    setAllMembersExclude,
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

  const seasonOptions = [
    { value: "all", label: "すべての期" },
    { value: "102", label: "102期" },
    { value: "103", label: "103期" },
    { value: "104", label: "104期" },
    { value: "105", label: "105期" },
    { value: "106", label: "106期" },
  ];

  const typeOptions = [
    { value: "all", label: "すべての配信" },
    { value: "with_meets", label: "With×MEETS" },
    { value: "with_station", label: "With×STATION" },
    { value: "fes_live", label: "Fes×LIVE" },
    { value: "story", label: "活動記録" },
    { value: "mirapa_mc", label: "みらくらマイクラ" },
  ];

  const watchedOptions = [
    { value: "all", label: "視聴/未視聴" },
    { value: "watched", label: "視聴済み" },
    { value: "unwatched", label: "未視聴" },
  ];

  const sortOptions = [
    { value: "desc", label: "新しい順" },
    { value: "asc", label: "古い順" },
  ];

  return (
    <div className="relative pb-24">
      
      {/* 🌟 ヘッダー直下に完全密着固定（セーフエリア加算＋1px食い込みで隙間を完全に除去） */}
      <div className="fixed top-[calc(51px+env(safe-area-inset-top,0px))] left-0 right-0 z-20 bg-gray-50 border-b border-gray-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-2.5">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200/60 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-gray-700 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                  表示切替・フィルター
                </span>
                <span className="text-[10px] bg-gray-200/80 text-gray-600 font-bold px-1.5 py-0.2 rounded-full">
                  {displayStreams.length} 件
                </span>
              </div>
              <svg className={`w-4 h-4 text-gray-500 transform transition-transform ${isFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isFilterOpen && (
              <div className="p-2.5 flex flex-col gap-2 bg-white max-h-[50vh] overflow-y-auto">
                {/* 1行目: 検索バー ＋ タイトルのみ */}
                <div className="flex items-center gap-1.5 w-full">
                  <div className="relative flex-1 min-w-[130px] h-[28px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="キーワード検索"
                      className="w-full h-full pl-7 pr-6 text-[11px] sm:text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-pink-400 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 font-normal"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTitleOnly(!isTitleOnly)}
                    className={`flex-shrink-0 whitespace-nowrap px-2 h-[28px] rounded-md text-[11px] sm:text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                      isTitleOnly
                        ? "bg-pink-500 border-pink-500 text-white shadow-2xs"
                        : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="タイトルのみを対象に絞り込み"
                  >
                    タイトルのみ
                  </button>
                </div>

                {/* 2行目: 各種コントロール */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-md h-[28px]">
                    <button onClick={() => setColumns(1)} className={`p-1 rounded transition-colors cursor-pointer ${columns === 1 ? "bg-white shadow-2xs text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                    </button>
                    <button onClick={() => setColumns(2)} className={`p-1 rounded transition-colors cursor-pointer ${columns === 2 ? "bg-white shadow-2xs text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h7v12H4zm9 0h7v12h-7z"/></svg>
                    </button>
                    <button onClick={() => setColumns(4)} className={`p-1 rounded transition-colors cursor-pointer ${columns === 4 ? "bg-white shadow-2xs text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5h4v14H3zm5 0h4v14H8zm5 0h4v14h-4zm5 0h4v14h-4z"/></svg>
                    </button>
                  </div>

                  <DynamicSelect
                    value={filterSeason}
                    onChange={setFilterSeason}
                    options={seasonOptions}
                  />

                  <DynamicSelect
                    value={filterType}
                    onChange={setFilterType}
                    options={typeOptions}
                  />

                  <DynamicSelect
                    value={filterWatched}
                    onChange={setFilterWatched}
                    options={watchedOptions}
                  />

                  <button 
                    onClick={() => setIsMemberPopupOpen(true)}
                    className="h-[28px] text-[11px] sm:text-xs px-2.5 bg-white border border-gray-300 rounded-md shadow-2xs hover:bg-gray-50 flex items-center gap-1 font-normal text-gray-700 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      メンバー
                    </span>
                    {isFilteringMembers && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5"></span>
                    )}
                  </button>

                  <DynamicSelect
                    value={sortOrder}
                    onChange={(val) => setSortOrder(val as "desc" | "asc")}
                    options={sortOptions}
                  />

                  {isAnyFilterActive && (
                    <button 
                      onClick={handleResetFilters}
                      className="h-[28px] text-[11px] sm:text-xs px-2.5 bg-gray-50 border border-gray-300 rounded-md shadow-2xs hover:bg-gray-100 font-normal text-gray-600 transition-colors flex-shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      リセット
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 閉じた状態のフィルターの高さ＋余白分を確保し、その下から動画カードを流す */}
<div className={`max-w-6xl mx-auto px-3 md:px-6 ${isFilterOpen ? "pt-[180px] sm:pt-[140px]" : "pt-[72px]"}`}>        <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
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
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 mt-2">
            <p className="text-gray-500 text-sm font-bold">条件に一致するアーカイブがありません。</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 text-xs text-pink-600 font-bold hover:underline cursor-pointer"
            >
              検索条件をクリアする
            </button>
          </div>
        )}
      </div>

      <MemberFilterModal 
        isOpen={isMemberPopupOpen}
        onClose={() => setIsMemberPopupOpen(false)}
        members={MEMBERS}
        memberFilters={memberFilters}
        setMemberFilter={setMemberFilter}
        resetMemberFilters={resetMemberFilters}
        onSetAllExclude={setAllMembersExclude}
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