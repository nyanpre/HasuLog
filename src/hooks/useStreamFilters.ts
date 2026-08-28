// src/hooks/useStreamFilters.ts
import { useState, useEffect, useMemo } from "react";
import type { StreamData } from "../types";
import type { StreamRecord } from "./useUserRecords";
import type { FilterState } from "../components/stream/MemberFilterModal";

export const MEMBERS = [
  "花帆", "さやか", "瑠璃乃", "梢", "綴理", "慈", 
  "吟子", "小鈴", "姫芽", "セラス", "泉"
];

// 同一日のタイトル順序付けヘルパー
const parseStoryRank = (title: string): { episodeNum: number; isInterlude: boolean; hasEpisode: boolean } => {
  const match = title.match(/^第(\d+(?:\.\d+)?)話/);
  const isInterlude = title.includes("幕間");

  if (match) {
    return {
      episodeNum: parseFloat(match[1]),
      isInterlude,
      hasEpisode: true
    };
  }

  return {
    episodeNum: 99999,
    isInterlude: false,
    hasEpisode: false
  };
};

export const useStreamFilters = (streams: StreamData[], records: Record<string, StreamRecord>) => {
  const [columns, setColumns] = useState<1 | 2 | 4>(() => {
    const saved = sessionStorage.getItem('hl_columns');
    return saved ? Number(saved) as 1 | 2 | 4 : 1;
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('hl_filterOpen');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [filterSeason, setFilterSeason] = useState<string>(() => sessionStorage.getItem('hl_season') || "all");
  const [filterType, setFilterType] = useState<string>(() => sessionStorage.getItem('hl_type') || "all");
  const [filterWatched, setFilterWatched] = useState<string>(() => sessionStorage.getItem('hl_watched') || "all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(() => (sessionStorage.getItem('hl_sort') as "desc" | "asc") || "desc");
  
  const [memberFilters, setMemberFilters] = useState<Record<string, FilterState>>(() => {
    const saved = sessionStorage.getItem('hl_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return MEMBERS.reduce((acc, member) => ({ ...acc, [member]: "none" }), {});
  });

  useEffect(() => {
    sessionStorage.setItem('hl_columns', columns.toString());
    sessionStorage.setItem('hl_filterOpen', String(isFilterOpen));
    sessionStorage.setItem('hl_season', filterSeason);
    sessionStorage.setItem('hl_type', filterType);
    sessionStorage.setItem('hl_watched', filterWatched);
    sessionStorage.setItem('hl_sort', sortOrder);
    sessionStorage.setItem('hl_members', JSON.stringify(memberFilters));
  }, [columns, isFilterOpen, filterSeason, filterType, filterWatched, sortOrder, memberFilters]);

  const setMemberFilter = (member: string, state: FilterState) => {
    setMemberFilters(prev => ({ ...prev, [member]: state }));
  };

  const resetMemberFilters = () => {
    setMemberFilters(MEMBERS.reduce((acc, member) => ({ ...acc, [member]: "none" }), {}));
  };

  const handleResetFilters = () => {
    setFilterSeason("all");
    setFilterType("all");
    setFilterWatched("all");
    resetMemberFilters();
  };

  const displayStreams = useMemo(() => {
    let result = [...streams];

    if (filterSeason !== "all") {
      result = result.filter(s => {
        if (!s.season) return false;
        if (filterSeason === "106") {
          return s.season.startsWith("106") || s.season === "With×STATION" || s.type === "with_station";
        }
        return s.season.startsWith(filterSeason);
      });
    }
    
    if (filterType !== "all") {
      result = result.filter(s => s.type === filterType);
    }

    if (filterWatched !== "all") {
      result = result.filter(s => {
        const viewCount = records[s.id]?.viewCount || 0;
        if (filterWatched === "watched") return viewCount > 0;
        if (filterWatched === "unwatched") return viewCount === 0;
        return true;
      });
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

    result.sort((a, b) => {
      const is102A = a.season === "102期";
      const is102B = b.season === "102期";
      
      if (is102A !== is102B) {
        if (is102A) return sortOrder === "desc" ? 1 : -1;
        if (is102B) return sortOrder === "desc" ? -1 : 1;
      }

      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();

      if (timeA !== timeB) {
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      }

      const rankA = parseStoryRank(a.title || "");
      const rankB = parseStoryRank(b.title || "");

      let diff = 0;

      if (rankA.hasEpisode && rankB.hasEpisode) {
        if (rankA.episodeNum !== rankB.episodeNum) {
          diff = rankA.episodeNum - rankB.episodeNum;
        } else {
          if (rankA.isInterlude !== rankB.isInterlude) {
            diff = rankA.isInterlude ? 1 : -1;
          } else {
            diff = a.title.localeCompare(b.title, 'ja');
          }
        }
      } else if (rankA.hasEpisode && !rankB.hasEpisode) {
        diff = -1;
      } else if (!rankA.hasEpisode && rankB.hasEpisode) {
        diff = 1;
      } else {
        diff = a.title.localeCompare(b.title, 'ja');
      }

      return sortOrder === "desc" ? -diff : diff;
    });

    return result;
  }, [streams, filterSeason, filterType, filterWatched, memberFilters, sortOrder, records]);

  const isFilteringMembers = Object.values(memberFilters).some(state => state !== "none");
  const isAnyFilterActive = filterSeason !== "all" || filterType !== "all" || filterWatched !== "all" || isFilteringMembers;

  return {
    columns, setColumns,
    isFilterOpen, setIsFilterOpen,
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
  };
};