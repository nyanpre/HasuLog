// hasulog/src/types/index.ts

// ▼ 今回新しく追加したFirestore用のデータ型
export interface StreamData {
  id: string;
  season: string;
  type: string; // 'with_meets' | 'with_station'
  date: string;
  title: string;
  participants: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  description: string;
}

// ▼ 既存のコンポーネント（HomeやVideoCardなど）で使われている型
export interface VideoData {
  id: string;
  type: string; // 'with_meets' | 'with_station'
  date: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  participants?: string;
  description?: string;
}