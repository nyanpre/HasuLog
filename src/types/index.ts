// src/types/index.ts

export interface StreamData {
  id: string;
  season: string;
  type: string;
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
  type: string;
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