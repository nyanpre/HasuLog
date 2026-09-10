// src/contexts/StreamContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StreamData } from '../types';

// JSONデータをフロントエンドにインポート
import withmeetsData from '../data/withmeets_wiki_data.json';
import withstationData from '../data/withstation_wiki_data.json';
import fesliveData from '../data/feslive_wiki_data.json';
import storyData from '../data/story_wiki_data.json';
import mirapaMcData from '../data/mirapa_minecraft.json';

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
      // 🌟 StreamData 型を満たすようにマッピング
      const formattedMirapaMc: StreamData[] = (mirapaMcData as any[]).map((v) => {
        const videoUrl = v.youtubeUrl || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : '');

        return {
          id: v.id || `mirapa-mc-${v.videoId}`,
          title: v.title,
          date: v.publishedDate || v.date || '',
          type: 'mirapa_mc',
          season: v.season || '104',
          cast: ['藤島慈', '安養寺姫芽'],
          participants: '藤島慈、安養寺姫芽', // 必須プロパティ
          description: v.description || '',
          url: videoUrl,
          youtubeUrl: videoUrl,             // 必須プロパティ
          thumbnailUrl: v.thumbnailUrl || '',
          is_official: true,
        };
      });

      // 1. 全てのJSONデータを合体
      const allStreams: StreamData[] = [
        ...(withmeetsData as StreamData[]),
        ...(withstationData as StreamData[]),
        ...(fesliveData as StreamData[]),
        ...(storyData as StreamData[]),
        ...formattedMirapaMc,
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
      setIsLoading(false);
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