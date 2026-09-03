// src/components/related/RelatedViewerModal.tsx
import { Archive, X } from 'lucide-react';

type Props = {
  content: { title: string; url: string } | null;
  onClose: () => void;
};

export const RelatedViewerModal = ({ content, onClose }: Props) => {
  if (!content) return null;

  // ViteのBase設定（/HasuLog/ など）を自動で補完する関数
  const getActualUrl = (path: string) => {
    if (path.startsWith('/')) {
      const baseUrl = import.meta.env.BASE_URL; // 例: "/" や "/HasuLog/"
      // 連続するスラッシュを防いで結合
      return baseUrl.endsWith('/') ? baseUrl + path.slice(1) : baseUrl + path;
    }
    return path;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in">
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-sm font-bold min-w-0 pr-4">
          <Archive size={16} className="text-pink-500 flex-shrink-0" />
          <span className="truncate text-gray-200">{content.title}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 bg-gray-100 w-full h-full relative flex items-center justify-center">
        <span className="absolute text-gray-400 text-xs font-bold">読み込み中...</span>
        {/* 🌟 sandbox に allow-forms を追加 */}
        <iframe 
          src={getActualUrl(content.url)} 
          title="関連コンテンツ"
          className="w-full h-full border-none absolute inset-0 bg-white z-10"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
};