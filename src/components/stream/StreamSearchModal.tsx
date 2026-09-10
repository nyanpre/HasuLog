// src/components/stream/StreamSearchModal.tsx
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, Calendar, Play } from 'lucide-react';
import type { StreamData } from '../../types';
import { useStreamSearch } from '../../hooks/useStreamSearch';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  streams: StreamData[];
  onSelectStream: (stream: StreamData) => void;
};

export const StreamSearchModal = ({ isOpen, onClose, streams, onSelectStream }: Props) => {
  const [query, setQuery] = useState('');
  const results = useStreamSearch(streams, query);

  const handleSelect = (stream: StreamData) => {
    onSelectStream(stream);
    onClose();
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'fes_live':
        return { label: 'Fes×LIVE', bg: 'bg-emerald-500' };
      case 'with_meets':
        return { label: 'With×MEETS', bg: 'bg-pink-500' };
      case 'with_station':
        return { label: 'With×STATION', bg: 'bg-blue-500' };
      case 'story':
        return { label: '活動記録', bg: 'bg-orange-600' };
      case 'mirapa_mc':
        return { label: 'マイクラ', bg: 'bg-yellow-500' };
      default:
        return { label: '配信', bg: 'bg-gray-500' };
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* 背景オーバーレイ */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" />

        {/* モーダルコンテンツ */}
        <Dialog.Content className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150 border border-gray-100 focus:outline-none">
          {/* 検索入力ヘッダー */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200 gap-3 bg-gray-50/50">
            <Search className="text-gray-400 flex-shrink-0" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワードで検索 (例: 瑠璃乃 マイクラ, 赤 スニーカー)"
              className="w-full bg-transparent border-none focus:outline-none text-sm sm:text-base text-gray-800 placeholder:text-gray-400"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={16} />
              </button>
            )}
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <span className="text-xs font-bold text-gray-400">ESC</span>
              </button>
            </Dialog.Close>
          </div>

          {/* 検索結果リスト */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100">
            {query.trim() === '' ? (
              <div className="text-center py-14 text-gray-400 text-xs sm:text-sm font-medium">
                タイトル、説明文、出演者名などをスペース区切りで検索できます
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-14 text-gray-500 text-sm font-bold">
                一致するアーカイブが見つかりませんでした
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-gray-400 px-2 py-1">
                  検索結果: {results.length} 件
                </div>
                {results.map((stream) => {
                  const badge = getTypeBadge(stream.type);
                  return (
                    <div
                      key={stream.id}
                      onClick={() => handleSelect(stream)}
                      className="p-2.5 rounded-xl hover:bg-pink-50/60 cursor-pointer flex gap-3 items-center group transition-colors"
                    >
                      {/* サムネイル */}
                      <div className="w-24 sm:w-28 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-100">
                        {stream.thumbnailUrl ? (
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                            No Image
                          </div>
                        )}
                        <span
                          className={`absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold text-white shadow-xs ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* テキスト情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium mb-1">
                          <Calendar size={12} />
                          <span>{stream.date}</span>
                          {stream.season && (
                            <span className="bg-gray-100 text-gray-600 px-1 rounded">
                              {stream.season}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug group-hover:text-pink-600 transition-colors truncate">
                          {stream.title}
                        </h4>
                        {stream.participants && (
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {stream.participants}
                          </p>
                        )}
                      </div>

                      <Play size={16} className="text-gray-300 group-hover:text-pink-500 flex-shrink-0 mr-1" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};