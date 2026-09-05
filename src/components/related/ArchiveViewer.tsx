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
        if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);

        // 🌟 修正: Streamで直接処理せず、一度バッファとして読み込む
        const buffer = await response.arrayBuffer();
        const view = new Uint8Array(buffer);
        let htmlBlob: Blob;

        // Gzipのマジックナンバー (1F 8B) を確認して本当に圧縮されているか判定
        if (view.length >= 2 && view[0] === 0x1f && view[1] === 0x8b) {
          // Gzip形式なので展開する
          const stream = new Blob([buffer]).stream();
          const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
          const rawBlob = await new Response(decompressedStream).blob();
          htmlBlob = new Blob([rawBlob], { type: 'text/html' });
        } else {
          // 開発サーバーによる自動解凍、またはファイルが存在しない(404)場合
          const textPreview = new TextDecoder().decode(buffer.slice(0, 1000));
          
          // ViteのSPAフォールバック (ファイルが無い時に index.html が返る現象) を検知
          if (textPreview.includes('<div id="root">') || textPreview.includes('src="/src/main.tsx"')) {
            throw new Error('アーカイブファイルが見つかりません。');
          }
          
          // 既に解凍されたHTMLデータとしてそのまま使用する
          htmlBlob = new Blob([buffer], { type: 'text/html' });
        }
        
        // iframeで表示可能なBlob URLを生成
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

    // クリーンアップ処理
    return () => {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [gzUrl]);

  if (error) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-gray-500 font-bold text-sm">
        {error}
      </div>
    );
  }

  if (!htmlUrl) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <span className="text-gray-400 text-xs font-bold animate-pulse">アーカイブを読み込み中...</span>
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