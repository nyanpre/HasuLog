// src/components/related/ArchiveViewer.tsx
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Props = {
  gzUrl: string;
};

export const ArchiveViewer = ({ gzUrl }: Props) => {
  const [htmlUrl, setHtmlUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentObjectUrl: string | null = null;

    async function fetchAndUnzip() {
      try {
        const response = await fetch(gzUrl);
        if (!response.ok) {
          throw new Error(`HTTPエラー: ${response.status} (Storageからの取得に失敗しました)`);
        }

        const buffer = await response.arrayBuffer();
        const view = new Uint8Array(buffer);
        let htmlBlob: Blob;

        // Gzipのマジックナンバー (1F 8B) の確認
        if (view.length >= 2 && view[0] === 0x1f && view[1] === 0x8b) {
          // ブラウザ側で明示的に解凍
          const stream = new Blob([buffer]).stream();
          const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
          const rawBlob = await new Response(decompressedStream).blob();
          htmlBlob = new Blob([rawBlob], { type: 'text/html;charset=utf-8' });
        } else {
          // ブラウザやCDNが既に自動解凍してくれたプレーンなHTMLの場合
          htmlBlob = new Blob([buffer], { type: 'text/html;charset=utf-8' });
        }
        
        currentObjectUrl = URL.createObjectURL(htmlBlob);
        setHtmlUrl(currentObjectUrl);
      } catch (err: any) {
        console.error("アーカイブの読み込みに失敗しました:", err);
        setError(err.message || "アーカイブの展開に失敗しました。");
      }
    }
    
    if (gzUrl) {
      setHtmlUrl(null);
      setError(null);
      fetchAndUnzip();
    }

    return () => {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [gzUrl]);

  if (error) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-6 text-center">
        <p className="text-red-500 font-bold text-sm mb-1">エラーが発生しました</p>
        <p className="text-gray-400 text-xs">{error}</p>
      </div>
    );
  }

  if (!htmlUrl) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <span className="text-gray-400 text-xs font-bold animate-pulse">Storageからアーカイブを展開中...</span>
      </div>
    );
  }

  return (
    <iframe 
      src={htmlUrl} 
      title="Archive Viewer"
      className="w-full h-full border-none absolute inset-0 bg-white z-10 animate-fade-in"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
};