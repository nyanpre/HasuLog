// src/components/recommendation/RandomVideoPicker.tsx
import { useState, useMemo, useEffect } from 'react';
import { Loader2, CheckSquare, Square, RotateCcw, ChevronDown } from 'lucide-react';
import { StreamCard } from '../stream/StreamCard';
import { VideoCard } from '../related/VideoCard';
import type { ContentItem } from '../related/types';
import type { StreamData } from '../../types';

import otameshiData from '../../data/otameshi_withmeets.json';
import sehasuData from '../related/data/sehasu_videos.json';
import mirapaData from '../related/data/mirapa_radio.json';

const STORAGE_KEY = 'hasulog_random_picker_stream_id';

export type PickerItem = StreamData & {
  category?: string;
};

export type RandomCategoryKey = 'meets_related' | 'story' | 'fes_live' | 'mirapa_mc' | 'sehasu' | 'mirapa_radio';

interface CategoryOption {
  key: RandomCategoryKey;
  label: string;
  match: (s: PickerItem) => boolean;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'meets_related',
    label: 'With×MEETS関連',
    match: (s) => ['with_meets', 'with_station', 'otameshi'].includes(s.type),
  },
  {
    key: 'story',
    label: '活動記録',
    match: (s) => s.type === 'story',
  },
  {
    key: 'fes_live',
    label: 'Fes×LIVE',
    match: (s) => s.type === 'fes_live',
  },
  {
    key: 'mirapa_mc',
    label: 'みらくらマイクラ',
    match: (s) => s.type === 'mirapa_mc',
  },
  {
    key: 'sehasu',
    label: 'せーはす',
    match: (s) => s.type === 'sehasu',
  },
  {
    key: 'mirapa_radio',
    label: 'みらぱラジオ',
    match: (s) => s.type === 'mirapa_radio',
  },
];

const ALL_CATEGORY_KEYS = CATEGORY_OPTIONS.map(opt => opt.key);

const SEASON_OPTIONS = [
  { value: 'all', label: 'すべての期' },
  { value: '103', label: '103期' },
  { value: '104', label: '104期' },
  { value: '105', label: '105期' },
  { value: '106', label: '106期' },
];

interface RandomVideoPickerProps {
  baseStreams: StreamData[];
  records: Record<string, { viewCount: number }>;
  isEx: boolean;
  onSelectStream: (stream: StreamData) => void;
}

