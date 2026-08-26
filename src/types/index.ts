// src/types/index.ts

// 🌟 配信種別のユニオン型（活動記録 'story' を追加）
export type StreamType = 'with_meets' | 'fes_live' | 'with_station' | 'story' | string;

export interface StreamData {
  id: string;
  season: string;
  type: StreamType;
  date: string;
  title: string;
  participants: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  description: string;
  raw_title_node?: string; // 🌟 Pythonスクリプトの出力合わせ
  is_official?: boolean;
  extraYoutubeUrls?: { label: string; url: string }[]; // 🌟 StreamDataにも追加！
}

export interface VideoData {
  id: string;
  type: StreamType;
  date: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  participants?: string;
  description?: string;
  isWatched?: boolean;
  extraYoutubeUrls?: { label: string; url: string }[];
}

// 🌟 今回新しく追加するプロフィール用の型
export interface UserProfileData {
  oshiMember: string;
  oshiMeets: string;
  oshiRecord: string;
  oshiFesLive: string;
}