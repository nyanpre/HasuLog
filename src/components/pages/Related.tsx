// src/components/pages/Related.tsx
import { useState, useMemo } from 'react';
import { Archive, ArrowUpDown } from 'lucide-react';

import articlesData from '../related/data/articles.json';
import { RelatedCard } from '../related/RelatedCard';
import { RelatedViewerModal } from '../related/RelatedViewerModal';
import type { Category, ContentItem } from '../related/types';

export default function Related() {
  const [selectedContent, setSelectedContent] = useState<{ title: string; url: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('すべて');
  const [activeSource, setActiveSource] = useState<string>('すべて');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc: 新しい順, asc: 古い順

  const categories: Category[] = ['すべて', '雑誌', 'メディア', '特設サイト'];
  const allContents = articlesData as ContentItem[];

  // 🌟 JSON内のデータから登録されている「媒体名」の一覧を動的に抽出
  const sources = useMemo(() => {
    const list = new Set<string>();
    allContents.forEach(item => {
      if (item.source) list.add(item.source);
    });
    return ['すべて', ...Array.from(list)];
  }, [allContents]);

  // 🌟 フィルタリング & ソート処理
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* ヘッダー部 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Archive className="text-pink-500" />
          関連コンテンツ
        </h2>

        {/* 🌟 ソート切り替えボタン */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors shadow-sm"
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'desc' ? '新しい順' : '古い順'}
        </button>
      </div>

      {/* 🌟 フィルターエリア */}
      <div className="flex flex-col gap-3 mb-6 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
        {/* カテゴリフィルター */}
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

        {/* 媒体名フィルター（媒体が2件以上ある場合のみ表示） */}
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

      {/* 🌟 記事一覧（1カラムレイアウト: flex flex-col gap-4） */}
      {processedContents.length > 0 ? (
        <div className="flex flex-col gap-4">
          {processedContents.map((item) => (
            <RelatedCard 
              key={item.id} 
              item={item} 
              onSelectContent={(title, url) => setSelectedContent({ title, url })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm font-bold">該当するコンテンツがありません。</p>
        </div>
      )}

      {/* ビューアモーダル */}
      <RelatedViewerModal 
        content={selectedContent} 
        onClose={() => setSelectedContent(null)} 
      />
    </div>
  );
}