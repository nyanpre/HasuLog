// src/components/related/VideoCard.tsx
import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type { ContentItem } from "./types";

type Props = {
  item: ContentItem;
  columns: 1 | 2 | 4;
};

export const VideoCard = ({ item, columns }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenVideo = () => {
    if (item.youtubeUrl) {
      window.open(item.youtubeUrl, "_blank");
    }
    setIsOpen(false);
  };

  // カテゴリ・タイプからバッジのテキストと色を動的に決定
  const isMembership = item.category?.includes("メンバー") || (item as any).type === "メンバー限定";
  const isIntro = item.category?.includes("自己紹介") || (item as any).type === "自己紹介";

  const badgeText = isMembership ? "メン限" : isIntro ? "自己紹介" : "せーはす";
  const badgeColor = isMembership ? "bg-amber-500" : isIntro ? "bg-teal-500" : "bg-purple-500";

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex w-full min-w-0 group ${
          columns === 1 ? "flex-col sm:flex-row items-center sm:items-stretch" : "flex-col"
        }`}
      >
        {/* サムネイル（常に16:9比率を固定し、見切れを防ぐ） */}
        <div className={`relative bg-gray-100 flex-shrink-0 overflow-hidden ${
          columns === 1 ? "w-full sm:w-56 md:w-64 aspect-video border-b sm:border-b-0 sm:border-r border-gray-100" : "w-full aspect-video"
        }`}>
          {item.thumbnailUrl ? (
            <img 
              src={item.thumbnailUrl} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium bg-gray-100">
              <span>No Image</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 text-white px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor} shadow-sm z-10`}>
            {badgeText}
          </span>
        </div>

        {/* テキスト情報 */}
        <div className={`flex flex-col flex-grow justify-start min-w-0 ${columns === 1 ? "p-3.5 sm:p-4" : "p-3"}`}>
          <div className="text-[11px] font-medium text-gray-400 mb-1">
            <span>{item.publishedDate}</span>
          </div>
          
          <h3 className={`font-bold text-gray-800 leading-snug break-words group-hover:text-pink-600 transition-colors ${
            columns === 1 ? "text-sm sm:text-base line-clamp-2" : "text-xs line-clamp-2"
          }`}>
            {item.title}
          </h3>
          
          {columns === 1 && item.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* 「動画を視聴する」モーダル */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-4">
              動画を視聴する
            </h3>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-5">
              {item.thumbnailUrl && (
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-2.5">
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="text-[11px] text-gray-400 mb-1">{item.publishedDate}</div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                {item.title}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleOpenVideo}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <ExternalLink size={18} />
                YouTubeで視聴する
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 text-gray-500 hover:text-gray-700 font-bold rounded-xl transition-colors text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};