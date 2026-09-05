// src/components/related/VideoList.tsx
import { useState, useMemo } from 'react';
import { ArrowLeft, AlignJustify, Columns2, ArrowUpDown } from 'lucide-react';
import { VideoCard } from './VideoCard';
import type { ContentItem } from './types';

type Props = {
  title?: string;
  items: ContentItem[];
  onBack: () => void;
};

type LayoutType = 1 | 2 | 4;

export const VideoList = ({ title = "動画一覧", items, onBack }: Props) => {
  const [layout, setLayout] = useState<LayoutType>(1);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterSeason, setFilterSeason] = useState<string>('all');

  const getItemSeason = (item: any): string => {
    if (item.season !== undefined && item.season !== null && item.season !== '') {
      return String(item.season);
    }

    const dateStr = item.publishedDate || item.date || '';
    const cleaned = dateStr.replace(/\D/g, '');
    if (cleaned.length >= 8) {
      const numDate = parseInt(cleaned.slice(0, 8), 10);
      if (numDate <= 20240331) return '103';
      if (numDate <= 20250331) return '104';
      return '105';
    }

    return '105';
  };

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filterSeason === 'all') return true;
        const currentSeason = getItemSeason(item);
        return currentSeason === filterSeason;
      })
      .sort((a, b) => {
        const parseDateNum = (target: any) => {
          const dateStr = target.publishedDate || target.date || '';
          const cleaned = dateStr.replace(/\D/g, '');
          return parseInt(cleaned, 10) || 0;
        };

        const timeA = parseDateNum(a);
        const timeB = parseDateNum(b);

        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [items, filterSeason, sortOrder]);

  const gridClass = 
    layout === 1 
      ? 'grid-cols-1' 
      : layout === 2 
      ? 'grid-cols-2' 
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div>
      {/* タイトルとフィルター・コントロール部 */}
      <div className="mb-6 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <button 
            onClick={onBack}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-pink-600 hover:border-pink-200 shadow-sm transition-colors flex-shrink-0"
            title="セクション一覧に戻る"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base sm:text-xl font-extrabold text-gray-800 truncate">
            {title}
          </h2>
        </div>

        {/* コントロールバー */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* レイアウト切り替え */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
              <button 
                onClick={() => setLayout(1)} 
                className={`p-1.5 rounded transition-colors ${layout === 1 ? "bg-white shadow text-pink-600" : "text-gray-400 hover:text-gray-600"}`}
                title="1列表示"
              >
                <AlignJustify size={18} />
              </button>
              <button 
                onClick={() => setLayout(2)} 
                className={`p-1.5 rounded transition-colors ${layout === 2 ? "bg-white shadow text-pink-600" : "text-gray-400 hover:text-gray-600"}`}
                title="2列表示"
              >
                <Columns2 size={18} />
              </button>
              <button 
                onClick={() => setLayout(4)} 
                className={`p-1.5 rounded transition-colors ${layout === 4 ? "bg-white shadow text-pink-600" : "text-gray-400 hover:text-gray-600"}`}
                title="4列表示"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5h4v14H3zm5 0h4v14H8zm5 0h4v14h-4zm5 0h4v14h-4z"/></svg>
              </button>
            </div>

            {/* シーズンフィルター */}
            <select 
              value={filterSeason} 
              onChange={(e) => setFilterSeason(e.target.value)} 
              className="text-xs sm:text-sm py-1.5 pl-2 pr-8 border border-gray-200 rounded-lg shadow-sm focus:border-pink-300 focus:ring-0 bg-white font-bold text-gray-700"
            >
              <option value="all">すべての期</option>
              <option value="103">103期</option>
              <option value="104">104期</option>
              <option value="105">105期</option>
            </select>
          </div>

          {/* ソート順切り替え */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors shadow-sm"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'desc' ? '新しい順' : '古い順'}
          </button>
        </div>
      </div>

      {/* 動画カード一覧 */}
      {filteredAndSortedItems.length > 0 ? (
        <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
          {filteredAndSortedItems.map((item) => (
            <VideoCard 
              key={item.id} 
              item={item} 
              columns={layout}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm font-bold">条件に一致するアーカイブがありません。</p>
        </div>
      )}
    </div>
  );
};