export const RandomVideoPicker = ({
  baseStreams,
  records,
  isEx,
  onSelectStream,
}: RandomVideoPickerProps) => {
  const [selectedCategories, setSelectedCategories] = useState<RandomCategoryKey[]>(ALL_CATEGORY_KEYS);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [randomStream, setRandomStream] = useState<PickerItem | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [pickCount, setPickCount] = useState(0);

  const allContentPool = useMemo<PickerItem[]>(() => {
    const formattedOtameshi: PickerItem[] = ((otameshiData as any[]) || []).map(item => ({
      ...item,
      participants: item.participants || '',
      type: 'otameshi',
      category: 'おためし蓮ノ空',
      is_official: item.is_official !== false
    }));

    const formattedSehasu: PickerItem[] = ((sehasuData as any[]) || []).map(item => ({
      ...item,
      participants: item.participants || '',
      type: 'sehasu',
      category: 'せーので！はすのそら！',
      is_official: true
    }));

    const formattedMirapaRadio: PickerItem[] = ((mirapaData as any[]) || []).map(item => ({
      id: item.id,
      season: item.season || '',
      type: 'mirapa_radio',
      date: item.date,
      title: item.title,
      description: item.description,
      participants: item.participants || '',
      youtubeUrl: item.youtubeUrl,
      thumbnailUrl: item.thumbnailUrl,
      category: 'みらぱラジオ',
      is_official: true
    }));

    return [...baseStreams, ...formattedOtameshi, ...formattedSehasu, ...formattedMirapaRadio];
  }, [baseStreams]);

  useEffect(() => {
    if (allContentPool.length === 0 || randomStream) return;

    try {
      const savedStreamId = localStorage.getItem(STORAGE_KEY);
      if (savedStreamId) {
        const found = allContentPool.find(s => s.id === savedStreamId);
        if (found) {
          const isOfficial = found.is_official !== false && (found.is_official as any) !== 'false';
          if (isOfficial || isEx) {
            setRandomStream(found);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.warn("ローカルストレージからの復元に失敗しました:", e);
    }
  }, [allContentPool, isEx, randomStream]);

  const toggleCategory = (key: RandomCategoryKey) => {
    setSelectedCategories(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleResetFilters = () => {
    setSelectedCategories(ALL_CATEGORY_KEYS);
    setSelectedSeason('all');
  };

  const handlePickRandom = () => {
    setIsPicking(true);

    const activeMatchers = CATEGORY_OPTIONS.filter(opt => selectedCategories.includes(opt.key));

    const candidates = allContentPool.filter(stream => {
      const matchesCategory = activeMatchers.some(opt => opt.match(stream));
      if (!matchesCategory) return false;

      if (selectedSeason !== 'all') {
        const seasonStr = String(stream.season || '');
        if (!seasonStr.startsWith(selectedSeason)) return false;
      }

      if (!stream.youtubeUrl || stream.youtubeUrl.trim() === '') return false;

      const isOfficial = stream.is_official !== false && (stream.is_official as any) !== 'false';
      if (!isOfficial && !isEx) return false;

      return true;
    });

    if (candidates.length === 0) {
      setRandomStream(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      setIsPicking(false);
      return;
    }

    setTimeout(() => {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      setRandomStream(picked);
      setPickCount(c => c + 1);

      try {
        localStorage.setItem(STORAGE_KEY, picked.id);
      } catch (e) {
        console.warn("ローカルストレージへの保存に失敗しました:", e);
      }

      setIsPicking(false);
    }, 250);
  };

  const isRelatedVideo = randomStream?.type === 'sehasu' || randomStream?.type === 'mirapa_radio';

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-xs">
      {/* 🌟 1.8秒間で滑らかにフェードアウトするCSSアニメーション */}
      <style>{`
        @keyframes fadeGlowOut1_8s {
          0% {
            opacity: 1;
            transform: scale(1.006);
          }
          15% {
            opacity: 1;
            transform: scale(1.006);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
        .animate-glow-1-8s {
          animation: fadeGlowOut1_8s 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight flex-shrink-0">
          ランダム動画Picker
        </h3>        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative inline-flex items-center h-[26px] bg-white border border-gray-200 rounded-md shadow-2xs hover:bg-gray-50 transition-colors text-[11px] text-gray-700">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="appearance-none bg-transparent pl-2 pr-5 py-0.5 focus:outline-none cursor-pointer font-medium text-gray-700"
            >
              {SEASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 h-[26px] text-[11px] font-bold text-gray-500 hover:text-pink-600 bg-gray-100 hover:bg-pink-50 px-2 rounded-md transition-colors cursor-pointer"
            title="条件を初期状態に戻す"
          >
            <RotateCcw size={11} />
            <span>リセット</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        対象に含めたいカテゴリを選んで「動画を引く」を押すと、条件に合った動画が1本選ばれます。
      </p>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {CATEGORY_OPTIONS.map(opt => {
          const isChecked = selectedCategories.includes(opt.key);
          const isOnlyOne = isChecked && selectedCategories.length === 1;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggleCategory(opt.key)}
              disabled={isOnlyOne}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer ${
                isChecked
                  ? 'bg-white border-pink-500 text-pink-600 shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              } ${isOnlyOne ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isChecked ? (
                <CheckSquare size={16} className="text-pink-500 flex-shrink-0" />
              ) : (
                <Square size={16} className="text-gray-400 flex-shrink-0" />
              )}
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handlePickRandom}
        disabled={isPicking || allContentPool.length === 0}
        className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isPicking && <Loader2 className="animate-spin" size={16} />}
        <span>{randomStream ? '別の動画を引く' : '動画を引く'}</span>
      </button>

      {/* 抽選結果コンテナ */}
      {randomStream && (
        <div className="mt-7 pt-5 border-t border-gray-100">
          
          {/* カードとエフェクトの基準を揃える相対コンテナ */}
          <div className="relative">
            
            {/* 🌟 背面エフェクト：幅スリム（-inset-1）＆ 1.8秒フェードアウト */}
            {pickCount > 0 && (
              <div
                key={`glow-${pickCount}`}
                className="absolute -inset-1 rounded-2xl pointer-events-none z-0 animate-glow-1-8s"
              >
                {/* 均等に寄り添うソフト光彩オーラ（淡いピンク〜ラベンダー） */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400/25 via-fuchsia-300/20 to-purple-400/25 rounded-2xl blur-xs" />
                {/* 輪郭に沿った繊細な光彩枠 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-400/35 via-purple-300/30 to-indigo-300/30 shadow-[0_0_8px_rgba(236,72,153,0.18),0_0_8px_rgba(168,85,247,0.18)]" />
              </div>
            )}

            {/* 🌟 カード本体（z-10 & bg-white で背面エフェクトを確実にカバー） */}
            <div className="relative z-10 rounded-2xl p-[1px] bg-gray-200/80 shadow-xs">
              <div className="rounded-[15px] overflow-hidden bg-white">
                {isRelatedVideo ? (
                  <VideoCard
                    item={{
                      id: randomStream.id,
                      season: randomStream.season,
                      title: randomStream.title,
                      description: randomStream.description,
                      publishedDate: randomStream.date,
                      category: randomStream.category || (randomStream.type === 'mirapa_radio' ? 'みらぱラジオ' : 'せーはす'),
                      source: 'YouTube',
                      thumbnailUrl: randomStream.thumbnailUrl,
                      youtubeUrl: randomStream.youtubeUrl,
                    } as ContentItem}
                    columns={1}
                  />
                ) : (
                  <StreamCard
                    stream={randomStream}
                    columns={1}
                    viewCount={records[randomStream.id]?.viewCount || 0}
                    onClick={() => onSelectStream(randomStream)}
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};