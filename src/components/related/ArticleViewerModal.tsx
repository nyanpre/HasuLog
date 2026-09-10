// src/components/related/ArticleViewerModal.tsx
import { Archive, X } from 'lucide-react';
import { ArchiveViewer } from './ArchiveViewer';

type Props = {
  content: { title: string; url: string } | null;
  onClose: () => void;
};

// 🌟 先ほどアップロードに使用したバケット名
const STORAGE_BUCKET = "hasulog.firebasestorage.app";

export const ArticleViewerModal = ({ content, onClose }: Props) => {
  if (!content) return null;

  // ローカルパス (/archives/xxx.html.gz) を Firebase Storage の公開URLに変換
  const getStorageUrl = (rawUrl: string): string => {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    const filename = rawUrl.split('/').pop() || '';
    return `https://storage.googleapis.com/${STORAGE_BUCKET}/archives/${filename}`;
  };

  const actualUrl = getStorageUrl(content.url);
  const isGzipArchive = content.url.endsWith('.gz') || actualUrl.endsWith('.gz');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in">
      {/* モーダルヘッダー */}
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
      
      {/* アーカイブコンテンツ表示部（クリックされた1件のみ取得） */}
      <div className="flex-1 bg-gray-100 w-full h-full relative flex items-center justify-center">
        {isGzipArchive ? (
          <ArchiveViewer gzUrl={actualUrl} />
        ) : (
          <>
            <span className="absolute text-gray-400 text-xs font-bold">読み込み中...</span>
            <iframe 
              src={actualUrl} 
              title={content.title}
              className="w-full h-full border-none absolute inset-0 bg-white z-10"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </>
        )}
      </div>
    </div>
  );
};