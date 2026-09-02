// src/components/related/RelatedCard.tsx
import { FileText, ChevronRight } from 'lucide-react';
import type { ContentItem } from './types';

type Props = {
  item: ContentItem;
  onSelectContent: (title: string, url: string) => void;
};

export const RelatedCard = ({ item, onSelectContent }: Props) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:border-pink-200 hover:shadow-md transition-all group overflow-hidden w-full min-w-0">
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded">
            {item.category}
          </span>
          {/* 🌟 媒体名が存在する場合はバッジ表示 */}
          {item.source && (
            <span className="inline-block px-2 py-0.5 bg-pink-50 text-pink-600 border border-pink-100 text-[11px] font-bold rounded">
              {item.source}
            </span>
          )}
        </div>
        {/* 🌟 スマホ時のサイズを text-base に拡大、PC時は sm:text-lg */}
        <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-snug group-hover:text-pink-600 transition-colors break-words">
          {item.title}
        </h3>
      </div>
      
      <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2 flex-grow break-words">
        {item.description}
      </p>
      
      <div className="text-[11px] text-gray-400 font-medium mb-3">
        公開日: {item.publishedDate}
      </div>

      {/* 単発コンテンツボタン */}
      {item.contentUrl && (
        <button
          onClick={() => onSelectContent(item.title, item.contentUrl!)}
          className="w-full mt-auto flex items-center justify-between px-3 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs sm:text-sm font-bold rounded-lg transition-colors border border-pink-100 min-w-0"
        >
          <span className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
            <FileText size={16} className="flex-shrink-0" /> 
            <span className="truncate">閲覧する</span>
          </span>
          <ChevronRight size={16} className="flex-shrink-0 ml-2" />
        </button>
      )}

      {/* 連載・複数ページボタンリスト */}
      {item.parts && item.parts.length > 0 && (
        <div className="mt-auto flex flex-col gap-1.5 pt-3 border-t border-gray-100 min-w-0">
          {item.parts.map((part, index) => (
            <button
              key={index}
              onClick={() => onSelectContent(`${item.title} - ${part.label}`, part.url)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-600 text-xs sm:text-sm font-bold rounded-lg transition-colors border border-transparent hover:border-pink-100 min-w-0"
            >
              <span className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
                <FileText size={15} className="flex-shrink-0" /> 
                <span className="truncate">{part.label}</span>
              </span>
              <ChevronRight size={15} className="flex-shrink-0 opacity-50 ml-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};