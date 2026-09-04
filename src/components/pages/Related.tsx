// src/components/pages/Related.tsx
import { useState, useMemo } from 'react';
// 🌟 画像と同じ形のアイコンに変更
import { Archive, ArrowUpDown, Filter, AlignJustify, Columns2 } from 'lucide-react';

import articlesData from '../related/data/articles.json';
import { RelatedCard } from '../related/RelatedCard';
import { RelatedViewerModal } from '../related/RelatedViewerModal';
import type { Category, ContentItem } from '../related/types';

type LayoutType = 1 | 2;

export default function Related() {
  const [selectedContent, setSelectedContent] = useState<{ title: string; url: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('すべて');
  const [activeSource, setActiveSource] = useState<string>('すべて');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [layout, setLayout] = useState<LayoutType>(1);

  const categories: Category[] = ['すべて', '雑誌', 'メディア', '特設サイト'];
  const allContents = articlesData as ContentItem[];

  const sources = useMemo(() => {
    const list = new Set<string>();
    allContents.forEach(item => {
      if (item.source) list.add(item.source);
    });
    return ['すべて', ...Array.from(list)];
  }, [allContents]);

  const processedContents = useMemo(() => {
    return allContents
      .filter(item => {
        const matchCategory = activeCategory === 'すべて' || item.category === activeCategory;
        const matchSource = activeSource === 'すべて' || item.source === activeSource;
        return matchCategory && matchSource;
      })
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate).getTime() || 0;
        const dateB = new Date(b.publishedDate).getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [allContents, activeCategory, activeSource, sortOrder]);

  const gridClass = layout === 1 ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* ヘッダー部 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 flex items-center">
          <Archive className="w-6 h-6 mr-2 text-gray-600" />
          関連コンテンツ
        </h2>

        {/* ヘッダー右側のボタン群 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* 🌟 画像を再現したトグルスイッチ風ボタン (アイコン変更) */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg mr-1">
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

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-bold transition-colors shadow-sm ${
              isFilterOpen 
                ? 'bg-pink-50 border-pink-200 text-pink-600' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-pink-200 hover:text-pink-600'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">絞り込み</span>
          </button>
          
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] sm:text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors shadow-sm"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'desc' ? '新しい順' : '古い順'}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="flex flex-col gap-3 mb-6 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap w-12">種別:</span>
            <div className="flex overflow-x-auto custom-scrollbar gap-1.5 flex-1 pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-colors border shadow-xs ${
                    activeCategory === category
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {sources.length > 2 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap w-12">媒体:</span>
              <div className="flex overflow-x-auto custom-scrollbar gap-1.5 flex-1 pb-1">
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
        </div>
      )}

      {processedContents.length > 0 ? (
        <div className={`grid ${gridClass}`}>
          {processedContents.map((item) => (
            <RelatedCard 
              key={item.id} 
              item={item} 
              columns={layout}
              onSelectContent={(title, url) => setSelectedContent({ title, url })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm font-bold">該当するコンテンツがありません。</p>
        </div>
      )}

      <RelatedViewerModal 
        content={selectedContent} 
        onClose={() => setSelectedContent(null)} 
      />
    </div>
  );
}