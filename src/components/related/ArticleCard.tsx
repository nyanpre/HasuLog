// src/components/related/ArticleCard.tsx
import { FileText, ChevronRight } from 'lucide-react';
import type { ContentItem } from './types';

type Props = {
  item: ContentItem;
  columns: 1 | 2; // 親コンポーネントから受け取る
  onSelectContent: (title: string, url: string) => void;
};

// 🌟 関数名を RelatedCard から ArticleCard に変更
export const ArticleCard = ({ item, columns, onSelectContent }: Props) => {
  // 🌟 2カラム（グリッド）表示かどうかを判定
  const isGrid = columns === 2;

  return (
    // h-full を追加してカードの高さを統一
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col hover:border-pink-200 hover:shadow-md transition-all group overflow-hidden w-full h-full min-w-0">
      
      {/* サムネイル画像エリア（データが存在する場合のみ表示） */}
      {item.thumbnailUrl && (
        <div className="w-full aspect-video bg-gray-100 overflow-hidden border-b border-gray-100 flex-shrink-0 relative">
          <img 
            src={item.thumbnailUrl} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* 🌟 2カラム時は padding を少し狭くして圧迫感を減らす */}
      <div className={`flex flex-col flex-grow min-w-0 ${isGrid ? 'p-3' : 'p-4 sm:p-5'}`}>
        <div className={isGrid ? "mb-2" : "mb-2.5"}>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className={`inline-block px-2 py-0.5 bg-gray-100 text-gray-600 font-bold rounded ${isGrid ? 'text-[10px]' : 'text-[11px]'}`}>
              {item.category}
            </span>
            {item.source && (
              <span className={`inline-block px-2 py-0.5 bg-pink-50 text-pink-600 border border-pink-100 font-bold rounded ${isGrid ? 'text-[10px]' : 'text-[11px]'}`}>
                {item.source}
              </span>
            )}
          </div>
          {/* 🌟 2カラム時はタイトルサイズも少し小さくする */}
          <h3 className={`font-bold text-gray-800 leading-snug group-hover:text-pink-600 transition-colors break-words ${isGrid ? 'text-sm' : 'text-base sm:text-lg'}`}>
            {item.title}
          </h3>
        </div>
        
        {/* 🌟 2カラムの時は description を非表示にしてスッキリさせる */}
        {!isGrid && (
          <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2 flex-grow break-words">
            {item.description}
          </p>
        )}
        
        {/* mt-auto を付与して、ボタンや公開日が常にカード下部に張り付くようにする */}
        <div className={`text-gray-700 font-medium flex items-center gap-1 mt-auto ${isGrid ? 'text-[10px] mb-2' : 'text-xs mb-3'}`}>
          <span>公開日:</span>
          <span className="font-semibold">{item.publishedDate}</span>
        </div>

        {/* 単発コンテンツボタン */}
        {item.contentUrl && (
          <button
            onClick={() => onSelectContent(item.title, item.contentUrl!)}
            className={`w-full flex items-center justify-between bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold rounded-lg transition-colors border border-pink-100 min-w-0 ${isGrid ? 'px-2 py-1.5 text-xs' : 'px-3 py-2.5 text-xs sm:text-sm'}`}
          >
            <span className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
              {/* 🌟 2カラム時はアイコンも小さく */}
              <FileText size={isGrid ? 14 : 16} className="flex-shrink-0" />
              <span className="truncate">閲覧する</span>
            </span>
            <ChevronRight size={isGrid ? 14 : 16} className="flex-shrink-0 ml-1" />
          </button>
        )}

        {/* 連載・複数ページボタンリスト */}
        {item.parts && item.parts.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 min-w-0">
            {item.parts.map((part, index) => (
              <button
                key={index}
                onClick={() => part.url && onSelectContent(`${item.title} - ${part.label}`, part.url)}
                className={`w-full flex items-center justify-between bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-600 font-bold rounded-lg transition-colors border border-transparent hover:border-pink-100 min-w-0 ${isGrid ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs sm:text-sm'}`}
              >
                <span className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
                  <FileText size={isGrid ? 12 : 15} className="flex-shrink-0" />
                  <span className="truncate">{part.label}</span>
                </span>
                <ChevronRight size={isGrid ? 12 : 15} className="flex-shrink-0 opacity-50 ml-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};