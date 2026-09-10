// src/components/related/MediaSectionView.tsx
import { useState, useMemo } from 'react';
import { ArrowLeft, AlignJustify, Columns2, Filter, ArrowUpDown } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import type { ContentItem } from './types';

interface MediaSectionViewProps {
  contents: ContentItem[];
  onBack: () => void;
  onSelectContent: (title: string, url: string) => void;
}

export const MediaSectionView = ({ contents, onBack, onSelectContent }: MediaSectionViewProps) => {
  const [activeSource, setActiveSource] = useState<string>('すべて');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [layout, setLayout] = useState<1 | 2>(1);

  const sources = useMemo(() => {
    const list = new Set<string>();
    contents.forEach(item => {
      if (item.source) list.add(item.source);
    });
    return ['すべて', ...Array.from(list)];
  }, [contents]);

  const processedContents = useMemo(() => {
    return contents
      .filter(item => activeSource === 'すべて' || item.source === activeSource)
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate).getTime() || 0;
        const dateB = new Date(b.publishedDate).getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [contents, activeSource, sortOrder]);

  const gridClass = layout === 1 ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <button 
            onClick={onBack}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-pink-600 hover:border-pink-200 shadow-sm transition-colors flex-shrink-0"
            title="セクション一覧に戻る"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 truncate flex items-center">
            メディア一覧
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
            <button 
              onClick={() => setLayout(1)} 
              className={`p-1.5 rounded-md transition-all duration-200 ${layout === 1 ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <AlignJustify size={18} />
            </button>
            <button 
              onClick={() => setLayout(2)} 
              className={`p-1.5 rounded-md transition-all duration-200 ${layout === 2 ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Columns2 size={18} />
            </button>
          </div>

          {sources.length > 2 && (
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-bold transition-colors shadow-sm ${
                isFilterOpen 
                  ? 'bg-pink-50 border-pink-200 text-pink-600' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-pink-200 hover:text-pink-600'
              }`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">媒体絞り込み</span>
            </button>
          )}
          
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] sm:text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors shadow-sm"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'desc' ? '新しい順' : '古い順'}
          </button>
        </div>
      </div>

      {isFilterOpen && sources.length > 2 && (
        <div className="flex items-center gap-2 mb-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
          <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap w-10">媒体:</span>
          <div className="flex overflow-x-auto custom-scrollbar gap-1.5 flex-1 pb-0.5">
            {sources.map((src) => (
              <button
                key={src}
                onClick={() => setActiveSource(src)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-colors border shadow-xs ${
                  activeSource === src
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      )}

      {processedContents.length > 0 ? (
        <div className={`grid ${gridClass}`}>
          {processedContents.map((item) => (
            <ArticleCard 
              key={item.id} 
              item={item} 
              columns={layout}
              onSelectContent={onSelectContent}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm font-bold">該当するコンテンツがありません。</p>
        </div>
      )}
    </div>
  );
};