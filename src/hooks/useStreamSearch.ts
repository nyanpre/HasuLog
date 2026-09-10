// src/hooks/useStreamSearch.ts
import { useMemo } from 'react';
import type { StreamData } from '../types';

export const useStreamSearch = (streams: StreamData[], query: string) => {
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // 全角・半角スペースで分割して検索キーワード配列を作成
    const keywords = trimmed.split(/[\s ]+/).filter(Boolean);

    return streams.filter((stream) => {
      // 検索対象テキストを結合（タイトル、説明文、出演者、タイプ等）
      const targetText = [
        stream.title || '',
        stream.description || '',
        stream.participants || '',
        stream.date || '',
        stream.season || '',
        ...(Array.isArray((stream as any).cast) ? (stream as any).cast : []),
        ...(Array.isArray((stream as any).songs) ? (stream as any).songs : [])
      ]
        .join(' ')
        .toLowerCase();

      // すべてのキーワードが部分一致（AND検索）するか判定
      return keywords.every((keyword) => targetText.includes(keyword));
    });
  }, [streams, query]);

  return searchResults;
};