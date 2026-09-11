// src/components/pages/Home.tsx
import { useState } from 'react';
import { LayoutList, Grid2X2, Grid3X3, ArrowUpDown, Loader2, Search } from 'lucide-react';

import { StreamCard } from '../stream/StreamCard';
import { StreamDetailModal } from '../stream/StreamDetailModal';
import { StreamSearchModal } from '../stream/StreamSearchModal';
import { useUserRecords } from '../../hooks/useUserRecords';
import { useStreams } from '../../contexts/StreamContext';
import type { StreamData } from '../../types';

type LayoutType = 1 | 2 | 4;
type SortOrder = 'desc' | 'asc';

export default function Home() {
  const { records, updateRecord } = useUserRecords();
  const { streams, isLoading } = useStreams();

  const [layout, setLayout] = useState<LayoutType>(2);
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const sortedStreams = [...streams].sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime();
    const timeB = new Date(b.date || 0).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const gridClass =
    layout === 1 ? 'grid-cols-1 gap-4' :
    layout === 2 ? 'grid-cols-2 gap-3' :
    'grid-cols-4 gap-2';

  return (
    <div className="relative pb-20">
      {/* 🌟 ヘッダー(52px)の真下に完全固定(fixed)。スクロールしても絶対に動かない */}
      <div className="fixed top-[52px] left-0 right-0 z-20 bg-gray-50 border-b border-gray-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-700">コンテンツ一覧</span>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded active:scale-95 transition-transform cursor-pointer"
              >
                <ArrowUpDown size={14} />
                <span>{sortOrder === 'desc' ? '新しい順' : '古い順'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-pink-50 hover:text-pink-600 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                title="キーワード検索"
              >
                <Search size={15} />
                <span className="hidden sm:inline">検索</span>
              </button>

              <div className="h-4 w-[1px] bg-gray-200" />

              <button 
                onClick={() => setLayout(1)} 
                className={`p-1.5 rounded cursor-pointer ${layout === 1 ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="1列表示"
              >
                <LayoutList size={20} />
              </button>
              <button 
                onClick={() => setLayout(2)} 
                className={`p-1.5 rounded cursor-pointer ${layout === 2 ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="2列表示"
              >
                <Grid2X2 size={20} />
              </button>
              <button 
                onClick={() => setLayout(4)} 
                className={`p-1.5 rounded cursor-pointer ${layout === 4 ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="4列表示"
              >
                <Grid3X3 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 固定バーの高さ分（約64px）トップ余白を確保し、動画カード群をその下から流す */}
      <div className="max-w-6xl mx-auto px-4 pt-[68px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-pink-500" size={32} />
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            データがありません
          </div>
        ) : (
          <div className={`grid ${gridClass}`}>
            {sortedStreams.map((stream) => {
              const currentRecord = records[stream.id];
              const currentViewCount = currentRecord?.viewCount || 0;

              return (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  columns={layout}
                  viewCount={currentViewCount}
                  onClick={() => setSelectedStream(stream)}
                />
              );
            })}
          </div>
        )}
      </div>

      <StreamSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        streams={streams}
        onSelectStream={(stream) => setSelectedStream(stream)}
      />

      {selectedStream && (
        <StreamDetailModal
          stream={selectedStream}
          record={selectedStream ? (records[selectedStream.id] || null) : null}
          onClose={() => setSelectedStream(null)}
          onUpdateRecord={updateRecord}
        />
      )}
    </div>
  );
}