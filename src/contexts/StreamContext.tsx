// src/contexts/StreamContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StreamData } from '../types';

// 🌟 JSONデータをフロントエンドに直接インポート！
import withmeetsData from '../data/withmeets_wiki_data.json';
import withstationData from '../data/withstation_wiki_data.json';
import fesliveData from '../data/feslive_wiki_data.json'; // 🌟 追加: Fes×LIVEデータ

type StreamContextType = {
  streams: StreamData[];
  isLoading: boolean;
  error: string | null;
};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 1. 3つのJSONデータを合体させる (🌟 fesliveData を追加)
      const allStreams = [
        ...(withmeetsData as StreamData[]),
        ...(withstationData as StreamData[]),
        ...(fesliveData as StreamData[])
      ];
      
      // 2. 日付の新しい順（降順）に並び替え
      allStreams.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      // 3. 状態にセット
      setStreams(allStreams);
    } catch (err) {
      console.error("データの読み込みに失敗しました:", err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false); // ロード完了（一瞬で終わります）
    }
  }, []);

  return (
    <StreamContext.Provider value={{ streams, isLoading, error }}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStreams = () => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useStreams must be used within a StreamProvider');
  }
  return context;
};