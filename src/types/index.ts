// src/types/index.ts
// (既存の StreamData や VideoData はそのまま残しておいてください)

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
  is_official?: boolean;
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
}

// 🌟 今回新しく追加するプロフィール用の型
export interface UserProfileData {
  oshiMember: string;
  oshiMeets: string;
  oshiRecord: string;
  oshiFesLive: string;
}